/*!
 * adventure/worlds/g2s2.js — «وادي الشيفرات والكنز الرقمي» (Grade 2 · Semester 2)
 * GAME TYPE: TREASURE HUNT. A large hand-illustrated Omani wadi at dusk: a
 * dashed treasure trail winds from the oasis camp, past carved gateways,
 * watch-towers, wells and ruined arches, along a glowing falaj, to the digital
 * treasure at the valley's end. Missions are PLACES on the map; the camera pans
 * the world; each completed site lights up and the trail opens onward.
 *
 * Lesson data mirrors WADI.curriculum verbatim (id/no/ar). Presentation only —
 * completion is read from the original platform blob; the lesson opens there.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg, E = ADV._el;

  /* ---- lessons (from the platform; order & names verbatim) ---- */
  var L = [
    ["l1","1.1","كَيْفِيَّةُ البَرْمَجَةِ"],["l2","1.2","التَّحَكُّمُ في الوَقْتِ"],
    ["l3","1.3","حَلُّ الْمُشْكِلاتِ"],["l4","1.4","طُرُقُ تَشْغيلِ البَرْنامَجِ"],
    ["l5","1.5","لِنَتَدَرَّبْ على طُرُقِ تَشْغيلِ البَرْنامَجِ"],["l6","1.6","الرُّسومُ الـمُتَحَرِّكَةُ"],
    ["l7","1.7","لِنَتَدَرَّبْ على الرُّسومِ الـمُتَحَرِّكَةِ"],["l8","1.8","التَّعامُلُ مَعَ الصَّفَحاتِ"],
    ["l9","1.9","الأنْماطُ"],["l10","1.10","التَّكْرارُ"],["l11","1.11","لِنَتَدَرَّبْ على التَّكْرارِ"],
    ["l12","1.12","التَّحَكُّمُ في ظُهورِ كائِنٍ"],["l13","1.13","لِنَتَدَرَّبْ على التَّحَكُّمِ في ظُهورِ الكائِنِ"],
    ["l14","1.14","الـمَشْروعُ"]
  ].map(function (r) { return { id: r[0], no: r[1], ar: r[2], unit: "u1" }; });
  var N = L.length;

  /* ---- deterministic pseudo-random (Math.random is unavailable here) ---- */
  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---- world geometry ---- */
  var W = 4300, H = 1320, MX = 360, BASE = 780, AMP = 132;
  function nodeAt(i) {
    var span = W - MX * 2;
    var x = MX + span * (i / (N - 1));
    var y = BASE + (i % 2 ? -AMP : AMP) + Math.sin(i * 1.7) * 26;
    return { x: x, y: y };
  }

  function P(d, a) { a = a || {}; a.d = d; return S("path", a); }
  function grad(id, stops, x1, y1, x2, y2) {
    return S("linearGradient", { id: id, x1: x1 || "0", y1: y1 || "0", x2: x2 || "0", y2: y2 || "1" },
      stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); }));
  }
  function rgrad(id, stops) {
    return S("radialGradient", { id: id },
      stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); }));
  }

  /* ---------------------------------------------------------------- scenery */
  function palm(x, y, s, dark) {
    var g = S("g", { transform: "translate(" + x + "," + y + ") scale(" + s + ")" });
    g.appendChild(P("M-4 0 q6 -60 2 -120 q-2 -30 -8 -46", { fill: "none", stroke: dark ? "#2a1c10" : "#4a3320", "stroke-width": 9, "stroke-linecap": "round" }));
    var fr = dark ? "#26402a" : "#3c6b40", fr2 = dark ? "#1c3020" : "#2f5433";
    [-1, 1].forEach(function (dir) {
      for (var k = 0; k < 3; k++) {
        var ang = -150 + k * 26;
        g.appendChild(P("M-4 -160 q" + (dir * (60 + k * 14)) + " " + (-30 - k * 8) + " " + (dir * (108 + k * 16)) + " " + (6 + k * 20), { fill: "none", stroke: k % 2 ? fr2 : fr, "stroke-width": 12 - k * 2, "stroke-linecap": "round" }));
      }
    });
    g.appendChild(S("circle", { cx: -4, cy: -162, r: 10, fill: "#6b4a1e" }));
    return g;
  }
  function rock(x, y, s, tone) {
    var g = S("g", { transform: "translate(" + x + "," + y + ") scale(" + s + ")" });
    g.appendChild(P("M-46 4 q-6 -34 22 -44 q30 -12 46 6 q22 4 20 34 q-2 10 -14 12 l-78 0 q-8 -2 -6 -14 z", { fill: tone || "#4a3626" }));
    g.appendChild(P("M-24 -34 q18 -8 34 4 q-14 6 -34 -4 z", { fill: "rgba(255,240,210,.14)" }));
    g.appendChild(P("M-46 4 q30 8 88 0 l0 6 q-44 8 -88 0 z", { fill: "rgba(0,0,0,.28)" }));
    return g;
  }
  function lantern(x, y, s, lit) {
    var g = S("g", { transform: "translate(" + x + "," + y + ") scale(" + s + ")", class: "wd-lan" + (lit ? " is-lit" : "") });
    g.appendChild(P("M0 0 v-44", { stroke: "#5a4630", "stroke-width": 5 }));
    g.appendChild(P("M-10 -44 q10 -10 20 0", { fill: "none", stroke: "#5a4630", "stroke-width": 4 }));
    g.appendChild(S("rect", { x: -10, y: -70, width: 20, height: 24, rx: 4, fill: "rgba(10,14,20,.6)", stroke: "#6a5238", "stroke-width": 2 }));
    if (lit) { g.appendChild(S("circle", { cx: 0, cy: -58, r: 30, fill: "url(#wdLanGlow)", class: "wd-glow" })); g.appendChild(P("M0 -66 q6 8 6 13 a6 6 0 0 1 -12 0 q0 -5 6 -13 z", { class: "wd-flame" })); }
    return g;
  }
  function tuft(x, y, s, c) {
    var g = S("g", { transform: "translate(" + x + "," + y + ") scale(" + s + ")" });
    [-14, -6, 2, 10].forEach(function (dx, i) { g.appendChild(P("M" + dx + " 0 q" + (dx / 2) + " -" + (16 + i * 2) + " " + (dx * 0.2) + " -" + (24 + i * 2), { fill: "none", stroke: c || "#5a6b34", "stroke-width": 3, "stroke-linecap": "round" })); });
    return g;
  }

  /* --------------------------------------------------------- mission places */
  function shadow(w) { return S("ellipse", { cx: 0, cy: 92, rx: w || 70, ry: 12, fill: "rgba(0,0,0,.34)" }); }

  function placeGate() {   /* carved stone gateway with a hanging lantern */
    return S("svg", { viewBox: "-95 -150 190 250" }, [
      shadow(72),
      P("M-64 92 V-24 q0-58 64-58 q64 0 64 58 V92 Z", { fill: "url(#wdStone)", stroke: "#6a5038", "stroke-width": 3 }),
      P("M-40 92 V-18 q0-36 40-36 q40 0 40 36 V92 Z", { fill: "#141c22" }),
      P("M-64 -24 q64-52 128 0", { fill: "none", stroke: "#8a6a44", "stroke-width": 4 }),
      S("rect", { x: -74, y: 82, width: 148, height: 14, rx: 3, fill: "#4a3826" }),
      S("g", { class: "wd-onlit" }, [S("rect", { x: -20, y: 20, width: 40, height: 54, rx: 6, fill: "url(#wdWin)" })]),
      S("g", { transform: "translate(0,-34)" }, [lantern(0, 0, 1, true)])
    ]);
  }
  function placeTower() {  /* watch-tower whose window lights when done */
    return S("svg", { viewBox: "-90 -160 180 260" }, [
      shadow(64),
      P("M-52 92 V-70 h104 V92 Z", { fill: "url(#wdStone)", stroke: "#6a5038", "stroke-width": 3 }),
      P("M-58 -70 h116 v-14 h-18 v-14 h-16 v14 h-16 v-14 h-16 v14 h-16 v-14 h-16 v14 h-16 z", { fill: "#5a4530" }),
      S("g", { class: "wd-onlit" }, [S("rect", { x: -22, y: -34, width: 44, height: 54, rx: 22, fill: "url(#wdWin)", stroke: "#2a2016", "stroke-width": 3 })]),
      S("rect", { x: -26, y: 44, width: 52, height: 48, rx: 5, fill: "#241a10" }),
      S("g", { class: "wd-flag" }, [P("M52 -84 v-40", { stroke: "#6a5238", "stroke-width": 4 }), P("M52 -124 h34 l-10 11 l10 11 h-34 z", { fill: "var(--adv-accent,#f0b455)" })])
    ]);
  }
  function placeWell() {   /* palm oasis + falaj well whose water glows when done */
    return S("svg", { viewBox: "-95 -150 190 250" }, [
      shadow(66),
      S("g", { transform: "translate(-40,92)" }, [palm(0, 0, 0.86, false)]),
      P("M6 92 V44 a44 22 0 0 1 88 0 V92 Z", { fill: "url(#wdStone)", stroke: "#6a5038", "stroke-width": 3 }),
      S("g", { class: "wd-onwater" }, [S("ellipse", { cx: 50, cy: 44, rx: 44, ry: 12, fill: "url(#wdWater)" })]),
      S("ellipse", { cx: 50, cy: 44, rx: 44, ry: 12, fill: "none", stroke: "#5a4530", "stroke-width": 3 })
    ]);
  }
  function placeArch() {   /* ancient ruined arch — mysterious ruin */
    return S("svg", { viewBox: "-100 -155 200 255" }, [
      shadow(74),
      P("M-70 92 V-10 q0-70 70-70 q70 0 70 70 V92 h-30 V-8 q0-40 -40 -40 q-40 0 -40 40 V92 Z", { fill: "url(#wdStone)", stroke: "#6a5038", "stroke-width": 3 }),
      P("M-70 -10 h20 M50 -10 h20", { stroke: "#3a2c1e", "stroke-width": 6 }),
      S("g", { class: "wd-onlit" }, [S("circle", { cx: 0, cy: 34, r: 22, fill: "url(#wdWin)" })]),
      rock(-58, 80, 0.7, "#3d2c1e"), rock(64, 84, 0.6, "#3d2c1e")
    ]);
  }
  function placeCamp() {   /* the starting oasis camp */
    return S("svg", { viewBox: "-100 -150 200 250" }, [
      shadow(78),
      S("g", { transform: "translate(46,92)" }, [palm(0, 0, 0.9, false)]),
      P("M-78 92 L-16 -44 L48 92 Z", { fill: "url(#wdTent)", stroke: "#7a5636", "stroke-width": 3 }),
      P("M-16 -44 L-16 92", { stroke: "rgba(0,0,0,.3)", "stroke-width": 3 }),
      S("g", { class: "wd-onlit" }, [P("M-40 92 V52 q0-14 14-14 q14 0 14 14 V92 Z", { fill: "url(#wdWin)" })]),
      P("M-16 -44 v-16", { stroke: "#7a5636", "stroke-width": 4 }),
      P("M-16 -60 h26 l-7 8 l7 8 h-26 z", { fill: "var(--adv-accent,#f0b455)" })
    ]);
  }
  function placeTreasure() {  /* the digital treasure at the valley's end */
    return S("svg", { viewBox: "-110 -170 220 280" }, [
      S("g", { class: "wd-rays" }, [P("M0 -8 L0 -120 M0 -8 L-70 -74 M0 -8 L70 -74 M0 -8 L-104 -20 M0 -8 L104 -20", { stroke: "var(--adv-accent-2,#ffd76a)", "stroke-width": 4 })]),
      shadow(84),
      S("circle", { cx: 0, cy: 20, r: 92, fill: "url(#wdTrGlow)", class: "wd-trglow" }),
      P("M-64 92 V38 q0-14 14-14 h100 q14 0 14 14 V92 Z", { fill: "#6b4a26", stroke: "#8a6a44", "stroke-width": 3 }),
      P("M-66 38 q66-34 132 0 v12 H-66 Z", { fill: "#7d5a2e", stroke: "#a07a48", "stroke-width": 3 }),
      S("rect", { x: -14, y: 44, width: 28, height: 22, rx: 3, fill: "var(--adv-accent-2,#ffd76a)" }),
      S("g", { class: "wd-gems" }, [
        S("circle", { cx: -34, cy: 70, r: 7, fill: "var(--adv-accent-2,#ffd76a)" }),
        S("circle", { cx: 0, cy: 76, r: 9, fill: "#fff2c4" }),
        S("circle", { cx: 34, cy: 70, r: 7, fill: "var(--adv-accent-2,#ffd76a)" }),
        S("path", { d: "M-52 60 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 z", fill: "#fff2c4", class: "wd-spark" })
      ])
    ]);
  }

  function place(host, ctx) {
    var i = ctx.index, node;
    if (i === 0) node = placeCamp();
    else if (i === N - 1) node = placeTreasure();
    else { var r = i % 4; node = r === 1 ? placeTower() : r === 2 ? placeWell() : r === 3 ? placeArch() : placeGate(); }
    host.appendChild(node);
  }

  /* ---------------------------------------------------- per-world signage */
  /* an aged wooden trail-marker plank on a post — the treasure-map look */
  function sign(ctx) {
    var wrap = E("div", { class: "wd-sign" });
    var plank = E("div", { class: "wd-sign__plank" }, [
      E("span", { class: "wd-sign__no" }, [E("span", { text: ctx.no })]),
      E("span", { class: "wd-sign__name", text: ctx.name })
    ]);
    wrap.appendChild(plank);
    return wrap;
  }

  /* ------------------------------------------------------------- traveler */
  function traveler() {   /* the hudhud scout with a satchel, following the trail */
    return S("svg", { viewBox: "0 0 80 80" }, [
      S("ellipse", { cx: 40, cy: 70, rx: 20, ry: 5, fill: "rgba(0,0,0,.3)" }),
      P("M40 20 q14 0 16 14 l10 -4 l-7 9 q6 6 6 16 q0 18 -25 18 q-25 0 -25 -20 q0 -16 9 -26 q6 -7 6 -17 q0 6 4 10 z", { fill: "#3f7fb0" }),
      P("M40 24 q10 2 12 12 q-8 -2 -12 -12 z", { fill: "#2c5f88" }),
      S("circle", { cx: 34, cy: 40, r: 3.4, fill: "#0b1420" }),
      P("M22 44 q-10 2 -16 -3 q8 6 16 8 z", { fill: "var(--adv-accent-2,#ffd76a)" }),
      S("rect", { x: 44, y: 46, width: 16, height: 14, rx: 3, fill: "#8a5a2c" })
    ]);
  }

  /* ------------------------------------------------------- environment art */
  function layers(env, ctx) {
    var svg = S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
    var R = rng(2202);

    var defs = S("defs", {}, [
      grad("wdSky", [["0%", "#141a33"], ["42%", "#3a2f4e"], ["72%", "#8a4b3e"], ["100%", "#c47a44"]]),
      grad("wdSun", [["0%", "#ffdca0"], ["100%", "#e08a44"]]),
      grad("wdFar", [["0%", "#3a2f4e"], ["100%", "#2a2340"]]),
      grad("wdMid", [["0%", "#6a4552"], ["100%", "#43303c"]]),
      grad("wdNear", [["0%", "#7a5236"], ["100%", "#4a3220"]]),
      grad("wdGround", [["0%", "#7c5734"], ["45%", "#573c24"], ["100%", "#33241640".slice(0,7)]]),
      grad("wdStone", [["0%", "#7a5c3e"], ["100%", "#4a3722"]]),
      grad("wdTent", [["0%", "#c98a4e"], ["100%", "#8a5a30"]]),
      grad("wdWin", [["0%", "#ffe6a6"], ["100%", "#f0a94e"]]),
      grad("wdWater", [["0%", "#8fe9e6"], ["100%", "#2f9b9a"]]),
      rgrad("wdLanGlow", [["0%", "#ffdd8f", 0.9], ["100%", "#ffdd8f", 0]]),
      rgrad("wdTrGlow", [["0%", "#ffe9a8", 0.85], ["55%", "#ffce54", 0.32], ["100%", "#ffce54", 0]])
    ]);
    svg.appendChild(defs);

    /* sky + sun + stars + soft clouds */
    svg.appendChild(S("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#wdSky)" }));
    for (var s = 0; s < 130; s++) { var sx = R() * W, sy = R() * H * 0.42; svg.appendChild(S("circle", { cx: sx, cy: sy, r: R() * 1.5 + 0.4, fill: "#fff", opacity: 0.18 + R() * 0.5, class: "wd-star" })); }
    svg.appendChild(S("circle", { cx: W * 0.66, cy: H * 0.34, r: 96, fill: "url(#wdSun)", opacity: 0.95 }));
    svg.appendChild(S("circle", { cx: W * 0.66, cy: H * 0.34, r: 190, fill: "url(#wdTrGlow)", opacity: 0.35 }));
    for (var cl = 0; cl < 7; cl++) {
      var cx = R() * W, cy = H * (0.12 + R() * 0.22), cs = 0.7 + R() * 1.1;
      svg.appendChild(S("g", { transform: "translate(" + cx + "," + cy + ") scale(" + cs + ")", opacity: 0.14 + R() * 0.12, class: "wd-cloud" }, [
        P("M-70 0 q-4 -26 24 -26 q6 -22 34 -16 q18 -14 40 4 q30 -4 28 24 q10 14 -8 20 z", { fill: "#d8b48c" })
      ]));
    }

    /* highest far range (fills the upper sky band) */
    var high = "M0 " + (H * 0.46); for (var xh = 0; xh <= W; xh += 300) high += " L" + xh + " " + (H * 0.30 + Math.sin(xh * 0.0026) * 70 + R() * 40); high += " L" + W + " " + H + " L0 " + H + " Z";
    svg.appendChild(P(high, { fill: "#2c2442", opacity: 0.7 }));

    /* far ridge line with a distant fort */
    var far = "M0 " + (H * 0.56); for (var x = 0; x <= W; x += 240) far += " L" + x + " " + (H * 0.44 - Math.sin(x * 0.004) * 74 - (R() * 40)); far += " L" + W + " " + H + " L0 " + H + " Z";
    svg.appendChild(P(far, { fill: "url(#wdFar)", opacity: 0.9 }));
    /* fort on the far ridge */
    var fx = W * 0.2, fy = H * 0.42;
    svg.appendChild(S("g", { opacity: 0.94 }, [
      P("M" + (fx - 70) + " " + fy + " h140 v88 h-140 z", { fill: "#241d33" }),
      P("M" + (fx - 76) + " " + fy + " h152 v-16 h-18 v-16 h-16 v16 h-16 v-16 h-16 v16 h-16 v-16 h-16 v16 h-18 z", { fill: "#2f2648" }),
      P("M" + (fx + 60) + " " + fy + " h36 v104 h-36 z", { fill: "#1f1930" }),
      S("rect", { x: fx - 10, y: fy + 30, width: 20, height: 34, fill: "#f0b455", opacity: 0.85 }),
      S("rect", { x: fx + 66, y: fy + 20, width: 14, height: 22, fill: "#f0b455", opacity: 0.6 })
    ]));

    /* mid ridge (dunes) */
    var mid = "M0 " + (H * 0.66); for (var x2 = 0; x2 <= W; x2 += 200) mid += " L" + x2 + " " + (H * 0.54 - Math.sin(x2 * 0.006 + 1) * 56 - (R() * 26)); mid += " L" + W + " " + H + " L0 " + H + " Z";
    svg.appendChild(P(mid, { fill: "url(#wdMid)", opacity: 0.94 }));

    /* near canyon walls (left & right framing cliffs) */
    svg.appendChild(P("M0 " + H + " V" + (H * 0.28) + " q140 -30 230 70 q90 100 70 " + (H * 0.62) + " Z", { fill: "url(#wdNear)", opacity: 0.92 }));
    svg.appendChild(P("M" + W + " " + H + " V" + (H * 0.3) + " q-140 -30 -230 70 q-90 100 -70 " + (H * 0.62) + " Z", { fill: "url(#wdNear)", opacity: 0.92 }));

    /* valley floor */
    svg.appendChild(P("M0 " + (H * 0.72) + " Q" + (W / 2) + " " + (H * 0.63) + " " + W + " " + (H * 0.72) + " V" + H + " H0 Z", { fill: "url(#wdGround)" }));

    /* the glowing falaj follows the trail (built from node points, lowered) */
    var pts = []; for (var i = 0; i < N; i++) { var p = nodeAt(i); pts.push({ x: p.x, y: p.y + 96 }); }
    var d = "M" + pts[0].x + " " + pts[0].y;
    for (var k = 1; k < pts.length; k++) { var a = pts[k - 1], b = pts[k], mx = (a.x + b.x) / 2; d += " C" + mx + " " + a.y + " " + mx + " " + b.y + " " + b.x + " " + b.y; }
    svg.appendChild(P(d, { fill: "none", stroke: "rgba(40,90,110,.5)", "stroke-width": 26, "stroke-linecap": "round" }));
    svg.appendChild(P(d, { fill: "none", stroke: "url(#wdWater)", "stroke-width": 12, "stroke-linecap": "round", class: "wd-falaj", opacity: 0.85 }));

    /* scattered foreground life between the sites */
    for (var g = 0; g < 26; g++) {
      var gx = 200 + R() * (W - 400), gy = H * 0.7 + R() * (H * 0.24), t = R();
      if (t < 0.34) svg.appendChild(rock(gx, gy, 0.5 + R() * 0.6, "#4a3626"));
      else if (t < 0.64) svg.appendChild(palm(gx, gy, 0.5 + R() * 0.4, R() < 0.5));
      else if (t < 0.85) svg.appendChild(tuft(gx, gy, 0.7 + R() * 0.7, "#6a7a3c"));
      else svg.appendChild(lantern(gx, gy - 10, 0.8 + R() * 0.4, R() < 0.6));
    }

    /* compass rose — the treasure-map motif, top-left corner */
    var cgx = 210, cgy = 250;
    svg.appendChild(S("g", { class: "wd-compass", transform: "translate(" + cgx + "," + cgy + ")", opacity: 0.9 }, [
      S("circle", { cx: 0, cy: 0, r: 92, fill: "none", stroke: "rgba(255,220,160,.35)", "stroke-width": 3 }),
      S("circle", { cx: 0, cy: 0, r: 70, fill: "none", stroke: "rgba(255,220,160,.2)", "stroke-width": 2 }),
      P("M0 -84 L16 0 L0 84 L-16 0 Z", { fill: "rgba(255,220,160,.28)" }),
      P("M-84 0 L0 16 L84 0 L0 -16 Z", { fill: "rgba(255,220,160,.18)" }),
      P("M0 -84 L10 0 L0 0 Z", { fill: "#ff6a4a" }),
      S("circle", { cx: 0, cy: 0, r: 7, fill: "#ffe9a8" })
    ]));

    /* a big warm glow behind the treasure at the far end */
    var tp = nodeAt(N - 1);
    svg.appendChild(S("circle", { cx: tp.x, cy: tp.y, r: 260, fill: "url(#wdTrGlow)", opacity: 0.55 }));

    env.appendChild(svg);
  }

  ADV.register({
    code: "g2s2", storageKey: "waha:g2s2:wadi.g2s2.v1",
    title: "وادي الشيفرات والكنز الرقمي", subtitle: "الصف الثاني · الفصل الثاني",
    gradeLabel: "الصف الثاني · الفصل الثاني",
    lessons: L, unitOf: function () { return "هَيَّا نُبَرْمِجُ"; },
    intro: "أهلًا أيها المستكشف! أمامك خريطة وادي الشيفرات. اتبع أثر الفلج المتعرّج من المخيّم؛ كل موقع تُنجزه يُضيء ويكشف الطريق إلى الدليل التالي… حتى تصل إلى الكنز الرقمي في نهاية الوادي.",
    msgStart: "ابدأ من المخيّم عند بداية الوادي — أول موقع ينتظر ضوءك.",
    msgLocked: "هذا الموقع مقفل — أنِر الموقع السابق ليفتح الطريق إليه.",
    msgDone: "أحسنت! أضأتَ موقعًا جديدًا وامتدّ الأثر نحو الكنز.",
    completeTitle: "وجدتَ الكنز الرقمي! 🏆",
    completeText: "أضأتَ الوادي كله وجرى الفلج حتى انكشف الكنز في نهايته. أحسنت أيها المستكشف!",
    theme: {
      "--adv-bg": "#171226", "--adv-ink": "#f6ecdc", "--adv-muted": "#c8a98a",
      "--adv-accent": "#f0b455", "--adv-accent-2": "#ffd76a", "--adv-accent-2b": "#e79a3c",
      "--adv-done": "#5fd39a", "--adv-locked": "#8b7a63", "--adv-glow": "rgba(240,180,85,.6)",
      "--path-c": "rgba(255,225,170,.5)"
    },
    world: {
      size: { w: W, h: H }, nodeAt: nodeAt,
      layers: layers, place: place, sign: sign, traveler: traveler
    }
  });
})();
