/*!
 * adventure/engine.js — Shared Adventure experience engine (presentation layer)
 * منصة واحة التقنية — طبقة المغامرة المشتركة. لا تُعدّل أي درس ولا أي محتوى تعليمي.
 *
 * Responsibilities (shared across all 8 worlds):
 *   • Progress adapter — READ-ONLY. Lesson completion comes from the original
 *     platform's own namespaced localStorage blob. Adventure never writes it.
 *   • World state derivation (done / current / locked) from real completion.
 *   • Topbar navigation, current-mission HUD, hudhud guide, celebrations,
 *     world-completion moment, skippable intro, accessibility, optional SFX.
 *   • Opening a mission = opening the ORIGINAL platform (no deep-link hack).
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
      tap: function () { tone(300, 0.06, "sine", 0.05, 0); }
    };
  })();

  /* ---------------------------------------------------------- progress adapter */
  /* READ-ONLY. Completion comes from the ORIGINAL platform's own namespaced
     localStorage blob(s). Never writes. The 8 platforms are heterogeneous, so
     the reader scans every key under "waha:<code>:" and checks each lesson id
     against the known completion shapes actually used by the platforms:
       progress[id].done   · progress[id].mastered · progress[id].completed
       progress.lessons[id].completed   · lessons[id].mastered
     A world may override with world.readDone(parsed, lesson) for anything else. */
  function entryDone(e) {
    return !!(e && typeof e === "object" && (e.done === true || e.mastered === true || e.completed === true));
  }
  function defaultReadDone(parsed, lesson) {
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
    /* fallback: an explicit storageKey hint (unshimmed) if prefix scan found nothing */
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
    return world.lessons.map(function (l, idx) {
      var st;
      if (done[l.id]) st = "done";
      else if (idx === firstIncomplete) st = "current";
      else if (idx < firstIncomplete) st = "done"; /* safety */
      else st = "locked";
      /* stations up to current are openable; done ones always openable */
      var open = done[l.id] || (firstIncomplete >= 0 && idx <= firstIncomplete);
      return { lesson: l, state: st, open: open };
    }).concat(allDone ? [{ allDone: true }] : []);
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
  }

  Engine.prototype.currentLesson = function () {
    for (var i = 0; i < this.rows.length; i++) if (this.rows[i].state === "current") return this.rows[i].lesson;
    return null;
  };

  /* ---- navigation targets (relative to gradeN/semesterM/adventure.html) ---- */
  Engine.prototype.gradeHref = function () { return "../index.html"; };
  Engine.prototype.basicHref = function () { return "./index.html"; };
  Engine.prototype.skipPlatformGate = function () {
    try { global.sessionStorage.setItem("waha:gate:" + this.world.code, "1"); } catch (e) {}
  };
  Engine.prototype.openMission = function () {
    /* Open the ORIGINAL platform. Completion is decided there, then re-read on return. */
    this.skipPlatformGate();
    Sfx.tap();
    global.location.href = this.basicHref();
  };
  Engine.prototype.goBasic = function () { this.skipPlatformGate(); global.location.href = this.basicHref(); };
  Engine.prototype.goGrade = function () { global.location.href = this.gradeHref(); };

  /* ---------------------------------------------------------- build UI */
  Engine.prototype.mount = function (rootEl) {
    this.root = rootEl;
    rootEl.classList.add("adv-root");
    rootEl.classList.add("adv-world");
    if (this.reduced) rootEl.setAttribute("data-reduced", "1");
    rootEl.setAttribute("data-world", this.world.code);
    if (this.world.theme) { var t = this.world.theme; for (var k in t) if (Object.prototype.hasOwnProperty.call(t, k)) rootEl.style.setProperty(k, t[k]); }

    doc.body.classList.add("adv-body");

    /* skip link */
    rootEl.appendChild(el("a", { class: "adv-skip", href: "#adv-missions", text: "تخطَّ إلى المهمات" }));

    var scene = el("div", { class: "adv-scene" });
    /* backdrop (per-world cinematic art) */
    var backdrop = el("div", { class: "adv-backdrop", "aria-hidden": "true" });
    if (this.world.backdrop) { try { this.world.backdrop(backdrop, this, { el: el, svg: svg }); } catch (e) {} }
    scene.appendChild(backdrop);

    var wrap = el("div", { class: "adv-stagewrap" });
    var header = el("header", { class: "adv-header" });
    header.appendChild(this.buildTopbar());
    header.appendChild(this.buildMissionBar());
    wrap.appendChild(header);
    wrap.appendChild(this.buildHead());
    wrap.appendChild(this.buildTrail());
    scene.appendChild(wrap);
    rootEl.appendChild(scene);

    this.hudhudEl = this.buildHudhud();
    rootEl.appendChild(this.hudhudEl);

    this.updateProgressMeter();
    this.wireReturnDetection();
    this.maybeIntro();
  };

  Engine.prototype.buildTopbar = function () {
    var self = this;
    var bar = el("div", { class: "adv-topbar", role: "navigation", "aria-label": "تنقّل المغامرة" });

    var back = el("a", { class: "adv-nav-btn", href: this.gradeHref(),
      "aria-label": "العودة إلى صفحة الصف واختيار الوضع" }, [
      icon(["M10.6 4.6 3.2 12l7.4 7.4 1.6-1.6L7.2 13.1H20.8v-2.2H7.2l5-4.7z"]), el("span", { text: "الصف والوضع" })
    ]);
    bar.appendChild(back);

    var basic = el("button", { type: "button", class: "adv-nav-btn",
      "aria-label": "التبديل إلى الوضع الأساسي للدروس" }, [
      icon(["M3.2 4.4h6.1c1.1 0 2 .4 2.7 1.1.7-.7 1.6-1.1 2.7-1.1h6.1v13.9h-6.1c-1.1 0-2 .4-2.7 1.1-.7-.7-1.6-1.1-2.7-1.1H3.2z"]),
      el("span", { text: "الوضع الأساسي" })
    ]);
    basic.addEventListener("click", function () { self.goBasic(); });
    bar.appendChild(basic);

    bar.appendChild(el("div", { class: "adv-worldname" }, [
      el("b", { text: this.world.title }),
      el("span", { text: this.world.subtitle || (this.world.gradeLabel || "") })
    ]));

    bar.appendChild(el("div", { class: "adv-topbar__spacer" }));

    /* progress meter */
    var prog = el("div", { class: "adv-progress", "aria-hidden": "false", role: "status" }, [
      el("span", { class: "adv-progress__lbl" }),
      el("span", { class: "adv-progress__track" }, [el("span", { class: "adv-progress__fill" })])
    ]);
    this.progEl = prog;
    bar.appendChild(prog);

    /* mute */
    var mute = el("button", { type: "button", class: "adv-nav-btn", "aria-pressed": "false",
      "aria-label": "كتم أو تشغيل المؤثرات الصوتية", title: "المؤثرات الصوتية" },
      [this._muteIcon(false)]);
    var self2 = this;
    mute.addEventListener("click", function () {
      var m = !Sfx.isMuted(); Sfx.setMuted(m);
      mute.setAttribute("aria-pressed", m ? "true" : "false");
      mute.replaceChild(self2._muteIcon(m), mute.firstChild);
      try { global.sessionStorage.setItem("adv:muted", m ? "1" : "0"); } catch (e) {}
    });
    try { if (global.sessionStorage.getItem("adv:muted") === "1") { Sfx.setMuted(true); mute.setAttribute("aria-pressed", "true"); mute.replaceChild(this._muteIcon(true), mute.firstChild); } } catch (e) {}
    bar.appendChild(mute);

    return bar;
  };
  Engine.prototype._muteIcon = function (m) {
    return m ? icon(["M4 9v6h4l5 5V4L8 9H4z", "M16 8l5 5M21 8l-5 5"])
             : icon(["M4 9v6h4l5 5V4L8 9H4z", "M16.5 8.5a5 5 0 0 1 0 7", "M19 6a8 8 0 0 1 0 12"]);
  };

  Engine.prototype.buildHead = function () {
    return el("header", { class: "adv-trail-head" }, [
      el("h1", { text: this.world.title }),
      el("p", { text: this.world.tagline || "" })
    ]);
  };

  Engine.prototype.buildTrail = function () {
    var self = this;
    var trail = el("div", { class: "adv-trail", id: "adv-missions", role: "list",
      "aria-label": "مهمات " + this.world.title });
    var lastRegion = null;
    this.rows.forEach(function (row, idx) {
      if (row.allDone) return;
      /* region/section dividers (world wings / floors / districts / decks) */
      if (self.world.regionOf) {
        var reg = self.world.regionOf(row.lesson);
        if (reg && reg.key !== lastRegion) {
          lastRegion = reg.key;
          trail.appendChild(el("div", { class: "adv-region", role: "presentation" }, [
            reg.kind ? el("span", { class: "adv-region__k", text: reg.kind }) : null,
            el("span", { class: "adv-region__t", text: reg.label })
          ]));
        }
      }
      var station = self.buildStation(row, idx);
      trail.appendChild(station);
      if (idx < self.world.lessons.length - 1 && !self.world.regionOf) trail.appendChild(el("span", { class: "adv-link", "aria-hidden": "true" }));
    });
    this.trailEl = trail;
    return trail;
  };

  Engine.prototype.buildStation = function (row, idx) {
    var self = this, l = row.lesson;
    var stateLabel = row.state === "done" ? "مكتملة" : row.state === "current" ? "المهمة الحالية" : "مقفلة — أكمل ما قبلها";
    var btn = el("button", {
      type: "button", class: "adv-station", role: "listitem",
      "data-state": row.state, "data-lesson": l.id,
      "aria-label": "المهمة " + l.no + " — " + l.ar + " — " + stateLabel
    });
    var place = el("div", { class: "adv-place" });
    /* per-world "place" art (station/room/building/module …) */
    var art = el("div", { class: "adv-place__art", "aria-hidden": "true" });
    place.appendChild(art);

    place.appendChild(el("span", { class: "adv-station__no", text: l.no }));
    if (row.state === "locked") place.appendChild(el("span", { class: "adv-lockmark", "aria-hidden": "true" },
      [icon(["M6 10V8a6 6 0 0 1 12 0v2h1.4v11H4.6V10H6zm2 0h8V8a4 4 0 0 0-8 0v2z"])]));

    var sign = el("div", { class: "adv-sign" }, [
      self.world.unitOf ? el("span", { class: "adv-sign__unit", text: self.world.unitOf(l) }) : null,
      el("h2", { class: "adv-sign__name", text: l.ar }),
      el("div", { class: "adv-sign__meta" }, [self._chip(row.state)])
    ]);
    place.appendChild(sign);
    btn.appendChild(place);

    /* per-world scene hook — runs after assembly, with real element refs */
    if (self.world.place) {
      try { self.world.place(art, { row: row, index: idx, lesson: l, placeEl: place, stationEl: btn, signEl: sign },
        { el: el, svg: svg, icon: icon }); } catch (e) {}
    }

    btn.addEventListener("click", function () {
      if (row.state === "locked" && !row.open) { self.hudhud(self.world.msgLocked || "أكمل المهمة السابقة أولًا."); Sfx.tap(); return; }
      self.enterLesson(l);
    });
    return btn;
  };

  Engine.prototype._chip = function (state) {
    if (state === "done") return el("span", { class: "adv-chip adv-chip--done" },
      [icon(["M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"]), el("span", { text: "أُنجزت" })]);
    if (state === "current") return el("span", { class: "adv-chip adv-chip--current" },
      [icon(["M12 2 4 7v10l8 5 8-5V7z"]), el("span", { text: "ابدأ الآن" })]);
    return el("span", { class: "adv-chip adv-chip--locked" },
      [icon(["M6 10V8a6 6 0 0 1 12 0v2h1.4v11H4.6V10H6z"]), el("span", { text: "قريبًا" })]);
  };

  Engine.prototype.enterLesson = function (l) {
    /* remember presentation target (optional, non-authoritative) */
    try { global.sessionStorage.setItem("adv:target:" + this.world.code, l.id); } catch (e) {}
    this.openMission();
  };

  /* ---------------------------------------------------------- mission bar (HUD) */
  /* Small, persistent "current mission" strip docked in the sticky header — it
     lives above the trail at rest, so it never overlaps a mission label. */
  Engine.prototype.buildMissionBar = function () {
    var self = this;
    var cur = this.currentLesson();
    var bar = el("div", { class: "adv-missionbar", role: "region", "aria-label": "المهمة الحالية" });
    if (!cur) {
      bar.appendChild(el("span", { class: "adv-missionbar__k", text: "اكتملت كل مهمات هذا العالم" }));
      bar.classList.add("is-complete");
      this.hudEl = bar; return bar;
    }
    bar.appendChild(el("span", { class: "adv-missionbar__badge", text: cur.no }));
    bar.appendChild(el("span", { class: "adv-missionbar__txt" }, [
      el("span", { class: "adv-missionbar__k", text: "المهمة الحالية" }),
      el("span", { class: "adv-missionbar__v", text: cur.ar })
    ]));
    var go = el("button", { type: "button", class: "adv-missionbar__go", text: "ابدأ المهمة" });
    go.addEventListener("click", function () { self.enterLesson(cur); });
    bar.appendChild(go);
    this.hudEl = bar;
    return bar;
  };

  Engine.prototype.updateProgressMeter = function () {
    if (!this.progEl) return;
    var pct = this.total ? Math.round((this.doneCount / this.total) * 100) : 0;
    $(".adv-progress__lbl", this.progEl).textContent = this.doneCount + " / " + this.total;
    $(".adv-progress__fill", this.progEl).style.width = pct + "%";
    this.progEl.setAttribute("aria-label", "أنجزت " + this.doneCount + " من " + this.total + " مهمة");
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
    if (!sticky) this._hudhudT = setTimeout(function () { self.hudhudEl.classList.remove("is-on"); }, 4200);
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
    var self = this;
    var ov = el("div", { class: "adv-worlddone", role: "status", "aria-live": "polite" }, [
      el("div", { class: "adv-worlddone__card" }, [
        el("h2", { text: this.world.completeTitle || "أحسنت! أكملت رحلة الفصل الدراسي." }),
        el("p", { text: this.world.completeText || "أضأت العالم بأكمله. يمكنك العودة ومراجعة أي مهمة متى شئت." }),
        (function () {
          var b = el("button", { type: "button", class: "adv-nav-btn adv-nav-btn--primary", text: "متابعة" });
          b.addEventListener("click", function () { ov.remove(); });
          return b;
        })()
      ])
    ]);
    this.root.appendChild(ov);
    if (this.world.onWorldComplete) { try { this.world.onWorldComplete(this); } catch (e) {} }
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

    /* persist current snapshot */
    try { global.sessionStorage.setItem(seenKey, JSON.stringify(nowDone)); } catch (e) {}

    if (fresh.length && prev.length >= 0) {
      /* a mission (or more) got completed since we last saw the world */
      var justAll = (this.doneCount === this.total);
      setTimeout(function () {
        self.reactToNew(fresh);
        if (justAll) { setTimeout(function () { self.worldComplete(); }, 900); }
        else {
          var nxt = self.currentLesson();
          self.hudhud(nxt ? ("رائع! فُتح الطريق إلى المهمة التالية: " + nxt.no) : "رائع! تقدّمتَ في العالم.");
        }
      }, 500);
    } else {
      /* first arrival greeting */
      var cur = this.currentLesson();
      setTimeout(function () {
        self.hudhud(self.doneCount === 0
          ? (self.world.msgStart || "جاهز؟ مهمتك الأولى تنتظرك.")
          : (cur ? ("أهلًا بعودتك. مهمتك الحالية: " + cur.no) : "أكملت كل المهمات — العالم مضيء بالكامل!"));
      }, 700);
    }

    /* if the platform completes something while we're still here (rare), re-check on focus */
    global.addEventListener("pageshow", function (e) { if (e.persisted) self.refresh(); });
    doc.addEventListener("visibilitychange", function () { if (!doc.hidden) self.refresh(); });
  };

  Engine.prototype.reactToNew = function (freshIds) {
    var self = this;
    freshIds.forEach(function (id) {
      var st = self.trailEl && self.trailEl.querySelector('[data-lesson="' + id + '"]');
      if (st && self.world.onMissionDone) { try { self.world.onMissionDone(st, id, self); } catch (e) {} }
    });
    /* light celebration for the newest */
    this.celebrate(this.world.msgDone || "أحسنت! اكتملت المهمة");
  };

  Engine.prototype.refresh = function () {
    var fresh = readState(this.world);
    var newDone = Object.keys(fresh.done).length;
    if (newDone === this.doneCount) return; /* nothing changed */
    /* full re-render is simplest and safe */
    var scrollY = global.scrollY;
    this.state = fresh; this.rows = derive(this.world, fresh.done); this.doneCount = newDone;
    var parent = this.root;
    parent.textContent = "";
    parent.removeAttribute("data-world");
    this.mount(parent);
    global.scrollTo(0, scrollY);
  };

  /* ---------------------------------------------------------- skippable intro */
  Engine.prototype.maybeIntro = function () {
    var self = this;
    if (!this.world.intro) return;
    var key = "adv:intro:" + this.world.code;
    var seen = false;
    try { seen = global.localStorage.getItem(key) === "1"; } catch (e) {}
    if (seen) return;
    var ov = el("div", { class: "adv-intro", role: "dialog", "aria-modal": "true", "aria-label": "مقدمة العالم" }, [
      el("div", { class: "adv-intro__inner" }, [
        el("h1", { text: this.world.title }),
        el("p", { text: this.world.intro }),
        (function () {
          var b = el("button", { type: "button", class: "adv-nav-btn adv-nav-btn--primary adv-intro__skip", text: "لنبدأ المغامرة" });
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
    _el: el, _svg: svg, _icon: icon, Sfx: Sfx
  };
  global.ADV = ADV;

  /* Auto-boot: <div id="adv-root" data-world="gNsM"> — no inline script needed.
     Runs on DOMContentLoaded, after all deferred world modules have registered. */
  function autoboot() {
    var r = $("#adv-root");
    if (r && r.getAttribute("data-world")) ADV.boot(r.getAttribute("data-world"), "#adv-root");
  }
  /* readyState is "interactive" while deferred scripts run — DOMContentLoaded has
     not fired yet, so wait for it unless the document is already fully loaded. */
  if (doc.readyState === "complete") autoboot();
  else doc.addEventListener("DOMContentLoaded", autoboot);

})(window);
