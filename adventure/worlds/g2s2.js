/*!
 * adventure/worlds/g2s2.js — «وادي الشيفرات والكنز الرقمي»
 * Grade 2 · Semester 2. Illustrated 2.5D wadi: missions are stone gateways,
 * watch-towers and wells set along a winding falaj that ends at the treasure.
 * Lesson data mirrors WADI.curriculum verbatim; completion read from the
 * original blob. Presentation only.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg, E = ADV._el;
  var UNIT = "هَيَّا نُبَرْمِجُ";
  var L = [
    ["l1","1.1","كَيْفِيَّةُ البَرْمَجَةِ"],["l2","1.2","التَّحَكُّمُ في الوَقْتِ"],
    ["l3","1.3","حَلُّ الْمُشْكِلاتِ"],["l4","1.4","طُرُقُ تَشْغيلِ البَرْنامَجِ"],
    ["l5","1.5","لِنَتَدَرَّبْ على طُرُقِ تَشْغيلِ البَرْنامَجِ"],["l6","1.6","الرُّسومُ الـمُتَحَرِّكَةُ"],
    ["l7","1.7","لِنَتَدَرَّبْ على الرُّسومِ الـمُتَحَرِّكَةِ"],["l8","1.8","التَّعامُلُ مَعَ الصَّفَحاتِ"],
    ["l9","1.9","الأنْماطُ"],["l10","1.10","التَّكْرارُ"],["l11","1.11","لِنَتَدَرَّبْ على التَّكْرارِ"],
    ["l12","1.12","التَّحَكُّمُ في ظُهورِ كائِنٍ"],["l13","1.13","لِنَتَدَرَّبْ على التَّحَكُّمِ في ظُهورِ الكائِنِ"],
    ["l14","1.14","الـمَشْروعُ"]
  ].map(function (r) { return { id: r[0], no: r[1], ar: r[2], unit: "u1" }; });

  function p(d, a) { a = a || {}; a.d = d; return S("path", a); }

  /* three reusable wadi "places" + a treasure — so markers vary, not repeat */
  function placeGate() {           /* carved stone gateway with a hanging lantern */
    return S("svg", { viewBox: "0 0 130 132" }, [
      S("g", { class: "wd-shadow" }, [S("ellipse", { cx: "65", cy: "122", rx: "46", ry: "8", fill: "rgba(0,0,0,.35)" })]),
      p("M22 120 V54 q0-30 43-30 q43 0 43 30 V120 Z", { fill: "#3a2c1e", stroke: "#5a4632", "stroke-width": "2" }),
      p("M38 120 V58 q0-18 27-18 q27 0 27 18 V120 Z", { fill: "#141c22" }),
      p("M22 54 q43-34 86 0", { fill: "none", stroke: "#7a5f42", "stroke-width": "3" }),
      S("rect", { x: "18", y: "116", width: "94", height: "8", rx: "2", fill: "#4a3a28" }),
      /* lantern */
      S("g", { class: "wd-lantern" }, [
        p("M65 22 v-9", { stroke: "#6a533a", "stroke-width": "2" }),
        S("rect", { x: "57", y: "20", width: "16", height: "20", rx: "3", fill: "rgba(10,14,18,.6)", stroke: "#6a533a", "stroke-width": "1.5" }),
        p("M65 24 q5 6 5 10 a5 5 0 0 1-10 0 q0-4 5-10z", { class: "wd-flame" })
      ])
    ]);
  }
  function placeTower() {           /* watch-tower / fort turret with a window that lights */
    return S("svg", { viewBox: "0 0 130 132" }, [
      S("ellipse", { cx: "65", cy: "124", rx: "42", ry: "7", fill: "rgba(0,0,0,.35)" }),
      p("M34 124 V40 h62 V124 Z", { fill: "#43331f", stroke: "#5a4632", "stroke-width": "2" }),
      p("M30 40 h70 v-8 h-10 v-8 h-10 v8 h-10 v-8 h-10 v8 h-10 v-8 h-10 v8 h-10 z", { fill: "#4d3b24" }),
      S("rect", { x: "56", y: "58", width: "18", height: "24", rx: "9", class: "wd-win", stroke: "#2a2016", "stroke-width": "2" }),
      S("rect", { x: "50", y: "100", width: "30", height: "24", fill: "#241a10" })
    ]);
  }
  function placeWell() {            /* palm + falaj well */
    return S("svg", { viewBox: "0 0 130 132" }, [
      S("ellipse", { cx: "65", cy: "124", rx: "40", ry: "7", fill: "rgba(0,0,0,.32)" }),
      S("g", { stroke: "#2c3a22", "stroke-width": "5", fill: "none", "stroke-linecap": "round" }, [
        p("M44 124 q4 -46 1 -74"), p("M45 50 q-20 -8 -32 -22 M45 50 q20 -8 32 -22 M45 50 q-10 -20 -13 -36 M45 50 q10 -20 13 -36")
      ]),
      p("M70 124 V96 a20 12 0 0 1 40 0 V124 Z", { fill: "#33251a", stroke: "#5a4632", "stroke-width": "2" }),
      S("ellipse", { cx: "90", cy: "96", rx: "20", ry: "7", class: "wd-water" })
    ]);
  }
  function placeTreasure() {        /* the digital treasure at the valley's end */
    return S("svg", { viewBox: "0 0 140 138" }, [
      S("ellipse", { cx: "70", cy: "128", rx: "50", ry: "9", fill: "rgba(0,0,0,.4)" }),
      S("g", { class: "wd-treasure-rays" }, [
        p("M70 66 L70 20 M70 66 L36 34 M70 66 L104 34 M70 66 L26 60 M70 66 L114 60", { stroke: "var(--adv-gold)", "stroke-width": "2", opacity: ".0" })
      ]),
      p("M30 128 V86 q0-10 10-10 h60 q10 0 10 10 V128 Z", { fill: "#5a4326", stroke: "#7a5f42", "stroke-width": "2" }),
      p("M28 86 q42-26 84 0 v10 H28 Z", { fill: "#6b4f2c", stroke: "#8a6a44", "stroke-width": "2" }),
      S("rect", { x: "62", y: "92", width: "16", height: "14", rx: "2", fill: "var(--adv-gold)", class: "wd-lock" }),
      S("g", { class: "wd-gems" }, [
        S("circle", { cx: "48", cy: "112", r: "4", fill: "var(--adv-gold)" }),
        S("circle", { cx: "70", cy: "116", r: "5", fill: "#ffe9a8" }),
        S("circle", { cx: "92", cy: "112", r: "4", fill: "var(--adv-gold)" })
      ])
    ]);
  }
  function marker(art, ctx) {
    var i = ctx.index, n = 14, node;
    if (ctx.lesson.id === "l14") { node = placeTreasure(); art.classList.add("wd-treasure"); }
    else if (i % 4 === 1) node = placeTower();
    else if (i % 4 === 3) node = placeWell();
    else node = placeGate();
    art.appendChild(node);
  }

  ADV.register({
    code: "g2s2", storageKey: "waha:g2s2:wadi.g2s2.v1",
    title: "وادي الشيفرات والكنز الرقمي", subtitle: "الصف الثاني · الفصل الثاني",
    gradeLabel: "الصف الثاني · الفصل الثاني",
    lessons: L, unitOf: function () { return UNIT; },
    intro: "أهلًا بك في وادي الشيفرات! سِر على امتداد الفلج المتعرّج؛ كل مهمة تُنجزها تُضيء موقعًا في الوادي ويجري الماء نحو الكنز الرقمي في نهايته.",
    msgStart: "جاهز؟ أول موقع في الوادي ينتظر ضوءك.",
    msgLocked: "أكمل الموقع السابق أولًا ليضيء الطريق.",
    msgDone: "أحسنت! أضأتَ موقعًا جديدًا في الوادي.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "أضأتَ الوادي كله وجرى الفلج حتى انكشف الكنز الرقمي.",
    scene: {
      laneH: 250, maxW: 980, mw: 158, marker: marker,
      xAt: function (i) { return 50 + Math.sin(i * 1.05) * 19; },
      path: function (pts) { return window.ADV.art.smoothPath(pts); },
      background: function (eng, bg, kit) {
        var A = window.ADV.art, W = kit.W, H = kit.H, pts = kit.pts;
        var svg = A.S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
        svg.appendChild(A.S("defs", {}, [
          A.grad("wdGround", [["0%", "#5a4632"], ["45%", "#3e3020"], ["100%", "#241a12"]]),
          A.grad("wdCliff", [["0%", "#6a4a35"], ["100%", "#3a281c"]])
        ]));
        svg.appendChild(A.defs());
        svg.appendChild(A.stars(W, { n: 34, ymax: 160, seed: 8 }));
        /* distant ridge + valley walls */
        svg.appendChild(A.mountains(W, { y: 10, h: 150, fill: "#2e2436", opacity: 0.7, seed: 4, step: 150 }));
        svg.appendChild(A.mountains(W, { y: 70, h: 150, fill: "url(#wdCliff)", opacity: 0.9, seed: 11, step: 100 }));
        /* fort silhouette on a ridge */
        svg.appendChild(A.building(150, 210, 70, 46, { fill: "#3a2a1c", roof: false, litWin: "#ffcf7a", win: "#20140c" }));
        svg.appendChild(A.P("M150 164 h70 v-9 h-10 v-9 h-10 v9 h-10 v-9 h-10 v9 h-10 v-9 h-10 z", { fill: "#3a2a1c" }));
        /* canyon ground */
        svg.appendChild(A.P("M0 220 Q" + (W / 2) + " 175 " + W + " 220 L" + W + " " + H + " L0 " + H + " Z", { fill: "url(#wdGround)" }));
        /* falaj + waypoints along the trail */
        var d = A.smoothPath(pts);
        svg.appendChild(A.stream(d, { w: 16, base: "rgba(52,120,150,.4)", glow: "rgba(120,215,240,.9)" }));
        svg.appendChild(A.waypoints(pts, { on: "#3fd1c7", off: "rgba(180,230,240,.3)" }));
        /* palms, lanterns, and a golden treasure glow at the journey's end */
        pts.forEach(function (pt, i) {
          var side = i % 2 ? 1 : -1;
          svg.appendChild(A.palm(pt.x + side * 116, pt.y + 40, 1.1, { frond: "#365a3a", trunk: "#4a3320" }));
          svg.appendChild(A.lantern(pt.x + side * 80, pt.y - 4, 1.4, { post: 24, lit: pt.state !== "locked" }));
          if (i === pts.length - 1) svg.appendChild(A.S("circle", { cx: pt.x, cy: pt.y - 4, r: 60, fill: "url(#advLampGlow)", opacity: pt.state === "done" ? 0.9 : 0.4 }));
        });
        bg.appendChild(svg);
      }
    },
    backdrop: function (c, eng, kit) { c.appendChild(kit.el("div", { class: "wd-sky" })); c.appendChild(kit.el("div", { class: "wd-sun" })); },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
