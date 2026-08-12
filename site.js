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
  const videos = Array.from(document.querySelectorAll("video"));
  const audibleVideos = [];
  const viewTriggeredVideos = [];
  let audioContext;
  const boostedVideos = new WeakSet();

  const attachCleanSeekbar = (video) => {
    if (video.dataset.cleanSeekbarReady === "true" || !video.parentNode) {
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "clean-video-wrap";
    video.parentNode.insertBefore(wrap, video);
    wrap.appendChild(video);

    const seek = document.createElement("input");
    seek.type = "range";
    seek.className = "clean-video-seek";
    seek.min = "0";
    seek.max = "1000";
    seek.value = "0";
    seek.tabIndex = -1;
    seek.setAttribute("aria-label", "视频进度");
    seek.setAttribute("aria-hidden", "true");
    wrap.appendChild(seek);

    let seeking = false;

    const syncSeek = () => {
      if (!seeking && Number.isFinite(video.duration) && video.duration > 0) {
        seek.value = String((video.currentTime / video.duration) * 1000);
      }
    };

    const jumpToSeekValue = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = (Number(seek.value) / 1000) * video.duration;
      }
    };

    video.addEventListener("timeupdate", syncSeek);
    video.addEventListener("loadedmetadata", syncSeek);
    seek.addEventListener("input", () => {
      seeking = true;
      jumpToSeekValue();
    });
    seek.addEventListener("change", () => {
      seeking = false;
      syncSeek();
    });
    seek.addEventListener("pointerup", () => {
      seeking = false;
      syncSeek();
    });

    video.dataset.cleanSeekbarReady = "true";
  };

  const pauseOtherAudibleVideos = (currentVideo) => {
    audibleVideos.forEach((otherVideo) => {
      if (otherVideo !== currentVideo) {
        otherVideo.pause();
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

  const prepareVideo = (video) => {
    if (video.dataset.mediaReady === "true") {
      return;
    }

    video.dataset.mediaReady = "true";
    video.preload = "metadata";
    video.load();
  };

  videos.forEach((video) => {
    const cleanSeekbar = video.dataset.cleanSeekbar === "true";

    if (cleanSeekbar) {
      video.controls = false;
      video.removeAttribute("controls");
      attachCleanSeekbar(video);
    } else {
      video.controls = true;
      video.setAttribute("controls", "");
    }

    video.setAttribute("playsinline", "");
    video.removeAttribute("autoplay");
    video.preload = "none";

    const silentAutoplay = video.dataset.silentAutoplay === "true";
    const playOnView =
      video.dataset.playOnView === "true" ||
      video.dataset.autoplayOnView === "true" ||
      silentAutoplay;

    if (playOnView) {
      viewTriggeredVideos.push(video);
      video.pause();
    }

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
    }
  });
  window.addEventListener("pagehide", () => {
    videos.forEach((video) => video.pause());
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
      rootMargin: "700px 0px",
      threshold: 0,
    }
  );

  videos.forEach((video) => loadObserver.observe(video));

  if (viewTriggeredVideos.length === 0) {
    return;
  }

  const playObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.28) {
          prepareVideo(video);

          if (video.dataset.silentAutoplay === "true") {
            video.muted = true;
            video.defaultMuted = true;
            video.setAttribute("muted", "");
          } else {
            pauseOtherAudibleVideos(video);
          }

          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    {
      threshold: [0, 0.28, 0.6],
    }
  );

  viewTriggeredVideos.forEach((video) => playObserver.observe(video));
})();
