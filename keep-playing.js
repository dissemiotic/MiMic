// Injected script to keep video playing when window is minimized
// Allows user to pause/play via controls, but prevents automatic pauses

(function() {
  'use strict';

  console.log('[MiMic Keep-Playing] Script loaded');

  // Wait for video element to be available
  function initKeepPlaying() {
    const video = document.querySelector('video');

    if (!video) {
      console.log('[MiMic Keep-Playing] No video element found yet, retrying...');
      setTimeout(initKeepPlaying, 500);
      return;
    }

    console.log('[MiMic Keep-Playing] Video element found, setting up pause/play control');

    // Store the original pause method
    const originalPause = video.pause.bind(video);

    // -------------------------------------------------------------------------
    // User-intent tracking
    //
    // userClickedPlayer: true for a short window after ANY click anywhere inside
    //   the YouTube player chrome (.html5-video-player or the <video> itself).
    //   This covers the play/pause button, the mute button, the volume slider,
    //   the settings cog, the fullscreen button, etc.
    //
    // userWantsPaused: latched true when the user explicitly clicks the
    //   play/pause button or presses Space/K. Latched false when they click
    //   play again or press Space/K while paused.
    // -------------------------------------------------------------------------
    let userClickedPlayer  = false;  // short-lived flag: a click just happened
    let userWantsPaused    = false;  // latched: user deliberately paused

    // CSS selectors that identify every interactive region of the YT player.
    // Matching any ancestor is intentional — buttons contain SVG children that
    // are the actual event.target, so closest() is the right tool.
    const PLAYER_SELECTORS = [
      '.html5-video-player',   // entire player container — catch-all
      'video',
      '.ytp-play-button',
      '.ytp-pause-overlay',
      '.ytp-mute-button',
      '.ytp-volume-area',
      '.ytp-volume-panel',
      '.ytp-volume-slider',
      '.ytp-settings-button',
      '.ytp-fullscreen-button',
      '.ytp-miniplayer-button',
      '.ytp-next-button',
      '.ytp-prev-button',
      '.ytp-chapter-title',
      '.ytp-progress-bar',
      '.ytp-scrubber-button',
    ];

    // Returns true if the click target is inside any recognised player element
    function isPlayerClick(target) {
      return PLAYER_SELECTORS.some(sel => {
        try { return target.closest(sel) !== null; } catch { return false; }
      });
    }

    // Returns true if the click target is specifically the play/pause toggle
    function isPlayPauseClick(target) {
      try {
        return (
          target.tagName === 'VIDEO' ||
          target.closest('.ytp-play-button')  !== null ||
          target.closest('.ytp-pause-overlay') !== null
        );
      } catch { return false; }
    }

    // -------------------------------------------------------------------------
    // Click listener (capture phase so it fires before YouTube's own handlers)
    // -------------------------------------------------------------------------
    document.addEventListener('click', (event) => {
      const target = event.target;

      if (isPlayerClick(target)) {
        // Any player click: set the short-lived flag so the pause override
        // knows a user action is in flight.
        userClickedPlayer = true;
        console.log('[MiMic Keep-Playing] User clicked inside player');

        setTimeout(() => { userClickedPlayer = false; }, 300);

        // If the click was specifically on the play/pause toggle, flip the
        // latched intent flag.
        if (isPlayPauseClick(target)) {
          userWantsPaused = !video.paused; // if currently playing → wants paused
          console.log('[MiMic Keep-Playing] Play/pause toggle — userWantsPaused:', userWantsPaused);
        }
      }
    }, true);

    // -------------------------------------------------------------------------
    // Keyboard listener — Space and K toggle play/pause
    // -------------------------------------------------------------------------
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' || event.key === 'k' || event.key === 'K') {
        userClickedPlayer = true;
        userWantsPaused   = !video.paused;
        console.log('[MiMic Keep-Playing] Play/pause key — userWantsPaused:', userWantsPaused);

        setTimeout(() => { userClickedPlayer = false; }, 300);
      }
    }, true);

    // -------------------------------------------------------------------------
    // Override video.pause()
    //
    // Allow the pause only when the user deliberately clicked a play/pause
    // control (userClickedPlayer) AND the latch says they want it paused.
    // All other pause() calls (visibility change, ad logic, etc.) are blocked.
    // -------------------------------------------------------------------------
    video.pause = function() {
      if (userClickedPlayer && userWantsPaused) {
        console.log('[MiMic Keep-Playing] User-initiated pause — allowed');
        return originalPause();
      }
      console.log('[MiMic Keep-Playing] Automatic pause blocked — keeping video playing');
      return Promise.resolve();
    };

    // -------------------------------------------------------------------------
    // Block event listeners that YouTube uses to pause on focus loss
    // -------------------------------------------------------------------------
    const originalWindowAEL = window.addEventListener.bind(window);
    window.addEventListener = function(type, listener, options) {
      if (type === 'blur' || type === 'visibilitychange' || type === 'unload' || type === 'beforeunload') {
        console.log('[MiMic Keep-Playing] Blocked window', type, 'listener');
        return;
      }
      return originalWindowAEL(type, listener, options);
    };

    const originalDocAEL = document.addEventListener.bind(document);
    document.addEventListener = function(type, listener, options) {
      if (type === 'visibilitychange') {
        console.log('[MiMic Keep-Playing] Blocked document visibilitychange listener');
        return;
      }
      return originalDocAEL(type, listener, options);
    };

    // -------------------------------------------------------------------------
    // Natural end detection
    //
    // When a singular watch-URL video finishes, video.ended becomes true and
    // video.paused becomes true. Without this listener the setInterval below
    // would see paused && !userWantsPaused and call play(), seeking back to
    // the start and restarting the video. Latching userWantsPaused on 'ended'
    // prevents that. Playlist videos are unaffected because the player
    // navigates to the next item before the element ever reaches ended state.
    // -------------------------------------------------------------------------
    video.addEventListener('ended', () => {
      console.log('[MiMic Keep-Playing] Video ended naturally — suppressing restart');
      userWantsPaused = true;
    });

    // -------------------------------------------------------------------------
    // Periodic safety net
    //
    // If the video is paused and the user has NOT latched a deliberate pause,
    // restart it. This catches edge cases (ad transitions, autoplay blocks, etc.)
    // without fighting the user's own pause.
    // The !video.ended guard is belt-and-suspenders: if the 'ended' listener
    // above fires between two interval ticks, this ensures the same tick that
    // sees ended cannot also call play().
    // -------------------------------------------------------------------------
    setInterval(() => {
      if (video.paused && !userWantsPaused && !video.ended) {
        console.log('[MiMic Keep-Playing] Video paused automatically — restarting');
        video.play().catch(err => {
          console.log('[MiMic Keep-Playing] play() failed:', err);
        });
      }
    }, 500);

    // -------------------------------------------------------------------------
    // Force-pause listener
    //
    // Receives a command from the background worker when YouTube auto-advances
    // to the next video on a non-list URL (detected via a window title change).
    // originalPause is called directly, bypassing the user-intent gate.
    // userWantsPaused is latched so the setInterval safety net does not
    // immediately restart the video.
    // -------------------------------------------------------------------------
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'mimicForcePause') {
        console.log('[MiMic Keep-Playing] Force-pause received — pausing auto-advanced video');
        userWantsPaused = true; // latch so the safety net does not restart it
        originalPause();
      }
    });

    console.log('[MiMic Keep-Playing] Keep-playing protection active');
  }

  // Start initialization
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initKeepPlaying();
  } else {
    window.addEventListener('DOMContentLoaded', initKeepPlaying);
  }
})();