/*!
 * adventure/worlds/g1s1.js — «قرية التقنية المفقودة»
 * Grade 1 · Semester 1. Illustrated Omani village: each mission is a house,
 * workshop or well along the falaj; completing it lights its windows and the
 * water runs. Lesson data mirrors WAHAT_CURRICULUM; completion read
 * progress.lessons[id].completed. Presentation only.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg;
  function p(d, a) { a = a || {}; a.d = d; return S("path", a); }
  var UNITS = { 1: "حاسوبي", 2: "هيا نرسم", 3: "لنتصفح" };
  var L = [
    ["1.1","الحاسوب في حياتنا",1],["1.2","أجزاء جهاز الحاسوب",1],["1.3","سطح المكتب",1],
    ["1.4","انقر واكتب",1],["1.5","دعنا نتذكر",1],["1.6","لنطبق معًا",1],
    ["2.1","مقدمة إلى الرسم الرقمي",2],["2.2","رسم الأشكال",2],["2.3","لنتدرب على الأشكال",2],
    ["2.4","دمج الأشكال",2],["2.5","لنتدرب على دمج الأشكال",2],["2.6","الرسم الحر",2],
    ["3.1","الإنترنت",3],["3.2","استمتع",3],["3.3","تواصل",3],["3.4","ابحث",3]
  ].map(function (r) { return { id: r[0], no: r[0], ar: r[1], unit: r[2] }; });

  function house() {
    return S("svg", { viewBox: "0 0 150 140" }, [
      S("ellipse", { cx: "75", cy: "132", rx: "52", ry: "7", fill: "rgba(0,0,0,.3)" }),
      p("M28 60 L75 28 L122 60 Z", { fill: "#8a5a34", stroke: "#a06a3e", "stroke-width": "2" }),
      S("rect", { x: "36", y: "60", width: "78", height: "68", fill: "#c79a68", stroke: "#8a6a44", "stroke-width": "2" }),
      S("rect", { x: "52", y: "96", width: "20", height: "32", fill: "#5a4028", class: "vg-door" }),
      S("rect", { x: "82", y: "74", width: "22", height: "22", rx: "2", class: "vg-win", stroke: "#5a4028", "stroke-width": "2" })
    ]);
  }
  function workshop() {
    return S("svg", { viewBox: "0 0 150 140" }, [
      S("ellipse", { cx: "75", cy: "132", rx: "52", ry: "7", fill: "rgba(0,0,0,.3)" }),
      S("rect", { x: "30", y: "56", width: "90", height: "72", fill: "#b98a58", stroke: "#8a6a44", "stroke-width": "2" }),
      p("M26 56 h98 l-8 -14 h-82 Z", { fill: "#7a5238" }),
      S("g", { class: "vg-gear" }, [S("circle", { cx: "75", cy: "84", r: "12", fill: "none", stroke: "#5a4028", "stroke-width": "3" }),
        S("circle", { cx: "75", cy: "84", r: "4", class: "vg-core" })]),
      S("rect", { x: "58", y: "104", width: "34", height: "24", class: "vg-win", stroke: "#5a4028", "stroke-width": "2" })
    ]);
  }
  function well() {
    return S("svg", { viewBox: "0 0 150 140" }, [
      S("ellipse", { cx: "75", cy: "132", rx: "48", ry: "7", fill: "rgba(0,0,0,.28)" }),
      S("g", { stroke: "#3a5a2a", "stroke-width": "6", fill: "none", "stroke-linecap": "round" }, [
        p("M48 130 q5 -52 1 -84"), p("M49 46 q-24 -10 -38 -26 M49 46 q24 -10 38 -26 M49 46 q-12 -24 -16 -42 M49 46 q12 -24 16 -42")
      ]),
      p("M78 130 V96 a22 12 0 0 1 44 0 V130 Z", { fill: "#7a5238", stroke: "#a06a3e", "stroke-width": "2" }),
      S("ellipse", { cx: "100", cy: "96", rx: "22", ry: "7", class: "vg-water" })
    ]);
  }
  function marker(art, ctx) {
    var i = ctx.index, node;
    if (i % 3 === 1) node = workshop(); else if (i % 3 === 2) node = well(); else node = house();
    art.appendChild(node);
  }

  ADV.register({
    code: "g1s1", storageKey: "waha:g1s1:wahat.g1.v1",
    title: "قرية التقنية المفقودة", subtitle: "الصف الأول · الفصل الأول",
    lessons: L, unitOf: function (l) { return UNITS[l.unit]; },
    readDone: function (pr, l) { var e = pr && pr.progress && pr.progress.lessons && pr.progress.lessons[l.id]; return !!(e && e.completed); },
    intro: "قريةٌ عُمانية هادئة تنتظر من يُعيد إليها الحياة. مع كل مهمة تُضيء نوافذ بيت ويجري ماء الفلج، حتى تعود القرية كلها نابضة بالنور.",
    msgStart: "جاهز؟ أول بيت في القرية ينتظر نورك.",
    msgLocked: "أكمل المهمة السابقة أولًا لتُضيء هذا الركن.",
    msgDone: "أحسنت! أضأتَ ركنًا جديدًا من القرية.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "أضأتَ القرية بأكملها، وعادت الحياة إلى كل بيوتها.",
    scene: {
      laneH: 244, maxW: 980, mw: 168, marker: marker,
      xAt: function (i) { return 50 + Math.sin(i * 0.95) * 20; },
      path: function (pts) { if (!pts.length) return ""; var d = "M" + pts[0].x + " " + pts[0].y;
        for (var i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i], my = (a.y + b.y) / 2;
          d += " C" + a.x + " " + my + " " + b.x + " " + my + " " + b.x + " " + b.y; } return d; },
      background: function (e, bg, kit) { bg.appendChild(kit.el("div", { class: "vg-ground" })); }
    },
    backdrop: function (c, e, kit) { c.appendChild(kit.el("div", { class: "vg-sky" })); c.appendChild(kit.el("div", { class: "vg-sun" })); },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
