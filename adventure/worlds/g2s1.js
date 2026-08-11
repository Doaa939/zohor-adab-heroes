/*!
 * adventure/worlds/g2s1.js — «متحف المخترعين السري» (Grade 2 · Semester 1)
 * GAME TYPE: ROOM EXPLORATION. A grand museum interior — coffered ceiling,
 * colonnade, marble floor and a red-carpet runner. Each mission is a HALL door
 * or a glass exhibit along the gallery. Completing one switches on its spotlight
 * and lights the artifact. Cinematic (Grade 2).
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg, E = ADV._el;
  var UNITS = { 1: "حاسوبي", 2: "هيا نصمم", 3: "هيا نكتب" };
  var L = [
    ["l1-1","1.1","أجزاء جهاز الحاسوب",1],["l1-2","1.2","سطح المكتب",1],
    ["l2-1","2.1","مقدمة إلى الرسم ثلاثي الأبعاد",2],["l2-2","2.2","التعامل مع شكل ثلاثي الأبعاد",2],
    ["l2-3","2.3","لنتدرب على التعامل مع شكل ثلاثي الأبعاد",2],["l2-4","2.4","إنشاء نموذج ثلاثي الأبعاد",2],
    ["l2-5","2.5","لنتدرب على النماذج ثلاثية الأبعاد",2],["l2-6","2.6","استكشاف المكتبة ثلاثية الأبعاد",2],
    ["l3-1","3.1","مقدمة إلى معالجة الكلمات",3],["l3-2","3.2","كتابة نص",3],
    ["l3-3","3.3","لنتدرب على الكتابة",3],["l3-4","3.4","التحرك داخل النص",3],
    ["l3-5","3.5","لنتدرب على تحريك المؤشر",3],["l3-6","3.6","تنسيق النص",3],
    ["l3-7","3.7","لنتدرب على تنسيق النص",3],["l3-8","3.8","أساسيات تحرير النص",3]
  ].map(function (r) { return { id: r[0], no: r[1], ar: r[2], unit: r[3] }; });
  var N = L.length;

  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function P(d, a) { a = a || {}; a.d = d; return S("path", a); }
  function grad(id, stops, horiz) { return S("linearGradient", { id: id, x1: 0, y1: 0, x2: horiz ? 1 : 0, y2: horiz ? 0 : 1 }, stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); })); }
  function rgrad(id, stops) { return S("radialGradient", { id: id }, stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); })); }

  /* gallery floor: gentle horizontal walk through the halls */
  var W = 4700, H = 1280, MX = 380, BASE = 720, AMP = 58;
  function nodeAt(i) { var span = W - MX * 2; return { x: MX + span * (i / (N - 1)), y: BASE + (i % 2 ? -AMP : AMP) }; }

  function galleryDoor() {
    return S("svg", { viewBox: "-90 -160 180 250" }, [
      S("ellipse", { cx: 0, cy: 84, rx: 56, ry: 8, fill: "rgba(0,0,0,.34)" }),
      P("M-64 -70 h128 l-16 -22 h-96 z", { fill: "#2a3350" }),               /* pediment */
      S("rect", { x: -60, y: -70, width: 16, height: 154, fill: "#333d5c" }),  /* columns */
      S("rect", { x: 44, y: -70, width: 16, height: 154, fill: "#333d5c" }),
      S("rect", { x: -44, y: -70, width: 88, height: 154, fill: "#1a2138" }),
      P("M-30 84 V4 q30 -30 60 0 V84 Z", { class: "ms-hall", stroke: "#c9a24b", "stroke-width": 3 }),  /* archway */
      S("g", { class: "ms-onlit" }, [S("circle", { cx: 0, cy: 40, r: 16, fill: "url(#msGlow)" })])
    ]);
  }
  function exhibit() {
    return S("svg", { viewBox: "-90 -160 180 250" }, [
      S("ellipse", { cx: 0, cy: 84, rx: 50, ry: 8, fill: "rgba(0,0,0,.3)" }),
      S("rect", { x: -34, y: 40, width: 68, height: 44, fill: "#2a3350", stroke: "#3a4a6a", "stroke-width": 2 }),  /* pedestal */
      S("rect", { x: -44, y: -66, width: 88, height: 106, rx: 4, fill: "rgba(150,180,230,.1)", stroke: "#5a6a9a", "stroke-width": 3 }), /* glass case */
      S("line", { x1: 0, y1: -66, x2: 0, y2: 40, stroke: "rgba(150,180,230,.18)", "stroke-width": 2 }),
      S("g", { class: "ms-onart" }, [
        S("circle", { cx: 0, cy: -10, r: 22, class: "ms-artifact", fill: "url(#msArt)" }),
        S("path", { d: "M0 -34 l6 12 l13 2 l-9 9 l2 13 l-12 -6 l-12 6 l2 -13 l-9 -9 l13 -2 z", fill: "#ffe9a8", class: "ms-star", transform: "translate(0,-4) scale(0.7)" })
      ])
    ]);
  }
  function place(host, ctx) { host.appendChild(ctx.index % 2 ? exhibit() : galleryDoor()); }

  /* per-world signage — a brass museum plaque on a small easel */
  function sign(ctx) {
    return E("div", { class: "ms-sign" }, [E("div", { class: "ms-sign__plate" }, [
      E("span", { class: "ms-sign__no", text: ctx.no }),
      E("span", { class: "ms-sign__name", text: ctx.name })
    ])]);
  }

  function traveler() {   /* a curator's floating spotlight orb */
    return S("svg", { viewBox: "0 0 70 70" }, [
      S("circle", { cx: 35, cy: 35, r: 26, fill: "url(#msGlow)" }),
      S("circle", { cx: 35, cy: 35, r: 12, fill: "#fff3cf" }),
      S("circle", { cx: 35, cy: 35, r: 12, fill: "none", stroke: "#c9a24b", "stroke-width": 2 })
    ]);
  }

  function layers(env, ctx) {
    var svg = S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
    var R = rng(2101);
    svg.appendChild(S("defs", {}, [
      grad("msWall", [["0%", "#1a2138"], ["60%", "#232c48"], ["100%", "#2c355a"]]),
      grad("msFloor", [["0%", "#3a465f"], ["100%", "#20263c"]]),
      grad("msFloor2", [["0%", "#e7ddc7"], ["100%", "#b9ad8f"]], false),
      grad("msCarpet", [["0%", "#a33042"], ["100%", "#7a2231"]]),
      grad("msArt", [["0%", "#bfe3ff"], ["100%", "#4f88c8"]]),
      rgrad("msGlow", [["0%", "#fff0c0", 0.9], ["100%", "#fff0c0", 0]])
    ]));
    /* wall */
    svg.appendChild(S("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#msWall)" }));
    /* coffered ceiling with skylights */
    svg.appendChild(S("rect", { x: 0, y: 0, width: W, height: H * 0.14, fill: "#141a2e" }));
    for (var sk = 0; sk < 20; sk++) { var kx = 120 + sk * 240; svg.appendChild(S("rect", { x: kx, y: 24, width: 150, height: 60, rx: 6, fill: "#3a5570", opacity: 0.5 })); svg.appendChild(S("rect", { x: kx + 20, y: 34, width: 110, height: 40, rx: 4, fill: "#9fb6d8", opacity: 0.16 })); }
    /* back-wall framed paintings between halls */
    for (var pa = 0; pa < 12; pa++) { var px = 260 + pa * 380 + R() * 60, py = H * 0.26 + R() * 50; svg.appendChild(S("g", {}, [S("rect", { x: px, y: py, width: 120, height: 92, rx: 3, fill: "#c9a24b" }), S("rect", { x: px + 8, y: py + 8, width: 104, height: 76, fill: ["#3f6fa0", "#7a5a9a", "#4f8f6a", "#a86a3c"][pa % 4], opacity: 0.7 })])); }
    /* colonnade — a receding row of columns */
    for (var cc = 0; cc < 16; cc++) { var cx = 150 + cc * 300; svg.appendChild(S("g", { opacity: 0.9 }, [S("rect", { x: cx, y: H * 0.16, width: 30, height: H * 0.44, fill: "#333d5c" }), S("rect", { x: cx - 6, y: H * 0.16, width: 42, height: 14, fill: "#3d476a" }), S("rect", { x: cx - 6, y: H * 0.6 - 14, width: 42, height: 14, fill: "#3d476a" }), S("g", { transform: "translate(" + (cx + 15) + "," + (H * 0.6) + ")", class: "ms-spot" }, [P("M0 0 L-70 " + (H * 0.4) + " L70 " + (H * 0.4) + " Z", { fill: "url(#msGlow)", opacity: 0.4 })])])); }
    /* marble floor */
    svg.appendChild(S("rect", { x: 0, y: H * 0.62, width: W, height: H * 0.38, fill: "url(#msFloor2)" }));
    for (var tl = 0; tl < 30; tl++) svg.appendChild(S("line", { x1: tl * 160, y1: H * 0.62, x2: tl * 160 - 240, y2: H, stroke: "rgba(120,100,70,.18)", "stroke-width": 2 }));
    /* red carpet runner along the trail */
    var pts = []; for (var i = 0; i < N; i++) { var p = nodeAt(i); pts.push({ x: p.x, y: p.y + 96 }); }
    var d = "M" + pts[0].x + " " + pts[0].y; for (var k = 1; k < pts.length; k++) { var a = pts[k - 1], b = pts[k], hx = (a.x + b.x) / 2; d += " C" + hx + " " + a.y + " " + hx + " " + b.y + " " + b.x + " " + b.y; }
    svg.appendChild(P(d, { fill: "none", stroke: "url(#msCarpet)", "stroke-width": 74, "stroke-linecap": "round" }));
    svg.appendChild(P(d, { fill: "none", stroke: "#c9a24b", "stroke-width": 78, "stroke-linecap": "round", "stroke-dasharray": "2 30", opacity: 0.5 }));
    env.appendChild(svg);
  }

  ADV.register({
    code: "g2s1", storageKey: "waha:g2s1:wahat2.rebuild.v1.progress",
    title: "متحف المخترعين السري", subtitle: "الصف الثاني · الفصل الأول",
    gradeLabel: "الصف الثاني · الفصل الأول",
    lessons: L, unitOf: function (l) { return UNITS[l.unit]; },
    readDone: function (pr, l) { var box = pr && (pr.lessons || (pr.progress && pr.progress.lessons)); var e = box && box[l.id]; return !!(e && (e.mastered || e.done)); },
    intro: "أهلًا في متحف المخترعين السري! أبوابٌ موصدة وقاعاتٌ في العتمة تنتظر من يكشف أسرارها. سِر على السجادة الحمراء؛ كل قاعة تُنجزها يُضاء كشّافها وتتألق مقتنياتها.",
    msgStart: "أول قاعة في المتحف تنتظر ضوءك — انقر لتدخلها.",
    msgLocked: "هذا الباب مقفل — أضِئ القاعة السابقة ليُفتح.",
    msgDone: "أحسنت! أُضيئت قاعة جديدة وتألقت مقتنياتها.",
    completeTitle: "أضأتَ المتحف كله! 🏛️",
    completeText: "فتحتَ كل الأبواب المغلقة وأضأتَ كل القاعات. صار متحف المخترعين يتألق بالكامل. أحسنت!",
    theme: {
      "--adv-bg": "#1a2138",
      "--adv-accent": "#c9a24b", "--adv-accent-2": "#ffd873", "--adv-accent-2b": "#a9863a",
      "--adv-done": "#6fd0b0", "--adv-locked": "#6f7896", "--adv-glow": "rgba(201,162,75,.5)",
      "--path-c": "rgba(201,162,75,.35)"
    },
    world: { size: { w: W, h: H }, nodeAt: nodeAt, layers: layers, place: place, sign: sign, traveler: traveler }
  });
})();
