/*!
 * adventure/worlds/g3s2.js — «مدينة الروبوتات»
 * Grade 3 · Semester 2. A future city: each mission is a lab or a robot;
 * completing it powers the building and wakes the robot. Lesson data mirrors
 * MNARA.curriculumS2; completion read progress[id].done.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg;
  function p(d, a) { a = a || {}; a.d = d; return S("path", a); }
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

  function lab() {
    return S("svg", { viewBox: "0 0 150 140" }, [
      S("ellipse", { cx: "75", cy: "132", rx: "48", ry: "6", fill: "rgba(0,0,0,.4)" }),
      S("rect", { x: "38", y: "40", width: "74", height: "90", rx: "4", fill: "#122036", stroke: "#2ee6c6", "stroke-width": "1.5" }),
      S("rect", { x: "50", y: "54", width: "50", height: "30", rx: "2", fill: "#0a1526" }),
      S("circle", { cx: "75", cy: "69", r: "9", class: "rc-core" }),
      S("g", { class: "rc-win" }, [S("rect", { x: "50", y: "94", width: "12", height: "12" }), S("rect", { x: "69", y: "94", width: "12", height: "12" }), S("rect", { x: "88", y: "94", width: "12", height: "12" })])
    ]);
  }
  function robot() {
    return S("svg", { viewBox: "0 0 150 140" }, [
      S("ellipse", { cx: "75", cy: "134", rx: "40", ry: "6", fill: "rgba(0,0,0,.4)" }),
      S("rect", { x: "50", y: "58", width: "50", height: "48", rx: "8", fill: "#1b2b44", stroke: "#a98bff", "stroke-width": "2" }),
      S("rect", { x: "60", y: "34", width: "30", height: "24", rx: "6", fill: "#20304c", stroke: "#a98bff", "stroke-width": "2" }),
      S("circle", { cx: "68", cy: "46", r: "4", class: "rc-eye" }), S("circle", { cx: "82", cy: "46", r: "4", class: "rc-eye" }),
      p("M75 34 V24", { stroke: "#a98bff", "stroke-width": "2" }), S("circle", { cx: "75", cy: "22", r: "3", class: "rc-core" }),
      S("rect", { x: "44", y: "106", width: "14", height: "22", rx: "3", fill: "#1b2b44" }), S("rect", { x: "92", y: "106", width: "14", height: "22", rx: "3", fill: "#1b2b44" })
    ]);
  }
  function marker(art, ctx) { art.appendChild(ctx.index % 2 ? robot() : lab()); }

  ADV.register({
    code: "g3s2", storageKey: "waha:g3s2:wahat.g3.s2.v1",
    title: "مدينة الروبوتات", subtitle: "الصف الثالث · الفصل الثاني",
    lessons: L, unitOf: function (l) { return DISTRICT[l.unit]; },
    intro: "مدينة الروبوتات نائمة بلا طاقة. مع كل مهمة يُضيء مبنى وتستيقظ روبوتاته، حتى تعمل المدينة بأكملها.",
    msgStart: "جاهز؟ أول مختبر في المدينة ينتظر طاقتك.",
    msgLocked: "أكمل المختبر السابق أولًا لتصل الطاقة.",
    msgDone: "أحسنت! شُغِّل مبنى واستيقظ روبوت جديد.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "عادت الطاقة إلى المدينة كلها، وبدأت روبوتاتها بالعمل.",
    scene: {
      laneH: 236, maxW: 980, mw: 160, marker: marker, pathDash: "1 6",
      xAt: function (i) { return 50 + Math.sin(i * 1.2) * 22; },
      path: function (pts) { if (!pts.length) return ""; var d = "M" + pts[0].x + " " + pts[0].y;
        for (var i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i]; d += " L" + a.x + " " + ((a.y + b.y) / 2) + " L" + b.x + " " + ((a.y + b.y) / 2) + " L" + b.x + " " + b.y; } return d; },
      background: function (eng, bg, kit) {
        var A = window.ADV.art, W = kit.W, H = kit.H, pts = kit.pts, i;
        var svg = A.S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
        svg.appendChild(A.S("defs", {}, [A.grad("rcSky", [["0%", "#0a1024"], ["100%", "#0d1526"]])]));
        svg.appendChild(A.defs());
        svg.appendChild(A.P("M0 0 H" + W + " V" + H + " H0 Z", { fill: "url(#rcSky)" }));
        svg.appendChild(A.stars(W, { n: 40, ymax: H, seed: 9 }));
        /* neon skyline: layered building silhouettes with lit windows */
        var r = A.rng(3), x;
        for (x = 0; x < W; x += 70) svg.appendChild(A.building(x, 210 + r() * 30, 40 + r() * 24, 90 + r() * 80,
          { fill: "#0e1a2c", roof: false, litWin: (r() > 0.5 ? "#2ee6c6" : "#a98bff"), win: "#0a1420" }));
        /* elevated light roads */
        for (i = 260; i < H; i += 320) { svg.appendChild(A.S("line", { x1: 0, y1: i, x2: W, y2: i, stroke: "rgba(46,230,198,.14)", "stroke-width": 8 }));
          svg.appendChild(A.S("line", { x1: 0, y1: i, x2: W, y2: i, stroke: "rgba(46,230,198,.6)", "stroke-width": 1.5, "stroke-dasharray": "3 20" })); }
        /* energy conduit (the path) + waypoints */
        var d = kit && pts.length ? (function () { var s = "M" + pts[0].x + " " + pts[0].y, k; for (k = 1; k < pts.length; k++) { var a = pts[k - 1], b = pts[k]; s += " L" + a.x + " " + ((a.y + b.y) / 2) + " L" + b.x + " " + ((a.y + b.y) / 2) + " L" + b.x + " " + b.y; } return s; })() : "";
        svg.appendChild(A.P(d, { fill: "none", stroke: "rgba(46,230,198,.5)", "stroke-width": 3, style: "filter:drop-shadow(0 0 5px rgba(46,230,198,.8))" }));
        svg.appendChild(A.waypoints(pts, { on: "#2ee6c6", off: "rgba(46,230,198,.3)" }));
        /* drones + a central holographic core */
        pts.forEach(function (pt, k) { if (k % 2 === 0) svg.appendChild(A.drone(pt.x + (k % 3 - 1) * 80, pt.y - 70, 1.2, "#22344c")); });
        svg.appendChild(A.S("circle", { cx: W / 2, cy: 120, r: 40, fill: "rgba(46,230,198,.16)", style: "filter:blur(2px)" }));
        bg.appendChild(svg);
      }
    },
    backdrop: function (c, e, kit) { c.appendChild(kit.el("div", { class: "rc-sky" })); },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
