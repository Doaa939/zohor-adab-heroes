/*!
 * adventure/worlds/g4s1.js — «استوديو الإنتاج الرقمي» (Grade 4 · Semester 1)
 * GAME TYPE: PRODUCTION CAMPUS. A professional digital studio lot at night —
 * soundstages, an edit wall, a presentation hall, a comms office, all under
 * stage-light beams. Each mission is a FACILITY; completing it switches its
 * screens on and lights its «ON AIR» sign. Professional / futuristic (Grade 4).
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg, E = ADV._el;
  var WING = { 1: "حاسوبي", 2: "لنعرض أفكارنا", 3: "عالمي المتصل" };
  var L = [
    ["l1-1","1.1","كيفية عمل جهاز الحاسوب",1],["l1-2","1.2","التعامل مع الوسائط المتعددة",1],
    ["l1-3","1.3","أجهزة الوسائط المتعددة",1],["l1-4","1.4","تطبيق التأثيرات على الصور",1],
    ["l1-5","1.5","دعنا نتذكر",1],["l1-6","1.6","إنشاء قصة متحركة",1],
    ["l2-1","2.1","العروض التقديمية",2],["l2-2","2.2","إنشاء عرض تقديمي",2],
    ["l2-3","2.3","كن مقدّماً جيداً",2],["l2-4","2.4","التعامل مع الصور",2],
    ["l2-5","2.5","لنتدرب على العروض التقديمية",2],["l2-6","2.6","التأثيرات الانتقالية والحركية",2],
    ["l2-7","2.7","لنتدرب على التأثيرات الانتقالية والحركية",2],["l2-8","2.8","المشروع",2],
    ["l3-1","3.1","البريد الإلكتروني",3],["l3-2","3.2","التواصل عبر البريد الإلكتروني",3]
  ].map(function (r) { return { id: r[0], no: r[1], ar: r[2], unit: r[3] }; });
  var N = L.length;

  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function P(d, a) { a = a || {}; a.d = d; return S("path", a); }
  function grad(id, stops) { return S("linearGradient", { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); })); }
  function rgrad(id, stops) { return S("radialGradient", { id: id }, stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); })); }

  var W = 4700, H = 1320, MX = 380, BASE = 780, AMP = 110;
  function nodeAt(i) { var span = W - MX * 2; return { x: MX + span * (i / (N - 1)), y: BASE + (i % 2 ? -AMP : AMP) + Math.sin(i * 1.5) * 26 }; }

  function soundstage() {
    return S("svg", { viewBox: "-95 -150 190 240" }, [
      S("ellipse", { cx: 0, cy: 84, rx: 60, ry: 7, fill: "rgba(0,0,0,.45)" }),
      S("rect", { x: -66, y: -50, width: 132, height: 134, rx: 6, fill: "#1c2130", stroke: "#3a4256", "stroke-width": 2 }),
      P("M-66 -50 h132 v-16 h-132 z", { fill: "#242a3c" }),
      /* screen wall */
      S("rect", { x: -50, y: -34, width: 100, height: 58, rx: 3, fill: "#070a12" }),
      S("g", { class: "st-onlit" }, [S("rect", { x: -46, y: -30, width: 92, height: 50, rx: 2, fill: "url(#stScreen)" }), P("M-30 -6 l14 -10 l0 20 z", { fill: "#fff", opacity: .85 })]),
      /* ON AIR sign */
      S("g", { class: "st-onair" }, [S("rect", { x: -26, y: 32, width: 52, height: 16, rx: 8, fill: "#3a1020", stroke: "#ff3b6b", "stroke-width": 1.5 }), S("circle", { cx: -14, cy: 40, r: 3, fill: "#ff3b6b" }), S("rect", { x: -6, y: 36, width: 30, height: 8, rx: 2, fill: "#ff3b6b" })])
    ]);
  }
  function editbay() {
    return S("svg", { viewBox: "-95 -150 190 240" }, [
      S("ellipse", { cx: 0, cy: 84, rx: 56, ry: 7, fill: "rgba(0,0,0,.45)" }),
      S("rect", { x: -60, y: -20, width: 120, height: 104, rx: 5, fill: "#1c2130", stroke: "#3a4256", "stroke-width": 2 }),
      /* three edit monitors */
      S("g", { class: "st-onlit" }, [
        S("rect", { x: -50, y: -6, width: 30, height: 22, rx: 2, fill: "url(#stScreen2)" }),
        S("rect", { x: -15, y: -14, width: 30, height: 30, rx: 2, fill: "url(#stScreen)" }),
        S("rect", { x: 20, y: -6, width: 30, height: 22, rx: 2, fill: "url(#stScreen2)" })]),
      S("rect", { x: -40, y: 40, width: 80, height: 10, rx: 2, fill: "#2a3142" }),
      S("rect", { x: -20, y: 50, width: 40, height: 34, fill: "#141824" })
    ]);
  }
  function hall() {   /* presentation / grand hall */
    return S("svg", { viewBox: "-100 -155 200 245" }, [
      S("ellipse", { cx: 0, cy: 84, rx: 66, ry: 7, fill: "rgba(0,0,0,.45)" }),
      S("rect", { x: -72, y: -34, width: 144, height: 118, rx: 5, fill: "#1c2130", stroke: "#3a4256", "stroke-width": 2 }),
      P("M-78 -34 h156 l-14 -24 h-128 z", { fill: "#242a3c" }),
      S("g", { class: "st-onlit" }, [S("rect", { x: -44, y: -18, width: 88, height: 54, rx: 3, fill: "url(#stScreen)" }), S("circle", { cx: 0, cy: 9, r: 12, fill: "#fff", opacity: .5 })]),
      S("rect", { x: -14, y: 54, width: 28, height: 30, fill: "#0e1220" })
    ]);
  }
  function place(host, ctx) { var i = ctx.index, r = i % 3; host.appendChild(r === 0 ? soundstage() : r === 1 ? editbay() : hall()); }

  /* per-world signage — an illuminated studio marquee */
  function sign(ctx) {
    return E("div", { class: "st-sign" }, [E("div", { class: "st-sign__marquee" }, [
      E("span", { class: "st-sign__no", text: ctx.no }),
      E("span", { class: "st-sign__name", text: ctx.name })
    ])]);
  }
  function traveler() {   /* a studio camera on a dolly */
    return S("svg", { viewBox: "0 0 90 70" }, [
      S("ellipse", { cx: 45, cy: 64, rx: 34, ry: 5, fill: "rgba(0,0,0,.3)" }),
      S("rect", { x: 20, y: 24, width: 40, height: 26, rx: 5, fill: "#20263a", stroke: "#5a6788", "stroke-width": 2 }),
      S("circle", { cx: 36, cy: 37, r: 9, fill: "#0a0e18", stroke: "#8ff3e6", "stroke-width": 2 }), S("circle", { cx: 36, cy: 37, r: 4, fill: "#2ee6c6" }),
      S("rect", { x: 58, y: 28, width: 14, height: 10, rx: 2, fill: "#2a3142" }),
      P("M30 50 v10 M60 50 v10", { stroke: "#3a4256", "stroke-width": 3 }),
      S("circle", { cx: 30, cy: 62, r: 5, fill: "#141824" }), S("circle", { cx: 60, cy: 62, r: 5, fill: "#141824" })
    ]);
  }

  function layers(env, ctx) {
    var svg = S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
    var R = rng(4101);
    svg.appendChild(S("defs", {}, [
      grad("stSky", [["0%", "#0b0e1a"], ["60%", "#141a2c"], ["100%", "#20182e"]]),
      grad("stGround", [["0%", "#181c28"], ["100%", "#0c0e16"]]),
      grad("stScreen", [["0%", "#7fd0ff"], ["50%", "#4f8fe0"], ["100%", "#8a5ad0"]]),
      grad("stScreen2", [["0%", "#ff7ac0"], ["100%", "#7a4fd0"]]),
      rgrad("stBeamC", [["0%", "#8ff3ff", 0.5], ["100%", "#8ff3ff", 0]]),
      rgrad("stBeamM", [["0%", "#ff7ac0", 0.45], ["100%", "#ff7ac0", 0]])
    ]));
    svg.appendChild(S("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#stSky)" }));
    for (var s = 0; s < 70; s++) svg.appendChild(S("circle", { cx: R() * W, cy: R() * H * 0.45, r: R() * 1.2 + 0.3, fill: "#cfe0ff", opacity: 0.12 + R() * 0.3 }));
    /* big billboard screen wall on the far side */
    var billx = W * 0.5;
    svg.appendChild(S("g", {}, [S("rect", { x: billx - 260, y: H * 0.16, width: 520, height: 220, rx: 8, fill: "#0a0e18", stroke: "#2a3a56", "stroke-width": 3 }), S("rect", { x: billx - 246, y: H * 0.16 + 14, width: 492, height: 192, rx: 4, fill: "url(#stScreen)", opacity: 0.5, class: "st-billboard" })]));
    /* crossing stage-light beams */
    for (var bm = 0; bm < 7; bm++) { var bx = 300 + bm * 640, tone = bm % 2 ? "url(#stBeamM)" : "url(#stBeamC)"; svg.appendChild(P("M" + bx + " 0 L" + (bx - 160) + " " + (H * 0.7) + " L" + (bx + 160) + " " + (H * 0.7) + " Z", { fill: tone, class: "st-beam" })); }
    /* ground + light grid */
    svg.appendChild(S("rect", { x: 0, y: H * 0.72, width: W, height: H * 0.28, fill: "url(#stGround)" }));
    for (var gl = 0; gl < 40; gl++) svg.appendChild(S("line", { x1: gl * 130, y1: H * 0.72, x2: gl * 130 - 260, y2: H, stroke: "rgba(120,150,220,.08)", "stroke-width": 2 }));
    /* light trusses / rigging silhouettes up top */
    svg.appendChild(S("rect", { x: 0, y: H * 0.09, width: W, height: 10, fill: "#12151f" }));
    for (var rg = 0; rg < 30; rg++) svg.appendChild(S("rect", { x: rg * 160, y: H * 0.09 + 10, width: 8, height: 20, fill: "#12151f" }));
    /* cabling path along the lot (built from node points) */
    var pts = []; for (var i = 0; i < N; i++) { var p = nodeAt(i); pts.push({ x: p.x, y: p.y + 92 }); }
    var d = "M" + pts[0].x + " " + pts[0].y; for (var k = 1; k < pts.length; k++) { var a = pts[k - 1], b = pts[k], hx = (a.x + b.x) / 2; d += " C" + hx + " " + a.y + " " + hx + " " + b.y + " " + b.x + " " + b.y; }
    svg.appendChild(P(d, { fill: "none", stroke: "#1c2334", "stroke-width": 30, "stroke-linecap": "round" }));
    svg.appendChild(P(d, { fill: "none", stroke: "#8ff3ff", "stroke-width": 5, "stroke-linecap": "round", "stroke-dasharray": "12 22", class: "st-cable", opacity: 0.7 }));
    env.appendChild(svg);
  }

  ADV.register({
    code: "g4s1", storageKey: "waha:g4s1:waha:g4s1:progress",
    title: "استوديو الإنتاج الرقمي", subtitle: "الصف الرابع · الفصل الأول",
    gradeLabel: "الصف الرابع · الفصل الأول",
    lessons: L, unitOf: function (l) { return WING[l.unit]; },
    intro: "مرحبًا في مجمّع الإنتاج الرقمي. المرافق مظلمة بانتظار فريقها. تنقّل بين مرافق المجمّع؛ كل مهمة تُنجزها تُشغّل شاشاتها وتُضيء لوحة «على الهواء»، حتى يعمل الاستوديو بأكمله.",
    msgStart: "أول مرفق في المجمّع بانتظار إشارتك — انقر لتبدأ.",
    msgLocked: "هذا المرفق مقفل — شغّل المرفق السابق ليُفتح.",
    msgDone: "أحسنت! عملت شاشات المرفق وأُضيئت لوحة «على الهواء».",
    completeTitle: "المجمّع كله على الهواء! 🎬",
    completeText: "شغّلتَ كل مرافق الإنتاج وأضأتَ كل لوحات «على الهواء». صار الاستوديو يعمل بكامل طاقته. أحسنت!",
    theme: {
      "--adv-bg": "#0b0e1a",
      "--adv-accent": "#8a5ad0", "--adv-accent-2": "#ff7ac0", "--adv-accent-2b": "#6f45b0",
      "--adv-done": "#54d0c0", "--adv-locked": "#5a6072", "--adv-glow": "rgba(138,90,208,.55)",
      "--path-c": "rgba(143,243,255,.35)"
    },
    world: { size: { w: W, h: H }, nodeAt: nodeAt, layers: layers, place: place, sign: sign, traveler: traveler }
  });
})();
