/*!
 * adventure/worlds/g1s1.js — «قرية التقنية المفقودة»
 * Grade 1 · Semester 1. A warm Omani village at golden hour: houses, workshop
 * and wells set among palms and a running falaj, joined by a lantern-lit stone
 * path. Bright and friendly (age-appropriate). Lesson data from
 * WAHAT_CURRICULUM; completion read progress.lessons[id].completed.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg;
  function p(d, a) { a = a || {}; a.d = d; return S("path", a); }
  var UNITS = { 1: "حاسوبي", 2: "هيا نرسم", 3: "لنتصفح" };
  var L = [
    ["1.1","الحاسوب في حياتنا",1],["1.2","أجزاء جهاز الحاسوب",1],["1.3","سطح المكتب",1],
    ["1.4","انقر واكتب",1],["1.5","دعنا نتذكر",1],["1.6","لنطبق معًا",1],
    ["2.1","مقدمة إلى الرسم الرقمي",2],["2.2","رسم الأشكال",2],["2.3","لنتدرب على الأشكال",2],
    ["2.4","دمج الأشكال",2],["2.5","لنتدرب على دمج الأشكال",2],["2.6","الرسم الحر",2],
    ["3.1","الإنترنت",3],["3.2","استمتع",3],["3.3","تواصل",3],["3.4","ابحث",3]
  ].map(function (r) { return { id: r[0], no: r[0], ar: r[1], unit: r[2] }; });

  /* ---- village buildings (the mission is the building itself) ---- */
  function house() {
    return S("svg", { viewBox: "0 0 160 150" }, [
      S("ellipse", { cx: 80, cy: 142, rx: 60, ry: 8, fill: "rgba(0,0,0,.28)" }),
      p("M26 66 L80 30 L134 66 Z", { fill: "#c98a54", stroke: "#e0a768", "stroke-width": 2 }),
      p("M80 30 L80 34 L30 66 L26 66 Z", { fill: "#b57642" }),
      S("rect", { x: 34, y: 66, width: 92, height: 74, rx: 3, fill: "#e6c093", stroke: "#b98a58", "stroke-width": 2 }),
      S("rect", { x: 34, y: 66, width: 92, height: 12, fill: "#cfa878" }),
      p("M60 140 V104 q20 -16 40 0 V140 Z", { class: "vg-door", stroke: "#5a4028", "stroke-width": 2 }),
      S("rect", { x: 44, y: 86, width: 20, height: 20, rx: 2, class: "vg-win", stroke: "#5a4028", "stroke-width": 2 }),
      S("rect", { x: 96, y: 86, width: 20, height: 20, rx: 2, class: "vg-win", stroke: "#5a4028", "stroke-width": 2 }),
      S("circle", { cx: 80, cy: 20, r: 4, fill: "#c0392b" })   /* small flag/finial */
    ]);
  }
  function workshop() {
    return S("svg", { viewBox: "0 0 160 150" }, [
      S("ellipse", { cx: 80, cy: 142, rx: 60, ry: 8, fill: "rgba(0,0,0,.28)" }),
      S("rect", { x: 28, y: 60, width: 104, height: 80, rx: 3, fill: "#d0a06a", stroke: "#b98a58", "stroke-width": 2 }),
      p("M22 60 h116 l-12 -16 h-92 Z", { fill: "#a86a3c" }),
      /* striped awning */
      p("M30 84 h60 v10 h-60 z", { fill: "#c94f3d" }),
      p("M30 84 h12 v10 h-12 z M54 84 h12 v10 h-12 z M78 84 h12 v10 h-12 z", { fill: "#f0e6d0" }),
      S("g", { class: "vg-gear" }, [S("circle", { cx: 106, cy: 96, r: 13, fill: "none", stroke: "#5a4028", "stroke-width": 3 }),
        S("circle", { cx: 106, cy: 96, r: 4, class: "vg-core" })]),
      S("rect", { x: 42, y: 104, width: 34, height: 36, class: "vg-door", stroke: "#5a4028", "stroke-width": 2 })
    ]);
  }
  function well() {
    return S("svg", { viewBox: "0 0 160 150" }, [
      S("ellipse", { cx: 80, cy: 142, rx: 54, ry: 8, fill: "rgba(0,0,0,.26)" }),
      S("g", { stroke: "#3a5a2a", "stroke-width": 6, fill: "none", "stroke-linecap": "round" }, [
        p("M46 140 q5 -56 1 -90"), p("M47 48 q-26 -10 -40 -28 M47 48 q26 -10 40 -28 M47 48 q-13 -26 -17 -46 M47 48 q13 -26 17 -46")
      ]),
      p("M84 140 V100 a24 13 0 0 1 48 0 V140 Z", { fill: "#a86a3c", stroke: "#c98a54", "stroke-width": 2 }),
      S("ellipse", { cx: 108, cy: 100, rx: 24, ry: 8, class: "vg-water" }),
      p("M84 100 l24 -22 l24 22", { fill: "none", stroke: "#7a5238", "stroke-width": 3 })
    ]);
  }
  function marker(art, ctx) { var i = ctx.index; art.appendChild(i % 3 === 1 ? workshop() : i % 3 === 2 ? well() : house()); }

  ADV.register({
    code: "g1s1", storageKey: "waha:g1s1:wahat.g1.v1",
    title: "قرية التقنية المفقودة", subtitle: "الصف الأول · الفصل الأول",
    lessons: L, unitOf: function (l) { return UNITS[l.unit]; },
    readDone: function (pr, l) { var e = pr && pr.progress && pr.progress.lessons && pr.progress.lessons[l.id]; return !!(e && e.completed); },
    intro: "قريةٌ عُمانية دافئة تنتظر من يُعيد إليها الحياة. مع كل مهمة تُضيء نوافذ بيت ويجري ماء الفلج، حتى تعود القرية كلها نابضة بالنور.",
    msgStart: "جاهز؟ أول بيت في القرية ينتظر نورك.",
    msgLocked: "أكمل المهمة السابقة أولًا لتُضيء هذا الركن.",
    msgDone: "أحسنت! أضأتَ ركنًا جديدًا من القرية.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "أضأتَ القرية بأكملها، وعادت الحياة إلى كل بيوتها.",
    scene: {
      laneH: 236, maxW: 1000, mw: 172, marker: marker,
      xAt: function (i) { return 50 + Math.sin(i * 0.9) * 22; },
      path: function (pts) { return window.ADV.art.smoothPath(pts); },
      background: function (eng, bg, kit) {
        var A = window.ADV.art, W = kit.W, H = kit.H, pts = kit.pts;
        var svg = A.S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
        svg.appendChild(A.S("defs", {}, [
          A.grad("vgGround", [["0%", "#caa06a"], ["45%", "#a87c4c"], ["100%", "#6e5334"]]),
          A.grad("vgFar", [["0%", "#8a5f45"], ["100%", "#5a3f2e"]])
        ]));
        svg.appendChild(A.defs());   /* lantern glow gradient */
        /* far mountains */
        svg.appendChild(A.mountains(W, { y: 8, h: 150, fill: "url(#vgFar)", opacity: 0.55, seed: 5, step: 130 }));
        svg.appendChild(A.mountains(W, { y: 70, h: 140, fill: "#6a4a35", opacity: 0.8, seed: 12, step: 95 }));
        /* warm ground */
        svg.appendChild(A.P("M0 200 Q" + (W / 2) + " 150 " + W + " 200 L" + W + " " + H + " L0 " + H + " Z", { fill: "url(#vgGround)" }));
        /* falaj running along the path (behind the stone path drawn by engine) */
        var d = A.smoothPath(pts);
        svg.appendChild(A.stream(d, { w: 20, base: "rgba(52,120,150,.35)", glow: "rgba(120,210,240,.85)" }));
        svg.appendChild(A.waypoints(pts, { on: "#ffcf7a", off: "rgba(255,220,170,.35)" }));
        /* scattered village life around the path */
        pts.forEach(function (pt, i) {
          var side = i % 2 ? 1 : -1;
          svg.appendChild(A.palm(pt.x + side * 118, pt.y + 44, 1.25, { frond: "#3f6b3f", trunk: "#5a4023" }));
          if (i % 2) svg.appendChild(A.palm(pt.x - side * 96, pt.y - 30, 0.9, { frond: "#457045" }));
          svg.appendChild(A.lantern(pt.x + side * 78, pt.y + 6, 1.5, { post: 26, lit: pt.state !== "locked" }));
          if (i % 3 === 0) svg.appendChild(A.building(pt.x - side * 150, pt.y + 20, 46, 40, { fill: "#b98a58", roof: "#8a5f3a", litWin: "#ffcf7a", win: "#3a2a1a" }));
        });
        bg.appendChild(svg);
      }
    },
    backdrop: function (c, e, kit) { c.appendChild(kit.el("div", { class: "vg-sky" })); c.appendChild(kit.el("div", { class: "vg-sun" })); c.appendChild(kit.el("div", { class: "vg-haze" })); },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
