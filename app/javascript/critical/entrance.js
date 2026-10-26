// Critical entrance: embedded in the HTML with a CSP nonce. No framework, module,
// font, image, storage or WebGL download is required to play the entrance.
(() => {
  if (window.portfolioEntrance) {
    window.portfolioEntrance.start();
    return;
  }
  let createPaperBurn;
  // Only the burn enhancement needs a module request; the counter and hero run inline.
  import("effects/paper_burn").then(module => { createPaperBurn = module.createPaperBurn; }).catch(() => {});
  const styleLinks = [...document.querySelectorAll("link[data-entrance-styles]")];
  const stylesReady = Promise.all(styleLinks.map(link => {
    if (link.entranceReady === true) return;
    return new Promise(resolve => {
      link.addEventListener("load", resolve, { once: true });
      link.addEventListener("error", resolve, { once: true });
    });
  })).then(() => {
    document.documentElement.classList.remove("is-style-loading");
  });
  let landingLoaded = false;
  document.documentElement.classList.add("is-entrance-waiting");
  const portraitReady = document.querySelector(".hero-portrait")?.decode().catch(() => {});
  // Keep the entrance intact until its actual portrait is decoded, even on a slow connection.
  // A failed/missing portrait settles too, so a broken image cannot trap the visitor.
  const landingReady = Promise.all([stylesReady, portraitReady]).then(() => {
    landingLoaded = true;
    document.documentElement.classList.remove("is-entrance-waiting");
  });

  // Counts 0→100 against real readiness (fonts, hero portrait, window load). Moments in, the sheet catches fire
  // right over the face in the hero portrait and the burn grows with the count (WebGL), so the burn itself is the
  // reveal while the site loads; at 100 the rest burns off. Without WebGL it wipes up instead.
  // A minimum keeps the count readable on a warm cache; a cap keeps a slow network from holding the hero hostage.
  const MIN_MS = 2400;
  const MAX_MS = 3200;
  const IGNITE_AT = 6; // percent: just after the labels have risen in
  const LOADING_BURN = 0.55; // most of the burn that may happen while counting; the rest is the finale
  const NOISE_REACH = 0.17; // the shader's ragged edge runs up to this far (viewport heights) past the mean front
  const FINISH_MS = 1300;
  const REVEAL_MS = 900; // matches the panel wipe's transition-delay in entrance_styles
  const EXIT_MS = 3600; // failsafe for either exit, from 100%

  class Preloader {
    constructor(element) {
      this.element = element;
      for (const target of ["count", "bar", "words"]) {
        this[`${target}Target`] = element.querySelector(`[data-preloader-target="${target}"]`);
      }
      this.connect();
    }

    connect() {
      this.root = document.documentElement;
      if (!this.root.classList.contains("is-preloading")) {
        this.done = true;
        return this.element.remove();
      }
      this.finish = () => this.complete();
      document.addEventListener("turbo:before-cache", this.finish);
      this.digits = [...this.countTarget.querySelectorAll(".preloader-digit")];
      this.wordCount = this.wordsTarget.children.length;
      // Start when the inline runtime can display the sheet, never while assets are downloading.
      this.started = performance.now();
      this.root.dataset.preloaderStarted = this.started;
      this.lastTick = performance.now();
      this.shown = 0;
      this.goal = 8;
      const remaining = MAX_MS - (performance.now() - this.started);
      if (remaining <= 0) return this.complete();
      this.deadlineTimer = setTimeout(() => this.leave(), remaining);
      this.track();
      this.frame = requestAnimationFrame(() => this.tick());
    }

    track() {
      const portrait = document.querySelector(".hero-portrait");
      const signals = [
        landingReady,
        document.fonts?.ready,
        portrait?.decode().catch(() => {}),
        document.readyState === "complete" ? null : new Promise((resolve) => addEventListener("load", resolve, { once: true })),
      ].filter(Boolean);
      let settled = 0;
      if (!signals.length) this.goal = 100;
      signals.forEach((signal) => signal.then(() => {
        settled += 1;
        this.goal = 8 + (92 * settled) / signals.length;
      }));
    }

    tick() {
      if (this.done || this.leaving) return;
      const now = performance.now();
      const elapsed = now - this.started;
      const delta = now - this.lastTick;
      this.lastTick = now;
      const goal = elapsed >= MAX_MS ? 100 : Math.min(this.goal, (100 * elapsed) / MIN_MS);
      this.shown += (goal - this.shown) * (1 - Math.exp(-delta / 130));
      if (elapsed >= MAX_MS) this.shown = 100;
      if (goal - this.shown < 0.4) this.shown = goal;
      this.render(Math.min(landingLoaded ? 100 : 99, Math.round(this.shown)));
      if (this.shown >= 100) return this.leave();
      this.frame = requestAnimationFrame(() => this.tick());
    }

    render(value) {
      if (value === this.value) return;
      this.value = value;
      this.countTarget.dataset.value = value;
      const places = [Math.floor(value / 100), Math.floor(value / 10) % 10, value % 10];
      this.digits.forEach((digit, index) => {
        digit.style.setProperty("--digit", places[index]);
        digit.classList.toggle("is-blank", index === 0 ? value < 100 : index === 1 && value < 10);
      });
      const progress = value / 100;
      this.barTarget.style.setProperty("--progress", progress);
      this.wordsTarget.style.setProperty("--word", Math.min(this.wordCount - 1, Math.floor(progress * this.wordCount)));
      if (value >= IGNITE_AT && !this.leaving && this.burner === undefined) this.ignite();
      // Ease out over the loading stretch, so the flame catches gently and keeps spreading.
      const t = Math.max(0, (value - IGNITE_AT) / (100 - IGNITE_AT));
      this.burner?.set(this.loadingBurn * (1 - (1 - t) * (1 - t)));
    }

    // Distance (CSS px) from the ignition point to the nearest edge of an element.
    reach(element) {
      const box = element.getBoundingClientRect();
      const dx = Math.max(box.left - this.origin.x, 0, this.origin.x - box.right);
      const dy = Math.max(box.top - this.origin.y, 0, this.origin.y - box.bottom);
      return Math.hypot(dx, dy);
    }

    // The flame catches over the face in the hero portrait underneath (the middle of the screen elsewhere).
    ignite() {
      // The counter and wipe never wait for this optional module download.
      if (!createPaperBurn || !landingLoaded) return;
      const portrait = document.querySelector(".hero-portrait")?.getBoundingClientRect();
      this.origin = portrait?.width
        ? { x: portrait.left + portrait.width / 2, y: Math.min(innerHeight * 0.7, portrait.top + portrait.height * 0.22) }
        : { x: innerWidth / 2, y: innerHeight * 0.45 };
      // Only the top labels can catch; the counter row is kept out of reach (see loadingBurn) and exits at 100.
      this.masks = [...this.element.querySelectorAll(".preloader-row:not(.preloader-row-bottom) .preloader-mask")]
        .map((mask) => ({ mask, reach: this.reach(mask) }));
      try {
        this.burner = createPaperBurn({
          host: this.element,
          finishFrom: LOADING_BURN,
          origin: this.origin,
          paint: (context, width, height, scale) => this.paint(context, scale),
          onIgnite: () => this.element.classList.add("is-burning"),
          onReveal: () => this.reveal(),
          onFrame: (radius) => this.scorch(radius),
          onFallback: () => this.fallback(),
        });
      } catch {
        this.burner = null;
      }
      if (!this.burner) return;
      // While counting, the hole grows around the portrait but stops short of the counter and the "Loading" line,
      // so they stay on intact paper until the finale.
      const bottom = Math.min(...Array.from(this.element.querySelectorAll(".preloader-row-bottom .preloader-mask"), (mask) => this.reach(mask)));
      this.loadingBurn = Math.min(LOADING_BURN, Math.max(0.1, (bottom / innerHeight - 0.06) / this.burner.speed));
    }

    // Any label a flame tongue reaches chars and crumbles instead of floating over the hole.
    scorch(radius) {
      const ragged = radius + NOISE_REACH * innerHeight * 0.6;
      this.masks.forEach((entry) => {
        if (!entry.burnt && ragged > entry.reach) {
          entry.burnt = true;
          entry.mask.classList.add("is-burnt");
        }
      });
    }

    fallback() {
      this.burner = null;
      if (this.done) return;
      if (this.revealed) return this.complete();
      this.element.classList.remove("is-burning");
      this.masks?.forEach(({ mask }) => mask.classList.remove("is-burnt"));
      if (this.leaving) this.wipe();
    }

    async leave() {
      if (this.done || this.leaving) return;
      // Keep the sheet until the landing page is styled and its portrait can be displayed.
      // Fonts, secondary images and optional scripts cannot hold up the entrance.
      if (!landingLoaded) {
        this.render(99);
        if (!this.waitingForLanding) {
          this.waitingForLanding = true;
          landingReady.then(() => this.leave());
        }
        return;
      }
      this.leaving = true;
      clearTimeout(this.deadlineTimer);
      cancelAnimationFrame(this.frame);
      this.shown = 100;
      this.render(100);
      this.timer = setTimeout(this.finish, EXIT_MS);
      this.element.classList.add("is-leaving");
      if (!this.burner) return this.wipe();
      const finished = await this.burner.finish(FINISH_MS);
      if (finished) this.complete();
    }

    wipe() {
      this.element.addEventListener("transitionend", (event) => {
        if (event.target === this.element && event.propertyName === "clip-path") this.complete();
      });
      this.revealTimer = setTimeout(() => this.reveal(), REVEAL_MS);
      this.element.classList.add("is-wiping");
    }

    // The burn texture: the bare sheet. The labels, counter and progress line stay live in the DOM above it.
    paint(context, scale) {
      context.scale(scale, scale);
      context.fillStyle = getComputedStyle(this.element).backgroundColor;
      context.fillRect(0, 0, innerWidth, innerHeight);
    }

    // Tells the hero name to play its entrance as the burn (or wipe) uncovers it.
    reveal() {
      if (this.revealed) return;
      this.revealed = true;
      document.dispatchEvent(new CustomEvent("preloader:reveal"));
    }

    complete() {
      if (this.done) return;
      this.done = true;
      cancelAnimationFrame(this.frame);
      this.burner?.stop();
      clearTimeout(this.deadlineTimer);
      clearTimeout(this.timer);
      clearTimeout(this.revealTimer);
      this.reveal();
      this.root.classList.remove("is-preloading");
      delete this.root.dataset.preloaderStarted;
      document.dispatchEvent(new CustomEvent("preloader:complete"));
      try {
        sessionStorage.setItem("preloaded", "1");
      } catch {}
      this.element.remove();
    }

    disconnect() {
      this.complete();
      document.removeEventListener("turbo:before-cache", this.finish);
    }
  }


  // Hero name motion: letters rise in (as the preloader burn uncovers them on a first visit), the front copy of the
  // surname then dissolves so it sinks behind the portrait, and the lines drift apart on scroll and lean toward the
  // cursor (layers of one line move together). The text stays plain in the HTML and in Turbo's cache.
  const DISSOLVE_DELAY = 2300;
  class HeroName {
    constructor(element) {
      this.element = element;
      this.lineTargets = [...element.querySelectorAll('[data-hero-name-target="line"]')];
      this.connect();
    }

    connect() {
      this.preference = matchMedia("(prefers-reduced-motion: reduce)");
      this.fine = matchMedia("(pointer: fine)");
      this.originals = this.lineTargets.map((line) => line.textContent);
      this.reset = () => this.restore();
      // Keep the entrance on low-end devices and when the OS reports animations off.
      // Only the expensive blur and continuous pointer motion are optional.
      this.lightweight = this.preference.matches || navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;
      this.motionChange = () => {
        this.lightweight = this.preference.matches || navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;
      };
      this.reveal = () => this.enter();
      this.queue = () => this.schedule();
      this.pointer = (event) => {
        this.pointerX = (event.clientX / innerWidth) * 2 - 1;
        this.pointerY = (event.clientY / innerHeight) * 2 - 1;
        this.schedule();
      };
      document.addEventListener("turbo:before-cache", this.reset);
      this.preference.addEventListener("change", this.motionChange);
      this.start();
    }

    start() {
      this.split();
      this.pointerX = this.pointerY = 0;
      this.drift = { x: 0, y: 0 };
      addEventListener("scroll", this.queue, { passive: true });
      if (this.fine.matches) addEventListener("pointermove", this.pointer, { passive: true });
      if (document.documentElement.classList.contains("is-preloading")) {
        document.addEventListener("preloader:reveal", this.reveal, { once: true });
      } else {
        this.enter();
      }
    }

    split() {
      if (this.chars) return;
      // Layers of the same line share indexes so the solid and outline copies rise in lockstep.
      const offsets = {};
      let next = 0;
      this.chars = [];
      this.lineTargets.forEach((line) => {
        const group = line.dataset.group;
        if (!(group in offsets)) {
          offsets[group] = next;
          next += line.textContent.trim().length;
        }
        let index = offsets[group];
        const words = line.textContent.trim().split(/\s+/);
        line.textContent = "";
        words.forEach((word, wordIndex) => {
          const wrapper = document.createElement("span");
          wrapper.className = "hero-word";
          [...word].forEach((letter) => {
            const char = document.createElement("span");
            char.className = "hero-char";
            char.textContent = letter;
            char.dataset.index = index++;
            wrapper.append(char);
            this.chars.push(char);
          });
          line.append(wrapper);
          if (wordIndex < words.length - 1) line.append(" ");
        });
      });
    }

    enter() {
      if (!landingLoaded) {
        if (!this.waitingForLanding) {
          this.waitingForLanding = true;
          landingReady.then(() => { if (this.element.isConnected) this.enter(); });
        }
        return;
      }
      if (this.entered) return;
      this.entered = true;
      this.chars?.forEach((char) => char.animate(
        [
          { opacity: 0, transform: "translateY(0.55em) rotate(7deg)", filter: this.lightweight ? "none" : "blur(10px)" },
          { opacity: 1, transform: "none", filter: this.lightweight ? "none" : "blur(0)" },
        ],
        { duration: 1100, delay: 120 + Number(char.dataset.index) * 42, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "backwards" },
      ));
      // Letter by letter the front surname smokes away, leaving its twin behind the portrait.
      this.lineTargets.filter((line) => "dissolve" in line.dataset).forEach((line) => {
        line.querySelectorAll(".hero-char").forEach((char, index) => char.animate(
          [
            { opacity: 1, filter: this.lightweight ? "none" : "blur(0)", transform: "none" },
            { opacity: 0.55, filter: this.lightweight ? "none" : "blur(2px)", transform: "translateY(-0.01em) scale(1.01)", offset: 0.35 },
            { opacity: 0, filter: this.lightweight ? "none" : "blur(14px)", transform: "translateY(-0.05em) scale(1.06)" },
          ],
          { duration: 1900, delay: DISSOLVE_DELAY + index * 120, easing: "ease-in-out", fill: "forwards" },
        ));
      });
    }

    schedule() {
      if (this.lightweight) return;
      if (this.frame) return;
      this.frame = requestAnimationFrame(() => this.render());
    }

    render() {
      this.frame = null;
      const progress = Math.min(1, Math.max(0, scrollY / (this.element.offsetHeight || innerHeight)));
      // Ease the cursor lean so quick flicks glide instead of snapping.
      this.drift.x += (this.pointerX - this.drift.x) * 0.12;
      this.drift.y += (this.pointerY - this.drift.y) * 0.12;
      const transforms = {
        first: `translate3d(${-progress * 9 - this.drift.x * 1.2}%, ${progress * -18 - this.drift.y * 6}px, 0)`,
        last: `translate3d(${progress * 9 + this.drift.x * 1.8}%, ${progress * 24 + this.drift.y * 10}px, 0)`,
      };
      this.lineTargets.forEach((line) => (line.style.transform = transforms[line.dataset.group] ?? ""));
      if (Math.abs(this.pointerX - this.drift.x) > 0.002 || Math.abs(this.pointerY - this.drift.y) > 0.002) this.schedule();
    }

    stop() {
      removeEventListener("scroll", this.queue);
      removeEventListener("pointermove", this.pointer);
      document.removeEventListener("preloader:reveal", this.reveal);
      cancelAnimationFrame(this.frame);
      this.frame = null;
      this.restore();
    }

    restore() {
      this.lineTargets.forEach((line, index) => {
        line.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
        line.textContent = this.originals[index];
        line.style.transform = "";
      });
      this.chars = null;
      this.entered = false;
    }

    disconnect() {
      this.stop();
      document.removeEventListener("turbo:before-cache", this.reset);
      this.preference.removeEventListener("change", this.motionChange);
    }
  }

  let preloader;
  let hero;
  const start = () => {
    const sheet = document.querySelector(".preloader");
    const name = document.querySelector("#hero-name");
    // Connect the hero first so it cannot miss even the earliest reveal event.
    if (name && hero?.element !== name) {
      hero?.disconnect();
      hero = new HeroName(name);
    }
    if (sheet && preloader?.element !== sheet) {
      preloader?.disconnect();
      preloader = new Preloader(sheet);
    }
  };
  const stop = () => {
    preloader?.disconnect();
    hero?.disconnect();
    preloader = hero = null;
  };
  window.portfolioEntrance = { start };
  document.addEventListener("turbo:load", start);
  document.addEventListener("turbo:before-cache", stop);
  document.addEventListener("turbo:before-render", stop);
  start();
})();
