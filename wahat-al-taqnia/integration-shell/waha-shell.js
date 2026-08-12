
/* ==========================================================================
   waha-shell — طبقة تكامل بوابة واحة التقنية (لا تُعدّل تصميم المنصّات)
   Integration shell for the Wahat Al-Taqnia portal.
   1) عزل تخزين التقدّم لكل صف/فصل داخل نطاق مستقل
   2) بوابة الجلسة على الأجهزة المشتركة (جلسة جديدة / متابعة)
   3) عنصر «العودة إلى صفحة الصف» الظاهر والموحّد
   4) زر «مسح تقدم هذا الجهاز» داخل وضع المعلّم
   إعداد وتنفيذ الأستاذة دعاء الجرواني
   ========================================================================== */
(function () {
  "use strict";
  var M = document.documentElement.getAttribute("data-waha") || "";
  var G = parseInt(M.charAt(1), 10) || 1;
  var S = parseInt(M.charAt(3), 10) || 1;
  var NS = "waha:g" + G + "s" + S + ":";
  var SKIP = "waha:gate:g" + G + "s" + S;
  /* المنصّة الوحيدة التي تضع زر العودة في تدفّق الصفحة (تخطيطها قابل للتمرير) */
  var INFLOW_EXIT = (M === "g4s1");

  /* ---------------------------------------------------------------- 1. storage */
  var real = null;
  try { real = window.localStorage; real.setItem(NS + "__t", "1"); real.removeItem(NS + "__t"); }
  catch (e) { real = null; }
  var mem = Object.create(null);

  function nsKeys() {
    if (!real) { return Object.keys(mem); }
    var out = [], i, k;
    try {
      for (i = 0; i < real.length; i++) { k = real.key(i); if (k && k.indexOf(NS) === 0) { out.push(k); } }
    } catch (e) { return []; }
    return out;
  }
  function snapshotNS() {
    var out = {}, ks = nsKeys(), i, k;
    for (i = 0; i < ks.length; i++) {
      k = ks[i];
      try { out[k] = real ? real.getItem(k) : mem[k]; } catch (e) {}
    }
    return out;
  }
  function restoreNS(snap) {
    if (!snap) { return; }
    var cur = nsKeys(), i, k;
    /* احذف كل مفتاح أُنشئ أثناء المعاينة */
    for (i = 0; i < cur.length; i++) {
      k = cur[i];
      if (!Object.prototype.hasOwnProperty.call(snap, k)) {
        try { real ? real.removeItem(k) : delete mem[k]; } catch (e) {}
      }
    }
    /* أعِد القيم الأصلية حرفيًا */
    for (k in snap) {
      if (!Object.prototype.hasOwnProperty.call(snap, k)) { continue; }
      try { real ? real.setItem(k, snap[k]) : (mem[k] = snap[k]); } catch (e) {}
    }
  }
  function purge() {
    if (!real) { mem = Object.create(null); return 0; }
    var ks = nsKeys(), i;
    for (i = 0; i < ks.length; i++) { try { real.removeItem(ks[i]); } catch (e) {} }
    return ks.length;
  }
  var previewActive = false;        /* أثناء معاينة المعلّمة تُمنع كل كتابات التقدّم */
  var previewSnap = null;           /* لقطة حرفية لمفاتيح النطاق قبل المعاينة */
  var shim = {
    get length() { return nsKeys().length; },
    key: function (i) { var k = nsKeys()[i]; return k == null ? null : k.slice(NS.length); },
    getItem: function (k) {
      if (!real) { return Object.prototype.hasOwnProperty.call(mem, NS + k) ? mem[NS + k] : null; }
      try { return real.getItem(NS + k); } catch (e) { return null; }
    },
    setItem: function (k, v) {
      if (previewActive) { return; }            /* معاينة المعلّمة: لا كتابة إطلاقًا */
      if (!real) { mem[NS + k] = String(v); return; }
      try { real.setItem(NS + k, String(v)); } catch (e) {}
    },
    removeItem: function (k) {
      if (previewActive) { return; }            /* معاينة المعلّمة: لا حذف إطلاقًا */
      if (!real) { delete mem[NS + k]; return; }
      try { real.removeItem(NS + k); } catch (e) {}
    },
    clear: function () { purge(); }
  };
  try {
    Object.defineProperty(window, "localStorage", {
      configurable: true, enumerable: true, get: function () { return shim; }
    });
  } catch (e) { /* التخزين محجوب: تعمل المنصّة بذاكرة الجلسة فقط */ }

  /* ---------------------------------------------------------------- 2. helpers */
  /* SECURITY HARDENING: no markup string is ever assigned to the DOM. This
   * builder creates namespaced SVG nodes programmatically, so the shell
   * layer contains zero innerHTML writes and nothing can turn text into markup. */
  function svgEl(tag, attrs, kids) {
    var n = document.createElementNS("http://www.w3.org/2000/svg", tag), k;
    for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag), k;
    if (attrs) {
      for (k in attrs) {
        if (k === "text") { n.textContent = attrs[k]; }
        /* the generic raw-HTML attribute path is removed (security hardening) */
        else if (attrs[k] != null) { n.setAttribute(k, attrs[k]); }
      }
    }
    (kids || []).forEach(function (c) { if (c) { n.appendChild(c); } });
    return n;
  }
  function root() { return document.documentElement; }
  function ready(fn) {
    if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", fn); }
    else { fn(); }
  }
  function noDiac(s) { return String(s || "").replace(/[\u064B-\u065F\u0670]/g, ""); }

  /* ---------------------------------------------------------------- 3. session gate */
  var hadProgress = nsKeys().length > 0;
  var skip = false;
  try { skip = window.sessionStorage.getItem(SKIP) === "1"; } catch (e) { skip = false; }

  function buildGate() {
    var ov = el("div", { id: "waha-gate", role: "dialog", "aria-modal": "true",
      "aria-labelledby": "waha-gate-ttl", "aria-describedby": "waha-gate-txt" });
    var card = el("div", { class: "waha-gate-card" }, [
      el("h2", { id: "waha-gate-ttl", class: "waha-gate-ttl", text: "جلسة التعلّم" }),
      el("p", { id: "waha-gate-txt", class: "waha-gate-txt",
        text: hadProgress
          ? "هذا جهاز مشترك؟ ابدأ جلسة جديدة حتى لا يظهر تقدم مستخدم سابق."
          : "هذا جهاز مشترك؟ ابدأ جلستك ليُحفظ تقدّمك على هذا الجهاز وحده." }),
      el("div", { class: "waha-gate-row" }, [
        el("button", { type: "button", class: "waha-btn waha-btn-primary", id: "waha-gate-new",
          text: "بدء جلسة جديدة" }),
        /* لا يُعرض خيار المتابعة إلا إذا وُجد تقدّم سابق فعلًا */
        hadProgress ? el("button", { type: "button", class: "waha-btn waha-btn-ghost",
          id: "waha-gate-keep", text: "متابعة آخر جلسة على هذا الجهاز" }) : null
      ]),
      el("p", { class: "waha-gate-note",
        text: "لا تُطلب أسماء ولا بيانات شخصية. التقدّم محفوظ على هذا الجهاز فقط." })
    ]);
    ov.appendChild(card);
    root().appendChild(ov);
    document.documentElement.setAttribute("data-waha-gate", "on");

    function close() {
      ov.parentNode && ov.parentNode.removeChild(ov);
      document.documentElement.removeAttribute("data-waha-gate");
    }
    ov.querySelector("#waha-gate-new").addEventListener("click", function () {
      purge();
      try { window.sessionStorage.setItem(SKIP, "1"); } catch (e) {}
      location.reload();
    });
    var keepBtn = ov.querySelector("#waha-gate-keep");
    if (keepBtn) {
      keepBtn.addEventListener("click", function () {
        try { window.sessionStorage.setItem(SKIP, "1"); } catch (e) {}
        close();
      });
    }
    ov.addEventListener("keydown", function (ev) {
      if (ev.key !== "Tab") { return; }
      var f = ov.querySelectorAll("button");
      var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { last.focus(); ev.preventDefault(); }
      else if (!ev.shiftKey && document.activeElement === last) { first.focus(); ev.preventDefault(); }
    });
    setTimeout(function () { ov.querySelector("#waha-gate-new").focus(); }, 30);
  }

  /* ---------------------------------------------------------------- 4. return control */
  function buildExit() {
    if (document.getElementById("waha-exit")) { return; }
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M10.6 4.6 3.2 12l7.4 7.4 1.6-1.6L7.2 13.1H20.8v-2.2H7.2l5-4.7z");
    svg.appendChild(path);
    var a = el("a", {
      id: "waha-exit", href: "../index.html",
      "aria-label": "العودة إلى صفحة الصف",
      title: "العودة إلى صفحة الصف"
    }, [svg, el("span", { class: "waha-exit-lbl", text: "العودة إلى صفحة الصف" })]);
    /* الصف الرابع: الزر جزء من تدفّق الصفحة في نهايتها، لا طبقة عائمة */
    if (INFLOW_EXIT && document.body) { document.body.appendChild(a); }
    else { root().appendChild(a); }
  }


  /* ---- تفادي التغطية: يختار الزاوية الخالية تلقائيًا ---- */
  function overlaps(a) {
    var pts = [[a.l + 6, a.t + 6], [a.l + a.w - 6, a.t + 6], [a.l + a.w / 2, a.t + a.h / 2],
               [a.l + 6, a.t + a.h - 6], [a.l + a.w - 6, a.t + a.h - 6]];
    var i, j, els, e;
    for (i = 0; i < pts.length; i++) {
      if (pts[i][0] < 0 || pts[i][1] < 0) { continue; }
      els = document.elementsFromPoint(pts[i][0], pts[i][1]) || [];
      for (j = 0; j < els.length; j++) {
        e = els[j];
        if (!e || e.id === "waha-exit" || (e.closest && e.closest("#waha-exit"))) { continue; }
        if (e === document.body || e === document.documentElement) { continue; }
        if (e.tagName === "BUTTON" || e.tagName === "A" || e.tagName === "INPUT" ||
            e.tagName === "SELECT" || e.tagName === "TEXTAREA" ||
            e.getAttribute("role") === "button" || e.onclick ||
            (e.closest && (e.closest("button") || e.closest("a") || e.closest("[role=button]")))) {
          return true;
        }
      }
    }
    return false;
  }
  function placeExit() {
    var a = document.getElementById("waha-exit");
    if (!a) { return; }
    /* المنصّة ذات الصفّ السفلي المحجوز: لا تُعِد تموضعه تلقائيًا */
    if (INFLOW_EXIT) { a.removeAttribute("data-corner"); return; }
    var w = a.offsetWidth || 200, h = a.offsetHeight || 48, m = 12;
    var W = window.innerWidth, H = window.innerHeight;
    var cands = [
      { l: m, t: H - h - m, css: { left: m + "px", right: "auto", top: "auto", bottom: m + "px" } },
      { l: W - w - m, t: H - h - m, css: { left: "auto", right: m + "px", top: "auto", bottom: m + "px" } },
      { l: W - w - m, t: m, css: { left: "auto", right: m + "px", top: m + "px", bottom: "auto" } },
      { l: m, t: m, css: { left: m + "px", right: "auto", top: m + "px", bottom: "auto" } },
      { l: m, t: H - h - m - 88, css: { left: m + "px", right: "auto", top: "auto", bottom: (m + 88) + "px" } },
      { l: W - w - m, t: H - h - m - 88, css: { left: "auto", right: m + "px", top: "auto", bottom: (m + 88) + "px" } },
      { l: m, t: Math.round(H / 2 - h / 2), css: { left: m + "px", right: "auto", top: Math.round(H / 2 - h / 2) + "px", bottom: "auto" } },
      { l: W - w - m, t: Math.round(H / 2 - h / 2), css: { left: "auto", right: m + "px", top: Math.round(H / 2 - h / 2) + "px", bottom: "auto" } }
    ];
    var prev = a.style.pointerEvents;
    a.style.pointerEvents = "none";
    var chosen = cands[0], i;
    for (i = 0; i < cands.length; i++) {
      cands[i].w = w; cands[i].h = h;
      if (!overlaps(cands[i])) { chosen = cands[i]; break; }
    }
    a.style.pointerEvents = prev || "";
    var k;
    for (k in chosen.css) { a.style.setProperty(k, chosen.css[k], "important"); }
    a.setAttribute("data-corner", String(cands.indexOf(chosen)));
  }

  /* ---------------------------------------------------------------- 5. teacher purge */
  var TEACH = /(وضع المعلم|دليل المعلمة|Teacher Mode)/;
  function ownText(node, limit) {
    var out = "", stack = [node], n, i, tag;
    while (stack.length && out.length < limit) {
      n = stack.shift();
      if (n.nodeType === 3) { out += n.nodeValue; continue; }
      if (n.nodeType !== 1) { continue; }
      tag = n.tagName;
      if (tag === "BUTTON" || tag === "A" || n.getAttribute("role") === "button") { continue; }
      for (i = 0; i < n.childNodes.length; i++) { stack.push(n.childNodes[i]); }
    }
    return out.slice(0, limit);
  }
  function isPanel(e) {
    var cs, r, z, t;
    if (!e || e.id === "waha-gate" || e.id === "waha-confirm") { return false; }
    try { cs = getComputedStyle(e); } catch (x) { return false; }
    if (cs.position !== "fixed" && cs.position !== "absolute") { return false; }
    if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.2) { return false; }
    r = e.getBoundingClientRect();
    if (r.width < 300 || r.height < 220) { return false; }
    if (r.top > window.innerHeight - 40 || r.bottom < 40) { return false; }
    z = parseInt(cs.zIndex, 10) || 0;
    if (z < 20 && r.width < window.innerWidth * 0.5) { return false; }
    /* نص العنصر نفسه دون نصوص الأزرار: يمنع اعتبار شريط يحوي زر «وضع المعلّم» لوحةً */
    t = noDiac(ownText(e, 260));
    return TEACH.test(t);
  }
  function findTeacherPanel() {
    var all = document.querySelectorAll("div,section,aside,form"), i, e, best = null, bz = -1, cs, z;
    for (i = 0; i < all.length; i++) {
      e = all[i];
      if (!isPanel(e)) { continue; }
      if (e.querySelector("[data-waha-purge]")) { return null; }
      try { cs = getComputedStyle(e); } catch (x) { continue; }
      z = parseInt(cs.zIndex, 10) || 0;
      if (z >= bz) { bz = z; best = e; }
    }
    return best;
  }
  /* -------- مسار احتياطي لاكتشاف لوحة وضع المعلّم --------
     يعمل فقط حين يعود الاكتشاف الأساسي فارغًا. بعض المنصّات تضع اللوحة في
     التدفّق الطبيعي (position:static)، وبعضها تجعل أبناءها مطلقي الموضع
     فيعود ارتفاع إطارها صفرًا. لا يُعدّل هذا المسار أي شيء في المنصّة نفسها. */
  function boxOf(e) {
    var r;
    try { r = e.getBoundingClientRect(); } catch (x) { r = { width: 0, height: 0 }; }
    return { w: Math.max(e.offsetWidth || 0, Math.round(r.width) || 0),
             h: Math.max(e.offsetHeight || 0, e.scrollHeight || 0, Math.round(r.height) || 0) };
  }
  function isPanelLoose(e) {
    var cs, b, t;
    if (!e || e.id === "waha-gate" || e.id === "waha-confirm") { return false; }
    if (e.closest && (e.closest("#waha-gate") || e.closest("#waha-confirm") ||
                      e.closest("#waha-simrot") || e.closest("#waha-rotate"))) { return false; }
    try { cs = getComputedStyle(e); } catch (x) { return false; }
    if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.2) { return false; }
    b = boxOf(e);                      /* قياس بديل حين يكون ارتفاع الإطار صفرًا */
    if (b.w < 300 || b.h < 220) { return false; }
    t = noDiac(ownText(e, 4000));      /* نافذة أوسع: العنوان قد يقع عميقًا */
    return TEACH.test(t);
  }
  function findTeacherPanelLoose() {
    var all = document.querySelectorAll("div,section,aside,form"), i, e, best = null, ba = -1, b;
    for (i = 0; i < all.length; i++) {
      e = all[i];
      if (!isPanelLoose(e)) { continue; }
      /* لا تكرار: إن وُجد زر محقون مسبقًا فلا شيء يُضاف */
      if (e.querySelector("[data-waha-purge]")) { return null; }
      b = boxOf(e);
      /* أصغر مطابق: اللوحة نفسها، لا غلاف أبعد منها */
      if (ba < 0 || b.w * b.h < ba) { ba = b.w * b.h; best = e; }
    }
    return best;
  }
  function teacherPanel() { return findTeacherPanel() || findTeacherPanelLoose(); }
  function sweepPurge() {
    /* أزل أي زر مسح لم يعد داخل لوحة وضع معلّم مفتوحة */
    var wraps = document.querySelectorAll(".waha-purge-wrap"), i, w, host;
    for (i = 0; i < wraps.length; i++) {
      w = wraps[i];
      host = w.parentNode;
      if (!host || (!isPanel(host) && !isPanelLoose(host))) { w.parentNode && w.parentNode.removeChild(w); }
    }
  }
  function confirmPurge() {
    if (document.getElementById("waha-confirm")) { return; }
    var ov = el("div", { id: "waha-confirm", role: "alertdialog", "aria-modal": "true" });
    var card = el("div", { class: "waha-gate-card" }, [
      el("h2", { class: "waha-gate-ttl", text: "مسح تقدم هذا الجهاز" }),
      el("p", { class: "waha-gate-txt",
        text: "سيُحذف تقدّم هذا الفصل على هذا الجهاز فقط. لن يتأثر أي صف أو فصل آخر، ولا إعدادات البوابة." }),
      el("div", { class: "waha-gate-row" }, [
        el("button", { type: "button", class: "waha-btn waha-btn-danger", id: "waha-purge-yes",
          text: "نعم، امسح التقدّم" }),
        el("button", { type: "button", class: "waha-btn waha-btn-ghost", id: "waha-purge-no",
          text: "إلغاء" })
      ])
    ]);
    ov.appendChild(card);
    root().appendChild(ov);
    ov.querySelector("#waha-purge-no").addEventListener("click", function () { ov.remove(); });
    ov.querySelector("#waha-purge-yes").addEventListener("click", function () {
      purge();
      try { window.sessionStorage.setItem(SKIP, "1"); } catch (e) {}
      location.reload();
    });
    setTimeout(function () { ov.querySelector("#waha-purge-no").focus(); }, 30);
  }
  function attachPurge() {
    var panel = teacherPanel();
    if (!panel) { return; }
    var b = el("button", { type: "button", class: "waha-btn waha-btn-danger waha-purge",
      "data-waha-purge": "1", text: "مسح تقدم هذا الجهاز" });
    b.addEventListener("click", function (ev) { ev.stopPropagation(); confirmPurge(); });
    var wrap = el("div", { class: "waha-purge-wrap" }, [b]);
    panel.appendChild(wrap);
  }


  /* ------------------------------------------------ 7. استجابة الهواتف */
  var CW = 1280, CH = 720;          /* أبعاد اللوحة التصميمية المشتركة */
  function stageInner() { return document.getElementById("stageInner"); }
  function isPhone() {
    var w = window.innerWidth, h = window.innerHeight;
    return Math.min(w, h) <= 500 && (w <= 900 || h <= 500);
  }
  var usesCanvas = null;   /* هل تعتمد المنصّة آلية اللوحة الثابتة أصلًا؟ */
  function detectCanvas(si) {
    if (usesCanvas === true) { return true; }   /* النتيجة الموجبة فقط تُخزَّن */
    if (!si) { return false; }
    var t = "";
    try { t = getComputedStyle(si).transform; } catch (e) { t = ""; }
    var w = si.offsetWidth || 0;
    /* اللوحة الثابتة تُعرف إمّا بتحويل مقياس فعّال أو بعرض تصميمي ≈1280 */
    var scaled = false;
    if (t && t !== "none") {
      var m = t.match(/matrix\(([-\d.]+)/);
      if (m && Math.abs(parseFloat(m[1]) - 1) > 0.02) { scaled = true; }
    }
    if (scaled || (w >= CW - 40 && w <= CW + 40)) { usesCanvas = true; return true; }
    return false;
  }
  function applyMobile() {
    var d = document.documentElement, si = stageInner();
    if (!isPhone()) {
      d.removeAttribute("data-waha-mobile");
      d.removeAttribute("data-waha-canvas");
      d.style.removeProperty("--waha-k");
      d.style.removeProperty("--waha-sh");
      var rb = document.getElementById("waha-rotate");
      if (rb) { rb.remove(); }
      return;
    }
    d.setAttribute("data-waha-mobile", "1");
    if (!si || !detectCanvas(si)) { d.removeAttribute("data-waha-canvas"); return; }
    d.setAttribute("data-waha-canvas", "1");
    var vw = window.innerWidth, vh = window.innerHeight;
    var portrait = vh >= vw;
    /* عرضيًا: املأ العرض ومرّر رأسيًا. أفقيًا: لائم الارتفاع بلا تمرير أفقي. */
    var k, cw = CW;
    if (portrait) {
      k = vw / CW;                       /* رأسيًا: كما هو — ملء العرض ثم تمرير رأسي */
    } else {
      k = vh / CH;                       /* أفقيًا: المقياس من الارتفاع — لا قصّ أعلى ولا أسفل */
      cw = Math.ceil(vw / k);            /* ويتمدّد العرض المنطقي ليملأ الشاشة تمامًا */
      if (cw < CW) {                     /* شاشة أضيق من اللوحة: أبقِ الملاءمة القديمة */
        k = Math.min(vw / CW, vh / CH);
        cw = CW;
      }
    }
    d.style.setProperty("--waha-cw", cw + "px");
    d.style.setProperty("--waha-ch", CH + "px");
    d.style.setProperty("--waha-k", String(k));
    d.style.setProperty("--waha-sh", Math.ceil(CH * k) + "px");
    if (portrait) { rotateHint(); }
  }
  function rotateHint() {
    if (document.getElementById("waha-rotate")) { return; }
    try { if (window.sessionStorage.getItem("waha:rot") === "1") { return; } } catch (e) {}
    var box = el("div", { id: "waha-rotate", role: "status" });
    box.appendChild(svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, [
      svgEl("path", { d: "M7.3 3h9.4A2.3 2.3 0 0 1 19 5.3v13.4A2.3 2.3 0 0 1 16.7 21H7.3A2.3 2.3 0 0 1 5 18.7V5.3A2.3 2.3 0 0 1 7.3 3zm0 2v14h9.4V5H7.3z" }),
    ]));
    box.appendChild(el("p", { text: "أدِر الجهاز أفقيًا للحصول على أفضل عرض لهذا الدرس." }));
    var b = el("button", { type: "button", "aria-label": "إغلاق التنبيه", text: "✕" });
    b.addEventListener("click", function () {
      try { window.sessionStorage.setItem("waha:rot", "1"); } catch (e) {}
      box.remove();
    });
    box.appendChild(b);
    root().appendChild(box);
  }


  /* ------------------------------------------------ 10. الانتقال المؤقّت بين المراحل */
  /* مفردات المراحل المعتمدة في المنهج عبر الصفوف الثمانية */
  var PHASE_RE = /(اكتشف|استكشف|شاهد|نفّذ معي|نفذ معي|جرّب بنفسك|جرب بنفسك|أنشئ|انشئ|أثبت فهمك|اثبت فهمك|راجع وتحقق|راجع و تحقق)/;
  var VKEY = "waha:visited";
  function visitedSet() {
    try { return JSON.parse(shim.getItem(VKEY) || "[]"); } catch (e) { return []; }
  }
  function markVisited(label) {
    if (previewActive) { return; }              /* لا تسجيل visited أثناء المعاينة */
    var v = visitedSet();
    if (v.indexOf(label) < 0) { v.push(label); try { shim.setItem(VKEY, JSON.stringify(v)); } catch (e) {} }
  }
  function stageButtons() {
    var out = [], all = document.querySelectorAll("button,[role=button]"), i, e, t;
    for (i = 0; i < all.length; i++) {
      e = all[i];
      if (e.closest && (e.closest("#waha-skip") || e.closest("#waha-gate") || e.closest("#waha-confirm"))) { continue; }
      t = noDiac((e.innerText || e.textContent || "").replace(/\s+/g, " ")).trim();
      if (!t || t.length > 26) { continue; }
      if (!PHASE_RE.test(noDiac(t))) { continue; }
      if (e.getBoundingClientRect().width < 24) { continue; }
      out.push(e);
    }
    return out;
  }
  function missingHint() {
    /* وصف مختصر لما ينقص، إن أعلنته المنصّة في سطر التعليمة */
    var n = document.querySelector(".lsn-instr,.instr,.instruct,[class*=instr]");
    if (!n) { return ""; }
    var t = (n.innerText || "").replace(/\s+/g, " ").trim();
    return t && t.length < 130 ? t : "";
  }
  function askSkip(label, onContinue) {
    if (document.getElementById("waha-skip")) { return; }
    var why = missingHint();
    var box = el("div", { class: "waha-skipbox" }, [
      el("div", { class: "waha-skip-h", text: "لم تكمل النشاط الحالي بعد" }),
      el("p", { class: "waha-skip-p",
        text: "يمكنك معاينة المرحلة التالية، وسيبقى النشاط الحالي غير مكتمل لتعود إليه لاحقًا." })
    ]);
    if (why) { box.appendChild(el("p", { class: "waha-skip-why", text: "الناقص: " + why })); }
    var stay = el("button", { type: "button", class: "waha-btn waha-btn-primary", text: "العودة وإكمال النشاط" });
    var go = el("button", { type: "button", class: "waha-btn waha-btn-ghost", text: "معاينة المرحلة مؤقتًا" });
    var row = el("div", { class: "waha-skip-row" }, [stay, go]);
    box.appendChild(row);
    var ov = el("div", { id: "waha-skip", role: "dialog", "aria-modal": "true",
      "aria-label": "النشاط غير مكتمل" }, [box]);
    function close() {
      ov.remove();
      document.removeEventListener("keydown", esc, true);
    }
    function esc(ev) {
      if (ev.key === "Escape") { close(); }
      else if (ev.key === "Tab") {
        var f = [stay, go], first = f[0], lastB = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) { lastB.focus(); ev.preventDefault(); }
        else if (!ev.shiftKey && document.activeElement === lastB) { first.focus(); ev.preventDefault(); }
      }
    }
    document.addEventListener("keydown", esc, true);
    ov.addEventListener("click", function (ev) { if (ev.target === ov) { close(); } });
    stay.addEventListener("click", function () { close(); onContinue(false); });
    go.addEventListener("click", function () { markVisited(label); close(); onContinue(true); });
    root().appendChild(ov);
    setTimeout(function () { stay.focus(); }, 40);
  }
  var askedThisSession = {};
  var teacherPreview = false;
  function previewBadge(on) {
    var b = document.getElementById("waha-prevbadge");
    if (!on) { if (b) { b.remove(); } return; }
    if (b) { return; }
    b = el("div", { id: "waha-prevbadge", role: "status", text: "معاينة مؤقتة" });
    root().appendChild(b);
  }
  function teacherBar(on) {
    var t = document.getElementById("waha-tbar");
    if (!on) { if (t) { t.remove(); } return; }
    if (t) { return; }
    t = el("div", { id: "waha-tbar", role: "status" }, [
      el("span", { text: "وضع معاينة المعلّمة — جميع المراحل مفتوحة، ولا يُسجَّل أي تقدّم" })
    ]);
    var off = el("button", { type: "button", class: "waha-btn waha-btn-ghost", text: "إنهاء المعاينة" });
    off.addEventListener("click", function () {
      previewActive = false;                    /* اسمح بالكتابة ثانيةً */
      restoreNS(previewSnap);                   /* استعادة حرفية — لا اعتماد على إعادة التحميل */
      previewSnap = null;
      teacherPreview = false; teacherBar(false); previewBadge(false);
      location.reload();
    });
    t.appendChild(off);
    root().appendChild(t);
  }
  function addTeacherPreviewButton() {
    var panel = teacherPanel();
    if (!panel || panel.querySelector("[data-waha-preview]")) { return; }
    var b = el("button", { type: "button", class: "waha-btn waha-btn-ghost waha-purge",
      "data-waha-preview": "1", text: "معاينة جميع مراحل الدرس" });
    b.addEventListener("click", function (ev) {
      ev.stopPropagation();
      previewSnap = snapshotNS();               /* لقطة حرفية قبل المعاينة */
      previewActive = true;                     /* امنع كل كتابة داخل النطاق */
      teacherPreview = true;
      teacherBar(true);
      stageNav();
    });
    var wrap = el("div", { class: "waha-purge-wrap" }, [b]);
    panel.appendChild(wrap);
  }
  function stageNav() {
    var btns = stageButtons(), i, b;
    for (i = 0; i < btns.length; i++) {
      b = btns[i];
      if (b.getAttribute("data-waha-stage") === "1") {
        /* أبقِ الشارة متوافقة مع سجلّ الاطّلاع */
        if (visitedSet().indexOf(b.__wahaLabel) >= 0) { b.setAttribute("data-waha-visited", "1"); }
        continue;
      }
      b.setAttribute("data-waha-stage", "1");
      b.__wahaLabel = noDiac((b.innerText || "").replace(/\s+/g, " ")).trim();
      if (b.disabled) {
        b.__wahaLocked = true;
        b.disabled = false;                 /* اجعلها قابلة للعرض */
        b.setAttribute("aria-disabled", "false");
        b.setAttribute("data-waha-unlocked", "1");
      }
      b.addEventListener("click", function (ev) {
        var self = ev.currentTarget;
        if (!self.__wahaLocked || self.__wahaPass) { self.__wahaPass = false; return; }
        if (teacherPreview) { return; }                    /* وضع معاينة المعلّمة: بلا نافذة */
        if (askedThisSession[self.__wahaLabel]) {          /* مرّة واحدة لكل مرحلة في الجلسة */
          self.setAttribute("data-waha-visited", "1");
          previewBadge(true);
          return;
        }
        ev.preventDefault();
        ev.stopImmediatePropagation();
        askSkip(self.__wahaLabel, function (proceed) {
          if (!proceed) { return; }
          askedThisSession[self.__wahaLabel] = true;
          self.__wahaPass = true;
          self.setAttribute("data-waha-visited", "1");
          previewBadge(true);
          self.click();                     /* مرِّر النقرة إلى معالج المنصّة نفسه */
        });
      }, true);
    }
  }

  /* ------------------------------------------------ 9. اتجاه المحاكيات */
  /* محدِّدات مساحات العمل الاحترافية — مستخرجة من شيفرة كل منصّة، لا تخمين.
     Professional simulator workspaces, extracted from each platform's source. */
  var SIM_SEL = [
    /* الصف الثاني · الفصل الأول */
    ".stagewrap", ".ce-workspace",            /* Tinkercad */
    ".ws-shell", ".ws-win", ".ws-docarea",    /* Word */
    ".win-desktop",                            /* محاكي سطح المكتب */
    /* الصف الأول والثاني · الفصل الثاني — ScratchJr */
    ".sj-stagewrap", ".sj-sheet", ".sj-app", ".sj-lib",
    /* الصف الثالث */
    ".stage-wrap", ".obs-stage", ".win-window", ".stagearea", ".wa-canvas", ".pl-stage",
    ".t3d-canvaswrap", ".t3d-wordsheet",
    /* الصف الثالث والرابع — Scratch */
    ".sc-stack", ".sc-lib", ".sc-libwin", ".sc-dlgwin",
    /* الصف الرابع — Excel وغيرها */
    ".simwrap", ".cm-sheet", ".minisheet", ".xl-sheetrow"
  ].join(",");
  function simVisible() {
    var l = document.querySelectorAll(SIM_SEL), i, e, r, cs;
    for (i = 0; i < l.length; i++) {
      e = l[i];
      try { cs = getComputedStyle(e); } catch (x) { continue; }
      if (cs.display === "none" || cs.visibility === "hidden") { continue; }
      r = e.getBoundingClientRect();
      if (r.width >= 240 && r.height >= 190) { return true; }
    }
    return false;
  }
  function buildSimRot() {
    if (document.getElementById("waha-simrot")) { return; }
    var ov = el("div", { id: "waha-simrot", role: "alertdialog", "aria-live": "polite" });
    ov.appendChild(el("div", { class: "waha-rot-emoji", text: "📱" }));
    var ill = el("div", { class: "waha-rot-ill" });
    ill.appendChild(svgEl("svg", { viewBox: "0 0 112 112", "aria-hidden": "true" }, [
      svgEl("g", { "class": "waha-rot-phone" }, [
        svgEl("rect", { x: "38", y: "18", width: "36", height: "64", rx: "7" }),
        svgEl("line", { x1: "50", y1: "25", x2: "62", y2: "25" }),
        svgEl("circle", { cx: "56", cy: "75", r: "2.4" }),
      ]),
      svgEl("path", { d: "M22 86a40 40 0 0 1 8-52", "stroke-linecap": "round" }),
      svgEl("path", { d: "M26 68 30 34l14 8", "stroke-linecap": "round", "stroke-linejoin": "round" }),
    ]));
    ov.appendChild(ill);
    ov.appendChild(el("p", { text: "للحصول على أفضل تجربة تعليمية، يرجى تدوير الهاتف إلى الوضع الأفقي." }));
    ov.appendChild(el("small", { dir: "ltr",
      text: "For the best learning experience, please rotate your device." }));
    root().appendChild(ov);
    document.documentElement.setAttribute("data-waha-simrot", "1");
  }
  function killSimRot() {
    var ov = document.getElementById("waha-simrot");
    if (ov) { ov.parentNode.removeChild(ov); }
    document.documentElement.removeAttribute("data-waha-simrot");
  }
  function simRotate() {
    var d = document.documentElement;
    if (!isPhone()) { killSimRot(); d.removeAttribute("data-waha-simland"); return; }
    /* سياسة الاتجاه: كل محتوى تعليمي داخل المنصّات يتطلّب الوضع الأفقي على الهاتف.
       البوابة وصفحات الصفوف والفصول لا تحمل هذه الطبقة أصلًا فلا تتأثّر. */
    var portrait = window.innerHeight > window.innerWidth;
    if (portrait) { buildSimRot(); d.removeAttribute("data-waha-simland"); }
    else { killSimRot(); d.setAttribute("data-waha-simland", "1"); }
  }

  /* ------------------------------------------------ 11. تثبيت جولة الشرح */
  var tourOn = false, tourScroll = null;
  function tourActive() {
    var n = document.querySelector(".gd-dim,.gd-arrow,.gd-ring,.gd-card,.tt-ring,.tt-card");
    if (!n) { return false; }
    var r = n.getBoundingClientRect();
    return r.width > 0 || r.height > 0 || getComputedStyle(n).display !== "none";
  }
  function blockScroll(e) { e.preventDefault(); }
  function blockKeys(e) {
    var k = e.key;
    if (k === "ArrowUp" || k === "ArrowDown" || k === "PageUp" || k === "PageDown" ||
        k === "Home" || k === "End" || k === " " || k === "Spacebar") { e.preventDefault(); }
    if (k === "Escape") { tourLock(false); }
  }
  function tourLock(on) {
    if (on === tourOn) { return; }
    tourOn = on;
    var d = document.documentElement;
    if (on) {
      tourScroll = { x: window.scrollX || 0, y: window.scrollY || 0 };
      d.setAttribute("data-waha-tour", "1");
      window.addEventListener("wheel", blockScroll, { passive: false });
      window.addEventListener("touchmove", blockScroll, { passive: false });
      window.addEventListener("keydown", blockKeys, true);
    } else {
      d.removeAttribute("data-waha-tour");
      window.removeEventListener("wheel", blockScroll, { passive: false });
      window.removeEventListener("touchmove", blockScroll, { passive: false });
      window.removeEventListener("keydown", blockKeys, true);
      if (tourScroll) { try { window.scrollTo(tourScroll.x, tourScroll.y); } catch (e) {} }
      tourScroll = null;
    }
  }
  function remeasureTour() {
    try {
      var W2 = window.WAHAT2 || window.W;
      if (W2 && W2.guide && typeof W2.guide.remeasure === "function") { W2.guide.remeasure(); }
    } catch (e) {}
  }
  function tourWatch() { tourLock(tourActive()); }


  /* ------------------------------------------------ 12. زر الإعدادات (g4s2) */
  function pinGear() {
    if (G !== 4 || S !== 2) { return; }
    var g = document.getElementById("setGear") || document.querySelector(".setgear");
    if (!g) { return; }
    var narrow = Math.min(window.innerWidth, window.innerHeight) <= 480;

    /* ---- الهاتف العمودي: الترس داخل شريط رأس المنصّة نفسه، في التدفّق ---- */
    if (narrow) {
      var head = document.querySelector(".hub-head") ||
                 document.querySelector("[class*=head]:not(.setpanel)");
      if (head && head.getBoundingClientRect().width > 120) {
        if (g.parentElement !== head) { head.appendChild(g); }
        g.style.setProperty("position", "static", "important");
        g.style.setProperty("top", "auto", "important");
        g.style.setProperty("right", "auto", "important");
        g.style.setProperty("left", "auto", "important");
        g.style.setProperty("bottom", "auto", "important");
        g.style.setProperty("inset-inline-end", "auto", "important");
        g.style.setProperty("inset-inline-start", "auto", "important");
        g.style.setProperty("transform", "none", "important");
        g.style.setProperty("margin-inline-start", "auto", "important");
        g.style.setProperty("flex", "0 0 auto", "important");
        g.style.setProperty("width", "34px", "important");
        g.style.setProperty("height", "34px", "important");
        g.style.setProperty("position", "relative", "important");
        g.style.setProperty("z-index", "60", "important");
        g.setAttribute("data-waha-pinned", "head");
        return;
      }
    }

    /* ---- بقية المقاسات: تثبيت أعلى الإطار المرئي خارج الحاويات المحوّلة ---- */
    var r = g.getBoundingClientRect();
    if (g.getAttribute("data-waha-pinned") === "1" &&
        r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth) { return; }
    var n = g.parentElement, moved = false;
    while (n && n !== document.body) {
      var tr = "";
      try { tr = getComputedStyle(n).transform; } catch (e) { tr = ""; }
      if (tr && tr !== "none") { moved = true; break; }
      n = n.parentElement;
    }
    if (moved && g.parentElement !== document.body) { document.body.appendChild(g); }
    g.style.setProperty("position", "fixed", "important");
    g.style.setProperty("top", "10px", "important");
    g.style.setProperty("right", "12px", "important");
    g.style.setProperty("left", "auto", "important");
    g.style.setProperty("bottom", "auto", "important");
    g.style.setProperty("inset-inline-end", "12px", "important");
    g.style.setProperty("inset-inline-start", "auto", "important");
    g.style.setProperty("transform", "none", "important");
    g.style.setProperty("margin-inline-start", "0", "important");
    g.style.setProperty("width", "", "important");
    g.style.setProperty("height", "", "important");
    g.style.setProperty("z-index", "2147482000", "important");
    g.setAttribute("data-waha-pinned", "1");
  }

  /* ---------------------------------------------------------------- 6. boot */
  ready(function () {
    applyMobile();
    pinGear();
    stageNav();
    simRotate();
    buildExit();
    setTimeout(placeExit, 400);
    window.addEventListener("resize", function () { applyMobile(); setTimeout(placeExit, 200); });
    window.addEventListener("orientationchange", function () { setTimeout(function () { applyMobile(); simRotate(); remeasureTour(); placeExit(); }, 250); });
    if (!skip) { buildGate(); }
    /* فحص دوري واحد ومحدود — لا MutationObserver ولا حلقات متكررة */
    setInterval(function () {
      if (!document.getElementById("waha-exit")) { buildExit(); }
      var dups = document.querySelectorAll("#waha-exit");
      var i;
      for (i = 1; i < dups.length; i++) { dups[i].remove(); }
      applyMobile();
      pinGear();
      tourWatch();
      stageNav();
      addTeacherPreviewButton();
      simRotate();
      sweepPurge();
      attachPurge();
      placeExit();
    }, 1200);
  });

  window.__waha = { ns: NS, purge: purge, keys: nsKeys, grade: G, semester: S,
    /* سطح اختبار للقراءة فقط — لا يفتح أي باب في المنصّة */
    previewStart: function () { previewSnap = snapshotNS(); previewActive = true; teacherPreview = true; stageNav(); },
    previewEnd: function () { previewActive = false; restoreNS(previewSnap); previewSnap = null; teacherPreview = false; },
    snapshot: snapshotNS, isPreview: function () { return previewActive; } };
})();

