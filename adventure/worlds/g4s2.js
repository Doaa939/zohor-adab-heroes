/*!
 * adventure/worlds/g4s2.js — «محطة المستقبل والبيانات» (Grade 4 · Semester 2)
 * GAME TYPE: HOLOGRAPHIC STATION MAP. A central DATA CORE with modules arranged
 * around it on an out-spiralling ring. Progress is not a line but energy routed
 * from the core outward: completing a module powers it and lights the conduit
 * to the next. When all are online, the whole station runs. Futuristic (Grade 4).
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg, E = ADV._el;
  var MODULE = { u1: "هيا نبرمج", u2: "لنتعامل مع البيانات" };
  var L = [
    ["1.1","كيفية البرمجة","u1"],["1.2","تحرير مظاهر الكائنات","u1"],["1.3","مبدأ عمل البرمجة","u1"],
    ["1.4","التفاعل في Scratch","u1"],["1.5","لنتدرب على Scratch","u1"],["1.6","إنشاء الرسوم المتحركة","u1"],
    ["1.7","لنتدرب على الرسوم المتحركة","u1"],["1.8","إنشاء لعبة","u1"],["1.9","لنتدرب على الحركة في Scratch","u1"],
    ["1.10","المشروع","u1"],["2.1","الجداول الحسابية","u2"],["2.2","تنظيم البيانات","u2"],
    ["2.3","لنتدرب على الجداول الحسابية","u2"],["2.4","العمليات الحسابية","u2"]
  ].map(function (r) { return { id: r[0], no: r[0], ar: r[1], unit: r[2] }; });
  var N = L.length;

  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function P(d, a) { a = a || {}; a.d = d; return S("path", a); }
  function rgrad(id, stops) { return S("radialGradient", { id: id }, stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); })); }
  function grad(id, stops) { return S("linearGradient", { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); })); }

  /* RADIAL: an out-spiral of modules around a central data core */
  var W = 3200, H = 3000, CX = W / 2, CY = H / 2;
  function nodeAt(i) {
    var t = i / (N - 1);
    var ang = -Math.PI / 2 + t * (Math.PI * 2.4);      /* ~1.2 turns */
    var rad = 360 + t * 980;                            /* spiral outward */
    return { x: CX + Math.cos(ang) * rad, y: CY + Math.sin(ang) * rad };
  }

  function modulePod() {
    return S("svg", { viewBox: "-80 -80 160 190" }, [
      S("ellipse", { cx: 0, cy: 96, rx: 46, ry: 7, fill: "rgba(0,0,0,.4)" }),
      S("rect", { x: -20, y: 60, width: 40, height: 40, rx: 4, fill: "#132842", stroke: "#2ea6ff", "stroke-width": 2 }),  /* stem */
      S("g", { class: "sp-onlit" }, [
        S("circle", { cx: 0, cy: 6, r: 52, fill: "url(#spPod)" }),
        S("circle", { cx: 0, cy: 6, r: 52, fill: "none", stroke: "#4fc3ff", "stroke-width": 3 }),
        S("rect", { x: -30, y: -14, width: 60, height: 40, rx: 4, fill: "#0a1830" }),
        S("rect", { x: -24, y: -8, width: 48, height: 28, rx: 2, fill: "url(#spScreen)", class: "sp-screen" }),
        P("M-24 -8 h48 M-24 2 h48 M-24 12 h48", { stroke: "rgba(10,24,48,.6)", "stroke-width": 1.5 })
      ]),
      S("circle", { cx: 0, cy: 6, r: 52, fill: "none", stroke: "#1c3a5a", "stroke-width": 3, class: "sp-ring-off" })
    ]);
  }
  function antennaPod() {
    return S("svg", { viewBox: "-80 -95 160 205" }, [
      S("ellipse", { cx: 0, cy: 96, rx: 42, ry: 7, fill: "rgba(0,0,0,.4)" }),
      S("rect", { x: -18, y: 54, width: 36, height: 46, rx: 4, fill: "#132842", stroke: "#2ea6ff", "stroke-width": 2 }),
      S("g", { class: "sp-onlit" }, [
        P("M-40 22 a40 40 0 0 1 80 0 Z", { fill: "url(#spDish)", stroke: "#4fc3ff", "stroke-width": 2 }),
        P("M0 22 v-46", { stroke: "#4fc3ff", "stroke-width": 3 }), S("circle", { cx: 0, cy: -26, r: 6, class: "sp-blip", fill: "#8ff0ff" })
      ]),
      P("M-40 22 a40 40 0 0 1 80 0", { fill: "none", stroke: "#1c3a5a", "stroke-width": 3, class: "sp-ring-off" })
    ]);
  }
  function place(host, ctx) { host.appendChild(ctx.index % 3 === 2 ? antennaPod() : modulePod()); }

  /* per-world signage — a module display panel */
  function sign(ctx) {
    return E("div", { class: "sp-sign" }, [E("div", { class: "sp-sign__panel" }, [
      E("span", { class: "sp-sign__no", text: ctx.no }),
      E("span", { class: "sp-sign__name", text: ctx.name })
    ])]);
  }
  function traveler() {   /* an energy pulse orb routed from the core */
    return S("svg", { viewBox: "0 0 60 60" }, [
      S("circle", { cx: 30, cy: 30, r: 24, fill: "url(#spPulse)" }),
      S("circle", { cx: 30, cy: 30, r: 9, fill: "#d8f6ff" }),
      S("circle", { cx: 30, cy: 30, r: 9, fill: "none", stroke: "#4fc3ff", "stroke-width": 2 })
    ]);
  }

  function layers(env, ctx) {
    var svg = S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
    var R = rng(4202);
    svg.appendChild(S("defs", {}, [
      grad("spBg", [["0%", "#05070f"], ["60%", "#0a1226"], ["100%", "#0e1a34"]]),
      rgrad("spCore", [["0%", "#eafcff", 1], ["30%", "#4fc3ff", 0.95], ["70%", "#2a6ad0", 0.5], ["100%", "#2a6ad0", 0]]),
      rgrad("spPod", [["0%", "#183a5e", 1], ["100%", "#0c1c34", 1]]),
      rgrad("spDish", [["0%", "#1c4a6a"], ["100%", "#0c1c34"]]),
      rgrad("spPulse", [["0%", "#d8f6ff", 0.9], ["100%", "#4fc3ff", 0]]),
      grad("spScreen", [["0%", "#8ff0ff"], ["100%", "#2e86d0"]])
    ]));
    svg.appendChild(S("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#spBg)" }));
    /* starfield + a nebula wash */
    for (var s = 0; s < 260; s++) { svg.appendChild(S("circle", { cx: R() * W, cy: R() * H, r: R() * 1.6 + 0.3, fill: "#cfeaff", opacity: 0.1 + R() * 0.6, class: R() < 0.2 ? "sp-star" : "" })); }
    svg.appendChild(S("ellipse", { cx: W * 0.24, cy: H * 0.2, rx: 420, ry: 260, fill: "#1a2f6a", opacity: 0.18 }));
    svg.appendChild(S("ellipse", { cx: W * 0.78, cy: H * 0.82, rx: 380, ry: 240, fill: "#5a2a6a", opacity: 0.14 }));

    /* concentric station rings */
    [1120, 820, 540].forEach(function (rr) { svg.appendChild(S("circle", { cx: CX, cy: CY, r: rr, fill: "none", stroke: "rgba(79,195,255,.12)", "stroke-width": 3, "stroke-dasharray": "8 20" })); });

    /* energy conduits: core → each module along the spiral */
    var pts = []; for (var i = 0; i < N; i++) pts.push(nodeAt(i));
    /* spokes from core to every module */
    pts.forEach(function (p) { svg.appendChild(S("line", { x1: CX, y1: CY, x2: p.x, y2: p.y, stroke: "rgba(79,195,255,.10)", "stroke-width": 3 })); });
    /* the main spiral conduit through consecutive modules */
    var d = "M" + pts[0].x + " " + pts[0].y; for (var k = 1; k < pts.length; k++) { var a = pts[k - 1], b = pts[k]; d += " Q" + ((a.x + b.x) / 2 + (CY - (a.y + b.y) / 2) * 0.14) + " " + ((a.y + b.y) / 2 - (CX - (a.x + b.x) / 2) * 0.14) + " " + b.x + " " + b.y; }
    svg.appendChild(P(d, { fill: "none", stroke: "#123253", "stroke-width": 16, "stroke-linecap": "round" }));
    svg.appendChild(P(d, { fill: "none", stroke: "#4fc3ff", "stroke-width": 5, "stroke-linecap": "round", "stroke-dasharray": "10 24", class: "sp-conduit", opacity: 0.7 }));

    /* the central DATA CORE */
    svg.appendChild(S("g", { class: "sp-corewrap" }, [
      S("circle", { cx: CX, cy: CY, r: 260, fill: "url(#spCore)" }),
      S("circle", { cx: CX, cy: CY, r: 96, fill: "#0a1e3a", stroke: "#4fc3ff", "stroke-width": 4 }),
      S("circle", { cx: CX, cy: CY, r: 66, fill: "#0e2c52", stroke: "#8ff0ff", "stroke-width": 2, class: "sp-corepulse" }),
      S("circle", { cx: CX, cy: CY, r: 22, fill: "#d8f6ff" }),
      S("g", { class: "sp-corering" }, [S("circle", { cx: CX, cy: CY, r: 132, fill: "none", stroke: "#4fc3ff", "stroke-width": 2, "stroke-dasharray": "4 18" })])
    ]));
    env.appendChild(svg);
  }

  ADV.register({
    code: "g4s2", storageKey: "waha:g4s2:waha:g4s2:v1",
    title: "محطة المستقبل والبيانات", subtitle: "الصف الرابع · الفصل الثاني",
    gradeLabel: "الصف الرابع · الفصل الثاني",
    lessons: L, unitOf: function (l) { return MODULE[l.unit]; },
    intro: "محطة مستقبلية للبيانات فقدت طاقتها، ووحداتها موزّعة حول نواة البيانات في المركز. كل مهمة تُنجزها تُشغّل وحدةً وتُنير مسار الطاقة من النواة إليها، حتى تعود جميع أنظمة المحطة إلى العمل.",
    msgStart: "أقرب وحدة إلى النواة تنتظر طاقتك — انقر لتشغّلها.",
    msgLocked: "هذه الوحدة أبعد في المدار — شغّل ما قبلها ليصلها مسار الطاقة.",
    msgDone: "أحسنت! استعادت وحدة جديدة طاقتها وأضاء مسارها.",
    completeTitle: "المحطة كلها تعمل! 🛰️",
    completeText: "أعدتَ الطاقة إلى كل الوحدات حول النواة، وعادت محطة المستقبل إلى العمل الكامل. أحسنت!",
    theme: {
      "--adv-bg": "#05070f",
      "--adv-accent": "#4fc3ff", "--adv-accent-2": "#8ff0ff", "--adv-accent-2b": "#2e86d0",
      "--adv-done": "#4fe0c0", "--adv-locked": "#4a556a", "--adv-glow": "rgba(79,195,255,.6)",
      "--path-c": "rgba(79,195,255,.4)"
    },
    world: { size: { w: W, h: H }, nodeAt: nodeAt, layers: layers, place: place, sign: sign, traveler: traveler }
  });
})();
