(function () {
  const resumeUrl = "assets/resume-20260821.pdf";

  function setUpResumeLink(element) {
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

  function init() {
    document.querySelectorAll("a, button, [role='button']").forEach(function (element) {
      if (element.textContent.trim().toLowerCase() === "resume") {
        setUpResumeLink(element);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}());
