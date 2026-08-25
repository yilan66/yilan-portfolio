(function () {
  const framerHero = document.querySelector(".framer-hero");

  if (!framerHero) {
    return;
  }

  let framePending = false;

  const syncFramerHeroState = () => {
    framePending = false;
    const revealAfter = 80;
    const bounds = framerHero.getBoundingClientRect();

    document.body.classList.toggle(
      "framer-at-top",
      bounds.top > -revealAfter
    );
    document.body.classList.toggle("framer-hero-offscreen", bounds.bottom <= 0);
  };

  const requestFramerHeroSync = () => {
    if (framePending) {
      return;
    }

    framePending = true;
    window.requestAnimationFrame(syncFramerHeroState);
  };

  syncFramerHeroState();
  window.addEventListener("scroll", requestFramerHeroSync, { passive: true });
  window.addEventListener("resize", requestFramerHeroSync);
})();

(function () {
  const isMobileDevice =
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches ||
    window.innerWidth < 768;

  if (isMobileDevice) {
    document.querySelectorAll("video[data-mobile-src]").forEach((video) => {
      if (video.dataset.mobileSrc) {
        video.src = video.dataset.mobileSrc;
      }
    });

    document.querySelectorAll("img[data-mobile-src]").forEach((img) => {
      if (img.dataset.mobileSrc) {
        img.src = img.dataset.mobileSrc;
      }
    });
  }

  const videos = Array.from(document.querySelectorAll("video"));
  const audibleVideos = [];
  const viewTriggeredVideos = [];
  const playingSilentVideos = new Set();
  const MAX_SILENT_VIDEOS = isMobileDevice ? 2 : 4;
  let userInteracted = false;
  let audioContext;
  const boostedVideos = new WeakSet();

  const pauseOtherAudibleVideos = (currentVideo) => {
    audibleVideos.forEach((otherVideo) => {
      if (otherVideo !== currentVideo) {
        otherVideo.pause();
      }
    });
  };

  const syncSilentPlayback = () => {
    const candidates = viewTriggeredVideos.filter(
      (video) =>
        video.dataset.silentAutoplay === "true" &&
        video.dataset.silentShouldPlay === "true"
    );

    candidates.slice(MAX_SILENT_VIDEOS).forEach((video) => {
      video.pause();
      playingSilentVideos.delete(video);
    });

    candidates.slice(0, MAX_SILENT_VIDEOS).forEach((video) => {
      if (playingSilentVideos.has(video)) {
        return;
      }
      const playPromise = video.play();
      if (playPromise && playPromise.then) {
        playPromise
          .then(() => {
            playingSilentVideos.add(video);
          })
          .catch(() => {});
      } else {
        playingSilentVideos.add(video);
      }
    });
  };

  const applyAudioGain = (video) => {
    const gainValue = Number(video.dataset.audioGain || 1);

    if (!Number.isFinite(gainValue) || gainValue <= 1) {
      return;
    }

    try {
      audioContext =
        audioContext ||
        new (window.AudioContext || window.webkitAudioContext)();

      if (!boostedVideos.has(video)) {
        const source = audioContext.createMediaElementSource(video);
        const gain = audioContext.createGain();
        gain.gain.value = gainValue;
        source.connect(gain).connect(audioContext.destination);
        boostedVideos.add(video);
      }

      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
      }
    } catch (error) {
      video.volume = 1;
    }
  };

  const MAX_CONCURRENT_LOADS = isMobileDevice ? 2 : 3;
  const loadQueue = [];
  let loadingCount = 0;

  const processLoadQueue = () => {
    while (loadingCount < MAX_CONCURRENT_LOADS && loadQueue.length > 0) {
      const video = loadQueue.shift();
      if (video.dataset.mediaReady === "true") {
        continue;
      }
      loadingCount++;
      video.dataset.mediaReady = "true";
      video.preload = "metadata";

      const onDone = () => {
        loadingCount = Math.max(0, loadingCount - 1);
        processLoadQueue();
      };
      video.addEventListener("loadeddata", onDone, { once: true });
      video.addEventListener("error", onDone, { once: true });
      video.load();
    }
  };

  const queueVideoLoad = (video, highPriority = false) => {
    if (video.dataset.mediaReady === "true") {
      return;
    }
    if (loadQueue.includes(video)) {
      if (highPriority) {
        loadQueue.splice(loadQueue.indexOf(video), 1);
        loadQueue.unshift(video);
      }
      return;
    }
    if (highPriority) {
      loadQueue.unshift(video);
    } else {
      loadQueue.push(video);
    }
    processLoadQueue();
  };

  const prepareVideo = (video, highPriority = false) => {
    queueVideoLoad(video, highPriority);
  };

  // Prioritize the first visible media in each project gallery (LCP).
  const lcpVideos = new Set();
  document.querySelectorAll(".project-gallery").forEach((gallery) => {
    const firstMedia = gallery.querySelector("img, video");
    if (!firstMedia) {
      return;
    }
    firstMedia.setAttribute("loading", "eager");
    firstMedia.setAttribute("fetchpriority", "high");
    if (firstMedia.tagName === "VIDEO") {
      firstMedia.dataset.lcpPriority = "true";
      lcpVideos.add(firstMedia);
      prepareVideo(firstMedia, true);
    }
  });

  videos.forEach((video) => {
    const silentAutoplay = video.dataset.silentAutoplay === "true";

    video.controls = false;
    video.removeAttribute("controls");
    video.setAttribute("playsinline", "");
    video.removeAttribute("autoplay");
    if (!lcpVideos.has(video)) {
      video.preload = "none";
    }

    const playOnView =
      video.dataset.playOnView === "true" ||
      video.dataset.autoplayOnView === "true" ||
      silentAutoplay;

    if (playOnView) {
      viewTriggeredVideos.push(video);
      video.pause();
    }

    const showControlsAndPlay = () => {
      video.controls = true;
      video.setAttribute("controls", "");
      const playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {});
      }
    };

    video.addEventListener("click", showControlsAndPlay);

    if (silentAutoplay) {
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.removeAttribute("poster");
      return;
    }

    audibleVideos.push(video);
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    video.removeAttribute("muted");

    video.addEventListener("play", () => {
      pauseOtherAudibleVideos(video);
      video.muted = false;
      video.volume = 1;
      applyAudioGain(video);
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      videos.forEach((video) => video.pause());
      playingSilentVideos.clear();
    }
  });
  window.addEventListener("pagehide", () => {
    videos.forEach((video) => video.pause());
    playingSilentVideos.clear();
  });

  if (!("IntersectionObserver" in window)) {
    videos.forEach(prepareVideo);
    return;
  }

  const loadObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        prepareVideo(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: isMobileDevice ? "200px 0px" : "500px 0px",
      threshold: 0,
    }
  );

  videos.forEach((video) => loadObserver.observe(video));

  if (viewTriggeredVideos.length === 0) {
    return;
  }

  const playThreshold = isMobileDevice ? 0.45 : 0.28;
  const playObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        const shouldPlay =
          entry.isIntersecting && entry.intersectionRatio >= playThreshold;

        if (video.dataset.silentAutoplay === "true") {
          video.dataset.silentShouldPlay = shouldPlay ? "true" : "false";
          if (shouldPlay) {
            prepareVideo(video);
          } else {
            video.pause();
            playingSilentVideos.delete(video);
          }
          syncSilentPlayback();
          return;
        }

        if (shouldPlay) {
          prepareVideo(video);
          pauseOtherAudibleVideos(video);

          const tryPlay = () => {
            const playPromise = video.play();
            if (playPromise === undefined) {
              return;
            }
            playPromise.catch(() => {
              if (!audibleVideos.includes(video)) {
                return;
              }
              video.muted = true;
              video.play().catch(() => {});
            });
          };

          if (userInteracted) {
            video.muted = false;
            video.volume = 1;
          }

          tryPlay();
        } else {
          video.pause();
        }
      });
    },
    {
      threshold: isMobileDevice ? [0, 0.25, 0.45, 0.7] : [0, 0.28, 0.6],
    }
  );

  viewTriggeredVideos.forEach((video) => playObserver.observe(video));

  const unlockAudio = () => {
    if (userInteracted) {
      return;
    }
    userInteracted = true;
    audibleVideos.forEach((v) => {
      v.muted = false;
      v.defaultMuted = false;
      v.volume = 1;
      v.removeAttribute("muted");
      if (!v.paused) {
        v.play().catch(() => {});
      }
    });
  };

  ["click", "pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    document.addEventListener(eventName, unlockAudio, { once: true, passive: true });
  });
})();

(function () {
  // Skeleton placeholder: fade in media once it finishes loading.
  const markLoaded = (media) => {
    media.classList.remove("is-loading");
    media.classList.add("is-loaded");
  };

  document.querySelectorAll(".project-gallery img").forEach((img) => {
    img.classList.add("is-loading");
    if (img.complete) {
      markLoaded(img);
    } else {
      img.addEventListener("load", () => markLoaded(img), { once: true });
      img.addEventListener("error", () => markLoaded(img), { once: true });
    }
  });

  document.querySelectorAll(".project-gallery video").forEach((video) => {
    video.classList.add("is-loading");
    if (video.readyState >= 2) {
      markLoaded(video);
    } else {
      video.addEventListener("loadeddata", () => markLoaded(video), { once: true });
      video.addEventListener("error", () => markLoaded(video), { once: true });
    }
  });
})();
