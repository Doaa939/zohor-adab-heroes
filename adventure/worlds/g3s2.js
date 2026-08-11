/*!
 * adventure/worlds/g3s2.js — «مدينة الروبوتات» (Grade 3 · Semester 2)
 * GAME TYPE: FUTURISTIC ENERGY RACE. A neon night city. A glowing race-track
 * threads energy checkpoints — labs, robot districts, energy gates. A hovercar
 * is the traveler; finishing a checkpoint powers its district (neon on, robot
 * awake) and the car speeds to the next. Futuristic (Grade 3).
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg, E = ADV._el;
  var DISTRICT = { 1: "الحي الأول", 2: "الحي الثاني" };
  var L = [
    ["s2-l1-1","1.1","التعامل مع الخوارزميات",1],["s2-l1-2","1.2","البرمجة في Scratch",1],
    ["s2-l1-3","1.3","تصحيح الأخطاء",1],["s2-l1-4","1.4","الدوران",1],
    ["s2-l1-5","1.5","لنتدرب على Scratch",1],["s2-l1-6","1.6","التكرارات",1],
    ["s2-l1-7","1.7","لنتدرب على التكرارات",1],["s2-l1-8","1.8","الرسم في Scratch",1],
    ["s2-l1-9","1.9","لنتدرب على لبنات القلم",1],["s2-l1-10","1.10","المشروع",1],
    ["s2-l2-1","2.1","الأشكال وطرق عرضها",2],["s2-l2-2","2.2","تحرير الكائنات ثلاثية الأبعاد",2],
    ["s2-l2-3","2.3","لنتدرب على الكائنات ثلاثية الأبعاد",2],["s2-l2-4","2.4","الرسم الحر ثلاثي الأبعاد",2]
  ].map(function (r) { return { id: r[0], no: r[1], ar: r[2], unit: r[3] }; });
  var N = L.length;

  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function P(d, a) { a = a || {}; a.d = d; return S("path", a); }
  function grad(id, stops) { return S("linearGradient", { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); })); }
  function rgrad(id, stops) { return S("radialGradient", { id: id }, stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); })); }

  var W = 4600, H = 1320, MX = 360, BASE = 780, AMP = 128;
  function nodeAt(i) { var span = W - MX * 2; return { x: MX + span * (i / (N - 1)), y: BASE + (i % 2 ? -AMP : AMP) + Math.sin(i * 1.6) * 30 }; }

  function drone(x, y, s) { return S("g", { transform: "translate(" + x + "," + y + ") scale(" + s + ")", class: "rc-drone" }, [S("ellipse", { cx: 0, cy: 30, rx: 20, ry: 4, fill: "rgba(46,230,198,.15)" }), S("rect", { x: -14, y: -4, width: 28, height: 12, rx: 6, fill: "#1b2b44", stroke: "#2ee6c6", "stroke-width": 1.5 }), S("circle", { cx: 0, cy: 2, r: 3, fill: "#2ee6c6" }), P("M-14 -4 h-8 M14 -4 h8", { stroke: "#2ee6c6", "stroke-width": 2 })]); }

  function lab() {
    return S("svg", { viewBox: "-90 -155 180 245" }, [
      S("ellipse", { cx: 0, cy: 84, rx: 54, ry: 7, fill: "rgba(0,0,0,.45)" }),
      S("rect", { x: -50, y: -60, width: 100, height: 144, rx: 6, fill: "#122036", stroke: "#2ee6c6", "stroke-width": 2 }),
      S("rect", { x: -34, y: -44, width: 68, height: 40, rx: 3, fill: "#0a1526" }),
      S("g", { class: "rc-onlit" }, [S("circle", { cx: 0, cy: -24, r: 12, class: "rc-core", fill: "#2ee6c6" }),
        S("rect", { x: -34, y: 8, width: 16, height: 16, class: "rc-win", fill: "#2ee6c6" }), S("rect", { x: -8, y: 8, width: 16, height: 16, class: "rc-win", fill: "#2ee6c6" }), S("rect", { x: 18, y: 8, width: 16, height: 16, class: "rc-win", fill: "#2ee6c6" })]),
      S("rect", { x: -18, y: 44, width: 36, height: 40, rx: 3, fill: "#0a1526", stroke: "#1c3350", "stroke-width": 2 })
    ]);
  }
  function robotHouse() {
    return S("svg", { viewBox: "-90 -160 180 250" }, [
      S("ellipse", { cx: 0, cy: 84, rx: 46, ry: 7, fill: "rgba(0,0,0,.45)" }),
      S("rect", { x: -46, y: -40, width: 92, height: 124, rx: 8, fill: "#1b2b44", stroke: "#a98bff", "stroke-width": 2 }),
      /* a robot standing at the door */
      S("g", { class: "rc-robot" }, [
        S("rect", { x: -22, y: 6, width: 44, height: 42, rx: 8, fill: "#20304c", stroke: "#a98bff", "stroke-width": 2 }),
        S("rect", { x: -14, y: -20, width: 28, height: 24, rx: 6, fill: "#26375a", stroke: "#a98bff", "stroke-width": 2 }),
        S("circle", { cx: -6, cy: -8, r: 4, class: "rc-eye" }), S("circle", { cx: 8, cy: -8, r: 4, class: "rc-eye" }),
        P("M0 -20 v-8", { stroke: "#a98bff", "stroke-width": 2 }), S("circle", { cx: 0, cy: -30, r: 3, class: "rc-core", fill: "#2ee6c6" })
      ]),
      S("g", { class: "rc-onlit" }, [S("rect", { x: -38, y: -30, width: 12, height: 12, class: "rc-win", fill: "#a98bff" }), S("rect", { x: 26, y: -30, width: 12, height: 12, class: "rc-win", fill: "#a98bff" })])
    ]);
  }
  function gateChk() {   /* an energy checkpoint arch over the track */
    return S("svg", { viewBox: "-100 -150 200 240" }, [
      S("ellipse", { cx: 0, cy: 84, rx: 60, ry: 7, fill: "rgba(0,0,0,.4)" }),
      S("rect", { x: -70, y: -30, width: 16, height: 114, rx: 4, fill: "#1b2b44", stroke: "#ff5aa0", "stroke-width": 2 }),
      S("rect", { x: 54, y: -30, width: 16, height: 114, rx: 4, fill: "#1b2b44", stroke: "#ff5aa0", "stroke-width": 2 }),
      P("M-62 -30 q62 -44 124 0", { fill: "none", stroke: "#ff5aa0", "stroke-width": 5, class: "rc-arc" }),
      S("g", { class: "rc-onlit" }, [P("M-54 -18 q54 -34 108 0", { fill: "none", stroke: "#2ee6c6", "stroke-width": 3, class: "rc-beam" })])
    ]);
  }
  function place(host, ctx) { var i = ctx.index, r = i % 3; host.appendChild(r === 0 ? gateChk() : r === 1 ? robotHouse() : lab()); }

  /* per-world signage — a holographic building display panel */
  function sign(ctx) {
    return E("div", { class: "rc-sign" }, [E("div", { class: "rc-sign__holo" }, [
      E("span", { class: "rc-sign__no", text: ctx.no }),
      E("span", { class: "rc-sign__name", text: ctx.name })
    ])]);
  }
  function traveler() {   /* a hovercar */
    return S("svg", { viewBox: "0 0 110 60" }, [
      S("ellipse", { cx: 55, cy: 52, rx: 44, ry: 6, fill: "rgba(46,230,198,.2)", class: "rc-hoverglow" }),
      P("M14 40 q4 -22 30 -24 h26 q22 2 28 24 q2 8 -8 10 h-70 q-8 -2 -6 -10 z", { fill: "#20304c", stroke: "#2ee6c6", "stroke-width": 2 }),
      P("M32 18 q10 -8 40 -6 q16 2 18 12 z", { fill: "#0a1526", stroke: "#8ff3e6", "stroke-width": 1.5 }),
      S("rect", { x: 22, y: 44, width: 20, height: 5, rx: 2, fill: "#ff5aa0" }), S("rect", { x: 68, y: 44, width: 20, height: 5, rx: 2, fill: "#ff5aa0" }),
      S("circle", { cx: 84, cy: 30, r: 4, fill: "#ffe066" })
    ]);
  }

  function layers(env, ctx) {
    var svg = S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
    var R = rng(3202);
    svg.appendChild(S("defs", {}, [
      grad("rcSky", [["0%", "#0a0f26"], ["55%", "#1a1240"], ["100%", "#2a1a4a"]]),
      grad("rcGround", [["0%", "#141033"], ["100%", "#0a0820"]]),
      rgrad("rcGlowC", [["0%", "#2ee6c6", 0.8], ["100%", "#2ee6c6", 0]]),
      rgrad("rcGlowM", [["0%", "#ff5aa0", 0.7], ["100%", "#ff5aa0", 0]])
    ]));
    svg.appendChild(S("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#rcSky)" }));
    for (var s = 0; s < 90; s++) { svg.appendChild(S("circle", { cx: R() * W, cy: R() * H * 0.5, r: R() * 1.3 + 0.3, fill: "#bfe3ff", opacity: 0.14 + R() * 0.4 })); }
    /* neon skyline (far → near), lit windows */
    for (var layer = 0; layer < 2; layer++) {
      var baseY = H * (0.62 - layer * 0.06), col = layer ? "#171238" : "#120f2c";
      for (var bx = -40; bx < W; bx += 150 + R() * 90) {
        var bw = 80 + R() * 90, bh = 120 + R() * (260 - layer * 60);
        svg.appendChild(S("rect", { x: bx, y: baseY - bh, width: bw, height: bh, fill: col }));
        var edge = R() < 0.5 ? "#2ee6c6" : "#ff5aa0";
        svg.appendChild(S("rect", { x: bx, y: baseY - bh, width: bw, height: bh, fill: "none", stroke: edge, "stroke-width": 1.4, opacity: 0.5 }));
        for (var wy = baseY - bh + 14; wy < baseY - 12; wy += 22) for (var wx = bx + 8; wx < bx + bw - 8; wx += 20) if (R() < 0.5) svg.appendChild(S("rect", { x: wx, y: wy, width: 8, height: 10, fill: R() < 0.5 ? "#2ee6c6" : "#ffe066", opacity: 0.5 + R() * 0.4 }));
      }
    }
    /* ground */
    svg.appendChild(S("rect", { x: 0, y: H * 0.7, width: W, height: H * 0.3, fill: "url(#rcGround)" }));
    /* perspective grid on the ground */
    for (var gl = 0; gl < 40; gl++) svg.appendChild(S("line", { x1: gl * 130, y1: H * 0.7, x2: gl * 130 - 300, y2: H, stroke: "rgba(46,230,198,.12)", "stroke-width": 2 }));
    for (var gh = 0; gh < 6; gh++) svg.appendChild(S("line", { x1: 0, y1: H * 0.7 + gh * gh * 8, x2: W, y2: H * 0.7 + gh * gh * 8, stroke: "rgba(46,230,198,.1)", "stroke-width": 2 }));
    /* neon race track (built from node points) */
    var pts = []; for (var i = 0; i < N; i++) { var p = nodeAt(i); pts.push({ x: p.x, y: p.y + 92 }); }
    var d = "M" + pts[0].x + " " + pts[0].y; for (var k = 1; k < pts.length; k++) { var a = pts[k - 1], b = pts[k], hx = (a.x + b.x) / 2; d += " C" + hx + " " + a.y + " " + hx + " " + b.y + " " + b.x + " " + b.y; }
    svg.appendChild(P(d, { fill: "none", stroke: "#241a40", "stroke-width": 40, "stroke-linecap": "round" }));
    svg.appendChild(P(d, { fill: "none", stroke: "#ff5aa0", "stroke-width": 5, "stroke-linecap": "round", transform: "translate(0,-13)", opacity: 0.7 }));
    svg.appendChild(P(d, { fill: "none", stroke: "#2ee6c6", "stroke-width": 5, "stroke-linecap": "round", transform: "translate(0,13)", opacity: 0.7 }));
    svg.appendChild(P(d, { fill: "none", stroke: "#8ff3e6", "stroke-width": 4, "stroke-linecap": "round", "stroke-dasharray": "10 26", class: "rc-track" }));
    /* drones */
    for (var dr = 0; dr < 10; dr++) svg.appendChild(drone(200 + R() * (W - 400), H * 0.2 + R() * (H * 0.3), 0.7 + R() * 0.8));
    env.appendChild(svg);
  }

  ADV.register({
    code: "g3s2", storageKey: "waha:g3s2:wahat.g3.s2.v1",
    title: "مدينة الروبوتات", subtitle: "الصف الثالث · الفصل الثاني",
    gradeLabel: "الصف الثالث · الفصل الثاني",
    lessons: L, unitOf: function (l) { return DISTRICT[l.unit]; },
    intro: "مدينة الروبوتات مظلمة بلا طاقة، ومركبتك على خط السباق. انطلق بين نقاط التفتيش المضيئة؛ كل مهمة تُنجزها تُشحن حيًّا كاملًا: تُضيء نيوناته ويستيقظ روبوته، وتنطلق المركبة إلى نقطة التفتيش التالية.",
    msgStart: "المركبة عند خط الانطلاق — انقر لتبدأ السباق!",
    msgLocked: "نقطة التفتيش هذه مطفأة — اشحن ما قبلها لتصل الطاقة.",
    msgDone: "أحسنت! شُحن الحي وأضاءت نيوناته واستيقظ روبوته.",
    completeTitle: "أضأتَ مدينة الروبوتات كلها! 🤖",
    completeText: "عبرتَ كل نقاط التفتيش وشحنتَ كل الأحياء؛ استيقظت روبوتات المدينة وعملت بالكامل. أحسنت!",
    theme: {
      "--adv-bg": "#0a0f26",
      "--adv-accent": "#2ee6c6", "--adv-accent-2": "#ff5aa0", "--adv-accent-2b": "#1fb6a0",
      "--adv-done": "#2ee6c6", "--adv-locked": "#5a5a86", "--adv-glow": "rgba(46,230,198,.6)",
      "--path-c": "rgba(46,230,198,.4)"
    },
    world: { size: { w: W, h: H }, nodeAt: nodeAt, layers: layers, place: place, sign: sign, traveler: traveler }
  });
})();
