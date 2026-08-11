/*!
 * adventure/gate.js — بوابة الدخول الموحّدة على صفحة الصف
 * On a grade page, intercepts a semester launch and presents ONE overlay that
 * resolves both the session (continue / new) and the mode (adventure / basic),
 * then routes. It reuses the platform's own session mechanism:
 *   • "new session"  → purge only this grade+semester's namespace (waha:gNsM:*)
 *   • both paths set sessionStorage["waha:gate:gNsM"]="1" so the platform's own
 *     in-page gate does not ask a second time (single source of truth).
 * Adventure is offered only where a world is installed (ADV_WORLDS).
 * No inline handlers, no eval, no remote requests; DOM built via createElement.
 */
(function () {
  "use strict";

  /* Worlds that have an installed adventure.html. */
  var ADV_WORLDS = { g1s1: true, g1s2: true, g2s1: true, g2s2: true,
                     g3s1: true, g3s2: true, g4s1: true, g4s2: true };

  var doc = document;
  function el(tag, attrs, kids) {
    var n = doc.createElement(tag), k;
    if (attrs) for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) {
      if (k === "text") n.textContent = attrs[k];
      else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? doc.createTextNode(c) : c); });
    return n;
  }
  function svg(paths) {
    var s = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true");
    (paths || []).forEach(function (d) {
      var p = doc.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", d); s.appendChild(p);
    });
    return s;
  }

  /* real namespaced keys for a semester (localStorage is per-origin) */
  function nsPrefix(code) { return "waha:" + code + ":"; }
  function nsKeys(code) {
    var pfx = nsPrefix(code), out = [], i, k;
    try { for (i = 0; i < localStorage.length; i++) { k = localStorage.key(i); if (k && k.indexOf(pfx) === 0) out.push(k); } }
    catch (e) {}
    return out;
  }
  function purgeNS(code) { nsKeys(code).forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); }
  function hasProgress(code) {
    var ks = nsKeys(code), i, raw, j, p, id;
    for (i = 0; i < ks.length; i++) {
      try { raw = localStorage.getItem(ks[i]); j = JSON.parse(raw); } catch (e) { j = null; }
      if (!j) continue;
      p = j.progress || (j.lessons) || null;
      if (p && typeof p === "object") {
        for (id in p) if (Object.prototype.hasOwnProperty.call(p, id)) {
          if (p[id] && (p[id].done || p[id].completed || p[id].mastered)) return doneCount(code);
        }
      }
    }
    return 0;
  }
  function doneCount(code) {
    var ks = nsKeys(code), i, raw, j, p, id, n = 0, seen = {};
    for (i = 0; i < ks.length; i++) {
      try { j = JSON.parse(localStorage.getItem(ks[i])); } catch (e) { j = null; }
      if (!j) continue;
      p = j.progress || null;
      if (p && typeof p === "object") for (id in p) if (Object.prototype.hasOwnProperty.call(p, id)) {
        if (!seen[id] && p[id] && (p[id].done || p[id].completed || p[id].mastered)) { seen[id] = 1; n++; }
      }
    }
    return n;
  }
  function markSkip(code) { try { sessionStorage.setItem("waha:gate:" + code, "1"); } catch (e) {} }

  /* focus trap + escape */
  function trap(scrim, onClose) {
    scrim.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { onClose(); return; }
      if (ev.key !== "Tab") return;
      var f = scrim.querySelectorAll("button, [href], input, [tabindex]:not([tabindex='-1'])");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && doc.activeElement === first) { last.focus(); ev.preventDefault(); }
      else if (!ev.shiftKey && doc.activeElement === last) { first.focus(); ev.preventDefault(); }
    });
  }

  function openGate(ctx) {
    /* ctx: { code, grade, term, basicHref, advHref } */
    var scrim = el("div", { class: "wg-scrim", role: "dialog", "aria-modal": "true", "aria-label": "بوابة الدخول" });
    var card = el("div", { class: "wg-card" });
    scrim.appendChild(card);
    var lastFocus = doc.activeElement;
    function close() {
      scrim.remove();
      doc.documentElement.style.removeProperty("overflow");
      if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
    }
    scrim.addEventListener("click", function (e) { if (e.target === scrim) close(); });
    trap(scrim, close);

    var progress = doneCount(ctx.code);
    var termLabel = "الصف " + arabicOrdinal(ctx.grade) + " · الفصل الدراسي " + (ctx.term === "2" ? "الثاني" : "الأول");

    function renderMode(sessionNote) {
      card.textContent = "";
      card.appendChild(el("p", { class: "wg-eyebrow", text: termLabel }));
      card.appendChild(el("h2", { class: "wg-title", text: "كيف تريد أن تبدأ؟" }));
      card.appendChild(el("p", { class: "wg-sub", text: sessionNote ||
        "اختر تجربة الدخول إلى هذا الفصل. المحتوى التعليمي نفسه في الوضعين." }));

      var choices = el("div", { class: "wg-choices" });
      var advAvailable = !!ADV_WORLDS[ctx.code];

      var adv = el("button", { type: "button",
        class: "wg-choice wg-choice--adv" + (advAvailable ? "" : " is-soon"),
        "aria-label": advAvailable ? "وضع المغامرة والتحدّي" : "وضع المغامرة — قريبًا لهذا الفصل" }, [
        el("span", { class: "wg-choice__icon" }, [svg([
          "M8 12h8M12 8v8", "M4 8.5C4 6.6 5.6 5 7.5 5h9C18.4 5 20 6.6 20 8.5v7c0 1.9-1.6 3.5-3.5 3.5h-9C5.6 19 4 17.4 4 15.5z"
        ])]),
        el("span", { class: "wg-choice__t", text: advAvailable ? "وضع المغامرة والتحدّي" : "وضع المغامرة" }),
        el("span", { class: "wg-choice__d", text: advAvailable
          ? "عالم تفاعلي تُفتح فيه المهمات درسًا بعد درس." : "قريبًا لهذا الفصل." })
      ]);
      if (advAvailable) adv.addEventListener("click", function () { markSkip(ctx.code); go(ctx.advHref); });
      else adv.disabled = true;
      choices.appendChild(adv);

      var basic = el("button", { type: "button", class: "wg-choice wg-choice--basic",
        "aria-label": "الوضع الأساسي" }, [
        el("span", { class: "wg-choice__icon" }, [svg([
          "M4 5.5h6c1.1 0 2 .9 2 2M20 5.5h-6c-1.1 0-2 .9-2 2M4 5.5v12h6c1.1 0 2 .9 2 2M20 5.5v12h-6c-1.1 0-2 .9-2 2M12 7.5v12"
        ])]),
        el("span", { class: "wg-choice__t", text: "الوضع الأساسي" }),
        el("span", { class: "wg-choice__d", text: "منصة الدروس المعتادة مباشرةً." })
      ]);
      basic.addEventListener("click", function () { markSkip(ctx.code); go(ctx.basicHref); });
      choices.appendChild(basic);

      card.appendChild(choices);
      card.appendChild(el("p", { class: "wg-foot",
        text: "لا تُطلب أسماء ولا بيانات. يمكنك تبديل الوضع في أي وقت." }));
      setTimeout(function () { adv.focus(); }, 30);
    }

    function renderSession() {
      card.textContent = "";
      card.appendChild(el("p", { class: "wg-eyebrow", text: termLabel }));
      card.appendChild(el("h2", { class: "wg-title", text: "جلسة التعلّم على هذا الجهاز" }));
      card.appendChild(el("p", { class: "wg-sub",
        text: "هذا جهاز مشترك؟ تابع جلستك السابقة، أو ابدأ جلسة جديدة لهذا الفصل وحده." }));

      var box = el("div", { class: "wg-sessions" });
      var cont = el("button", { type: "button", class: "wg-btn wg-btn--primary" }, [
        el("span", { class: "wg-btn__ic" }, [svg(["M8 5v14l11-7z"])]),
        el("span", { class: "wg-btn__body" }, [
          el("span", { class: "wg-btn__t", text: "متابعة الجلسة السابقة" }),
          el("span", { class: "wg-btn__d", text: "أنجزتَ على هذا الجهاز " + toArabic(progress) + " مهمة حتى الآن." })
        ])
      ]);
      cont.addEventListener("click", function () { renderMode("تابع من حيث توقفت، أو بدّل الوضع كما تحب."); });
      box.appendChild(cont);

      var fresh = el("button", { type: "button", class: "wg-btn wg-btn--danger" }, [
        el("span", { class: "wg-btn__ic" }, [svg(["M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"])]),
        el("span", { class: "wg-btn__body" }, [
          el("span", { class: "wg-btn__t", text: "بدء جلسة جديدة" }),
          el("span", { class: "wg-btn__d", text: "يبدأ هذا الفصل من المهمة الأولى على هذا الجهاز." })
        ])
      ]);
      fresh.addEventListener("click", function () { renderConfirm(); });
      box.appendChild(fresh);

      card.appendChild(box);
      card.appendChild(el("p", { class: "wg-foot",
        text: "لن يتأثّر أي صف أو فصل آخر، ولا وضع المعلّم، ولا إعدادات البوابة." }));
      setTimeout(function () { cont.focus(); }, 30);
    }

    function renderConfirm() {
      card.textContent = "";
      card.classList.add("wg-confirm");
      card.appendChild(el("h2", { class: "wg-title", text: "بدء رحلة جديدة؟" }));
      card.appendChild(el("p", { class: "wg-sub",
        text: "سيبدأ هذا الفصل من الدرس الأول على هذا الجهاز. لن يتأثر أي صف أو فصل آخر." }));
      var row = el("div", { class: "wg-row" });
      var yes = el("button", { type: "button", class: "wg-btn wg-btn--primary" },
        [el("span", { class: "wg-btn__body" }, [el("span", { class: "wg-btn__t", text: "ابدأ الرحلة" })])]);
      yes.addEventListener("click", function () { purgeNS(ctx.code); progress = 0; card.classList.remove("wg-confirm"); renderMode("بدأت جلسة جديدة. اختر الوضع."); });
      var no = el("button", { type: "button", class: "wg-btn" },
        [el("span", { class: "wg-btn__body" }, [el("span", { class: "wg-btn__t", text: "إلغاء" })])]);
      no.addEventListener("click", function () { card.classList.remove("wg-confirm"); renderSession(); });
      row.appendChild(yes); row.appendChild(no);
      card.appendChild(row);
      setTimeout(function () { no.focus(); }, 30);
    }

    function go(href) { close(); location.href = href; }

    doc.documentElement.style.setProperty("overflow", "hidden");
    doc.body.appendChild(scrim);
    /* If prior progress exists, resolve session first; else go straight to mode. */
    if (progress > 0) renderSession(); else renderMode();
  }

  function toArabic(v) {
    return String(v).replace(/[0-9]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".charAt(+d); });
  }
  function arabicOrdinal(g) {
    return ({ "1": "الأول", "2": "الثاني", "3": "الثالث", "4": "الرابع" })[g] || g;
  }

  /* attach to every semester launcher on the grade page */
  function wire() {
    var arches = doc.querySelectorAll("a[data-launch][data-grade][data-term]");
    Array.prototype.forEach.call(arches, function (a) {
      var grade = a.getAttribute("data-grade"), term = a.getAttribute("data-term");
      var code = "g" + grade + "s" + term;
      var basicHref = a.getAttribute("href");                    /* semesterM/index.html */
      var advHref = basicHref.replace(/index\.html?$/, "adventure.html");
      if (!/adventure\.html$/.test(advHref)) advHref = basicHref.replace(/\/?$/, "/adventure.html");
      a.addEventListener("click", function (ev) {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1) return; /* let new-tab work */
        ev.preventDefault();
        openGate({ code: code, grade: grade, term: term, basicHref: basicHref, advHref: advHref });
      });
    });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", wire);
  else wire();

  window.__wahaGate = { open: openGate };
})();
