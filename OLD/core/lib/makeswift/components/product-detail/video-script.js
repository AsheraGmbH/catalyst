(function () {
  // Your Cloudflare Stream .m3u8 URL
  const videoSrc =
    'https://customer-js0qaqinw74u6ydh.cloudflarestream.com/080e8e9a62989e1afc0bec7077938ed3/manifest/video.m3u8';

  const video = document.getElementById('myHlsVideo');
  const playOverlay = document.getElementById('playOverlay');
  const loadingOverlay = document.getElementById('loadingOverlay');

  let hasInitialized = false; // Track if we've attached HLS or set a native src

  // When user clicks the overlay => load + play with sound
  playOverlay?.addEventListener('click', () => {
    // Show "Loading..." overlay right after user clicks
    loadingOverlay.classList.add('visible');

    // If we haven't initialized yet, do so now
    if (!hasInitialized) {
      hasInitialized = true;

      // Check for native HLS (Safari, iOS)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
        attachListeners();
        startPlayback();
      } else {
        // Otherwise, dynamically load Hls.js
        if (!window.Hls) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.18/hls.min.js';
          script.onload = () => {
            attachHls();
            attachListeners();
            startPlayback();
          };
          document.head.appendChild(script);
        } else {
          // Hls.js already exists
          attachHls();
          attachListeners();
          startPlayback();
        }
      }
    } else {
      // If already initialized, just play again
      startPlayback();
    }
  });

  function attachHls() {
    if (window.Hls && window.Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
    } else {
      console.warn('Hls.js is not supported in this environment.');
    }
  }

  // Start playback from the beginning, reveal controls, unmute
  function startPlayback() {
    video.currentTime = 0;
    video.muted = false;
    video
      .play()
      .then(() => {
        video.setAttribute('controls', '');
        // Hide the play overlay
        playOverlay.classList.add('hidden');
      })
      .catch((err) => {
        console.warn('Playback failed:', err);
        // Hide loading, show play button again so user can retry
        loadingOverlay.classList.remove('visible');
        playOverlay.classList.remove('hidden');
      });
  }

  // Listen for events to hide the loading overlay:
  function attachListeners() {
    // 1) Once video is actually "playing"
    video.addEventListener('playing', () => {
      loadingOverlay.classList.remove('visible');
    });

    // 2) If buffering occurs again, you could re-show the overlay:
    //    e.g. video.addEventListener('waiting', () => loadingOverlay.classList.add('visible'));
    //    But that's optional, depending on your needs
  }
})();
