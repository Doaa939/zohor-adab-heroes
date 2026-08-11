/*!
 * adventure/worlds/g3s1.js — «قلعة المعرفة الرقمية» (Grade 3 · Semester 1)
 * GAME TYPE: CASTLE ASCENT. You start at the gate and climb — courtyard, rooms,
 * library, towers — up the mountainside to the upper keep. Missions ASCEND: each
 * completed place lights its torches and opens its door; the camera climbs. The
 * final tower flies the banner of completion. Cinematic (Grade 3).
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg, E = ADV._el;
  var FLOOR = { 1: "الطابق الأول", 2: "الطابق الثاني", 3: "الطابق الثالث" };
  var L = [
    ["l1-1","1.1","أجهزة التفاعل مع الحاسوب",1],["l1-2","1.2","تنظيم الملفات والمجلدات",1],
    ["l1-3","1.3","أجهزة الطباعة والالتقاط",1],
    ["l2-1","2.1","تنسيق النص",2],["l2-2","2.2","لنتدرب على تنسيق النص",2],
    ["l2-3","2.3","إدراج وتنسيق صورة",2],["l2-4","2.4","لنتدرب على التعامل مع النص وتنسيق الصور",2],
    ["l2-5","2.5","إنشاء القوائم",2],["l2-6","2.6","لنتدرب على التعامل مع القوائم",2],["l2-7","2.7","المشروع",2],
    ["l3-1","3.1","الأمان عبر الإنترنت",3],["l3-2","3.2","البحث عن المعلومات",3],
    ["l3-3","3.3","أخلاقيات الإنترنت",3],["l3-4","3.4","العثور على المعلومات",3],
    ["l3-5","3.5","لنتدرب على استخدام الإنترنت",3],["l3-6","3.6","البحث في موسوعة ويكيبيديا",3]
  ].map(function (r) { return { id: r[0], no: r[1], ar: r[2], unit: r[3] }; });
  var N = L.length;

  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function P(d, a) { a = a || {}; a.d = d; return S("path", a); }
  function grad(id, stops) { return S("linearGradient", { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); })); }
  function rgrad(id, stops) { return S("radialGradient", { id: id }, stops.map(function (s) { return S("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }); })); }

  /* a tall world: the climb goes bottom → top. Rows are spaced well apart so
     the ascending places never overlap (each mission owns its own altitude). */
  var W = 3000, H = 4900, TOP = 320, BOT = 320;
  function nodeAt(i) { var t = i / (N - 1); return { x: W / 2 + Math.sin(i * 0.95) * (W * 0.29), y: (H - BOT) - ((H - BOT - TOP) * t) }; }

  function torch(x, y) { return S("g", { class: "ct-torch" }, [S("rect", { x: x - 3, y: y, width: 6, height: 22, fill: "#5a4632" }), S("circle", { cx: x, cy: y - 4, r: 12, fill: "url(#ctGlow)", class: "ct-glow" }), P("M" + x + " " + (y - 2) + " q9 -12 0 -24 q-9 12 0 24z", { class: "ct-flame" })]); }
  function gate() {
    return S("svg", { viewBox: "-100 -160 200 250" }, [
      S("ellipse", { cx: 0, cy: 82, rx: 66, ry: 9, fill: "rgba(0,0,0,.4)" }),
      S("rect", { x: -66, y: -30, width: 132, height: 112, fill: "url(#ctStone)", stroke: "#6a5038", "stroke-width": 3 }),
      P("M-72 -30 h144 v-16 h-18 v-16 h-18 v16 h-18 v-16 h-18 v16 h-18 v-16 h-18 v16 h-18 z", { fill: "#5a4530" }),
      P("M-30 82 V6 q30 -26 60 0 V82 Z", { class: "ct-door", fill: "#1a120a" }),
      S("g", { class: "ct-bars" }, [P("M-16 30 V82 M0 24 V82 M16 30 V82", { stroke: "#2a1c10", "stroke-width": 4, opacity: .6 })]),
      torch(-52, 4), torch(52, 4)
    ]);
  }
  function tower() {
    return S("svg", { viewBox: "-90 -175 180 265" }, [
      S("ellipse", { cx: 0, cy: 82, rx: 52, ry: 8, fill: "rgba(0,0,0,.4)" }),
      S("rect", { x: -50, y: -70, width: 100, height: 152, fill: "url(#ctStone)", stroke: "#6a5038", "stroke-width": 3 }),
      P("M-56 -70 h112 v-16 h-16 v-16 h-14 v16 h-16 v-16 h-14 v16 h-16 v-16 h-14 v16 h-16 z", { fill: "#5a4530" }),
      S("g", { class: "ct-onlit" }, [S("rect", { x: -20, y: -30, width: 40, height: 52, rx: 20, fill: "url(#ctWin)" })]),
      S("rect", { x: -26, y: 44, width: 52, height: 38, rx: 3, fill: "#1a120a" }),
      S("g", { class: "ct-flag" }, [P("M50 -86 v-42", { stroke: "#6a5038", "stroke-width": 4 }), P("M50 -128 h40 l-11 12 l11 12 h-40 z", { fill: "var(--adv-accent-2,#e0a94e)" })]),
      torch(-44, -6), torch(44, -6)
    ]);
  }
  function hall() {   /* library / hall */
    return S("svg", { viewBox: "-100 -160 200 250" }, [
      S("ellipse", { cx: 0, cy: 82, rx: 62, ry: 8, fill: "rgba(0,0,0,.38)" }),
      S("rect", { x: -70, y: -20, width: 140, height: 102, fill: "url(#ctStone)", stroke: "#6a5038", "stroke-width": 3 }),
      P("M-76 -20 L0 -66 L76 -20 Z", { fill: "#4a3826", stroke: "#6a5038", "stroke-width": 3 }),
      S("g", { class: "ct-onlit" }, [S("rect", { x: -52, y: 6, width: 30, height: 44, rx: 6, fill: "url(#ctWin)" }), S("rect", { x: 22, y: 6, width: 30, height: 44, rx: 6, fill: "url(#ctWin)" })]),
      P("M-16 82 V34 q16 -16 32 0 V82 Z", { class: "ct-door", fill: "#1a120a" }),
      torch(-58, 0), torch(58, 0)
    ]);
  }
  function place(host, ctx) { var i = ctx.index; host.appendChild(i === 0 ? gate() : (i % 3 === 2 ? hall() : tower())); }

  /* per-world signage — a carved stone tablet */
  function sign(ctx) {
    return E("div", { class: "ct-sign" }, [E("div", { class: "ct-sign__stone" }, [
      E("span", { class: "ct-sign__no", text: ctx.no }),
      E("span", { class: "ct-sign__name", text: ctx.name })
    ])]);
  }
  function traveler() {   /* a banner-bearer token climbing the keep */
    return S("svg", { viewBox: "0 0 60 80" }, [
      S("ellipse", { cx: 30, cy: 74, rx: 16, ry: 4, fill: "rgba(0,0,0,.3)" }),
      P("M30 30 v44", { stroke: "#6a5038", "stroke-width": 5 }),
      P("M30 30 h26 l-8 10 l8 10 h-26 z", { fill: "var(--adv-accent-2,#e0a94e)", class: "ct-bannerflag" }),
      S("circle", { cx: 30, cy: 26, r: 6, fill: "#c9a24b" })
    ]);
  }

  function layers(env, ctx) {
    var svg = S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
    var R = rng(3101);
    svg.appendChild(S("defs", {}, [
      grad("ctSky", [["0%", "#0e1430"], ["50%", "#26243f"], ["100%", "#4a3550"]]),
      grad("ctMtn", [["0%", "#2a2438"], ["100%", "#1a1626"]]),
      grad("ctMtn2", [["0%", "#3a3048"], ["100%", "#241e30"]]),
      grad("ctStone", [["0%", "#6a533a"], ["100%", "#3f3120"]]),
      grad("ctWin", [["0%", "#ffe6a6"], ["100%", "#f0a94e"]]),
      rgrad("ctGlow", [["0%", "#ffcf7a", 0.9], ["100%", "#ffcf7a", 0]]),
      rgrad("ctMoon", [["0%", "#fff8e0", 1], ["100%", "#fff8e0", 0]])
    ]));
    svg.appendChild(S("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#ctSky)" }));
    /* moon + stars near the top (the summit) */
    svg.appendChild(S("circle", { cx: W * 0.28, cy: TOP * 0.7, r: 70, fill: "#fdf3d0" }));
    svg.appendChild(S("circle", { cx: W * 0.28, cy: TOP * 0.7, r: 150, fill: "url(#ctMoon)" }));
    for (var s = 0; s < 120; s++) { var sx = R() * W, sy = R() * H * 0.5; svg.appendChild(S("circle", { cx: sx, cy: sy, r: R() * 1.4 + 0.4, fill: "#fff", opacity: 0.15 + R() * 0.5, class: "ct-star" })); }
    /* layered mountain the castle is built on (a big triangular massif) */
    svg.appendChild(P("M0 " + H + " L" + (W * 0.2) + " " + (H * 0.2) + " L" + (W * 0.5) + " " + (H * 0.42) + " L" + (W * 0.8) + " " + (H * 0.16) + " L" + W + " " + H + " Z", { fill: "url(#ctMtn2)", opacity: 0.8 }));
    svg.appendChild(P("M0 " + H + " L" + (W * 0.5) + " " + (TOP + 40) + " L" + W + " " + H + " Z", { fill: "url(#ctMtn)" }));
    /* castle curtain wall winding up the ridge (behind the missions) */
    var pts = []; for (var i = 0; i < N; i++) { var p = nodeAt(i); pts.push({ x: p.x, y: p.y + 70 }); }
    var d = "M" + pts[0].x + " " + pts[0].y; for (var k = 1; k < pts.length; k++) { var a = pts[k - 1], b = pts[k], my = (a.y + b.y) / 2; d += " C" + a.x + " " + my + " " + b.x + " " + my + " " + b.x + " " + b.y; }
    svg.appendChild(P(d, { fill: "none", stroke: "#4a3a28", "stroke-width": 46, "stroke-linecap": "round", opacity: 0.9 }));   /* wall */
    svg.appendChild(P(d, { fill: "none", stroke: "#5a4632", "stroke-width": 46, "stroke-linecap": "round", "stroke-dasharray": "6 22", opacity: 0.7 }));  /* crenellations hint */
    /* the climbing stair path */
    var sd = "M" + pts[0].x + " " + pts[0].y; for (var kk = 1; kk < pts.length; kk++) { var aa = pts[kk - 1], bb = pts[kk], mmy = (aa.y + bb.y) / 2; sd += " C" + aa.x + " " + mmy + " " + bb.x + " " + mmy + " " + bb.x + " " + bb.y; }
    svg.appendChild(P(sd, { fill: "none", stroke: "#7a6242", "stroke-width": 14, "stroke-linecap": "round", "stroke-dasharray": "3 16", transform: "translate(0,20)", opacity: 0.8 }));
    /* a few banners on the wall */
    for (var bn = 0; bn < 8; bn++) { var bx = 200 + R() * (W - 400), by = 300 + R() * (H - 700); svg.appendChild(S("g", { class: "ct-wallbanner", opacity: 0.8 }, [S("rect", { x: bx, y: by, width: 22, height: 60, fill: ["#7a2231", "#243f7a", "#2f6a4a"][bn % 3] }), P("M" + bx + " " + (by + 60) + " l11 12 l11 -12 z", { fill: ["#7a2231", "#243f7a", "#2f6a4a"][bn % 3] })])); }
    env.appendChild(svg);
  }

  ADV.register({
    code: "g3s1", storageKey: "waha:g3s1:manara.g3.v1",
    title: "قلعة المعرفة الرقمية", subtitle: "الصف الثالث · الفصل الأول",
    gradeLabel: "الصف الثالث · الفصل الأول",
    lessons: L, unitOf: function (l) { return FLOOR[l.unit]; },
    intro: "من بوابة القلعة تبدأ رحلة الصعود. كل مهمة تُشعل مشاعلها وتفتح بابها فتصعد طابقًا أعلى — من الساحة إلى الغرف فالمكتبة فالأبراج — حتى تبلغ البرج الأعلى وترفع راية الإنجاز.",
    msgStart: "بوابة القلعة مفتوحة — انقر لتبدأ الصعود.",
    msgLocked: "هذا المكان أعلى في القلعة — أكمل ما قبله لتصعد إليه.",
    msgDone: "أحسنت! أشعلتَ مشاعل المكان وفُتح بابه فصعدتَ أعلى.",
    completeTitle: "بلغتَ أعلى أبراج القلعة! 🏰",
    completeText: "أشعلتَ كل مشاعل القلعة وصعدتَ حتى البرج الأعلى، ورُفعت راية إتمام المعرفة. أحسنت!",
    theme: {
      "--adv-bg": "#0e1430",
      "--adv-accent": "#e0a94e", "--adv-accent-2": "#ffcf7a", "--adv-accent-2b": "#c98f3a",
      "--adv-done": "#6fd0a0", "--adv-locked": "#6f6a7f", "--adv-glow": "rgba(224,169,78,.55)",
      "--path-c": "rgba(255,207,122,.4)"
    },
    world: { size: { w: W, h: H }, nodeAt: nodeAt, layers: layers, place: place, sign: sign, traveler: traveler }
  });
})();
