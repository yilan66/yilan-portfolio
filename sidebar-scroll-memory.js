(function () {
  "use strict";

  var desktop = window.matchMedia("(min-width: 901px)");
  var storageKey = "portfolio-sidebar-state-v2";

  if (!desktop.matches) return;

  function isScrollable(element) {
    if (!element) return false;
    var style = window.getComputedStyle(element);
    return element.scrollHeight > element.clientHeight + 2 &&
      /(auto|scroll)/.test(style.overflowY);
  }

  function findWorkLabel() {
    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function (node) {
          if (node.children.length) return NodeFilter.FILTER_SKIP;
          return /^WORK\b/.test((node.textContent || "").trim())
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        }
      }
    );
    return walker.nextNode();
  }

  function findSidebar() {
    var selectors = [
      ".side-panel",
      ".portfolio-sidebar",
      ".work-sidebar",
      ".left-sidebar",
      ".sidebar",
      "aside"
    ];
    var preferred = document.querySelectorAll(selectors.join(","));

    for (var i = 0; i < preferred.length; i += 1) {
      if (isScrollable(preferred[i])) return preferred[i];
    }

    var label = findWorkLabel();
    var node = label;
    var fallback = null;

    while (node && node !== document.body) {
      if (isScrollable(node)) return node;

      var style = window.getComputedStyle(node);
      if (
        !fallback &&
        node.scrollHeight > node.clientHeight + 2 &&
        /(fixed|sticky)/.test(style.position)
      ) {
        fallback = node;
      }
      node = node.parentElement;
    }

    return fallback;
  }

  function setup() {
    var sidebar = findSidebar();
    if (!sidebar) return;

    var frame = 0;

    function readState() {
      try {
        return JSON.parse(window.sessionStorage.getItem(storageKey) || "{}");
      } catch (error) {
        return {};
      }
    }

    function saveState(event) {
      if (event && event.target && event.target.closest) {
        var link = event.target.closest("a");
        if (link) {
          try {
            window.sessionStorage.setItem(
              storageKey + ":active",
              link.getAttribute("href") || ""
            );
          } catch (error) {}
        }
      }

      function persist() {
        try {
          window.sessionStorage.setItem(
            storageKey,
            JSON.stringify({ top: sidebar.scrollTop })
          );
        } catch (error) {}
      }

      if (event && (event.type === "click" || event.type === "pagehide")) {
        persist();
        return;
      }

      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = 0;
        persist();
      });
    }

    function restoreState() {
      var state = readState();
      if (typeof state.top !== "number" || !Number.isFinite(state.top)) return;

      var maximum = Math.max(0, sidebar.scrollHeight - sidebar.clientHeight);
      sidebar.scrollTop = Math.min(Math.max(state.top, 0), maximum);
    }

    sidebar.addEventListener("scroll", saveState, { passive: true });
    sidebar.addEventListener("pointerdown", saveState, true);
    sidebar.addEventListener("click", saveState, true);
    window.addEventListener("pagehide", saveState);
    window.addEventListener("pageshow", restoreState);
    window.addEventListener("load", restoreState, { once: true });

    restoreState();
    window.requestAnimationFrame(restoreState);
    window.setTimeout(restoreState, 120);
    window.setTimeout(restoreState, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  } else {
    setup();
  }
})();
