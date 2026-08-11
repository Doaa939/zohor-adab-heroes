/*!
 * adventure/engine.js — Adventure experience engine (GAME-WORLD presentation)
 * منصة واحة التقنية — طبقة المغامرة المشتركة. لا تُعدّل أي درس ولا أي محتوى تعليمي.
 *
 * PRESENTATION MODEL — a real game world, not a vertical lesson page:
 *   • Each world is a large, hand-illustrated pixel scene (bigger than the
 *     screen). A translate-only CAMERA pans across it — the page itself never
 *     scrolls. No transform:scale to fit; text is composited at true size.
 *   • Missions are PLACES in the scene (a building, a station, a gateway…),
 *     positioned by the world along its own geography (trail / line / hub…).
 *   • On entry the camera opens on the CURRENT mission. Prev/next destination
 *     controls + drag/swipe explore the world. A minimap shows the whole map.
 *   • Completing a mission plays a short cinematic: the finished place lights
 *     up, a traveler moves along the path, and the camera glides to the next
 *     destination.
 *
 * FROZEN FUNCTIONAL CONTRACT (unchanged from the approved build):
 *   • Progress adapter — READ-ONLY. Completion comes from the original
 *     platform's own namespaced localStorage blob(s). Adventure never writes it.
 *   • Opening a mission hands {id,no,ar} to the inlined navigation bridge via
 *     sessionStorage["adv:target:<code>"] and returns to ./index.html with the
 *     platform gate suppressed. The original lesson opens — no second copy.
 *   • Session gate, scoped reset, Basic Mode, Teacher Mode, offline, security.
 *
 * No eval, no new Function, no remote requests, no innerHTML of untrusted text.
 * DOM is built with createElement + textContent only.
 */
(function (global) {
  "use strict";

  var registry = Object.create(null);
  var doc = document;

  /* ---------------------------------------------------------- tiny DOM kit */
  function el(tag, attrs, kids) {
    var n = doc.createElement(tag), k;
    if (attrs) for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "html") { /* intentionally unsupported */ }
      else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? doc.createTextNode(c) : c); });
    return n;
  }
  function svg(tag, attrs, kids) {
    var n = doc.createElementNS("http://www.w3.org/2000/svg", tag), k;
    if (attrs) for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function icon(paths, vb) {
    return svg("svg", { viewBox: vb || "0 0 24 24", "aria-hidden": "true", focusable: "false" },
      (paths || []).map(function (d) { return svg("path", { d: d }); }));
  }
  function $(sel, r) { return (r || doc).querySelector(sel); }

  /* Arabic-Indic digits — the progress counter must read correctly in RTL. */
  function toAr(n) { return String(n).replace(/[0-9]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[+d]; }); }

  /* ---------------------------------------------------------- reduced motion */
  function prefersReduced() {
    try { return global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch (e) { return false; }
  }

  /* ---------------------------------------------------------- SFX (local, generated) */
  var Sfx = (function () {
    var ctx = null, muted = false;
    function ac() {
      if (muted) return null;
      try { if (!ctx) ctx = new (global.AudioContext || global.webkitAudioContext)(); return ctx; }
      catch (e) { return null; }
    }
    function tone(freq, dur, type, gain, delay) {
      var c = ac(); if (!c) return;
      try {
        var o = c.createOscillator(), g = c.createGain();
        o.type = type || "sine"; o.frequency.value = freq;
        var t0 = c.currentTime + (delay || 0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(gain || 0.09, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
      } catch (e) {}
    }
    return {
      setMuted: function (m) { muted = m; },
      isMuted: function () { return muted; },
      unlock: function () { tone(523, 0.14, "sine", 0.08, 0); tone(784, 0.18, "sine", 0.07, 0.1); },
      success: function () { tone(523, 0.12, "triangle", 0.08, 0); tone(659, 0.12, "triangle", 0.08, 0.09); tone(880, 0.22, "triangle", 0.09, 0.18); },
      world: function () { [392, 523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.3, "triangle", 0.08, i * 0.12); }); },
      move: function () { tone(420, 0.08, "sine", 0.05, 0); tone(560, 0.10, "sine", 0.05, 0.06); },
      tap: function () { tone(300, 0.06, "sine", 0.05, 0); }
    };
  })();

  /* ---------------------------------------------------------- progress adapter */
  /* READ-ONLY. Completion comes from the ORIGINAL platform's own namespaced
     localStorage blob(s). Never writes. Delegates to the shared adapter so the
     gate and the engine decide "completed" identically. */
  function entryDone(e) {
    return !!(e && typeof e === "object" && (e.done === true || e.mastered === true || e.completed === true));
  }
  function defaultReadDone(parsed, lesson) {
    if (global.AdvProgress) return global.AdvProgress.doneInBlob(parsed, lesson.id);
    if (!parsed || typeof parsed !== "object") return false;
    var id = lesson.id, buckets = [];
    if (parsed.progress && parsed.progress.lessons) buckets.push(parsed.progress.lessons);
    if (parsed.progress && typeof parsed.progress === "object") buckets.push(parsed.progress);
    if (parsed.lessons && typeof parsed.lessons === "object") buckets.push(parsed.lessons);
    buckets.push(parsed);
    for (var i = 0; i < buckets.length; i++) { if (entryDone(buckets[i][id])) return true; }
    return false;
  }
  function readState(world) {
    var prefix = "waha:" + world.code + ":", blobs = [], i, k, raw;
    try {
      for (i = 0; i < global.localStorage.length; i++) {
        k = global.localStorage.key(i);
        if (k && k.indexOf(prefix) === 0) {
          raw = global.localStorage.getItem(k);
          if (raw) { try { blobs.push(JSON.parse(raw)); } catch (e) {} }
        }
      }
    } catch (e) {}
    if (!blobs.length && world.storageKey) {
      try { raw = global.localStorage.getItem(world.storageKey); if (raw) blobs.push(JSON.parse(raw)); } catch (e) {}
    }
    var reader = typeof world.readDone === "function" ? world.readDone : defaultReadDone;
    var done = Object.create(null);
    world.lessons.forEach(function (l) {
      for (var b = 0; b < blobs.length; b++) {
        var ok; try { ok = reader(blobs[b], l); } catch (e) { ok = false; }
        if (ok) { done[l.id] = true; break; }
      }
    });
    return { parsed: blobs[0] || null, blobs: blobs, done: done };
  }

  /* derive done / current / locked per lesson */
  function derive(world, done) {
    var firstIncomplete = -1, i;
    for (i = 0; i < world.lessons.length; i++) { if (!done[world.lessons[i].id]) { firstIncomplete = i; break; } }
    var allDone = firstIncomplete === -1;
    var rows = world.lessons.map(function (l, idx) {
      var st;
      if (done[l.id]) st = "done";
      else if (idx === firstIncomplete) st = "current";
      else if (idx < firstIncomplete) st = "done";
      else st = "locked";
      var open = done[l.id] || (firstIncomplete >= 0 && idx <= firstIncomplete);
      return { lesson: l, state: st, open: open, index: idx };
    });
    rows.allDone = allDone;
    rows.currentIndex = firstIncomplete;
    return rows;
  }

  /* small easing + tween helper (rAF, cancellable, respects reduced-motion) */
  function tween(from, to, ms, onStep, onDone, reduced) {
    if (reduced || ms <= 0) { onStep(to); if (onDone) onDone(); return { cancel: function () {} }; }
    var start = null, raf = 0, live = true;
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function frame(ts) {
      if (!live) return;
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / ms), k = ease(t);
      onStep({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k });
      if (t < 1) raf = global.requestAnimationFrame(frame);
      else if (onDone) onDone();
    }
    raf = global.requestAnimationFrame(frame);
    return { cancel: function () { live = false; if (raf) global.cancelAnimationFrame(raf); } };
  }

  /* ---------------------------------------------------------- Engine instance */
  function Engine(world) {
    this.world = world;
    this.root = null;
    this.state = readState(world);
    this.rows = derive(world, this.state.done);
    this.doneCount = Object.keys(this.state.done).length;
    this.total = world.lessons.length;
    this.reduced = prefersReduced() || (this.state.parsed && this.state.parsed.settings && this.state.parsed.settings.reducedMotion) || false;
    this.cam = { x: 0, y: 0 };           /* camera translate (px) */
    this.focusIdx = this.rows.currentIndex >= 0 ? this.rows.currentIndex : Math.max(0, this.total - 1);
    this.nodeEls = [];                    /* .adv-node per lesson index */
    this._camTween = null;
  }

  Engine.prototype.currentLesson = function () {
    var i = this.rows.currentIndex;
    return i >= 0 ? this.rows[i].lesson : null;
  };
  Engine.prototype.wcfg = function () { return this.world.world || {}; };
  Engine.prototype.worldSize = function () {
    var w = this.wcfg().size || { w: 2400, h: 1350 };
    return { w: w.w, h: w.h };
  };
  Engine.prototype.nodePos = function (i) {
    var wc = this.wcfg();
    if (typeof wc.nodeAt === "function") { try { return wc.nodeAt(i, this.total); } catch (e) {} }
    var sz = this.worldSize();
    return { x: (sz.w / (this.total + 1)) * (i + 1), y: sz.h / 2 };
  };

  /* ---- navigation targets (relative to gradeN/semesterM/adventure.html) ---- */
  Engine.prototype.gradeHref = function () { return "../index.html"; };
  Engine.prototype.basicHref = function () { return "./index.html"; };
  Engine.prototype.skipPlatformGate = function () {
    try { global.sessionStorage.setItem("waha:gate:" + this.world.code, "1"); } catch (e) {}
  };
  Engine.prototype.openMission = function () {
    this.skipPlatformGate();
    Sfx.tap();
    global.location.href = this.basicHref();
  };
  Engine.prototype.goBasic = function () { this.skipPlatformGate(); global.location.href = this.basicHref(); };
  Engine.prototype.goGrade = function () { global.location.href = this.gradeHref(); };

  Engine.prototype.enterLesson = function (l) {
    /* Hand the target to the navigation bridge (id to open, title to verify). */
    try { global.sessionStorage.setItem("adv:target:" + this.world.code,
      JSON.stringify({ id: l.id, no: l.no, ar: l.ar })); } catch (e) {}
    this.openMission();
  };

  /* ---------------------------------------------------------- build UI */
  Engine.prototype.mount = function (rootEl) {
    this.root = rootEl;
    rootEl.className = "adv-root adv-game";
    if (this.reduced) rootEl.setAttribute("data-reduced", "1");
    rootEl.setAttribute("data-world", this.world.code);
    if (this.world.theme) { var t = this.world.theme; for (var k in t) if (Object.prototype.hasOwnProperty.call(t, k)) rootEl.style.setProperty(k, t[k]); }

    doc.documentElement.classList.add("adv-html");
    doc.body.classList.add("adv-body");

    rootEl.appendChild(el("a", { class: "adv-skip", href: "#adv-current", text: "تخطَّ إلى المهمة الحالية" }));

    rootEl.appendChild(this.buildHUD());
    rootEl.appendChild(this.buildStage());
    rootEl.appendChild(this.buildDock());   /* compact bottom controls: prev/current/next + minimap */

    this.hudhudEl = this.buildHudhud();
    rootEl.appendChild(this.hudhudEl);

    this.updateProgressMeter();
    this.updateFocusHud();
    this.wireResize();
    this.wireReturnDetection();
    this.maybeIntro();

    /* open the camera on the current mission */
    var self = this;
    this._raf(function () { self.centerOn(self.focusIdx, false); self.spotlight(self.focusIdx); });
  };

  Engine.prototype._raf = function (fn) { if (global.requestAnimationFrame) global.requestAnimationFrame(fn); else setTimeout(fn, 16); };

  /* -------- compact HUD (top): world · current mission · progress · controls */
  Engine.prototype.buildHUD = function () {
    var self = this;
    var hud = el("header", { class: "adv-hud", role: "banner" });

    var left = el("div", { class: "adv-hud__grp" });
    var back = el("a", { class: "adv-hud__btn", href: this.gradeHref(), title: "الصف والوضع",
      "aria-label": "العودة إلى صفحة الصف واختيار الوضع" },
      [icon(["M10.6 4.6 3.2 12l7.4 7.4 1.6-1.6L7.2 13.1H20.8v-2.2H7.2l5-4.7z"])]);
    var basic = el("button", { type: "button", class: "adv-hud__btn", title: "الوضع الأساسي",
      "aria-label": "التبديل إلى الوضع الأساسي للدروس" },
      [icon(["M3.2 4.4h6.1c1.1 0 2 .4 2.7 1.1.7-.7 1.6-1.1 2.7-1.1h6.1v13.9h-6.1c-1.1 0-2 .4-2.7 1.1-.7-.7-1.6-1.1-2.7-1.1H3.2z"])]);
    basic.addEventListener("click", function () { self.goBasic(); });
    left.appendChild(back); left.appendChild(basic);

    var title = el("div", { class: "adv-hud__title" }, [
      el("b", { text: this.world.title }),
      el("span", { text: this.world.subtitle || this.world.gradeLabel || "" })
    ]);

    var right = el("div", { class: "adv-hud__grp" });
    /* progress — explicit Arabic, correct in RTL: «أنجزت ٣ من ١٦» */
    var prog = el("div", { class: "adv-hud__prog", role: "status" }, [
      el("span", { class: "adv-hud__ring" }, [
        svg("svg", { viewBox: "0 0 36 36", "aria-hidden": "true" }, [
          svg("circle", { class: "adv-hud__ringbg", cx: "18", cy: "18", r: "15.5" }),
          svg("circle", { class: "adv-hud__ringfg", cx: "18", cy: "18", r: "15.5" })
        ])
      ]),
      el("span", { class: "adv-hud__proglbl" })
    ]);
    this.progEl = prog;
    var mute = el("button", { type: "button", class: "adv-hud__btn", "aria-pressed": "false",
      title: "المؤثرات الصوتية", "aria-label": "كتم أو تشغيل المؤثرات الصوتية" }, [this._muteIcon(false)]);
    mute.addEventListener("click", function () {
      var m = !Sfx.isMuted(); Sfx.setMuted(m);
      mute.setAttribute("aria-pressed", m ? "true" : "false");
      mute.replaceChild(self._muteIcon(m), mute.firstChild);
      try { global.sessionStorage.setItem("adv:muted", m ? "1" : "0"); } catch (e) {}
    });
    try { if (global.sessionStorage.getItem("adv:muted") === "1") { Sfx.setMuted(true); mute.setAttribute("aria-pressed", "true"); mute.replaceChild(this._muteIcon(true), mute.firstChild); } } catch (e) {}
    right.appendChild(prog); right.appendChild(mute);

    hud.appendChild(left); hud.appendChild(title); hud.appendChild(right);
    return hud;
  };
  Engine.prototype._muteIcon = function (m) {
    return m ? icon(["M4 9v6h4l5 5V4L8 9H4z", "M16 8l5 5M21 8l-5 5"])
             : icon(["M4 9v6h4l5 5V4L8 9H4z", "M16.5 8.5a5 5 0 0 1 0 7", "M19 6a8 8 0 0 1 0 12"]);
  };

  /* -------- the camera stage: a fixed frame holding the pannable world */
  Engine.prototype.buildStage = function () {
    var stage = el("div", { class: "adv-stage", role: "application",
      "aria-label": "خريطة عالم " + this.world.title + " — اسحب للاستكشاف" });
    var sz = this.worldSize();
    var cam = el("div", { class: "adv-cam" });
    cam.style.width = sz.w + "px";
    cam.style.height = sz.h + "px";
    this.camEl = cam;
    this.stageEl = stage;

    /* environment art (background → midground → foreground), built by the world */
    var env = el("div", { class: "adv-env", "aria-hidden": "true" });
    var wc = this.wcfg();
    if (typeof wc.layers === "function") {
      try {
        wc.layers(env, {
          el: el, svg: svg, icon: icon, W: sz.w, H: sz.h,
          nodes: this.rows.map(function (r, i) { return { i: i, state: r.state }; }),
          nodeAt: this.nodePos.bind(this), stateOf: this.stateOf.bind(this)
        });
      } catch (e) {}
    }
    cam.appendChild(env);

    /* path connecting the missions (world coords) */
    this.pathEl = this.buildPath();
    if (this.pathEl) cam.appendChild(this.pathEl);

    /* traveler (hudhud / vehicle / pulse) */
    if (typeof wc.traveler === "function") {
      try {
        var trav = wc.traveler({ el: el, svg: svg, icon: icon });
        if (trav) { trav.classList.add("adv-traveler"); this.travelerEl = trav; cam.appendChild(trav); }
      } catch (e) {}
    }

    /* mission places */
    this.nodeEls = [];
    var mlist = el("div", { class: "adv-nodes", id: "adv-missions", role: "list",
      "aria-label": "مهمات " + this.world.title });
    for (var i = 0; i < this.rows.length; i++) mlist.appendChild(this.buildNode(this.rows[i]));
    cam.appendChild(mlist);

    stage.appendChild(cam);
    this.wirePan(stage);
    return stage;
  };

  Engine.prototype.stateOf = function (i) {
    var r = this.rows[i]; return r ? r.state : "locked";
  };

  Engine.prototype.buildPath = function () {
    var wc = this.wcfg(), sz = this.worldSize();
    var pts = this.rows.map(function (r, i) { return null; });
    var arr = [];
    for (var i = 0; i < this.total; i++) arr.push(this.nodePos(i));
    var d = typeof wc.pathD === "function" ? wc.pathD(arr) : this._defaultPath(arr);
    if (!d) return null;
    var doneCount = this.doneCount;
    var litArr = arr.slice(0, Math.min(doneCount + 1, arr.length));
    var litD = litArr.length > 1 ? (typeof wc.pathD === "function" ? wc.pathD(litArr) : this._defaultPath(litArr)) : "";
    var s = svg("svg", { class: "adv-path", viewBox: "0 0 " + sz.w + " " + sz.h, preserveAspectRatio: "none", "aria-hidden": "true" }, [
      svg("path", { class: "adv-path__base", d: d }),
      litD ? svg("path", { class: "adv-path__lit", d: litD }) : null
    ]);
    return s;
  };
  Engine.prototype._defaultPath = function (pts) {
    if (!pts.length) return "";
    var d = "M" + pts[0].x + " " + pts[0].y;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], mx = (a.x + b.x) / 2;
      d += " C" + mx + " " + a.y + " " + mx + " " + b.y + " " + b.x + " " + b.y;
    }
    return d;
  };

  Engine.prototype.buildNode = function (row) {
    var self = this, l = row.lesson, i = row.index, wc = this.wcfg();
    var p = this.nodePos(i);
    var node = el("div", { class: "adv-node", "data-state": row.state, "data-lesson": l.id, role: "listitem" });
    node.style.left = p.x + "px"; node.style.top = p.y + "px";
    if (i === this.rows.currentIndex) node.id = "adv-current";

    /* scene object (per-world illustrated place) */
    var art = el("div", { class: "adv-node__art", "aria-hidden": "true" });
    if (typeof wc.place === "function") {
      try { wc.place(art, { row: row, index: i, lesson: l, state: row.state, first: i === 0, last: i === this.total - 1 },
        { el: el, svg: svg, icon: icon }); } catch (e) {}
    }
    node.appendChild(art);

    /* per-world signage carrying the lesson name (from platform data) */
    var sign;
    if (typeof wc.sign === "function") {
      try { sign = wc.sign({ row: row, index: i, lesson: l, state: row.state, no: l.no, name: l.ar,
        unit: this.world.unitOf ? this.world.unitOf(l) : "" }, { el: el, svg: svg, icon: icon, stateIcon: this._stateIcon }); }
      catch (e) { sign = null; }
    }
    if (!sign) sign = this._defaultSign(row);
    sign.classList.add("adv-sign");
    node.appendChild(sign);

    /* accessible hit target covering the place */
    var hit = el("button", { type: "button", class: "adv-node__hit", "data-lesson": l.id,
      "aria-label": "المهمة " + l.no + " — " + l.ar + " — " + this._stateLabel(row.state) });
    hit.addEventListener("click", function (ev) {
      if (self._dragged) { ev.preventDefault(); return; }
      self.focusIdx = i; self.centerOn(i, true); self.spotlight(i); self.updateFocusHud();
      if (row.state === "locked" && !row.open) { self.hudhud(self.world.msgLocked || "أكمل المهمة السابقة أولًا."); Sfx.tap(); return; }
      self.enterLesson(l);
    });
    node.appendChild(hit);

    if (row.state === "current") node.appendChild(el("div", { class: "adv-node__beacon", "aria-hidden": "true" }));
    this.nodeEls[i] = node;
    return node;
  };

  Engine.prototype._stateLabel = function (state) {
    return state === "done" ? "مكتملة" : state === "current" ? "المهمة الحالية" : "مقفلة — أكمل ما قبلها";
  };
  Engine.prototype._stateIcon = function (state) {
    if (state === "done") { var i = icon(["M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"]); i.setAttribute("fill", "currentColor"); return i; }
    if (state === "current") { var j = icon(["M8 5v14l11-7z"]); j.setAttribute("fill", "currentColor"); return j; }
    var k = icon(["M6 10V8a6 6 0 0 1 12 0v2h1.4v11H4.6V10H6zm2 0h8V8a4 4 0 0 0-8 0v2z"]); k.setAttribute("fill", "currentColor"); return k;
  };
  Engine.prototype._defaultSign = function (row) {
    var l = row.lesson;
    return el("div", { class: "adv-sign--plate" }, [
      el("div", { class: "adv-sign__row" }, [
        el("span", { class: "adv-sign__no", text: l.no }),
        el("span", { class: "adv-sign__st", "aria-hidden": "true" }, [this._stateIcon(row.state)])
      ]),
      el("span", { class: "adv-sign__name", text: l.ar })
    ]);
  };

  /* -------- bottom dock: destination controls + minimap */
  Engine.prototype.buildDock = function () {
    var self = this;
    var dock = el("div", { class: "adv-dock", role: "navigation", "aria-label": "التنقل في العالم" });

    /* current-mission chip + start button */
    var focus = el("div", { class: "adv-dock__focus" }, [
      el("span", { class: "adv-dock__badge" }),
      el("span", { class: "adv-dock__txt" }, [
        el("span", { class: "adv-dock__k" }),
        el("span", { class: "adv-dock__v" })
      ])
    ]);
    this.focusChip = focus;
    var start = el("button", { type: "button", class: "adv-dock__go" });
    start.addEventListener("click", function () {
      var r = self.rows[self.focusIdx];
      if (!r) return;
      if (r.state === "locked" && !r.open) { self.hudhud(self.world.msgLocked || "أكمل المهمة السابقة أولًا."); Sfx.tap(); return; }
      self.enterLesson(r.lesson);
    });
    this.startBtn = start;

    /* prev / next destination */
    var prev = el("button", { type: "button", class: "adv-dock__nav", "aria-label": "الوجهة السابقة" },
      [icon(["M15.4 4.6 8 12l7.4 7.4 1.6-1.6L11.2 12l5.8-5.8z"])]);
    var next = el("button", { type: "button", class: "adv-dock__nav", "aria-label": "الوجهة التالية" },
      [icon(["M8.6 4.6 16 12l-7.4 7.4-1.6-1.6L12.8 12 7 6.2z"])]);
    prev.addEventListener("click", function () { self.step(-1); });
    next.addEventListener("click", function () { self.step(1); });
    this.prevBtn = prev; this.nextBtn = next;

    /* minimap of the whole world */
    var mini = this.buildMiniMap();

    var nav = el("div", { class: "adv-dock__ctrls" }, [next, focus, start, prev]); /* RTL: prev on right */
    dock.appendChild(mini);
    dock.appendChild(nav);
    return dock;
  };

  Engine.prototype.buildMiniMap = function () {
    var self = this, sz = this.worldSize();
    var mini = el("div", { class: "adv-mini", role: "group", "aria-label": "خريطة مصغّرة" });
    var vb = svg("svg", { class: "adv-mini__svg", viewBox: "0 0 " + sz.w + " " + sz.h, preserveAspectRatio: "xMidYMid meet" });
    var arr = []; for (var i = 0; i < this.total; i++) arr.push(this.nodePos(i));
    vb.appendChild(svg("path", { class: "adv-mini__path", d: this._defaultPath(arr) }));
    this.miniDots = [];
    arr.forEach(function (p, i) {
      var st = self.stateOf(i);
      var c = svg("circle", { class: "adv-mini__dot", cx: p.x, cy: p.y, r: 26, "data-state": st });
      vb.appendChild(c); self.miniDots[i] = c;
    });
    /* viewport rectangle */
    this.miniView = svg("rect", { class: "adv-mini__view", x: 0, y: 0, width: 100, height: 100 });
    vb.appendChild(this.miniView);
    /* click to pan */
    vb.addEventListener("click", function (ev) {
      var r = vb.getBoundingClientRect();
      var wx = ((ev.clientX - r.left) / r.width) * sz.w;
      var wy = ((ev.clientY - r.top) / r.height) * sz.h;
      /* jump to nearest node */
      var best = 0, bd = Infinity;
      arr.forEach(function (p, i) { var d = (p.x - wx) * (p.x - wx) + (p.y - wy) * (p.y - wy); if (d < bd) { bd = d; best = i; } });
      self.focusIdx = best; self.centerOn(best, true); self.spotlight(best); self.updateFocusHud();
    });
    mini.appendChild(vb);
    return mini;
  };

  /* -------- camera ------------------------------------------------------- */
  Engine.prototype.stageBox = function () {
    return this.stageEl ? { w: this.stageEl.clientWidth, h: this.stageEl.clientHeight } : { w: global.innerWidth, h: 400 };
  };
  Engine.prototype.clampCam = function (x, y) {
    var sz = this.worldSize(), box = this.stageBox();
    var m = 40; /* allow a little breathing room past the edges */
    var minX = Math.min(m, box.w - sz.w - m), maxX = m;
    var minY = Math.min(m, box.h - sz.h - m), maxY = m;
    /* if world smaller than frame in an axis, center it */
    if (sz.w <= box.w) { var cx = (box.w - sz.w) / 2; minX = maxX = cx; }
    if (sz.h <= box.h) { var cy = (box.h - sz.h) / 2; minY = maxY = cy; }
    return { x: Math.max(minX, Math.min(maxX, x)), y: Math.max(minY, Math.min(maxY, y)) };
  };
  Engine.prototype.applyCam = function () {
    if (this.camEl) this.camEl.style.transform = "translate(" + this.cam.x + "px," + this.cam.y + "px)";
    this.updateMiniView();
  };
  Engine.prototype.setCam = function (x, y) { var c = this.clampCam(x, y); this.cam.x = c.x; this.cam.y = c.y; this.applyCam(); };
  Engine.prototype.centerOn = function (i, animate) {
    if (this._camTween) { this._camTween.cancel(); this._camTween = null; }
    var p = this.nodePos(i), box = this.stageBox();
    var focusY = box.h * 0.52;
    var target = this.clampCam(box.w / 2 - p.x, focusY - p.y);
    if (!animate || this.reduced) { this.cam.x = target.x; this.cam.y = target.y; this.applyCam(); return; }
    var self = this;
    this._camTween = tween({ x: this.cam.x, y: this.cam.y }, target, 620,
      function (v) { self.cam.x = v.x; self.cam.y = v.y; self.applyCam(); },
      function () { self._camTween = null; }, this.reduced);
  };
  Engine.prototype.step = function (dir) {
    var i = Math.max(0, Math.min(this.total - 1, this.focusIdx + dir));
    if (i === this.focusIdx) return;
    this.focusIdx = i; Sfx.move();
    this.centerOn(i, true); this.spotlight(i); this.updateFocusHud();
  };
  Engine.prototype.spotlight = function (i) {
    for (var k = 0; k < this.nodeEls.length; k++) if (this.nodeEls[k]) this.nodeEls[k].classList.toggle("is-focus", k === i);
    if (this.miniDots) for (var m = 0; m < this.miniDots.length; m++) this.miniDots[m].classList.toggle("is-focus", m === i);
  };
  Engine.prototype.updateMiniView = function () {
    if (!this.miniView) return;
    var box = this.stageBox(), sz = this.worldSize();
    var vx = -this.cam.x, vy = -this.cam.y;
    this.miniView.setAttribute("x", Math.max(0, vx));
    this.miniView.setAttribute("y", Math.max(0, vy));
    this.miniView.setAttribute("width", Math.min(sz.w, box.w));
    this.miniView.setAttribute("height", Math.min(sz.h, box.h));
  };

  Engine.prototype.updateFocusHud = function () {
    var r = this.rows[this.focusIdx]; if (!r || !this.focusChip) return;
    var l = r.lesson;
    $(".adv-dock__badge", this.focusChip).textContent = l.no;
    var isCur = r.index === this.rows.currentIndex;
    $(".adv-dock__k", this.focusChip).textContent = isCur ? "المهمة الحالية" : (r.state === "done" ? "مهمة مكتملة" : "وجهة مقفلة");
    $(".adv-dock__v", this.focusChip).textContent = l.ar;
    this.focusChip.setAttribute("data-state", r.state);
    if (this.startBtn) {
      this.startBtn.textContent = r.state === "done" ? "أعد اللعب" : r.state === "current" ? "ابدأ المهمة" : "مقفلة";
      this.startBtn.disabled = (r.state === "locked" && !r.open);
    }
    if (this.prevBtn) this.prevBtn.disabled = this.focusIdx <= 0;
    if (this.nextBtn) this.nextBtn.disabled = this.focusIdx >= this.total - 1;
  };

  Engine.prototype.updateProgressMeter = function () {
    if (!this.progEl) return;
    var pct = this.total ? Math.round((this.doneCount / this.total) * 100) : 0;
    var lbl = $(".adv-hud__proglbl", this.progEl);
    if (lbl) lbl.textContent = "أنجزت " + toAr(this.doneCount) + " من " + toAr(this.total);
    var fg = $(".adv-hud__ringfg", this.progEl);
    if (fg) { var C = 2 * Math.PI * 15.5; fg.style.strokeDasharray = C.toFixed(1); fg.style.strokeDashoffset = (C * (1 - pct / 100)).toFixed(1); }
    this.progEl.setAttribute("aria-label", "أنجزت " + toAr(this.doneCount) + " من " + toAr(this.total) + " مهمة");
  };

  /* -------- drag / swipe to pan ----------------------------------------- */
  Engine.prototype.wirePan = function (stage) {
    var self = this, active = false, sx = 0, sy = 0, ox = 0, oy = 0, moved = 0;
    function down(e) {
      if (e.button != null && e.button !== 0) return;
      active = true; self._dragged = false; moved = 0;
      var pt = e.touches ? e.touches[0] : e;
      sx = pt.clientX; sy = pt.clientY; ox = self.cam.x; oy = self.cam.y;
      if (self._camTween) { self._camTween.cancel(); self._camTween = null; }
      stage.classList.add("is-grabbing");
    }
    function move(e) {
      if (!active) return;
      var pt = e.touches ? e.touches[0] : e;
      var dx = pt.clientX - sx, dy = pt.clientY - sy;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 8) { self._dragged = true; if (e.cancelable) e.preventDefault(); }
      self.setCam(ox + dx, oy + dy);
    }
    function up() { active = false; stage.classList.remove("is-grabbing"); setTimeout(function () { self._dragged = false; }, 30); }
    stage.addEventListener("mousedown", down);
    global.addEventListener("mousemove", move);
    global.addEventListener("mouseup", up);
    stage.addEventListener("touchstart", down, { passive: true });
    stage.addEventListener("touchmove", move, { passive: false });
    stage.addEventListener("touchend", up);
    /* keyboard: arrows step between destinations */
    stage.setAttribute("tabindex", "0");
    stage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { self.step(1); e.preventDefault(); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { self.step(-1); e.preventDefault(); }
    });
  };

  /* -------- resize: keep the focused mission centered (no reflow column) -- */
  Engine.prototype.wireResize = function () {
    if (this._resizeWired) return;
    this._resizeWired = true;
    var self = this, t;
    global.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { self.centerOn(self.focusIdx, false); }, 140);
    });
  };

  /* ---------------------------------------------------------- hudhud guide */
  Engine.prototype.buildHudhud = function () {
    var box = el("div", { class: "adv-hudhud", role: "status", "aria-live": "polite" }, [
      el("div", { class: "adv-hudhud__bird", "aria-hidden": "true" }, [
        icon(["M12 3c2 0 3 1.4 3 3l3-1-2 2.4c1.4 1 2 2.6 2 4.6 0 3.6-2.7 6-6 6s-6-2.4-6-6c0-3.4 2-6.6 3-8.2C12.3 5.6 12 4 12 3z",
              "M9 11.5a1 1 0 1 0 .01 0z"], "0 0 24 24")
      ]),
      el("div", { class: "adv-hudhud__bubble" })
    ]);
    this.hudhudBubble = $(".adv-hudhud__bubble", box);
    return box;
  };
  Engine.prototype.hudhud = function (msg, sticky) {
    if (!this.hudhudEl) return;
    var self = this;
    this.hudhudBubble.textContent = "";
    this.hudhudBubble.appendChild(doc.createTextNode(msg));
    this.hudhudEl.classList.add("is-on");
    clearTimeout(this._hudhudT);
    if (!sticky) this._hudhudT = setTimeout(function () { self.hudhudEl.classList.remove("is-on"); }, 4600);
  };

  /* ---------------------------------------------------------- celebration */
  Engine.prototype.celebrate = function (msg) {
    var burst = el("div", { class: "adv-burst", "aria-hidden": "true" });
    burst.appendChild(el("div", { class: "adv-burst__ring" }));
    burst.appendChild(el("div", { class: "adv-burst__msg", text: msg || "أحسنت! اكتملت المهمة" }));
    if (!this.reduced) {
      for (var i = 0; i < 14; i++) {
        var a = (Math.PI * 2 * i) / 14, r = 120 + (i % 3) * 40;
        var s = el("span", { class: "adv-spark" });
        s.style.setProperty("--dx", Math.cos(a) * r + "px");
        s.style.setProperty("--dy", Math.sin(a) * r + "px");
        burst.appendChild(s);
      }
    }
    this.root.appendChild(burst);
    Sfx.success();
    setTimeout(function () { burst.remove(); }, this.reduced ? 1400 : 2500);
  };

  Engine.prototype.worldComplete = function () {
    var ov = el("div", { class: "adv-worlddone", role: "status", "aria-live": "polite" }, [
      el("div", { class: "adv-worlddone__card" }, [
        el("h2", { text: this.world.completeTitle || "أحسنت! أكملت رحلة الفصل الدراسي." }),
        el("p", { text: this.world.completeText || "أضأت العالم بأكمله. يمكنك العودة ومراجعة أي مهمة متى شئت." }),
        (function () {
          var b = el("button", { type: "button", class: "adv-hud__btn adv-hud__btn--primary", text: "متابعة" });
          b.addEventListener("click", function () { ov.remove(); });
          return b;
        })()
      ])
    ]);
    this.root.appendChild(ov);
    if (this.wcfg().onComplete) { try { this.wcfg().onComplete(this); } catch (e) {} }
    Sfx.world();
  };

  /* ---------------------------------------------------------- return detection */
  Engine.prototype.wireReturnDetection = function () {
    var self = this;
    var seenKey = "adv:seen:" + this.world.code;
    var prev = [];
    try { prev = JSON.parse(global.sessionStorage.getItem(seenKey) || "[]"); } catch (e) { prev = []; }
    var nowDone = Object.keys(this.state.done);
    var fresh = nowDone.filter(function (id) { return prev.indexOf(id) < 0; });
    try { global.sessionStorage.setItem(seenKey, JSON.stringify(nowDone)); } catch (e) {}

    if (fresh.length) {
      var justAll = (this.doneCount === this.total);
      /* index of the just-completed mission we want the camera to start from */
      var fromIdx = -1;
      for (var i = 0; i < this.rows.length; i++) if (fresh.indexOf(this.rows[i].lesson.id) >= 0) fromIdx = Math.max(fromIdx, i);
      setTimeout(function () { self.playCompletion(fromIdx, justAll); }, 420);
    } else {
      var cur = this.currentLesson();
      setTimeout(function () {
        self.hudhud(self.doneCount === 0
          ? (self.world.msgStart || "جاهز؟ مهمتك الأولى تنتظرك — انطلق!")
          : (cur ? ("أهلًا بعودتك. مهمتك الحالية: " + cur.no + " — " + cur.ar) : "أكملت كل المهمات — العالم مضيء بالكامل!"), false);
      }, 650);
    }
    global.addEventListener("pageshow", function (e) { if (e.persisted) self.refresh(); });
    doc.addEventListener("visibilitychange", function () { if (!doc.hidden) self.refresh(); });
  };

  /* cinematic: light the finished place, move traveler + camera to next dest */
  Engine.prototype.playCompletion = function (fromIdx, justAll) {
    var self = this;
    if (fromIdx >= 0 && this.nodeEls[fromIdx]) {
      var node = this.nodeEls[fromIdx];
      node.setAttribute("data-state", "done");
      node.classList.add("is-justdone");
      if (this.wcfg().onDone) { try { this.wcfg().onDone(node, this.rows[fromIdx].lesson.id, this); } catch (e) {} }
    }
    /* start camera on the finished place */
    if (fromIdx >= 0) { this.focusIdx = fromIdx; this.centerOn(fromIdx, false); this.spotlight(fromIdx); }
    this.celebrate(this.world.msgDone || "أحسنت! أضأتَ موقعًا جديدًا.");

    var nextIdx = this.rows.currentIndex;
    if (justAll || nextIdx < 0) {
      /* travel to the final place, then the world-complete moment */
      this.moveTraveler(fromIdx, Math.max(0, this.total - 1), function () {
        setTimeout(function () { self.worldComplete(); }, 500);
      });
      return;
    }
    /* glide to the next destination */
    setTimeout(function () {
      self.moveTraveler(fromIdx, nextIdx, function () {
        self.focusIdx = nextIdx; self.spotlight(nextIdx); self.updateFocusHud();
        var nl = self.rows[nextIdx].lesson;
        self.hudhud("فُتح الطريق إلى الوجهة التالية: " + nl.no + " — " + nl.ar + ". هيّا!", false);
      });
    }, 900);
  };

  /* move the traveler element from node a → node b while the camera follows */
  Engine.prototype.moveTraveler = function (fromIdx, toIdx, done) {
    var self = this;
    var a = fromIdx >= 0 ? this.nodePos(fromIdx) : this.nodePos(Math.max(0, toIdx - 1));
    var b = this.nodePos(toIdx);
    if (this.travelerEl) { this.travelerEl.style.opacity = "1"; }
    this.centerOn(toIdx, true);
    if (!this.travelerEl || this.reduced) {
      if (this.travelerEl) { this.travelerEl.style.left = b.x + "px"; this.travelerEl.style.top = b.y + "px"; }
      if (done) setTimeout(done, this.reduced ? 100 : 640);
      return;
    }
    Sfx.move();
    tween({ x: a.x, y: a.y }, { x: b.x, y: b.y }, 900,
      function (v) { self.travelerEl.style.left = v.x + "px"; self.travelerEl.style.top = v.y + "px"; if (v.x < b.x) self.travelerEl.setAttribute("data-dir", "fwd"); },
      function () { if (done) done(); }, this.reduced);
  };

  Engine.prototype.refresh = function () {
    var fresh = readState(this.world);
    var newDone = Object.keys(fresh.done).length;
    if (newDone === this.doneCount) return;
    var parent = this.root;
    this.state = fresh; this.rows = derive(this.world, fresh.done); this.doneCount = newDone;
    this.focusIdx = this.rows.currentIndex >= 0 ? this.rows.currentIndex : Math.max(0, this.total - 1);
    parent.textContent = ""; parent.removeAttribute("data-world"); parent.removeAttribute("style");
    this.mount(parent);
  };

  /* ---------------------------------------------------------- skippable intro */
  Engine.prototype.maybeIntro = function () {
    var self = this;
    if (!this.world.intro) return;
    var key = "adv:intro:" + this.world.code, seen = false;
    try { seen = global.localStorage.getItem(key) === "1"; } catch (e) {}
    if (seen) return;
    var ov = el("div", { class: "adv-intro", role: "dialog", "aria-modal": "true", "aria-label": "مقدمة العالم" }, [
      el("div", { class: "adv-intro__inner" }, [
        el("span", { class: "adv-intro__eyebrow", text: this.world.subtitle || this.world.gradeLabel || "" }),
        el("h1", { text: this.world.title }),
        el("p", { text: this.world.intro }),
        (function () {
          var b = el("button", { type: "button", class: "adv-hud__btn--primary adv-intro__skip", text: "لنبدأ المغامرة" });
          b.addEventListener("click", function () { try { global.localStorage.setItem(key, "1"); } catch (e) {} ov.remove(); Sfx.unlock(); });
          return b;
        })()
      ])
    ]);
    this.root.appendChild(ov);
    setTimeout(function () { var b = $(".adv-intro__skip", ov); if (b) b.focus(); }, 60);
  };

  /* ---------------------------------------------------------- public API */
  var ADV = {
    register: function (world) { registry[world.code] = world; },
    get: function (code) { return registry[code]; },
    boot: function (code, rootSel) {
      var world = registry[code];
      if (!world) { console.error("[adventure] unknown world:", code); return null; }
      var rootEl = (rootSel && $(rootSel)) || $("#adv-root") || (function () { var d = el("div", { id: "adv-root" }); doc.body.appendChild(d); return d; })();
      var eng = new Engine(world);
      eng.mount(rootEl);
      ADV.current = eng;
      return eng;
    },
    _el: el, _svg: svg, _icon: icon, _toAr: toAr, Sfx: Sfx
  };
  global.ADV = ADV;

  function autoboot() {
    var r = $("#adv-root");
    if (r && r.getAttribute("data-world")) ADV.boot(r.getAttribute("data-world"), "#adv-root");
  }
  if (doc.readyState === "complete") autoboot();
  else doc.addEventListener("DOMContentLoaded", autoboot);

})(window);
