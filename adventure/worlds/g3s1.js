/*!
 * adventure/worlds/g3s1.js — «قلعة المعرفة الرقمية»
 * Grade 3 · Semester 1. A castle you ascend: each mission is a gate, hall or
 * tower; completing it lights a torch and opens its door. Lesson data mirrors
 * MNARA.curriculum; completion read progress[id].done.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg;
  function p(d, a) { a = a || {}; a.d = d; return S("path", a); }
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

  function torch(x, y) {
    return S("g", { class: "ct-torch" }, [
      S("rect", { x: x - 2, y: y, width: "4", height: "16", fill: "#5a4632" }),
      p("M" + x + " " + y + " q6 -8 0 -16 q-6 8 0 16z", { class: "ct-flame", transform: "translate(0,-2)" })
    ]);
  }
  function tower() {
    return S("svg", { viewBox: "0 0 150 150" }, [
      S("ellipse", { cx: "75", cy: "142", rx: "44", ry: "7", fill: "rgba(0,0,0,.35)" }),
      S("rect", { x: "44", y: "36", width: "62", height: "104", fill: "#3a3020", stroke: "#5a4632", "stroke-width": "2" }),
      p("M40 36 h70 v-8 h-10 v-8 h-10 v8 h-10 v-8 h-10 v8 h-10 v-8 h-10 z", { fill: "#463a26" }),
      S("rect", { x: "64", y: "56", width: "22", height: "28", rx: "11", class: "ct-win", stroke: "#241a10", "stroke-width": "2" }),
      S("rect", { x: "60", y: "108", width: "30", height: "32", class: "ct-door" }),
      torch(38, 96), torch(112, 96)
    ]);
  }
  function gate() {
    return S("svg", { viewBox: "0 0 150 150" }, [
      S("ellipse", { cx: "75", cy: "142", rx: "48", ry: "7", fill: "rgba(0,0,0,.35)" }),
      S("rect", { x: "30", y: "60", width: "90", height: "80", fill: "#3a3020", stroke: "#5a4632", "stroke-width": "2" }),
      p("M30 60 h90 v-8 h-12 v-8 h-12 v8 h-12 v-8 h-12 v8 h-12 v-8 h-12 z", { fill: "#463a26" }),
      p("M56 140 V92 q19 -20 38 0 V140 Z", { class: "ct-door", stroke: "#241a10", "stroke-width": "2" }),
      /* portcullis bars */
      S("g", { stroke: "#241a10", "stroke-width": "2", opacity: ".5" }, [p("M64 100 V140 M75 96 V140 M86 100 V140")]),
      torch(26, 96), torch(118, 96)
    ]);
  }
  function marker(art, ctx) { art.appendChild(ctx.index % 2 ? tower() : gate()); }

  ADV.register({
    code: "g3s1", storageKey: "waha:g3s1:manara.g3.v1",
    title: "قلعة المعرفة الرقمية", subtitle: "الصف الثالث · الفصل الأول",
    lessons: L, unitOf: function (l) { return FLOOR[l.unit]; },
    intro: "من بوابة القلعة تبدأ رحلة الصعود. كل مهمة تُشعل مشعلًا وتفتح بابًا يقودك إلى طابق أعلى في قلعة المعرفة.",
    msgStart: "جاهز؟ بوابة القلعة مفتوحة لأول مهمة.",
    msgLocked: "أكمل الغرفة السابقة أولًا لتصعد أعلى.",
    msgDone: "أحسنت! أشعلتَ مشعلًا وفُتح باب جديد.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "بلغتَ أعلى أبراج القلعة بعد أن أشعلتَ كل مشاعلها.",
    scene: {
      laneH: 250, maxW: 900, mw: 172, marker: marker,
      /* near-central, gentle sway = climbing a keep */
      xAt: function (i) { return 50 + (i % 2 ? 12 : -12); },
      path: function (pts) { return window.ADV.art.smoothPath(pts); },
      background: function (eng, bg, kit) {
        var A = window.ADV.art, W = kit.W, H = kit.H, pts = kit.pts, i, j;
        var svg = A.S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
        svg.appendChild(A.S("defs", {}, [A.grad("ctWall", [["0%", "#2c2418"], ["100%", "#181206"]])]));
        svg.appendChild(A.defs());
        /* great stone wall with courses + crenellations */
        svg.appendChild(A.P("M0 0 H" + W + " V" + H + " H0 Z", { fill: "url(#ctWall)" }));
        for (j = 60; j < H; j += 34) svg.appendChild(A.S("line", { x1: 0, y1: j, x2: W, y2: j, stroke: "rgba(0,0,0,.28)", "stroke-width": 2 }));
        for (i = 0; i < W; i += 80) svg.appendChild(A.S("rect", { x: i, y: 0, width: 44, height: 30, fill: "#3a2f1e" }));
        /* torch-lit stone stair path + waypoints */
        var d = A.smoothPath(pts);
        svg.appendChild(A.P(d, { fill: "none", stroke: "rgba(60,48,30,.9)", "stroke-width": 30, "stroke-linecap": "round" }));
        svg.appendChild(A.P(d, { fill: "none", stroke: "rgba(226,178,90,.35)", "stroke-width": 3, "stroke-dasharray": "1 9" }));
        svg.appendChild(A.waypoints(pts, { on: "#ff9d4d", off: "rgba(226,178,90,.3)" }));
        pts.forEach(function (pt, k) {
          var side = k % 2 ? 1 : -1, lit = pt.state !== "locked";
          /* wall torch */
          svg.appendChild(A.S("g", { transform: "translate(" + (pt.x + side * 96) + " " + (pt.y) + ")" }, [
            A.S("rect", { x: -2, y: 0, width: 4, height: 20, fill: "#4a3826" }),
            A.S("circle", { cx: 0, cy: -3, r: 12, fill: "url(#advLampGlow)", opacity: lit ? 0.9 : 0.12 }),
            A.P("M0 -2 q5 -9 0 -16 q-5 7 0 16z", { fill: lit ? "#ff9d4d" : "#4a3826" })
          ]));
          /* hanging banner */
          if (k % 2 === 0) svg.appendChild(A.S("g", { transform: "translate(" + (pt.x - side * 130) + " " + (pt.y - 40) + ")" }, [
            A.P("M0 0 h24 v52 l-12 -10 l-12 10 z", { fill: side > 0 ? "#7a2e3a" : "#2e5a7a", opacity: 0.85 }),
            A.S("rect", { x: -2, y: -4, width: 28, height: 5, fill: "#3a2f1e" })
          ]));
        });
        bg.appendChild(svg);
      }
    },
    backdrop: function (c, e, kit) { c.appendChild(kit.el("div", { class: "ct-sky" })); },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
