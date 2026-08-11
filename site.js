(function () {
  const framerHero = document.querySelector(".framer-hero");

  if (!framerHero) {
    return;
  }

  const syncFramerHeroState = () => {
    const revealAfter = 80;

    document.body.classList.toggle(
      "framer-at-top",
      framerHero.getBoundingClientRect().top > -revealAfter
    );
  };

  syncFramerHeroState();
  window.addEventListener("scroll", syncFramerHeroState, { passive: true });
  window.addEventListener("resize", syncFramerHeroState);
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

    const silentAutoplay = video.dataset.silentAutoplay === "true";
    const playOnView = video.dataset.playOnView === "true";

    if (silentAutoplay) {
      if (playOnView) {
        viewTriggeredVideos.push(video);
      }

      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.removeAttribute("poster");

      const playSilently = () => {
        video.muted = true;
        video.defaultMuted = true;
        video.play().catch(() => {});
      };

      if (!playOnView) {
        playSilently();
      }

      video.addEventListener("canplay", () => {
        if (!playOnView) {
          playSilently();
        }
      });

      video.addEventListener("loadeddata", () => {
        if (!playOnView) {
          playSilently();
        }
      });

      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && !playOnView) {
          playSilently();
        }
      });

      return;
    }

    audibleVideos.push(video);
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    video.removeAttribute("muted");

    if (playOnView) {
      video.pause();
      video.removeAttribute("autoplay");
      viewTriggeredVideos.push(video);
    }

    video.addEventListener("play", () => {
      pauseOtherAudibleVideos(video);
      video.muted = false;
      video.volume = 1;
      applyAudioGain(video);
    });
  });

  if (!("IntersectionObserver" in window) || viewTriggeredVideos.length === 0) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
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
      threshold: [0, 0.45, 0.75],
    }
  );

  viewTriggeredVideos.forEach((video) => observer.observe(video));
})();
