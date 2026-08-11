/*!
 * adventure/worlds/g1s2.js — «قطار الأوامر العجيب» (Grade 1 · Semester 2)
 * GAME TYPE: TRAIN JOURNEY. A cheerful railway crosses hills, a bridge and a
 * tunnel. Each mission is a STATION along the line; the little train is the
 * traveler. Completing a station turns its signal green and the train rolls on
 * to the next stop. Grade-1 friendly: bright and playful.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg, E = ADV._el;
  var UNITS = { 1: "لنفكّر", 2: "هيا نبرمج" };
  var L = [
    ["u1-l1","1.1","اتّباع التعليمات",1],["u1-l2","1.2","تنفيذ مهمة بسيطة",1],
    ["u1-l3","1.3","استكشاف الأخطاء",1],["u1-l4","1.4","تنفيذ مهمة معقدة",1],
    ["u2-l1","2.1","اتّباع القواعد",2],["u2-l2","2.2","البرمجة في تطبيق ScratchJr",2],
    ["u2-l3","2.3","لنتدرب على تطبيق ScratchJr",2],["u2-l4","2.4","التعامل مع الخلفية",2],
    ["u2-l5","2.5","لنتدرب على التعامل مع الخلفية",2],["u2-l6","2.6","تدوير الكائن",2],
    ["u2-l7","2.7","لنتدرب على التدوير",2],["u2-l8","2.8","التحكم بالسرعة",2],
    ["u2-l9","2.9","لنتدرب على التحكم بالسرعة",2],["u2-l10","2.10","المشروع",2]
  ].map(function (r) { return { id: r[0], no: r[1], ar: r[2], unit: r[3] }; });
  var N = L.length;

  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function P(d, a) { a = a || {}; a.d = d; return S("path", a); }
  function grad(id, stops) { return S("linearGradient", { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); })); }

  /* rail line: mostly horizontal with gentle grade */
  var W = 4600, H = 1280, MX = 360, BASE = 760, AMP = 66;
  function nodeAt(i) { var span = W - MX * 2; return { x: MX + span * (i / (N - 1)), y: BASE + Math.sin(i * 0.8) * AMP + Math.cos(i * 1.9) * 22 }; }

  function tree(x, y, s) { var g = S("g", { transform: "translate(" + x + "," + y + ") scale(" + s + ")" }); g.appendChild(P("M0 0 v-40", { stroke: "#6f4a2c", "stroke-width": 8, "stroke-linecap": "round" })); g.appendChild(S("circle", { cx: 0, cy: -52, r: 26, fill: "#4f9e4a" })); g.appendChild(S("circle", { cx: -16, cy: -42, r: 17, fill: "#5bb457" })); g.appendChild(S("circle", { cx: 16, cy: -42, r: 17, fill: "#68c063" })); return g; }

  function station() {
    return S("svg", { viewBox: "-100 -150 200 250" }, [
      S("ellipse", { cx: 0, cy: 92, rx: 84, ry: 11, fill: "rgba(60,40,20,.2)" }),
      S("rect", { x: -84, y: 78, width: 168, height: 14, rx: 3, fill: "#7a8894" }),   /* platform */
      S("rect", { x: -58, y: 6, width: 116, height: 74, rx: 4, fill: "#f2d9a6", stroke: "#d9a763", "stroke-width": 3 }),  /* shelter */
      P("M-66 6 h132 l-16 -26 h-100 z", { fill: "#c85a3a" }),
      P("M-66 6 h132 v-8 h-132 z", { fill: "#a8472c" }),
      P("M-16 80 V38 q16 -14 32 0 V80 Z", { class: "tr-door", fill: "#8a5a30" }),
      S("g", { class: "tr-onlit" }, [S("rect", { x: -48, y: 24, width: 26, height: 26, rx: 3, fill: "url(#trWin)" })]),
      /* signal post — turns green when done */
      S("g", {}, [S("rect", { x: 52, y: -34, width: 6, height: 56, fill: "#4a5a68" }),
        S("circle", { cx: 55, cy: -40, r: 10, class: "tr-sigred" }),
        S("circle", { cx: 55, cy: -40, r: 10, class: "tr-siggreen" })])
    ]);
  }
  function place(host, ctx) { host.appendChild(station()); }

  /* per-world signage — a railway station name board on two posts */
  function sign(ctx) {
    return E("div", { class: "tr-sign" }, [E("div", { class: "tr-sign__board" }, [
      E("span", { class: "tr-sign__no", text: ctx.no }),
      E("span", { class: "tr-sign__name", text: ctx.name })
    ])]);
  }

  function traveler() {   /* the little train */
    return S("svg", { viewBox: "0 0 120 70" }, [
      S("ellipse", { cx: 60, cy: 62, rx: 52, ry: 5, fill: "rgba(0,0,0,.22)" }),
      S("rect", { x: 60, y: 26, width: 46, height: 26, rx: 5, fill: "#f0b93e", stroke: "#d99a2a", "stroke-width": 2 }),
      S("rect", { x: 66, y: 31, width: 14, height: 12, rx: 2, fill: "#bfe9ff" }),
      P("M18 52 V30 q0 -8 8 -8 h20 q6 0 6 8 V52 Z", { fill: "#e0533f", stroke: "#c33f2c", "stroke-width": 2 }),
      S("rect", { x: 26, y: 30, width: 14, height: 12, rx: 2, fill: "#bfe9ff" }),
      S("rect", { x: 44, y: 14, width: 8, height: 12, fill: "#c33f2c" }),
      S("circle", { cx: 30, cy: 54, r: 7, fill: "#28323c" }), S("circle", { cx: 52, cy: 54, r: 7, fill: "#28323c" }),
      S("circle", { cx: 78, cy: 54, r: 7, fill: "#28323c" }), S("circle", { cx: 98, cy: 54, r: 7, fill: "#28323c" }),
      S("g", { class: "tr-smoke" }, [S("circle", { cx: 48, cy: 8, r: 6, fill: "#fff", opacity: .8 }), S("circle", { cx: 40, cy: 2, r: 4, fill: "#fff", opacity: .6 })])
    ]);
  }

  function layers(env, ctx) {
    var svg = S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
    var R = rng(1202);
    svg.appendChild(S("defs", {}, [
      grad("trSky", [["0%", "#ffd9a0"], ["40%", "#ffc98f"], ["70%", "#9fd8ec"], ["100%", "#cfeaf2"]]),
      grad("trHill", [["0%", "#9ccf74"], ["100%", "#6faa52"]]),
      grad("trHill2", [["0%", "#7fbf63"], ["100%", "#528f43"]]),
      grad("trGround", [["0%", "#cdb083"], ["100%", "#a98657"]]),
      grad("trWin", [["0%", "#fff2c0"], ["100%", "#ffcf6b"]]),
      grad("trRiver", [["0%", "#bfeef2"], ["100%", "#5fb8d0"]])
    ]));
    svg.appendChild(S("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#trSky)" }));
    svg.appendChild(S("circle", { cx: W * 0.78, cy: H * 0.22, r: 66, fill: "#fff4d0" }));
    for (var c = 0; c < 8; c++) { var cx = R() * W, cy = H * (0.1 + R() * 0.22), cs = 0.9 + R() * 1.3; svg.appendChild(S("g", { transform: "translate(" + cx + "," + cy + ") scale(" + cs + ")", opacity: .9, class: "tr-cloud" }, [P("M-66 0 q-6 -28 26 -26 q6 -22 36 -15 q19 -13 40 6 q28 -2 24 24 z", { fill: "#fff" })])); }
    var h1 = "M0 " + (H * 0.58); for (var x = 0; x <= W; x += 260) h1 += " L" + x + " " + (H * 0.46 - Math.sin(x * 0.003) * 66 - R() * 26); h1 += " L" + W + " " + H + " L0 " + H + " Z";
    svg.appendChild(P(h1, { fill: "url(#trHill)", opacity: .88 }));
    var h2 = "M0 " + (H * 0.7); for (var x2 = 0; x2 <= W; x2 += 220) h2 += " L" + x2 + " " + (H * 0.58 - Math.sin(x2 * 0.005 + 2) * 46 - R() * 20); h2 += " L" + W + " " + H + " L0 " + H + " Z";
    svg.appendChild(P(h2, { fill: "url(#trHill2)" }));
    /* a tunnel mouth through a big hill on the right */
    var tx = W * 0.62;
    svg.appendChild(S("g", {}, [P("M" + (tx - 130) + " " + (H * 0.62) + " a130 130 0 0 1 260 0 Z", { fill: "#4a7a3c" }), P("M" + (tx - 46) + " " + (H * 0.62) + " a46 60 0 0 1 92 0 Z", { fill: "#101a10" }), P("M" + (tx - 52) + " " + (H * 0.62) + " a52 66 0 0 1 104 0", { fill: "none", stroke: "#3a5a2c", "stroke-width": 8 })]));
    svg.appendChild(P("M0 " + (H * 0.72) + " Q" + (W / 2) + " " + (H * 0.67) + " " + W + " " + (H * 0.72) + " V" + H + " H0 Z", { fill: "url(#trGround)" }));
    /* a river with a bridge crossing under one dip */
    svg.appendChild(S("ellipse", { cx: W * 0.34, cy: H * 0.9, rx: 320, ry: 60, fill: "url(#trRiver)", class: "tr-river" }));

    /* the railway (built from node points) */
    var pts = []; for (var i = 0; i < N; i++) { var p = nodeAt(i); pts.push({ x: p.x, y: p.y + 88 }); }
    var d = "M" + pts[0].x + " " + pts[0].y; for (var k = 1; k < pts.length; k++) { var a = pts[k - 1], b = pts[k], hx = (a.x + b.x) / 2; d += " C" + hx + " " + a.y + " " + hx + " " + b.y + " " + b.x + " " + b.y; }
    svg.appendChild(P(d, { fill: "none", stroke: "#8a6b4a", "stroke-width": 30, "stroke-linecap": "round" }));           /* rail bed */
    svg.appendChild(P(d, { fill: "none", stroke: "#5a4630", "stroke-width": 30, "stroke-linecap": "butt", "stroke-dasharray": "5 22" }));  /* sleepers */
    svg.appendChild(P(d, { fill: "none", stroke: "#dfe6ec", "stroke-width": 4, "stroke-linecap": "round", transform: "translate(0,-7)" }));
    svg.appendChild(P(d, { fill: "none", stroke: "#dfe6ec", "stroke-width": 4, "stroke-linecap": "round", transform: "translate(0,7)" }));
    /* lit path up to progress */
    for (var g = 0; g < 34; g++) { var gx = 160 + R() * (W - 320), gy = H * 0.74 + R() * (H * 0.22); svg.appendChild(tree(gx, gy, 0.5 + R() * 0.5)); }
    env.appendChild(svg);
  }

  ADV.register({
    code: "g1s2", storageKey: "waha:g1s2:wadi.g1s2.v1",
    title: "قطار الأوامر العجيب", subtitle: "الصف الأول · الفصل الثاني",
    gradeLabel: "الصف الأول · الفصل الثاني",
    lessons: L, unitOf: function (l) { return UNITS[l.unit]; },
    intro: "استعدّ للرحلة! قطار الأوامر العجيب يقف عند أول محطة. كل مهمة تُنجزها تُحوّل إشارة المحطة إلى الأخضر ويتقدّم القطار على السكة عبر التلال والجسر والنفق نحو المحطة التالية.",
    msgStart: "القطار ينتظرك عند المحطة الأولى — انقر لتبدأ الرحلة!",
    msgLocked: "هذه المحطة مقفلة — أضِئ المحطة السابقة ليصلها القطار.",
    msgDone: "أحسنت! صارت الإشارة خضراء وتحرّك القطار.",
    completeTitle: "وصل القطار إلى محطته الأخيرة! 🚂",
    completeText: "أضأتَ كل إشارات الخط، وأكمل قطار الأوامر رحلته حتى المحطة الأخيرة. أحسنت!",
    theme: {
      "--adv-bg": "#cfeaf2",
      "--adv-accent": "#e0533f", "--adv-accent-2": "#f0b93e", "--adv-accent-2b": "#c94f3d",
      "--adv-done": "#57c98a", "--adv-locked": "#9aa7b3", "--adv-glow": "rgba(224,83,63,.5)",
      "--path-c": "rgba(255,255,255,.35)"
    },
    world: { size: { w: W, h: H }, nodeAt: nodeAt, layers: layers, place: place, sign: sign, traveler: traveler }
  });
})();
