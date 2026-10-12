(function () {
  "use strict";

  var ENDPOINT = "/api/lead"; // el webhook de Make vive en el servidor (MAKE_WEBHOOK_URL), no aquí
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "] failed:", e); } }

  /* ---------- Año del pie ---------- */
  function initYear() {
    var el = $("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- Menú móvil ---------- */
  function initHeader() {
    var toggle = $("[data-nav-toggle]");
    var nav = $("#nav");
    if (!toggle || !nav) return;
    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      nav.classList.toggle("is-open", open);
    }
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  }

  /* ---------- Scroll suave a anclas (botones "Agendar demo") ---------- */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 68;
      window.scrollTo({ top: id === "#inicio" ? 0 : top, behavior: reduced ? "auto" : "smooth" });
      if (history.replaceState) history.replaceState(null, "", id);
      if (id === "#demo") {
        setTimeout(function () { var f = $("#nombre"); if (f) f.focus({ preventScroll: true }); }, reduced ? 50 : 700);
      }
    });
  }

  /* ---------- Revelado al hacer scroll ---------- */
  function initReveals() {
    var items = $$(".reveal");
    if (!items.length) return;
    if (typeof IntersectionObserver === "undefined") {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.03, rootMargin: "0px 0px -2% 0px" });
    items.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(el);
    });
    // Red de seguridad: a los 6 s se muestra todo lo que ya esté en pantalla.
    setTimeout(function () {
      $$(".reveal:not(.is-in)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
      });
    }, 6000);
  }

  /* ---------- Línea de los 3 pasos y barra de progreso: un solo listener de scroll ---------- */
  function initScrollEffects() {
    var steps = reduced ? null : $("[data-steps]");
    var bar = $("[data-progress]");
    if (!steps && !bar) return;
    var queued = false;
    function update() {
      queued = false;
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
      }
      if (steps) {
        var r = steps.getBoundingClientRect();
        var p = (window.innerHeight * 0.75 - r.top) / r.height;
        steps.style.setProperty("--steps-p", Math.max(0.08, Math.min(1, p)).toFixed(3));
      }
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();
  }

  /* ---------- Firma: la conversación se escribe en directo ---------- */
  function initChat() {
    var chat = $("[data-chat]");
    var body = chat && $(".chat-body", chat);
    if (!body) return;
    var items = Array.prototype.slice.call(body.children);
    if (!items.length) return;

    // Con "reducir movimiento" activado la conversación se muestra entera, sin animar.
    if (reduced) return;

    // La tarjeta arranca pequeña (solo la cabecera) y crece suavemente con cada mensaje.
    // El hero conserva su altura final para que el resto de la página no se mueva.
    var hero = $(".hero");
    if (hero) hero.style.minHeight = hero.offsetHeight + "px";
    chat.classList.add("is-growing");
    items.forEach(function (el) { el.classList.add("is-hidden"); });

    var i = 0;
    var done = false;
    var failsafe = setTimeout(reveal, 40000);

    function grow(mutate) {
      var h0 = chat.offsetHeight;
      chat.style.height = h0 + "px";
      mutate();
      chat.style.height = "auto";
      var h1 = chat.offsetHeight;
      chat.style.height = h0 + "px";
      void chat.offsetHeight; // fuerza el reflujo para que la transición arranque
      chat.style.height = h1 + "px";
    }
    function finish() {
      done = true;
      clearTimeout(failsafe);
      setTimeout(function () {
        chat.classList.remove("is-growing");
        chat.style.height = "";
        if (hero) hero.style.minHeight = "";
      }, 600);
    }
    function reveal() {
      $$(".typing", body).forEach(function (t) { t.remove(); });
      items.forEach(function (el) { el.classList.remove("is-hidden"); });
      finish();
    }
    function show(el) { el.classList.remove("is-hidden"); el.classList.add("is-pop"); }

    function next() {
      if (done) return;
      var el = items[i++];

      if (el.classList.contains("lead-card")) {
        // La ficha del vendedor entra al final, con una entrada suave.
        setTimeout(function () { if (done) return; grow(function () { show(el); }); finish(); }, 900);
        return;
      }

      // Antes de cada mensaje salen los tres puntos de "escribiendo…", tanto del cliente como del asistente.
      var isOut = el.classList.contains("msg-out");
      var typing = document.createElement("span");
      typing.className = "typing" + (isOut ? " is-out" : "");
      typing.setAttribute("aria-hidden", "true");
      typing.innerHTML = "<i></i><i></i><i></i>";
      grow(function () { body.insertBefore(typing, el); });
      setTimeout(function () {
        if (done) return;
        grow(function () { typing.remove(); show(el); });
        setTimeout(next, 350);
      }, isOut ? 1150 : 950);
    }

    setTimeout(next, 700);
  }

  /* ---------- Tilt 3D suave (máx. 6°) en la tarjeta del chat ---------- */
  function initTilt() {
    var card = $("[data-tilt]");
    if (!fineHover || !card) return;
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;
      var y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--ty", ((x - 0.5) * 10).toFixed(2) + "deg");
      card.style.setProperty("--tx", ((0.5 - y) * 8).toFixed(2) + "deg");
      card.style.setProperty("--hx", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--hy", (y * 100).toFixed(1) + "%");
      card.classList.add("is-tilting");
    });
    card.addEventListener("mouseleave", function () {
      card.style.setProperty("--tx", "0deg");
      card.style.setProperty("--ty", "0deg");
      card.classList.remove("is-tilting");
    });
  }

  /* ---------- Formulario: envío a /api/lead ---------- */
  function initForm() {
    var form = $("#form-lead");
    if (!form) return;
    var msg = $("#form-msg");
    var btn = $("[data-submit]", form);
    var ok = $("[data-ok]", form);
    var idleLabel = btn.textContent;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (btn.disabled) return;
      $$(".err", form).forEach(function (p) { p.textContent = ""; });
      $$("[aria-invalid]", form).forEach(function (f) { f.removeAttribute("aria-invalid"); });
      msg.textContent = "";
      btn.disabled = true;
      btn.textContent = "Enviando…";

      var payload = {};
      new FormData(form).forEach(function (v, k) { payload[k] = v; });

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) { return res.json().catch(function () { return { ok: false }; }); })
        .then(function (out) {
          if (out.ok) {
            form.reset();
            ok.hidden = false;
            ok.classList.add("is-on");
            return;
          }
          var first = null;
          Object.keys(out.errors || {}).forEach(function (k) {
            var p = $("#err-" + k);
            var field = form.elements.namedItem(k);
            if (p) p.textContent = out.errors[k];
            if (field && field.setAttribute) { field.setAttribute("aria-invalid", "true"); if (!first) first = field; }
          });
          msg.textContent = out.error || "Revisa los campos marcados.";
          if (first) first.focus();
        })
        .catch(function () {
          msg.textContent = "No hemos podido conectar. Revisa tu conexión e inténtalo de nuevo.";
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = idleLabel;
        });
    });
  }

  /* ---------- Títulos: las palabras suben al entrar (GSAP) ---------- */
  function splitWords(el) {
    var text = el.textContent.trim().replace(/\s+/g, " ");
    el.setAttribute("aria-label", text);
    el.textContent = "";
    text.split(" ").forEach(function (w, i, all) {
      var s = document.createElement("span");
      s.className = "split-word";
      s.setAttribute("aria-hidden", "true");
      s.textContent = w;
      el.appendChild(s);
      if (i < all.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return el.querySelectorAll(".split-word");
  }
  function initSplitText() {
    if (!hasGsap) return;
    $$("[data-split]").forEach(function (el) {
      var words = splitWords(el);
      var isHero = !!el.closest(".hero");
      gsap.set(words, { y: 26, opacity: 0 });
      gsap.to(words, {
        y: 0, opacity: 1, duration: 0.9, stagger: 0.045, ease: "expo.out", delay: isHero ? 0.1 : 0,
        scrollTrigger: isHero ? undefined : { trigger: el, start: "top 90%", once: true },
      });
    });
    // Red de seguridad: lo que ya esté en pantalla a los 6 s no puede seguir invisible.
    setTimeout(function () {
      $$(".split-word").forEach(function (w) {
        if (w.getBoundingClientRect().top < window.innerHeight && parseFloat(getComputedStyle(w).opacity) < 1) {
          w.style.opacity = 1;
          w.style.transform = "none";
        }
      });
    }, 6000);
  }

  /* ---------- Parallax suave del hero (menos de 40 px) ---------- */
  function initHeroParallax() {
    if (!hasGsap || reduced) return;
    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    var mesh = $(".hero-mesh");
    var card = $(".chat-wrap");
    var copy = $(".hero-copy");
    if (mesh) tl.to(mesh, { yPercent: 14 }, 0);
    if (card) tl.to(card, { y: -28 }, 0);
    if (copy) tl.to(copy, { y: 24, opacity: 0.55 }, 0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  function boot() {
    safe(function () { if (hasGsap) gsap.registerPlugin(ScrollTrigger); }, "gsap");
    safe(initYear, "initYear");
    safe(initHeader, "initHeader");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initReveals, "initReveals");
    safe(initScrollEffects, "initScrollEffects");
    safe(initSplitText, "initSplitText");
    safe(initHeroParallax, "initHeroParallax");
    safe(initChat, "initChat");
    safe(initTilt, "initTilt");
    safe(initForm, "initForm");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
