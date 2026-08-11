/*!
 * adventure/worlds/g4s1.js — «استوديو الإنتاج الرقمي»
 * Grade 4 · Semester 1. A production campus: each mission is a studio/facility;
 * completing it turns on its ON-AIR sign and screens. Lesson data mirrors
 * G4_CURRICULUM; completion read progress[id].done.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg;
  function p(d, a) { a = a || {}; a.d = d; return S("path", a); }
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

  function studio() {
    return S("svg", { viewBox: "0 0 150 140" }, [
      S("ellipse", { cx: "75", cy: "132", rx: "48", ry: "6", fill: "rgba(0,0,0,.4)" }),
      S("rect", { x: "34", y: "44", width: "82", height: "86", rx: "4", fill: "#1c1230", stroke: "#ff6fae", "stroke-width": "1.5" }),
      /* ON AIR plate */
      S("rect", { x: "50", y: "52", width: "50", height: "16", rx: "3", class: "st-onair" }),
      S("text", { x: "75", y: "64", "text-anchor": "middle", "font-size": "9", "font-weight": "800", fill: "#0b0510", class: "st-onair-t" }, [document.createTextNode("ON AIR")]),
      /* screen */
      S("rect", { x: "48", y: "78", width: "54", height: "34", rx: "2", class: "st-screen", stroke: "#3a2440", "stroke-width": "2" })
    ]);
  }
  function camera() {
    return S("svg", { viewBox: "0 0 150 140" }, [
      S("ellipse", { cx: "75", cy: "134", rx: "40", ry: "6", fill: "rgba(0,0,0,.4)" }),
      S("rect", { x: "44", y: "60", width: "56", height: "40", rx: "6", fill: "#241640", stroke: "#4fd0e0", "stroke-width": "2" }),
      S("circle", { cx: "66", cy: "80", r: "12", fill: "#0a0716", stroke: "#4fd0e0", "stroke-width": "2" }),
      S("circle", { cx: "66", cy: "80", r: "5", class: "st-lens" }),
      p("M100 70 l16 -8 v36 l-16 -8 Z", { fill: "#2a1a4a", stroke: "#4fd0e0", "stroke-width": "1.5" }),
      S("rect", { x: "58", y: "100", width: "6", height: "24", fill: "#241640" }), S("rect", { x: "40", y: "122", width: "44", height: "6", rx: "2", fill: "#241640" })
    ]);
  }
  function marker(art, ctx) { art.appendChild(ctx.index % 2 ? camera() : studio()); }

  ADV.register({
    code: "g4s1", storageKey: "waha:g4s1:waha:g4s1:progress",
    title: "استوديو الإنتاج الرقمي", subtitle: "الصف الرابع · الفصل الأول",
    lessons: L, unitOf: function (l) { return WING[l.unit]; },
    intro: "مجمّع إنتاج رقمي احترافي بانتظار فريقه. مع كل مهمة تُضيء لوحة «على الهواء» في استوديو وتعمل شاشاته، حتى تُفتح قاعة العرض الكبرى.",
    msgStart: "جاهز؟ أول استوديو ينتظر إشارتك.",
    msgLocked: "أكمل الاستوديو السابق أولًا ليُفتح التالي.",
    msgDone: "أحسنت! أُضيئت لوحة «على الهواء» في استوديو جديد.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "شغّلتَ كل مرافق الاستوديو، وفُتحت قاعة العرض الكبرى.",
    scene: {
      laneH: 236, maxW: 980, mw: 162, marker: marker, pathDash: "2 5",
      xAt: function (i) { return 50 + Math.sin(i * 1.0) * 20; },
      path: function (pts) { return window.ADV.art.smoothPath(pts); },
      background: function (eng, bg, kit) {
        var A = window.ADV.art, W = kit.W, H = kit.H, pts = kit.pts, i;
        var svg = A.S("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none" });
        svg.appendChild(A.S("defs", {}, [A.grad("stFloor", [["0%", "#241536"], ["100%", "#140a22"]])]));
        svg.appendChild(A.defs());
        svg.appendChild(A.P("M0 0 H" + W + " V" + H + " H0 Z", { fill: "url(#stFloor)" }));
        /* big screen wall at the top */
        svg.appendChild(A.S("rect", { x: W * 0.2, y: 20, width: W * 0.6, height: 90, rx: 4, fill: "#0a0716", stroke: "#ff6fae", "stroke-width": 2 }));
        for (i = 0; i < 5; i++) svg.appendChild(A.S("rect", { x: W * 0.22 + i * (W * 0.56 / 5), y: 30, width: W * 0.09, height: 70, rx: 2, fill: i % 2 ? "rgba(79,208,224,.5)" : "rgba(255,111,174,.5)" }));
        /* truss of stage lights across the top */
        svg.appendChild(A.S("rect", { x: 0, y: 122, width: W, height: 4, fill: "#2a1a3a" }));
        for (i = 50; i < W; i += 90) { svg.appendChild(A.S("circle", { cx: i, cy: 132, r: 6, fill: i % 180 ? "#4fd0e0" : "#ff6fae", style: "filter:drop-shadow(0 0 6px currentColor)" })); }
        /* light-cable path + waypoints */
        var d = A.smoothPath(pts);
        svg.appendChild(A.P(d, { fill: "none", stroke: "rgba(255,111,174,.4)", "stroke-width": 4, style: "filter:drop-shadow(0 0 5px rgba(255,111,174,.7))" }));
        svg.appendChild(A.waypoints(pts, { on: "#ff6fae", off: "rgba(255,111,174,.3)" }));
        /* colored spotlight beams onto each facility */
        pts.forEach(function (pt, k) {
          var lit = pt.state !== "locked", col = k % 2 ? "rgba(79,208,224," : "rgba(255,111,174,";
          svg.appendChild(A.P("M" + (pt.x + (k % 2 ? 60 : -60)) + " 130 L" + (pt.x - 40) + " " + (pt.y + 20) + " L" + (pt.x + 40) + " " + (pt.y + 20) + " Z",
            { fill: col + (lit ? ".12)" : ".03)") }));
        });
        bg.appendChild(svg);
      }
    },
    backdrop: function (c, e, kit) { c.appendChild(kit.el("div", { class: "st-sky" })); },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
