/*!
 * app.js — منصة واحة التقنية
 * Entrance motion, platform availability probing, real project figures,
 * offline registration. No third-party code, no inline handlers.
 * تصميم وتطوير وتنفيذ: الأستاذة دعاء الجرواني
 */
(function () {
  "use strict";

  var doc = document;

  function $(sel, root) { return (root || doc).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }

  /* Depth-aware root: "" on the portal index, "../" inside a grade folder. */
  function scopeRoot() {
    return doc.documentElement.getAttribute("data-root") || "";
  }

  /* ============================================================ 1. motion */

  /* Elements rise once as they arrive, then the page is still. */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================ 2. offline */

  function initServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register(scopeRoot() + "sw.js", { scope: scopeRoot() || "./" })
        .catch(function () { /* offline support is optional, never fatal */ });
    });
  }

  /* ============================================================ 3. platforms */

  /* Verifies that a platform folder is actually installed before the card
     promises anything. Runs only over http(s); a file:// copy simply opens. */
  function probe(url) {
    if (location.protocol !== "http:" && location.protocol !== "https:") {
      return Promise.resolve("unknown");
    }
    if (!("fetch" in window)) return Promise.resolve("unknown");
    var control = "AbortController" in window ? new AbortController() : null;
    var timer = control ? setTimeout(function () { control.abort(); }, 4000) : null;
    return fetch(url, {
      method: "HEAD",
      cache: "no-store",
      redirect: "follow",
      signal: control ? control.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.ok ? "ready" : "missing";
    }).catch(function () {
      if (timer) clearTimeout(timer);
      return "unknown";
    });
  }

  function initLaunchers() {
    $$("[data-launch]").forEach(function (card) {
      var flag = $(".arch__flag", card);
      probe(card.href).then(function (state) {
        if (state !== "missing") return;
        card.setAttribute("data-state", "missing");
        if (flag) {
          flag.textContent = "لم تُركَّب منصة هذا الفصل بعد";
          flag.hidden = false;
        }
      });
    });
  }

  /* ============================================================ 4. figures */

  function toArabicIndic(value) {
    return String(value).replace(/[0-9]/g, function (d) {
      return "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669".charAt(Number(d));
    });
  }

  /* Renders only figures that actually carry a value. A null in stats.json
     removes the entry rather than inviting an invented number. */
  function initStats() {
    var host = $("#stats");
    if (!host || !("fetch" in window)) return;
    fetch(scopeRoot() + "assets/data/stats.json", { cache: "no-store" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data || !Array.isArray(data.items)) return;
        var live = data.items.filter(function (item) {
          return item && typeof item.value === "number" && isFinite(item.value) && item.value > 0;
        });
        if (!live.length) return;
        host.textContent = "";
        live.forEach(function (item) {
          var box = doc.createElement("div");
          box.className = "stat";
          var num = doc.createElement("span");
          num.className = "stat__num";
          num.textContent = toArabicIndic(item.value);
          var label = doc.createElement("span");
          label.className = "stat__label";
          label.textContent = String(item.label || "").slice(0, 40);
          box.appendChild(num);
          box.appendChild(label);
          host.appendChild(box);
        });
      })
      .catch(function () { /* offline or file://: the built-in figures stand */ });
  }

  /* ============================================================ 5. boot */

  function boot() {
    initReveal();
    initServiceWorker();
    initLaunchers();
    initStats();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
