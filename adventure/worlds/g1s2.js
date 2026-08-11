/*!
 * adventure/worlds/g1s2.js — «قطار الأوامر العجيب»
 * Grade 1 · Semester 2. A rail journey: each mission is a station along the
 * track; the train waits at the current station and its signal turns green when
 * the station is complete. Lesson data mirrors WADI.curriculum; completion read
 * progress[id].done. Presentation only.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg;
  function p(d, a) { a = a || {}; a.d = d; return S("path", a); }
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

  function station(withTrain) {
    var kids = [
      S("rect", { x: "18", y: "112", width: "132", height: "10", rx: "2", fill: "#2a3947" }),  /* platform */
      /* shelter */
      S("rect", { x: "44", y: "64", width: "80", height: "48", fill: "#25384a", stroke: "#3f5a72", "stroke-width": "2" }),
      p("M38 64 h92 l-10 -16 h-72 Z", { fill: "#1c2c3a" }),
      S("rect", { x: "58", y: "78", width: "22", height: "34", class: "tr-door" }),
      S("rect", { x: "92", y: "78", width: "22", height: "22", rx: "2", class: "tr-win", stroke: "#16222e", "stroke-width": "2" }),
      /* signal post */
      S("g", {}, [S("rect", { x: "132", y: "58", width: "5", height: "54", fill: "#3f5a72" }),
        S("circle", { cx: "134", cy: "56", r: "7", class: "tr-signal" })])
    ];
    if (withTrain) {
      kids.push(S("g", { class: "tr-train" }, [
        S("rect", { x: "6", y: "88", width: "46", height: "26", rx: "5", fill: "#c9552e", stroke: "#e2703f", "stroke-width": "2" }),
        S("rect", { x: "12", y: "94", width: "14", height: "12", rx: "2", fill: "#ffe0a0" }),
        S("circle", { cx: "18", cy: "118", r: "5", fill: "#1a2530" }), S("circle", { cx: "42", cy: "118", r: "5", fill: "#1a2530" }),
        S("rect", { x: "44", y: "80", width: "8", height: "12", fill: "#8a3a20" })
      ]));
    }
    return S("svg", { viewBox: "0 0 168 132" }, [S("ellipse", { cx: "84", cy: "126", rx: "70", ry: "7", fill: "rgba(0,0,0,.3)" })].concat(kids));
  }
  function marker(art, ctx) { art.appendChild(station(ctx.state === "current")); }

  ADV.register({
    code: "g1s2", storageKey: "waha:g1s2:wadi.g1s2.v1",
    title: "قطار الأوامر العجيب", subtitle: "الصف الأول · الفصل الثاني",
    lessons: L, unitOf: function (l) { return UNITS[l.unit]; },
    intro: "استعدّ للرحلة! قطار الأوامر العجيب يقف عند أول محطة. كل مهمة تُنجزها تُضيء إشارة المحطة ويتقدّم القطار في رحلته.",
    msgStart: "جاهز؟ القطار ينتظرك عند المحطة الأولى.",
    msgLocked: "أكمل المحطة السابقة أولًا ليتقدّم القطار.",
    msgDone: "أحسنت! صارت الإشارة خضراء وتحرّك القطار.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "وصل القطار إلى محطته الأخيرة بعد أن أضأتَ كل إشاراته.",
    scene: {
      laneH: 232, maxW: 1000, mw: 186, marker: marker, pathDash: "3 5",
      /* strong zigzag = a rail winding down the line */
      xAt: function (i) { return i % 2 ? 70 : 30; },
      path: function (pts) { if (!pts.length) return ""; var d = "M" + pts[0].x + " " + pts[0].y;
        for (var i = 1; i < pts.length; i++) d += " L" + pts[i].x + " " + pts[i].y; return d; },
      background: function (e, bg, kit) { bg.appendChild(kit.el("div", { class: "tr-land" })); }
    },
    backdrop: function (c, e, kit) { c.appendChild(kit.el("div", { class: "tr-sky" })); },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
