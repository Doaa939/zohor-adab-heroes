/*!
 * adventure/worlds/g2s1.js — «متحف المخترعين السري»
 * Grade 2 · Semester 1. A museum: each mission is a gallery door or an exhibit;
 * completing it lights the hall and its spotlight. Lesson data mirrors
 * WAHAT2.curriculum.LESSONS; completion read lessons[id].mastered.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg;
  function p(d, a) { a = a || {}; a.d = d; return S("path", a); }
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

  function galleryDoor() {
    return S("svg", { viewBox: "0 0 150 140" }, [
      S("g", { class: "ms-spot" }, [p("M75 6 L40 128 H110 Z", { fill: "var(--adv-accent-2)", opacity: "0" })]),
      S("ellipse", { cx: "75", cy: "132", rx: "48", ry: "7", fill: "rgba(0,0,0,.35)" }),
      /* columns + pediment */
      p("M26 44 h98 l-14 -20 h-70 Z", { fill: "#20263c" }),
      S("rect", { x: "30", y: "44", width: "14", height: "86", fill: "#2a3350" }),
      S("rect", { x: "106", y: "44", width: "14", height: "86", fill: "#2a3350" }),
      /* archway (the mission) */
      p("M52 130 V72 q23 -22 46 0 V130 Z", { class: "ms-hall", stroke: "#c9a24b", "stroke-width": "2" })
    ]);
  }
  function exhibit() {
    return S("svg", { viewBox: "0 0 150 140" }, [
      S("ellipse", { cx: "75", cy: "132", rx: "44", ry: "7", fill: "rgba(0,0,0,.32)" }),
      S("rect", { x: "56", y: "96", width: "38", height: "34", fill: "#242c44", stroke: "#3a4a6a", "stroke-width": "2" }),
      /* glass case */
      S("rect", { x: "50", y: "40", width: "50", height: "58", rx: "3", fill: "rgba(120,150,200,.08)", stroke: "#4a5a7a", "stroke-width": "2" }),
      S("circle", { cx: "75", cy: "70", r: "13", class: "ms-artifact" })
    ]);
  }
  function marker(art, ctx) { art.appendChild(ctx.index % 2 ? exhibit() : galleryDoor()); }

  ADV.register({
    code: "g2s1", storageKey: "waha:g2s1:wahat2.rebuild.v1.progress",
    title: "متحف المخترعين السري", subtitle: "الصف الثاني · الفصل الأول",
    lessons: L, unitOf: function (l) { return UNITS[l.unit]; },
    readDone: function (pr, l) { var box = pr && (pr.lessons || (pr.progress && pr.progress.lessons)); var e = box && box[l.id]; return !!(e && (e.mastered || e.done)); },
    intro: "أبوابٌ موصدة وقاعاتٌ في العتمة تنتظر من يكشف أسرارها. مع كل مهمة تُضاء قاعة في متحف المخترعين وتتألق مقتنياتها.",
    msgStart: "جاهز؟ أول قاعة في المتحف تنتظر ضوءك.",
    msgLocked: "أكمل القاعة السابقة أولًا ليُفتح هذا الباب.",
    msgDone: "أحسنت! أُضيئت قاعة جديدة في المتحف.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "أضأتَ المتحف كله وفتحتَ كل أبوابه المغلقة.",
    scene: {
      laneH: 236, maxW: 940, mw: 158, marker: marker, pathDash: "2 6",
      xAt: function (i) { return 50 + Math.sin(i * 0.8) * 16; },
      path: function (pts) { return window.ADV.art.smoothPath(pts); },
      background: function (eng, bg, kit) {
        var A = window.ADV.art, W = kit.W, H = kit.H, pts = kit.pts, i;
        var svg = A.S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
        svg.appendChild(A.S("defs", {}, [
          A.grad("msFloor", [["0%", "#141a30"], ["100%", "#0a0e1c"]]),
          A.grad("msWall", [["0%", "#1a2038"], ["100%", "#10142a"]])
        ]));
        svg.appendChild(A.defs());
        /* walls + marble floor */
        svg.appendChild(A.P("M0 0 H" + W + " V" + H + " H0 Z", { fill: "url(#msWall)" }));
        svg.appendChild(A.P("M0 " + (H * 0.32) + " H" + W + " V" + H + " H0 Z", { fill: "url(#msFloor)" }));
        /* gold cornice + a row of hanging spotlights across the top */
        svg.appendChild(A.S("rect", { x: 0, y: 44, width: W, height: 5, fill: "#c9a24b", opacity: 0.7 }));
        for (i = 60; i < W; i += 150) {
          svg.appendChild(A.S("rect", { x: i - 1.5, y: 0, width: 3, height: 26, fill: "#3a4260" }));
          svg.appendChild(A.S("circle", { cx: i, cy: 30, r: 6, fill: "#ffe9b0", opacity: 0.85, style: "filter:drop-shadow(0 0 6px rgba(255,215,122,.7))" }));
        }
        /* colonnade down both sides */
        for (i = 70; i < H; i += 200) {
          svg.appendChild(A.S("rect", { x: 24, y: i, width: 26, height: 150, rx: 3, fill: "#232a44" }));
          svg.appendChild(A.S("rect", { x: W - 50, y: i, width: 26, height: 150, rx: 3, fill: "#232a44" }));
        }
        /* gold carpet runner (the path) + waypoints */
        var d = A.smoothPath(pts);
        svg.appendChild(A.P(d, { fill: "none", stroke: "rgba(201,162,75,.35)", "stroke-width": 30, "stroke-linecap": "round" }));
        svg.appendChild(A.P(d, { fill: "none", stroke: "rgba(255,215,122,.5)", "stroke-width": 3, "stroke-dasharray": "1 10", "stroke-linecap": "round" }));
        svg.appendChild(A.waypoints(pts, { on: "#ffd77a", off: "rgba(201,162,75,.3)" }));
        /* a spotlight cone + floor pool at each hall */
        pts.forEach(function (pt) {
          var lit = pt.state !== "locked";
          svg.appendChild(A.P("M" + pt.x + " " + (pt.y - 120) + " L" + (pt.x - 44) + " " + (pt.y + 30) + " L" + (pt.x + 44) + " " + (pt.y + 30) + " Z",
            { fill: "#ffe9b0", opacity: lit ? 0.12 : 0.03 }));
          svg.appendChild(A.S("ellipse", { cx: pt.x, cy: pt.y + 34, rx: 46, ry: 10, fill: "#ffd77a", opacity: lit ? 0.16 : 0.04 }));
        });
        bg.appendChild(svg);
      }
    },
    backdrop: function (c, e, kit) { c.appendChild(kit.el("div", { class: "ms-hallbg" })); },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
