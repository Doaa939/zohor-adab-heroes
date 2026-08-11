/*!
 * adventure/worlds/g1s1.js — «قرية التقنية المفقودة» (Grade 1 · Semester 1)
 * GAME TYPE: EXPLORATION MAP. A bright, warm Omani village by day. A stone road
 * winds through neighbourhoods; each mission is a building (home, workshop,
 * school, café…). Completing one lights its windows, runs its falaj and brings
 * the village back to life. Grade-1 friendly: sunny, colourful, magical.
 *
 * Lesson data mirrors WAHAT_CURRICULUM verbatim; completion read from the
 * platform blob (progress.lessons[id].completed).
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg, E = ADV._el;
  var UNITS = { 1: "حاسوبي", 2: "هيا نرسم", 3: "لنتصفح" };
  var L = [
    ["1.1","الحاسوب في حياتنا",1],["1.2","أجزاء جهاز الحاسوب",1],["1.3","سطح المكتب",1],
    ["1.4","انقر واكتب",1],["1.5","دعنا نتذكر",1],["1.6","لنطبق معًا",1],
    ["2.1","مقدمة إلى الرسم الرقمي",2],["2.2","رسم الأشكال",2],["2.3","لنتدرب على الأشكال",2],
    ["2.4","دمج الأشكال",2],["2.5","لنتدرب على دمج الأشكال",2],["2.6","الرسم الحر",2],
    ["3.1","الإنترنت",3],["3.2","استمتع",3],["3.3","تواصل",3],["3.4","ابحث",3]
  ].map(function (r) { return { id: r[0], no: r[0], ar: r[1], unit: r[2] }; });
  var N = L.length;

  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function P(d, a) { a = a || {}; a.d = d; return S("path", a); }
  function grad(id, stops) { return S("linearGradient", { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); })); }
  function rgrad(id, stops) { return S("radialGradient", { id: id }, stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); })); }

  /* ---- world geometry: a road winding through the village ---- */
  var W = 4600, H = 1360, MX = 360, BASE = 800, AMP = 118;
  function nodeAt(i) { var span = W - MX * 2; return { x: MX + span * (i / (N - 1)), y: BASE + (i % 2 ? -AMP : AMP) + Math.sin(i * 1.3) * 40 }; }

  /* ---- scenery ---- */
  function palm(x, y, s) {
    var g = S("g", { transform: "translate(" + x + "," + y + ") scale(" + s + ")" });
    g.appendChild(P("M-3 0 q4 -54 0 -104", { fill: "none", stroke: "#7a5a34", "stroke-width": 9, "stroke-linecap": "round" }));
    for (var d = -1; d <= 1; d += 2) for (var k = 0; k < 3; k++) g.appendChild(P("M-3 -104 q" + (d * (54 + k * 12)) + " " + (-24 - k * 8) + " " + (d * (96 + k * 14)) + " " + (10 + k * 18), { fill: "none", stroke: k % 2 ? "#4f9e4a" : "#5bb457", "stroke-width": 12 - k * 2, "stroke-linecap": "round" }));
    g.appendChild(S("circle", { cx: -3, cy: -106, r: 9, fill: "#8a5f2a" }));
    return g;
  }
  function tree(x, y, s) {
    var g = S("g", { transform: "translate(" + x + "," + y + ") scale(" + s + ")" });
    g.appendChild(P("M0 0 v-46", { stroke: "#7a5233", "stroke-width": 8, "stroke-linecap": "round" }));
    g.appendChild(S("circle", { cx: 0, cy: -60, r: 30, fill: "#5bb457" }));
    g.appendChild(S("circle", { cx: -20, cy: -48, r: 20, fill: "#4f9e4a" }));
    g.appendChild(S("circle", { cx: 20, cy: -48, r: 20, fill: "#68c063" }));
    return g;
  }
  function bush(x, y, s) { var g = S("g", { transform: "translate(" + x + "," + y + ") scale(" + s + ")" }); [-14, 0, 14].forEach(function (dx, i) { g.appendChild(S("circle", { cx: dx, cy: -i % 2 * 4, r: 13, fill: i % 2 ? "#5bb457" : "#4f9e4a" })); }); return g; }
  function flowers(x, y, s) { var g = S("g", { transform: "translate(" + x + "," + y + ") scale(" + s + ")" }); ["#ff7aa2", "#ffd23e", "#8ad6ff"].forEach(function (c, i) { g.appendChild(S("circle", { cx: i * 12 - 12, cy: -i % 2 * 6, r: 5, fill: c })); g.appendChild(P("M" + (i * 12 - 12) + " 0 v-8", { stroke: "#4f9e4a", "stroke-width": 2 })); }); return g; }

  /* ---- village buildings (the mission IS the building) ---- */
  function shadow(w) { return S("ellipse", { cx: 0, cy: 96, rx: w || 78, ry: 12, fill: "rgba(60,40,20,.22)" }); }
  function home() {
    return S("svg", { viewBox: "-100 -150 200 260" }, [
      shadow(80),
      P("M-64 -6 L0 -58 L64 -6 Z", { fill: "#e0844a", stroke: "#c96c34", "stroke-width": 3 }),
      S("rect", { x: -56, y: -6, width: 112, height: 100, rx: 4, fill: "#f2cd97", stroke: "#d9a763", "stroke-width": 3 }),
      S("rect", { x: -56, y: -6, width: 112, height: 16, fill: "#e6bd82" }),
      P("M-20 94 V44 q20 -18 40 0 V94 Z", { class: "vg-door", fill: "#8a5a30" }),
      S("g", { class: "vg-onlit" }, [S("rect", { x: -46, y: 22, width: 26, height: 26, rx: 3, fill: "url(#vgWin)" }), S("rect", { x: 20, y: 22, width: 26, height: 26, rx: 3, fill: "url(#vgWin)" })]),
      S("circle", { cx: 0, cy: -66, r: 5, fill: "#e14b3c" })
    ]);
  }
  function workshop() {
    return S("svg", { viewBox: "-100 -150 200 260" }, [
      shadow(82),
      S("rect", { x: -64, y: 0, width: 128, height: 94, rx: 4, fill: "#eec58a", stroke: "#d9a763", "stroke-width": 3 }),
      P("M-70 0 h140 l-16 -22 h-108 z", { fill: "#c96c34" }),
      P("M-52 26 h68 v14 h-68 z", { fill: "#e0533f" }),
      P("M-52 26 h14 v14 h-14 z M-24 26 h14 v14 h-14 z M4 26 h12 v14 h-12 z", { fill: "#fbe7cf" }),
      S("g", { class: "vg-gear" }, [S("circle", { cx: 30, cy: 60, r: 16, fill: "none", stroke: "#8a5a30", "stroke-width": 5 }), S("circle", { cx: 30, cy: 60, r: 5, class: "vg-core", fill: "#f2a541" })]),
      S("g", { class: "vg-onlit" }, [S("rect", { x: -44, y: 54, width: 34, height: 40, rx: 3, fill: "url(#vgWin)" })])
    ]);
  }
  function school() {
    return S("svg", { viewBox: "-105 -155 210 265" }, [
      shadow(88),
      S("rect", { x: -74, y: -8, width: 148, height: 102, rx: 4, fill: "#f2cd97", stroke: "#d9a763", "stroke-width": 3 }),
      P("M-84 -8 h168 l-20 -30 h-128 z", { fill: "#3f7fb0" }),
      S("rect", { x: -14, y: -44, width: 28, height: 22, fill: "#f2cd97", stroke: "#d9a763", "stroke-width": 2 }),
      P("M0 -66 v-12 M0 -78 h18 l-5 6 l5 6 h-18 z", { fill: "#ffd23e", stroke: "#e0a83a" }),
      P("M-24 94 V40 q24 -20 48 0 V94 Z", { class: "vg-door", fill: "#8a5a30" }),
      S("g", { class: "vg-onlit" }, [S("rect", { x: -60, y: 16, width: 24, height: 26, rx: 3, fill: "url(#vgWin)" }), S("rect", { x: 36, y: 16, width: 24, height: 26, rx: 3, fill: "url(#vgWin)" })])
    ]);
  }
  function cafe() {   /* internet café — unit 3 "لنتصفح" */
    return S("svg", { viewBox: "-100 -150 200 260" }, [
      shadow(80),
      S("rect", { x: -62, y: 4, width: 124, height: 90, rx: 4, fill: "#e8bf88", stroke: "#d9a763", "stroke-width": 3 }),
      P("M-70 4 h140 v-16 h-140 z", { fill: "#2fa39a" }),
      S("rect", { x: -40, y: 24, width: 80, height: 44, rx: 4, fill: "#173247", stroke: "#0e2233", "stroke-width": 3 }),
      S("g", { class: "vg-onlit" }, [S("rect", { x: -32, y: 30, width: 64, height: 32, rx: 2, fill: "url(#vgScreen)" }), S("circle", { cx: 0, cy: 46, r: 8, fill: "#8ad6ff" })]),
      S("rect", { x: -14, y: 68, width: 28, height: 26, fill: "#8a5a30" })
    ]);
  }
  function garden() {
    return S("svg", { viewBox: "-100 -150 200 260" }, [
      shadow(70),
      S("g", { transform: "translate(-30,96)" }, [palm(0, 0, 0.9)]),
      P("M6 94 V52 a44 20 0 0 1 88 0 V94 Z", { fill: "#e8bf88", stroke: "#d9a763", "stroke-width": 3 }),
      S("g", { class: "vg-onwater" }, [S("ellipse", { cx: 50, cy: 52, rx: 44, ry: 11, fill: "url(#vgWater)" })]),
      S("ellipse", { cx: 50, cy: 52, rx: 44, ry: 11, fill: "none", stroke: "#c98a54", "stroke-width": 3 })
    ]);
  }
  function place(host, ctx) {
    var i = ctx.index, u = L[i].unit, node;
    if (u === 3) node = i % 2 ? garden() : cafe();
    else if (i % 5 === 0) node = school();
    else if (i % 3 === 1) node = workshop();
    else if (i % 4 === 3) node = garden();
    else node = home();
    host.appendChild(node);
  }

  /* per-world signage — a bright painted village board hanging from a post */
  function sign(ctx) {
    return E("div", { class: "vg-sign" }, [E("div", { class: "vg-sign__board" }, [
      E("span", { class: "vg-sign__no", text: ctx.no }),
      E("span", { class: "vg-sign__name", text: ctx.name })
    ])]);
  }

  function traveler() {   /* friendly hudhud */
    return S("svg", { viewBox: "0 0 80 80" }, [
      S("ellipse", { cx: 40, cy: 72, rx: 18, ry: 4, fill: "rgba(0,0,0,.2)" }),
      P("M40 22 q13 0 15 13 l9 -4 l-6 9 q6 6 6 15 q0 17 -24 17 q-24 0 -24 -19 q0 -15 9 -25 q5 -6 5 -15 q0 6 4 9 z", { fill: "#e79a3c" }),
      P("M40 26 q9 2 11 11 q-7 -2 -11 -11 z", { fill: "#c97a24" }),
      S("g", { class: "vg-crest" }, [P("M38 14 l3 -8 l3 8 z M44 14 l3 -8 l3 8 z", { fill: "#e14b3c" })]),
      S("circle", { cx: 34, cy: 40, r: 3.4, fill: "#3a1f08" }),
      P("M20 44 q-11 2 -16 -3 q9 6 16 8 z", { fill: "#ffd23e" })
    ]);
  }

  function layers(env, ctx) {
    var svg = S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
    var R = rng(1101);
    svg.appendChild(S("defs", {}, [
      grad("vgSky", [["0%", "#8fd3f4"], ["55%", "#bfe6f2"], ["100%", "#ecdfc0"]]),
      grad("vgHill", [["0%", "#a9d47e"], ["100%", "#7bb85a"]]),
      grad("vgHill2", [["0%", "#8ec96f"], ["100%", "#5ea24a"]]),
      grad("vgGround", [["0%", "#e7c88f"], ["100%", "#c99b5e"]]),
      grad("vgWin", [["0%", "#fff2c0"], ["100%", "#ffcf6b"]]),
      grad("vgScreen", [["0%", "#bfe9ff"], ["100%", "#4fa8e0"]]),
      grad("vgWater", [["0%", "#bff0ee"], ["100%", "#4fc6c0"]]),
      rgrad("vgSun", [["0%", "#fff6d8", 1], ["100%", "#ffe08a", 0]])
    ]));
    svg.appendChild(S("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#vgSky)" }));
    svg.appendChild(S("circle", { cx: W * 0.16, cy: H * 0.2, r: 78, fill: "#fff3c8" }));
    svg.appendChild(S("circle", { cx: W * 0.16, cy: H * 0.2, r: 190, fill: "url(#vgSun)" }));
    for (var c = 0; c < 9; c++) { var cx = R() * W, cy = H * (0.08 + R() * 0.24), cs = 0.9 + R() * 1.4; svg.appendChild(S("g", { transform: "translate(" + cx + "," + cy + ") scale(" + cs + ")", opacity: 0.9, class: "vg-cloud" }, [P("M-70 0 q-6 -30 26 -28 q6 -24 38 -16 q20 -14 42 6 q30 -2 26 26 z", { fill: "#ffffff" })])); }
    /* palm-dotted green hills */
    var h1 = "M0 " + (H * 0.6); for (var x = 0; x <= W; x += 260) h1 += " L" + x + " " + (H * 0.5 - Math.sin(x * 0.003) * 70 - R() * 30); h1 += " L" + W + " " + H + " L0 " + H + " Z";
    svg.appendChild(P(h1, { fill: "url(#vgHill)", opacity: 0.85 }));
    var h2 = "M0 " + (H * 0.7); for (var x2 = 0; x2 <= W; x2 += 220) h2 += " L" + x2 + " " + (H * 0.6 - Math.sin(x2 * 0.005 + 2) * 50 - R() * 24); h2 += " L" + W + " " + H + " L0 " + H + " Z";
    svg.appendChild(P(h2, { fill: "url(#vgHill2)" }));
    /* distant minaret + a couple far houses */
    var mx = W * 0.82;
    svg.appendChild(S("g", { opacity: 0.9 }, [S("rect", { x: mx - 12, y: H * 0.4, width: 24, height: H * 0.2, fill: "#f2e2c4" }), P("M" + (mx - 16) + " " + (H * 0.4) + " h32 l-16 -30 z", { fill: "#3f7fb0" }), S("circle", { cx: mx, cy: H * 0.4 - 34, r: 5, fill: "#ffd23e" })]));
    /* ground */
    svg.appendChild(P("M0 " + (H * 0.74) + " Q" + (W / 2) + " " + (H * 0.68) + " " + W + " " + (H * 0.74) + " V" + H + " H0 Z", { fill: "url(#vgGround)" }));
    /* stone road along the trail (built from node points) */
    var pts = []; for (var i = 0; i < N; i++) { var p = nodeAt(i); pts.push({ x: p.x, y: p.y + 92 }); }
    var d = "M" + pts[0].x + " " + pts[0].y; for (var k = 1; k < pts.length; k++) { var a = pts[k - 1], b = pts[k], hx = (a.x + b.x) / 2; d += " C" + hx + " " + a.y + " " + hx + " " + b.y + " " + b.x + " " + b.y; }
    svg.appendChild(P(d, { fill: "none", stroke: "#d9bd8c", "stroke-width": 42, "stroke-linecap": "round" }));
    svg.appendChild(P(d, { fill: "none", stroke: "#c7a570", "stroke-width": 42, "stroke-linecap": "round", "stroke-dasharray": "2 46" }));
    /* a bright falaj running beside part of the road */
    svg.appendChild(P(d, { fill: "none", stroke: "url(#vgWater)", "stroke-width": 8, "stroke-linecap": "round", class: "vg-falaj", transform: "translate(0,34)", opacity: 0.85 }));
    /* scattered greenery + flowers */
    for (var g = 0; g < 40; g++) { var gx = 160 + R() * (W - 320), gy = H * 0.72 + R() * (H * 0.24), t = R(); if (t < 0.3) svg.appendChild(palm(gx, gy, 0.5 + R() * 0.4)); else if (t < 0.6) svg.appendChild(tree(gx, gy, 0.5 + R() * 0.4)); else if (t < 0.82) svg.appendChild(bush(gx, gy, 0.7 + R() * 0.6)); else svg.appendChild(flowers(gx, gy, 0.8 + R() * 0.6)); }
    env.appendChild(svg);
  }

  ADV.register({
    code: "g1s1", storageKey: "waha:g1s1:wahat.g1.v1",
    title: "قرية التقنية المفقودة", subtitle: "الصف الأول · الفصل الأول",
    gradeLabel: "الصف الأول · الفصل الأول",
    lessons: L, unitOf: function (l) { return UNITS[l.unit]; },
    readDone: function (pr, l) { var e = pr && pr.progress && pr.progress.lessons && pr.progress.lessons[l.id]; return !!(e && e.completed); },
    intro: "أهلًا بك في القرية! القرية تنتظر من يُعيد إليها الحياة. سِر على الطريق الحجري بين البيوت والورش؛ كل مكان تُنجزه تُضيء نوافذه ويجري فلجه وتعود القرية زاهية.",
    msgStart: "ابدأ من أول بيت على الطريق — انقر لتدخل مهمتك الأولى!",
    msgLocked: "هذا المكان مقفل — أنِر المكان السابق ليفتح الطريق إليه.",
    msgDone: "أحسنت! أضأتَ مكانًا جديدًا في القرية.",
    completeTitle: "أضأتَ القرية كلها! 🎉",
    completeText: "عادت الحياة إلى كل بيوت القرية وورشها وحدائقها بعد أن أكملت كل المهام. أحسنت!",
    theme: {
      "--adv-bg": "#bfe6f2",
      "--adv-accent": "#2fa8c9", "--adv-accent-2": "#ffb43e", "--adv-accent-2b": "#2f96b4",
      "--adv-done": "#57c98a", "--adv-locked": "#9aa7b3", "--adv-glow": "rgba(47,168,201,.55)",
      "--path-c": "rgba(255,255,255,.4)"
    },
    world: { size: { w: W, h: H }, nodeAt: nodeAt, layers: layers, place: place, sign: sign, traveler: traveler }
  });
})();
