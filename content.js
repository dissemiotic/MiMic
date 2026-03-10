// MiMic Extension

// Global variables
let video0 = '';
let video_id0 = '';
let extract_sd_description = '';
let account_url = '';
let extract0 = [];
let original_mimic_url = '';
let mimic_url = '';
let mimic_author_url = '';
let mimic_title = '';
let mimic_author = '';
let channel_id = '';
let hasActivated = false; // Track if we've already shown dialog for current video

// Track whether activation is currently in progress to prevent overlapping runs
let isProcessing = false;

// Approved channel list (populated from storage; defaults defined in options.js)
let APPROVED_CHANNELS = [];

// Disapproved channel list - note: this isn't a judgment on the quality of these channels' videos or the channel creators' actions/dispositions/whatever, just if the listed handles serve as (1) other YT creators who commonly contribute to the production of YT horror commentary videos but do little of it themselves on their own corner of the platform, (2) secondary channels that often get linked to in the creators' video descriptions, OR (3) if the creator uses the handle to comment on YT Horror while tending to not link to the original source material. these three kinds cause the extension to essentially malfunction.
const DISAPPROVED_CHANNELS = new Set([
  '/@wendigames',
  '/@mistagg',
  '/@operatordrewski',
  '/@papameat',
  '/@dvmegirl',
  '/@lucyfromtheinternet',
  '/@elvandubz',
  '/@creeppodcast',
  '/@theweirdbible',
  '/@aydin_makes_things',
  '/@something_sinister',
  '/@all-bonesjones',
  '/@calebfinn',
  '/@sodajump',
  '/@harruwu',
  '/@therealmrmirage'
]);

const DISAPPROVED_OTHER_YT = new Set([
'https://www.youtube.com/channel/UCVHTYS0EIbTWfK-fVFo2NEg',
'https://www.youtube.com/Sunflower41XD',
'https://www.youtube.com/channel/UC8L0M5FgnBxSBTLeqAn0-xA'
]);

// Helper function to extract metadata from HTML string
async function extractVideoMetadata(url) {
  const mimicHtmlText = await (await fetch(url)).text();
  const doc = new DOMParser().parseFromString(mimicHtmlText, 'text/html');

  // Extract title — DOMParser handles entity decoding automatically
  const titleEl = doc.querySelector('title');
  if (titleEl) {
    mimic_title = titleEl.textContent.replace(' - YouTube', '');
    console.log(`Updated mimic_title to: ${mimic_title}`);
  }

  // Extract channel name from itemprop link
  const nameEl = doc.querySelector('link[itemprop="name"]');
  if (nameEl) {
    mimic_author = nameEl.getAttribute('content');
    console.log(`Extracted mimic_author: ${mimic_author}`);
  }

  // Extract channel URL from itemprop link
  const urlEl = doc.querySelector('link[itemprop="url"]');
  if (urlEl) {
    mimic_author_url = urlEl.getAttribute('href');
    console.log(`Extracted mimic_author_url: ${mimic_author_url}`);
  }
}

// Deactivate and reset.
// Pass soft = true (overlay click) to also clear video_id0 and hasActivated,
// allowing the dialog to re-appear if the user navigates back to the same video.
function deactivate(soft = false) {
  console.log(soft ? '[MiMic] Soft deactivating extension due to click outside dialog.' : '[MiMic] Deactivating extension');
  extract_sd_description = '';
  account_url = '';
  extract0 = [];
  mimic_url = '';
  if (soft) {
    video_id0 = '';
    hasActivated = false;
  }
  // Note: video_id0 and hasActivated are kept on hard deactivate to prevent re-processing the same video
}

// Step 6: Open MiMic window
function openMimicWindow(shouldMute = true, shouldMinimize = true) {
  console.log('[MiMic] Opening window:', mimic_url);
  console.log('[MiMic] Checkbox values - shouldMute:', shouldMute, 'shouldMinimize:', shouldMinimize);

  try {
    chrome.runtime.sendMessage({
      action: 'openMimicWindow',
      url: mimic_url,
      shouldMute: shouldMute,
      shouldMinimize: shouldMinimize
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[MiMic] Extension context invalidated. Please reload the page.');
        // Fallback: open in new window using window.open
        window.open(mimic_url, '_blank', 'width=400,height=300');
        deactivate();
        return;
      }
      if (response && response.success) {
        console.log('[MiMic] Window opened successfully');
        deactivate();
      }
    });
  } catch (error) {
    console.error('[MiMic] Error opening window:', error);
    // Fallback: open in new window
    window.open(mimic_url, '_blank', 'width=400,height=300');
    deactivate();
  }
}

// Step 5: Show dialog overlay
function showDialog() {
  // Mark that we've shown the dialog for this video
  hasActivated = true;

  // Create full-screen overlay for click detection
  const overlay = document.createElement('div');
  overlay.id = 'mimic-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
  `;

  // Create style element for hyperlinks
  const style = document.createElement('style');
  style.textContent = `
    #mimic-dialog a,
    #mimic-dialog a:link,
    #mimic-dialog a:visited,
    #mimic-dialog a:hover,
    #mimic-dialog a:active {
      color: #ff6666 !important;
    }
  `;
  document.head.appendChild(style);

  // Create dialog box with Web 3.0 glassmorphism design - flexible sizing
  const dialog = document.createElement('div');
  dialog.id = 'mimic-dialog';
  dialog.style.cssText = `
    background: linear-gradient(270deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: white;
    padding: 30px;
    border-radius: 20px;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    min-width: 300px;
    max-width: 90vw;
    width: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  `;

  // Create message
  const message = document.createElement('p');
  // Create the hyperlinks
  const link = document.createElement('a');
  link.href = mimic_url;
  link.textContent = mimic_title;
  link.target = '_blank'; // Optional: open in new tab

  const yt_arrow = document.createElement('img');
  yt_arrow.src = chrome.runtime.getURL('images/yt_favicon_ringo2.png');

  const author_link = document.createElement('a');
  author_link.href = mimic_author_url + '?sub_confirmation=1';
  author_link.append(yt_arrow, '\u00A0', mimic_author);
  author_link.target = '_blank'; // Optional: open in new tab

  // Assemble the message
  message.append('Open "', link, '" by ', author_link, ' as a MiMic video?');
  message.style.cssText = `
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0.3px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  `;

  // Create buttons container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 10px;
    justify-content: center;
  `;

  // Create checkboxes container
  const checkboxContainer = document.createElement('div');
  checkboxContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
    align-items: flex-start;
    font-size: 14px;
  `;

  // Create mute checkbox with label
  const muteCheckboxWrapper = document.createElement('label');
  muteCheckboxWrapper.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  `;

  const muteCheckbox = document.createElement('input');
  muteCheckbox.type = 'checkbox';
  muteCheckbox.id = 'mimic-mute-checkbox';
  muteCheckbox.checked = true;
  muteCheckbox.style.cssText = `
    cursor: pointer;
    width: 16px;
    height: 16px;
  `;

  const muteLabel = document.createElement('span');
  muteLabel.textContent = 'Keep the MiMic video muted';
  muteLabel.style.cssText = `
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  `;

  muteCheckboxWrapper.appendChild(muteCheckbox);
  muteCheckboxWrapper.appendChild(muteLabel);

  // Create minimize checkbox with label
  const minimizeCheckboxWrapper = document.createElement('label');
  minimizeCheckboxWrapper.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  `;

  const minimizeCheckbox = document.createElement('input');
  minimizeCheckbox.type = 'checkbox';
  minimizeCheckbox.id = 'mimic-minimize-checkbox';
  minimizeCheckbox.checked = true;
  minimizeCheckbox.style.cssText = `
    cursor: pointer;
    width: 16px;
    height: 16px;
  `;

  const minimizeLabel = document.createElement('span');
  minimizeLabel.textContent = 'Minimize the MiMic video automatically';
  minimizeLabel.style.cssText = `
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  `;

  minimizeCheckboxWrapper.appendChild(minimizeCheckbox);
  minimizeCheckboxWrapper.appendChild(minimizeLabel);

  checkboxContainer.appendChild(muteCheckboxWrapper);
  checkboxContainer.appendChild(minimizeCheckboxWrapper);

  // Create Yes button
  const yesButton = document.createElement('button');
  yesButton.textContent = 'Yes';
  yesButton.style.cssText = `
    padding: 12px 32px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  `;
  yesButton.addEventListener('mouseover', () => {
    yesButton.style.transform = 'translateY(-2px)';
    yesButton.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
  });
  yesButton.addEventListener('mouseout', () => {
    yesButton.style.transform = 'translateY(0)';
    yesButton.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
  });
  yesButton.addEventListener('click', (e) => {
    e.stopPropagation();

    // Read checkbox values BEFORE removing overlay
    const shouldMute = muteCheckbox.checked;
    const shouldMinimize = minimizeCheckbox.checked;

    overlay.remove();
    openMimicWindow(shouldMute, shouldMinimize);
  });

  // Create No button
  const noButton = document.createElement('button');
  noButton.textContent = 'No';
  noButton.style.cssText = `
    padding: 12px 32px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  `;
  noButton.addEventListener('mouseover', () => {
    noButton.style.transform = 'translateY(-2px)';
    noButton.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
  });
  noButton.addEventListener('mouseout', () => {
    noButton.style.transform = 'translateY(0)';
    noButton.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
  });
  noButton.addEventListener('click', (e) => {
    e.stopPropagation();
    overlay.remove();
    deactivate();
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      deactivate(true);
    }
  });

  // Assemble dialog
  buttonContainer.appendChild(yesButton);
  buttonContainer.appendChild(noButton);
  dialog.appendChild(message);
  dialog.appendChild(buttonContainer);
  dialog.appendChild(checkboxContainer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

// Main activation function
async function activate() {
  console.log('[MiMic] Extension activated');

  // Step 1: Extract video information
  try {
    video0 = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    const currentVideoId = urlParams.get('v');

    if (!currentVideoId) {
      console.log('[MiMic] No video ID found, deactivating');
      deactivate();
      return;
    }

    // Check if this is the same video we already processed
    if (hasActivated && currentVideoId === video_id0) {
      console.log('[MiMic] Already processed this video, skipping');
      return;
    }

    // Reset for new video.
    video_id0 = currentVideoId;
    hasActivated = false;
    
    // Set video-id attribute for MutationObserver tracking (body may not exist at document_start)
    if (document.body) {
      document.body.setAttribute('video-id', video_id0);
    }

    // Get ytInitialPlayerResponse.
    // On a hard page load it is available on window directly.
    // On a YouTube SPA navigation it is absent or stale, so we fetch the watch
    // page HTML for the current video and parse it out of the raw source instead.
    let ytInitialPlayerResponse = null;

    const windowResponse = window.ytInitialPlayerResponse;
    if (windowResponse && windowResponse.videoDetails?.videoId === currentVideoId) {
      // Window object is fresh and matches the current video — use it directly.
      ytInitialPlayerResponse = JSON.parse(JSON.stringify(windowResponse));
      console.log('[MiMic] Using ytInitialPlayerResponse from window');
    } else {
      // SPA navigation: fetch the page HTML and parse ytInitialPlayerResponse from source.
      console.log('[MiMic] Fetching ytInitialPlayerResponse from page source for video:', currentVideoId);
      try {
        const resp = await fetch('https://www.youtube.com/watch?v=' + currentVideoId);
        const html = await resp.text();
        const marker = 'ytInitialPlayerResponse = ';
        const start = html.indexOf(marker);
        if (start !== -1) {
          const jsonStr = html.substring(start + marker.length).split(/;\s*(?:var|const|let)\s/)[0];
          ytInitialPlayerResponse = JSON.parse(jsonStr);
          console.log('[MiMic] Parsed ytInitialPlayerResponse from page source');
        }
      } catch (fetchErr) {
        console.error('[MiMic] Failed to fetch page source:', fetchErr);
      }
    }

    if (!ytInitialPlayerResponse) {
      console.log('[MiMic] ytInitialPlayerResponse not found, deactivating');
      deactivate();
      return;
    }

    // Extract shortDescription and ownerProfileUrl
    extract_sd_description = ytInitialPlayerResponse.videoDetails?.shortDescription || '';
    console.log('[MiMic] RAW shortDescription:', ytInitialPlayerResponse.videoDetails?.shortDescription);

    account_url = ytInitialPlayerResponse.microformat?.playerMicroformatRenderer?.ownerProfileUrl || '';

    // Process account_url
    account_url = account_url.toLowerCase().replace(/https?:\/\/www\.youtube\.com/, '');

    console.log('[MiMic] video0:', video0);
    console.log('[MiMic] video_id0:', video_id0);
    console.log('[MiMic] extract_sd_description:', extract_sd_description);
    console.log('[MiMic] account_url:', account_url);

    // Step 2: Check if channel is approved or disapproved
    // First check disapproved list
    if (DISAPPROVED_CHANNELS.has(account_url)) {
      console.log('[MiMic] Channel is disapproved, deactivating');
      deactivate();
      return;
    }

    // Then check approved list
    if (!APPROVED_CHANNELS.includes(account_url)) {
      console.log('[MiMic] Channel not approved, deactivating');
      deactivate();
      return;
    }

    // Step 3: Extract URLs from description
    processDescription();

  } catch (error) {
    console.error('[MiMic] Error in activation:', error);
    deactivate();
  }
}

// Step 3: Process description to extract URLs
async function processDescription() {
  // Check for marker
  const markerIndex = extract_sd_description.indexOf('⧸');
  if (markerIndex !== -1) {
    const afterMarker = extract_sd_description.substring(markerIndex + 1);
    const httpMatch = afterMarker.match(/https?:\/\/(?:(?:www\. )?youtube\.com|youtu\.be)[^\n]*/);
    const atMatch =  afterMarker.match(/[^@\s\n]+/);
    const matchNot = afterMarker.match(/(?!.*\/redirect\?)(?!.*\/hashtag\/)[^@\s\n]+/);
    console.log('[MiMic] Marker found, httpMatch:', httpMatch, 'atMatch:', atMatch, 'matchNot:', matchNot);
    if (httpMatch && matchNot) {
      mimic_url = httpMatch[0].replace(/\n+$/, '');
      if (mimic_url.includes('youtu.be/')) {
        const match = mimic_url.match(/\.be\/(.+)/);
        if (match) {
          const afterBe = match[1];
          const url = 'https://www.youtube.com/watch?v=' + afterBe;
          mimic_url = url;
        }
      }
      // Normalize URL to always use https://www.youtube.com
      mimic_url = mimic_url.replace(/https?:\/\/(www\.)?youtube\.com/, 'https://www.youtube.com');
      
      processStep4();
      return;
    } else if (atMatch) {
      mimic_url = 'https://www.youtube.com/@' + atMatch[0].replace(/\n+$/, '');
      processStep4();
      return;
    } else {
      extract_sd_description = extract_sd_description.replace(/⧸/, '');
    }
  }

  // Extract URLs matching criteria
  extract0 = [];

  // URL extraction - split by whitespace and newlines
  const words = extract_sd_description.split(/[\s\n]+/);

  for (let word of words) {
    // Criterion 1: URLs starting with 'http'
    if (word.startsWith('http')) {
      // Case 1: youtu.be and non-www URLs
      if (word.includes('youtu.be/')) {
        const match = word.match(/\.be\/(.+)/);
        if (match) {
          const afterBe = match[1];
          const url = 'https://www.youtube.com/watch?v=' + afterBe;
          extract0.push(url);
        }
      }
      // Case 2: URLs containing 'youtube'
      else if (word.includes('youtube.com/')) {
        if (!word.includes('www.youtube.com/')){
          word = word.replace('youtube.com/', 'www.youtube.com/');
        }

        const url = word;

        if (DISAPPROVED_OTHER_YT.has(url)) {
          console.log('[MiMic] URL is on disapproved list, skipping');
          continue;
        }
        extract0.push(url.replace(/\n+$/, ''));
      }
      // Case 3: URLs containing '@'
      else if (word.includes('@')) {
        const tryFallback = async () => {
          const fallbackUrl = 'https://www.youtube.com/channel/' + word.substring(word.indexOf('@') + 1);
          try {
            const r = await fetch(fallbackUrl, { method: 'HEAD' });
            if (r.status === 200) extract0.push(fallbackUrl);
          } catch {
            console.log('[MiMic] Fallback fetch failed for @-containing URL:', word);
          }
        };

        try {
          const response = await fetch(word, { method: 'HEAD' });
          if (response.ok) {
            extract0.push(word);
          } else {
            await tryFallback();
          }
        } catch {
          await tryFallback();
        }
      }
      // Case 3: All other http URLs
      else {
        extract0.push(word.replace(/\n+$/, ''));
      }
    }

    // Criterion 2: Handles starting with '@'
    if (word.startsWith('@')) {
      const url = 'https://www.youtube.com/' + word;
      extract0.push(url);
    }
  }

  // Steampowered.com URL check - if any URL contains 'steampowered.com', deactivate immediately
  if (extract0.some(url => url.includes('steampowered.com'))) {
    console.log('[MiMic] steampowered.com URL detected, deactivating');
    deactivate();
    return;
  }

  // Remove URLs where domain ≠ youtube.com OR path contains /hashtag/
  extract0 = extract0.filter(url => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const path = urlObj.pathname;
      const vParam = urlObj.searchParams.get('v');

      return domain === 'youtube.com' && !path.includes('/hashtag/') && !path.includes('/redirect?') && vParam !== video_id0;
    } catch (e) {
      return false;
    }
  });

  if (extract0.length === 0) {
    console.log('[MiMic] No valid YouTube URLs after filtering, deactivating');
    deactivate();
    return;
  }

  console.log('[MiMic] extract0:', extract0);

  // Proceed to Step 4
  processStep4();
}

// Shared helper: fetch metadata for mimic_url and show the confirmation dialog.
async function finishWithVideo() {
  await extractVideoMetadata(mimic_url).catch(err => {
    console.error(`[MiMic] extractVideoMetadata failed for ${mimic_url}:`, err);
    deactivate();
  });
  showDialog();
}

// Shared helper: check fetched page HTML against approved/disapproved channel lists.
// allowOwn = true exempts 'dissemiotic' from the approved-channel block (section C).
// Returns true if the URL was blocked so the caller can return immediately.
function checkChannelLists(html, urlToRemove, allowOwn = false) {
  const channelCheck = /"canonicalBaseUrl":"\/\@([A-Za-z0-9_\-.]+)"/;
  const channelMatch = html.match(channelCheck);
  if (!channelMatch) return false;
  const channelMatchURL = '/@' + channelMatch[1].toLowerCase();
  console.log(`[MiMic] Assembled channel URL: ${channelMatchURL}`);
  const isApproved = APPROVED_CHANNELS.includes(channelMatchURL) &&
    (!allowOwn || !channelMatchURL.includes('dissemiotic'));
  if (isApproved || DISAPPROVED_CHANNELS.has(channelMatchURL)) {
    console.log('[MiMic] Channel is on approved/disapproved list, trying next URL');
    tryNextUrl(urlToRemove);
    return true;
  }
  return false;
}

// Shared helper: extract channel_id from a /channel/ URL, convert to UU prefix,
// fetch the channel's upload playlist page, and return the HTML.
async function fetchChannelPlaylist(urlObj) {
  channel_id = urlObj.pathname.split('/channel/')[1].split('/')[0];
  channel_id = channel_id.replace(/^(UV|UC)/, 'UU');
  const playlistUrl = `https://www.youtube.com/watch?v=&list=${channel_id}`;
  return (await fetch(playlistUrl)).text();
}

// Shared helper: find the first video (index=1) in a playlist HTML page, set mimic_url,
// fetch its metadata, and show the dialog. Returns true on success, false if not found.
async function extractFirstPlaylistVideo(html, listId) {
  const urlPattern = new RegExp(
    `/watch\\?v=([^&"]+)[^"]*list=${listId.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}[^"]*index=1\\b`, 'i'
  );
  console.log(`Assembled URL pattern: ${urlPattern}`);
  const match = html.match(urlPattern);
  if (!match) return false;
  const matchedUrl = match[0].replace(/&amp;|\\u0026/g, '&');
  mimic_url = `https://www.youtube.com${matchedUrl}`;
  await finishWithVideo();
  return true;
}

// Shared helper: remove a URL from the candidate list and recurse into the next one.
// The caller must still `return` after calling this to stop its own execution.
function tryNextUrl(urlToRemove) {
  extract0 = extract0.filter(url => url !== urlToRemove);
  if (extract0.length === 0) {
    console.log('[MiMic] No more URLs, deactivating');
    deactivate();
    return;
  }
  mimic_url = extract0[0];
  processStep4();
}

// Step 4: Process mimic_url
async function processStep4() {
  if (extract0.length === 0 && !mimic_url) {
    console.log('[MiMic] No URLs to process, deactivating');
    deactivate();
    return;
  }

  // If mimic_url not set from Ω, get first from extract0
  if (!mimic_url) {
    mimic_url = extract0[0];
  }

  console.log('[MiMic] Processing mimic_url:', mimic_url);

  try {
    // A) Process handle URLs
    if (mimic_url.includes('/@')) {
      original_mimic_url = mimic_url;
      if (mimic_url.includes('/videos')) {
        mimic_url = mimic_url.replace('/videos', '');
      }
      if (mimic_url === account_url && !mimic_url.includes('dissemiotic')) {
        // Remove this URL and try next
        tryNextUrl(mimic_url);
        return;
      }
      
      const playlistResponse_check = await fetch(mimic_url, { method: 'HEAD' }).catch(() => ({ status: 0 }));
      const mimic_url_handle_weirdness_check = mimic_url.replace('/@', '/channel/');
      console.log(`[MiMic] Checking playlistResponse_check.status: ${playlistResponse_check.status}`);
      if (playlistResponse_check.status !== 200 && (await fetch(mimic_url_handle_weirdness_check, { method: 'HEAD' }).then(resp => resp.status === 200).catch(() => false))) {
        mimic_url = mimic_url_handle_weirdness_check;
        console.log(`[MiMic] Converted handle mimic_url to channel version: ${mimic_url} after successful HEAD request of mimic_url_handle_weirdness_check`);
      }

      const lower_mimic_url = mimic_url.toLowerCase().replace(/https?:\/\/www\.youtube\.com/, '');
      console.log('[MiMic] Processed mimic_url for handle checks:', lower_mimic_url);
      if (DISAPPROVED_CHANNELS.has(lower_mimic_url) || APPROVED_CHANNELS.includes(lower_mimic_url) || DISAPPROVED_OTHER_YT.has(mimic_url)) {
        console.log('[MiMic] mimic_URL is either a disapproved or approved handle, trying next URL');

        tryNextUrl(original_mimic_url);
        return;
      }

      const playlistResponse = await fetch(mimic_url);
      const playlistHtml = await playlistResponse.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(playlistHtml, 'text/html');
      const canonicalTag = doc.querySelector('head link[rel="canonical"]');

      if (canonicalTag && canonicalTag.href) {
        // Store the canonical URL back to mimic_url
        original_mimic_url = mimic_url;
        mimic_url = canonicalTag.href;
        console.log(`Updated mimic_url to: ${mimic_url}`);
      }

      if (mimic_url.includes('/channel/')) {
        
        console.log('[MiMic] Channel URL does not match any channel handles, passing through to playlist extraction');
        const urlObj = new URL(mimic_url);
        const playlistHtml = await fetchChannelPlaylist(urlObj);
        if (!await extractFirstPlaylistVideo(playlistHtml, channel_id)) {
          console.log('[MiMic] Could not extract video ID from channel, deactivating');
          deactivate();
        }
        return;
      }
      return;
    }

    // B) Process playlist URLs
    if (mimic_url.includes('/playlist?') && mimic_url.includes('list=')) {
      const playlistResponse = await fetch(mimic_url);
      const playlistHtml = await playlistResponse.text();

      if (checkChannelLists(playlistHtml, mimic_url)) return;

      // Extract list ID
      const listMatch = mimic_url.match(/list=([^&]+)/);
      if (!listMatch) {
        console.log('[MiMic] Could not extract list ID strangely, deactivating');
        deactivate();
        return;
      }
      channel_id = listMatch[1];

      if (!await extractFirstPlaylistVideo(playlistHtml, channel_id)) {
        console.log('[MiMic] Could not find URL with index=1 in playlist, deactivating');
        deactivate();
      }
      return;
    }

    // C) Process watch URLs
    if (mimic_url.includes('/watch?') && mimic_url.includes('v=')) {
      console.log('[MiMic] Detected watch URL, verifying video ID and channel');
      let urlObj = new URL(mimic_url);
      const vParam = urlObj.searchParams.get('v');

      if (vParam === video_id0) {
        // Same video, remove and try next
        tryNextUrl(mimic_url);
        return;
      }

      const channelResponse = await fetch(urlObj.href);
      const channelHTML = await channelResponse.text();

      if (checkChannelLists(channelHTML, mimic_url, true)) return;
      mimic_url = urlObj.href;
      await finishWithVideo();
      return;
    }

    // D) Process channel URLs
    if (mimic_url.includes('/channel/')) {
      original_mimic_url = mimic_url;
      // Convert to UU
      if (mimic_url.includes('/join')) {
        mimic_url = mimic_url.replace('/join', '');
      }
      if (mimic_url.includes('/videos')) {
        mimic_url = mimic_url.replace('/videos', '');
      }
      const urlObj = new URL(mimic_url);
      const channelResponse = await fetch(urlObj.href);
      const channelHTML = await channelResponse.text();

      if (checkChannelLists(channelHTML, original_mimic_url)) return;
        console.log('[MiMic] Channel URL does not match any channel handles, passing through to playlist extraction');
        const playlistHtml = await fetchChannelPlaylist(urlObj);
        if (!await extractFirstPlaylistVideo(playlistHtml, channel_id)) {
          console.log('[MiMic] Could not extract video ID from channel strangely, deactivating');
          deactivate();
        }
        return;
    }

    // E) Process /shorts/ URLs
    if (mimic_url.includes('/shorts/')) {
      tryNextUrl(mimic_url);
      return;
    }
    // F) URL doesn't match any criteria, last attempt before trying next
    const vanityURL = mimic_url.replace('.com/', '.com/@');
    if ((await fetch(vanityURL, { method: 'HEAD' }).then(resp => resp.status === 200).catch(() => false))) {
      extract0 = extract0.filter(url => url !== mimic_url);
      mimic_url = vanityURL;
      processStep4();
    } else {
      tryNextUrl(mimic_url);
    }
  } catch (error) {
    console.error('[MiMic] Error in Step 4:', error);
    deactivate();
  }
}

// Default approved channels — used when storage is empty (mirrors DEFAULT_CHANNELS in options.js)
const DEFAULT_CHANNELS = [
  '/@halfbrewed',
  '/@nexpo',
  '/@soupysoupx',
  '/@bazamalam',
  '/@emortalmarcus',
  '/@sodagirl',
  '/@muldered',
  '/@dissemiotic',
  '/@wowmanzz',
  '/@seedbutter',
  '/@4plus419',
  '/@nightmind',
  '/@antthonygallego',
  '/@minaxa',
  '/@wendigoon',
  '/@catman_vhs',
  '/@crowmudgeon',
  '/@tmetal2854',
  '/@mythonics',
  '/@reapestrella',
  '/@danielprofeta',
  '/@sunflower41xd',
  '/@bdstudios8700',
  '/@johnxwoodcat',
  '/@codexcurse',
  '/@thenightarchives4148',
  '/@thathorrordude101',
  '/@thatguyzanyt',
  '/@m3owyt',
  '/@tedorate',
  '/@abashortfilms',
  '/@gearisko',
  '/@jaybird160',
  '/@nightmaremasterclass'
];

// Load approved channels from storage
function loadApprovedChannels(callback) {
  chrome.storage.sync.get(['approvedChannels'], (result) => {
    if (result.approvedChannels && result.approvedChannels.length > 0) {
      APPROVED_CHANNELS = result.approvedChannels;
      console.log('[MiMic] Loaded approved channels from storage:', APPROVED_CHANNELS);
    } else {
      APPROVED_CHANNELS = DEFAULT_CHANNELS;
      console.log('[MiMic] Using default approved channels:', APPROVED_CHANNELS);
    }
    if (callback) callback();
  });
}

// Listen for messages from options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'reloadChannels') {
    console.log('[MiMic] Reloading channels from storage...');
    loadApprovedChannels(() => {
      console.log('[MiMic] Channels reloaded:', APPROVED_CHANNELS);
    });
  }
});

// --- Navigation detection using YouTube's own yt-navigate-finish event ---
// This is the same reliable approach used by the yt-watch-tracker extension.
// YouTube fires yt-navigate-finish on the document after every SPA navigation
// completes and the page state (including ytInitialPlayerResponse) has updated.
// We track the last seen video ID to avoid re-processing the same video.
document.addEventListener('yt-navigate-finish', () => {
  const m = location.href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (!m) return; // Not a watch page

  const newVideoId = m[1];
  if (newVideoId === video_id0) return; // Same video, nothing to do

  console.log('[MiMic] yt-navigate-finish: new video detected:', newVideoId, '(previous:', video_id0 + ')');

  if (isProcessing) {
    console.log('[MiMic] Navigation blocked: already processing');
    return;
  }

  isProcessing = true;
  hasActivated = false;
  cachedPlayerResponse = null;

  // Small delay to ensure ytInitialPlayerResponse has been updated by YouTube
  setTimeout(() => {
    activate();
    isProcessing = false;
  }, 500);
});
// --- End navigation detection ---

// Simple initialization - just run once on page load
console.log('[MiMic] Initializing...');

// Load approved channels, then activate once the DOM is ready.
// The yt-navigate-finish listener above is already registered at document_start,
// so SPA navigations are caught regardless of when this initial activation runs.
loadApprovedChannels(() => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', activate, { once: true });
  } else {
    activate();
  }
});