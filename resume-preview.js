(function () {
  "use strict";

  var resumeUrl = "assets/resume-20260821.pdf";

  function connectResume(element) {
    if (element.tagName === "A") {
      element.href = resumeUrl;
      element.target = "_blank";
      element.rel = "noopener";
      return;
    }

    element.style.cursor = "pointer";
    element.addEventListener("click", function () {
      window.open(resumeUrl, "_blank", "noopener");
    });
  }

  function initResumeLinks() {
    document.querySelectorAll("a, button, [role='button']").forEach(function (element) {
      if (element.textContent.trim().toLowerCase().indexOf("resume") === 0) {
        connectResume(element);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initResumeLinks, { once: true });
  } else {
    initResumeLinks();
  }
}());
