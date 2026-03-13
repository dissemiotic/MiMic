// Background service worker for MiMic extension
// Handles window creation and management

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openMimicWindow') {
    const mimicUrl = message.url;
    const shouldMinimize = message.shouldMinimize ?? true; // default true
    const shouldMute = message.shouldMute ?? true; // default true
    
    console.log('[MiMic Background] Received - shouldMute:', message.shouldMute, 'resolved to:', shouldMute);
    console.log('[MiMic Background] Received - shouldMinimize:', message.shouldMinimize, 'resolved to:', shouldMinimize);
    
    // Get current window to calculate dimensions and store reference
    chrome.windows.getCurrent((currentWindow) => {
      const originalWindowId = currentWindow.id;
      const width = Math.floor(currentWindow.width * 0.15);
      const height = Math.floor(currentWindow.height * 0.15);
      
      // Create new window with 15% dimensions
      chrome.windows.create({
        url: mimicUrl,
        type: 'popup',
        width: width,
        height: height,
        focused: true,
        state: 'normal'
      }, (newWindow) => {
        const windowId = newWindow.id;
        const tabId = newWindow.tabs[0].id;
        
        // Mute the tab if requested
        if (shouldMute) {
          chrome.tabs.update(tabId, { muted: true });
          console.log('[MiMic] Tab muted');
        } else {
          console.log('[MiMic] Muting disabled by user');
        }
        
        // Inject the keep-playing script as soon as possible
        // Use document_start to inject before YouTube's scripts run
        const injectScript = () => {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['keep-playing.js'],
            world: 'MAIN', // Inject into main world to access page's video element
            injectImmediately: true
          }, () => {
            if (chrome.runtime.lastError) {
              console.log('[MiMic] Script injection error:', chrome.runtime.lastError);
              // Retry after a short delay
              setTimeout(injectScript, 100);
            } else {
              console.log('[MiMic] Keep-playing script injected');
            }
          });
        };
        
        // Wait for tab to start loading, then inject
        chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
          if (updatedTabId === tabId && info.status === 'loading') {
            chrome.tabs.onUpdated.removeListener(listener);
            injectScript();
          }
        });
        
        // Wait a random 9–15 seconds, then minimize the window if requested
        if (shouldMinimize) {
          const minimizeDelay = Math.floor(Math.random() * 6001) + 9000; // 9000–15000 ms
          console.log('[MiMic] Minimizing after', minimizeDelay, 'ms');
          setTimeout(() => {
            chrome.windows.update(windowId, { state: 'minimized' }, () => {
              console.log('[MiMic] Window minimized');
              
              // After minimizing the new window, maximize the original window to 100%
              chrome.windows.update(originalWindowId, { state: 'maximized' }, () => {
                console.log('[MiMic] Original window maximized to 100%');
              });
            });
          }, minimizeDelay);
        } else {
          console.log('[MiMic] Minimization disabled by user');
        }

        // If the mimicUrl is not a list/playlist, watch for title changes.
        // A title change means YouTube auto-advanced to an unknown next video;
        // pause it immediately.
        if (!mimicUrl.includes('list')) {
          let initialTitleSet = false;

          chrome.tabs.onUpdated.addListener(function titleWatcher(updatedTabId, info) {
            if (updatedTabId !== tabId) return;

            // Skip the very first title assignment (the page loading its own title)
            if (!initialTitleSet) {
              if (info.title) {
                initialTitleSet = true;
                console.log('[MiMic] Initial title recorded:', info.title);
              }
              return;
            }

            // A subsequent title change means a new video loaded automatically
            if (info.title) {
              console.log('[MiMic] Title changed to "' + info.title + '" — pausing auto-advanced video');
              chrome.tabs.onUpdated.removeListener(titleWatcher); // fire once only

              chrome.tabs.sendMessage(tabId, { action: 'mimicForcePause' }, () => {
                if (chrome.runtime.lastError) {
                  console.log('[MiMic] Could not send forcePause:', chrome.runtime.lastError.message);
                }
              });
            }
          });
        }
      });
    });
    
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});