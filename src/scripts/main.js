/**
 * maatriks.ai — landing interactions
 * Single scroll-driven animation loop, lightweight observers, no dependencies.
 */

(function () {
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function setupRevealObserver() {
    var reveals = document.querySelectorAll(".reveal");
    if (!reveals.length) {
      return;
    }

    if (!("IntersectionObserver" in window) || reducedMotion) {
      reveals.forEach(function (element) {
        element.classList.add("visible");
      });
      return;
    }

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -48px 0px"
    });

    reveals.forEach(function (element) {
      revealObserver.observe(element);
    });
  }

  function setupAutoProgressionGraph() {
    var graph = document.querySelector("[data-auto-progression-graph]");
    if (!graph) {
      return;
    }

    if (!("IntersectionObserver" in window) || reducedMotion) {
      graph.classList.add("visible");
      return;
    }

    var section = graph.closest(".auto-progression-section") || graph;
    var graphObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          graph.classList.add("visible");
          graphObserver.unobserve(section);
        }
      });
    }, {
      threshold: 0.35,
      rootMargin: "0px 0px -8% 0px"
    });

    graphObserver.observe(section);
  }

  function setupNavigation() {
    var currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
    document.querySelectorAll(".nav-links a").forEach(function (link) {
      var href = (link.getAttribute("href") || "").replace(/\/+$/, "") || "/";
      if (currentPath === href || (href !== "/" && currentPath.indexOf(href) === 0)) {
        link.classList.add("active");
      }
    });

    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav-links");
    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function setupExerciseVideo() {
    var videos = document.querySelectorAll("[data-exercise-video]");
    if (!videos.length) {
      return;
    }

    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var shouldKeepStill = reducedMotion || Boolean(connection && connection.saveData);
    videos.forEach(function (video) {
      var source = video.querySelector("source[data-src]");
      var frame = video.parentElement;
      var sourceAttached = false;
      var inViewport = true;

      if (!source || shouldKeepStill) {
        return;
      }

      function showStill() {
        if (frame) {
          frame.classList.add("is-fallback");
        }
      }

      function attachSource() {
        if (sourceAttached) {
          return;
        }

        source.src = source.getAttribute("data-src");
        sourceAttached = true;
        video.load();
      }

      function syncPlayback() {
        if (document.hidden || !inViewport) {
          video.pause();
          return;
        }

        attachSource();
        var playAttempt = video.play();
        if (playAttempt && typeof playAttempt.catch === "function") {
          playAttempt.catch(showStill);
        }
      }

      video.addEventListener("playing", function () {
        if (frame) {
          frame.classList.remove("is-fallback");
        }
      });
      video.addEventListener("error", showStill);
      document.addEventListener("visibilitychange", syncPlayback);

      if ("IntersectionObserver" in window) {
        var videoObserver = new IntersectionObserver(function (entries) {
          inViewport = entries.some(function (entry) {
            return entry.isIntersecting;
          });
          syncPlayback();
        }, {
          threshold: 0.15
        });
        videoObserver.observe(video);
        return;
      }

      syncPlayback();
    });
  }

  function setupTimedExerciseDemo() {
    var demos = document.querySelectorAll("[data-timed-exercise-demo]");
    if (!demos.length) {
      return;
    }

    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var keepStatic = reducedMotion || Boolean(connection && connection.saveData);
    var compactViewport = window.matchMedia("(max-width: 768px)");

    function readPositiveNumber(value, fallback) {
      var parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    }

    function formatClock(seconds) {
      var safeSeconds = Math.max(0, Math.floor(seconds));
      var minutes = Math.floor(safeSeconds / 60);
      var secondsPart = String(safeSeconds % 60).padStart(2, "0");
      return minutes + ":" + secondsPart;
    }

    demos.forEach(function (demo) {
      var targetSeconds = readPositiveNumber(demo.dataset.targetSeconds, 30);
      var finishSeconds = readPositiveNumber(demo.dataset.finishSeconds, 35);
      var setupDelay = readPositiveNumber(demo.dataset.setupDelayMs, 800);
      var resultDelay = readPositiveNumber(demo.dataset.resultDelayMs, 3200);
      var targetLabel = demo.querySelector("[data-timed-exercise-target]");
      var readout = demo.querySelector("[data-timed-exercise-readout]");
      var support = demo.querySelector("[data-timed-exercise-support]");
      var progress = demo.querySelector("[data-timed-exercise-progress]");
      var overtime = demo.querySelector("[data-timed-exercise-overtime]");
      var savedSeconds = demo.querySelector("[data-timed-exercise-saved-seconds]");
      var inViewport = !("IntersectionObserver" in window);
      var cycleActive = false;
      var cycleStartedAt = 0;
      var lastElapsed = -1;
      var tickHandle = 0;
      var phaseHandle = 0;
      var targetHandle = 0;

      if (!targetLabel || !readout || !support || !progress || !overtime) {
        return;
      }

      targetLabel.textContent = "Target · " + formatClock(targetSeconds);
      if (savedSeconds) {
        savedSeconds.textContent = String(Math.floor(finishSeconds) % 60).padStart(2, "0");
      }

      function clearTimers() {
        window.clearInterval(tickHandle);
        window.clearTimeout(phaseHandle);
        window.clearTimeout(targetHandle);
        tickHandle = 0;
        phaseHandle = 0;
        targetHandle = 0;
      }

      function renderElapsed(elapsedSeconds) {
        var elapsed = Math.min(finishSeconds, Math.max(0, Math.floor(elapsedSeconds)));
        var targetProgress = Math.min(elapsed / targetSeconds, 1);
        var overtimeSeconds = Math.max(elapsed - targetSeconds, 0);
        var overtimeProgress = Math.min(overtimeSeconds / targetSeconds, 1);
        var targetWasReached = lastElapsed < targetSeconds && elapsed >= targetSeconds;

        readout.textContent = formatClock(elapsed);
        support.textContent =
          elapsed >= targetSeconds
            ? "+" + formatClock(overtimeSeconds) + " over"
            : "of " + formatClock(targetSeconds);
        progress.setAttribute("stroke-dashoffset", String(1 - targetProgress));
        overtime.setAttribute("stroke-dashoffset", String(1 - overtimeProgress));
        demo.classList.toggle("can-finish", elapsed >= 1);
        demo.classList.toggle("is-overtime", elapsed >= targetSeconds);

        if (targetWasReached) {
          demo.classList.add("target-reached");
          targetHandle = window.setTimeout(function () {
            demo.classList.remove("target-reached");
          }, 420);
        }

        lastElapsed = elapsed;
      }

      function showSetup() {
        demo.classList.remove(
          "can-finish",
          "is-overtime",
          "is-pressing",
          "is-running",
          "is-saved",
          "target-reached"
        );
        lastElapsed = -1;
        renderElapsed(0);
      }

      function showSavedResult() {
        demo.classList.remove("is-pressing");
        demo.classList.add("is-saved");
        phaseHandle = window.setTimeout(function () {
          cycleActive = false;
          startCycle();
        }, resultDelay);
      }

      function finishCycle() {
        window.clearInterval(tickHandle);
        tickHandle = 0;
        demo.classList.remove("is-running");
        demo.classList.add("is-pressing");
        phaseHandle = window.setTimeout(showSavedResult, 220);
      }

      function sampleTimer() {
        var elapsed = Math.floor((Date.now() - cycleStartedAt) / 1000);
        if (elapsed !== lastElapsed) {
          renderElapsed(elapsed);
        }
        if (elapsed >= finishSeconds) {
          finishCycle();
        }
      }

      function beginTimer() {
        if (!cycleActive || document.hidden || !inViewport || compactViewport.matches) {
          return;
        }

        cycleStartedAt = Date.now();
        demo.classList.add("is-running");
        renderElapsed(0);
        tickHandle = window.setInterval(sampleTimer, 1000);
      }

      function startCycle() {
        if (
          cycleActive ||
          keepStatic ||
          document.hidden ||
          !inViewport ||
          compactViewport.matches
        ) {
          return;
        }

        clearTimers();
        cycleActive = true;
        demo.classList.add("is-enhanced");
        showSetup();
        phaseHandle = window.setTimeout(beginTimer, setupDelay);
      }

      function stopCycle() {
        clearTimers();
        cycleActive = false;
        showSetup();
      }

      function syncDemo() {
        var canAnimate = !keepStatic && !compactViewport.matches;
        demo.classList.toggle("is-enhanced", canAnimate);

        if (canAnimate && !document.hidden && inViewport) {
          startCycle();
          return;
        }

        stopCycle();
      }

      document.addEventListener("visibilitychange", syncDemo);
      if (typeof compactViewport.addEventListener === "function") {
        compactViewport.addEventListener("change", syncDemo);
      } else if (typeof compactViewport.addListener === "function") {
        compactViewport.addListener(syncDemo);
      }

      if ("IntersectionObserver" in window) {
        var demoObserver = new IntersectionObserver(function (entries) {
          inViewport = entries.some(function (entry) {
            return entry.isIntersecting;
          });
          syncDemo();
        }, {
          threshold: 0.35
        });
        demoObserver.observe(demo);
      } else {
        syncDemo();
      }
    });
  }

  function setupSnakeLine() {
    var shell = document.getElementById("story-shell");
    var svg = document.getElementById("snake-line");
    var bgPath = document.getElementById("snake-path-bg");
    var litPath = document.getElementById("snake-path-lit");
    if (!shell || !svg || !bgPath || !litPath) {
      return;
    }

    if (window.matchMedia("(max-width: 767px)").matches) {
      svg.style.display = "none";
      return;
    }

    var lastPath = "";
    var pathLength = 0;
    var frameRequested = false;

    function getAnchorPoints() {
      var shellRect = shell.getBoundingClientRect();
      var anchors = Array.prototype.slice.call(shell.querySelectorAll("[data-snake-anchor]"));

      return anchors.map(function (anchor) {
        var target = anchor.querySelector(".device") || anchor;
        var rect = target.getBoundingClientRect();
        return {
          x: rect.left - shellRect.left + rect.width / 2,
          y: rect.top - shellRect.top + rect.height / 2
        };
      });
    }

    function buildDesktopPath(points) {
      var path = "M " + points[0].x + " " + points[0].y;

      for (var index = 1; index < points.length; index += 1) {
        var previous = points[index - 1];
        var current = points[index];
        var midY = (previous.y + current.y) / 2;
        path += " C " + previous.x + " " + midY + ", " + current.x + " " + midY + ", " + current.x + " " + current.y;
      }

      return path;
    }

    function rebuildPath() {
      var points = getAnchorPoints();
      if (points.length < 2) {
        return;
      }

      var width = Math.max(shell.scrollWidth, shell.clientWidth);
      var height = shell.scrollHeight;
      var d = buildDesktopPath(points);

      if (d === lastPath) {
        return;
      }

      lastPath = d;
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      bgPath.setAttribute("d", d);
      litPath.setAttribute("d", d);
      pathLength = litPath.getTotalLength();
      litPath.style.strokeDasharray = String(pathLength);
      updateProgress();
    }

    function updateProgress() {
      if (!pathLength) {
        return;
      }

      var rect = shell.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      var progress = clamp((viewportHeight - rect.top) / (rect.height + viewportHeight * 0.4), 0, 1);
      litPath.style.strokeDashoffset = String(pathLength * (1 - progress));
    }

    function requestFrame() {
      if (frameRequested) {
        return;
      }

      frameRequested = true;
      window.requestAnimationFrame(function () {
        frameRequested = false;
        rebuildPath();
        updateProgress();
      });
    }

    requestFrame();
    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame);
    window.addEventListener("load", requestFrame);

    if ("ResizeObserver" in window) {
      var resizeObserver = new ResizeObserver(requestFrame);
      resizeObserver.observe(shell);
    }
  }

  setupRevealObserver();
  setupAutoProgressionGraph();
  setupNavigation();
  setupExerciseVideo();
  setupTimedExerciseDemo();
  setupSnakeLine();
})();
