/*!
 * adventure/worlds/g4s2.js — «محطة المستقبل والبيانات»
 * Grade 4 · Semester 2. A data station: each mission is a module wired to the
 * central core; completing it powers the module and lights its conduit. Lesson
 * data mirrors G4S2.curriculum; completion read progress[id].done.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var S = ADV._svg;
  function p(d, a) { a = a || {}; a.d = d; return S("path", a); }
  var MODULE = { u1: "هيا نبرمج", u2: "لنتعامل مع البيانات" };
  var L = [
    ["1.1","كيفية البرمجة","u1"],["1.2","تحرير مظاهر الكائنات","u1"],["1.3","مبدأ عمل البرمجة","u1"],
    ["1.4","التفاعل في Scratch","u1"],["1.5","لنتدرب على Scratch","u1"],["1.6","إنشاء الرسوم المتحركة","u1"],
    ["1.7","لنتدرب على الرسوم المتحركة","u1"],["1.8","إنشاء لعبة","u1"],["1.9","لنتدرب على الحركة في Scratch","u1"],
    ["1.10","المشروع","u1"],["2.1","الجداول الحسابية","u2"],["2.2","تنظيم البيانات","u2"],
    ["2.3","لنتدرب على الجداول الحسابية","u2"],["2.4","العمليات الحسابية","u2"]
  ].map(function (r) { return { id: r[0], no: r[0], ar: r[1], unit: r[2] }; });

  function modulePod() {
    return S("svg", { viewBox: "0 0 150 140" }, [
      S("ellipse", { cx: "75", cy: "132", rx: "46", ry: "6", fill: "rgba(0,0,0,.4)" }),
      S("rect", { x: "40", y: "46", width: "70", height: "84", rx: "10", fill: "#0f1e30", stroke: "#39c6ff", "stroke-width": "1.5" }),
      S("rect", { x: "52", y: "58", width: "46", height: "30", rx: "3", fill: "#081420" }),
      S("g", { class: "ds-screen" }, [p("M58 78 h34 M58 72 h24 M58 66 h30", { stroke: "#39c6ff", "stroke-width": "2" })]),
      S("circle", { cx: "62", cy: "104", r: "5", class: "ds-led" }), S("circle", { cx: "78", cy: "104", r: "5", class: "ds-led" }), S("circle", { cx: "94", cy: "104", r: "5", class: "ds-led" })
    ]);
  }
  function dish() {
    return S("svg", { viewBox: "0 0 150 140" }, [
      S("ellipse", { cx: "75", cy: "134", rx: "40", ry: "6", fill: "rgba(0,0,0,.4)" }),
      S("rect", { x: "62", y: "92", width: "26", height: "38", fill: "#0f1e30", stroke: "#39c6ff", "stroke-width": "1.5" }),
      S("g", { class: "ds-dish" }, [p("M46 64 a34 34 0 0 1 58 0 Z", { fill: "#12283e", stroke: "#39c6ff", "stroke-width": "2" }),
        S("circle", { cx: "75", cy: "58", r: "5", class: "ds-led" }), p("M75 58 L75 40", { stroke: "#39c6ff", "stroke-width": "2" })])
    ]);
  }
  function marker(art, ctx) { art.appendChild(ctx.index % 2 ? dish() : modulePod()); }

  ADV.register({
    code: "g4s2", storageKey: "waha:g4s2:waha:g4s2:v1",
    title: "محطة المستقبل والبيانات", subtitle: "الصف الرابع · الفصل الثاني",
    lessons: L, unitOf: function (l) { return MODULE[l.unit]; },
    intro: "محطة مستقبلية للبيانات فقدت طاقتها. مع كل مهمة تُشغّل وحدةً وتُنير مسار طاقتها نحو النواة، حتى تعود جميع أنظمتها إلى العمل.",
    msgStart: "جاهز؟ أول وحدة في المحطة تنتظر طاقتك.",
    msgLocked: "أكمل الوحدة السابقة أولًا لتصل الطاقة.",
    msgDone: "أحسنت! استعادت وحدة جديدة طاقتها.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "استعادت المحطة كل أنظمتها، وعادت إلى العمل الكامل.",
    scene: {
      laneH: 236, maxW: 980, mw: 160, marker: marker, pathDash: "1 7",
      xAt: function (i) { return 50 + Math.sin(i * 1.15) * 21; },
      path: function (pts) { if (!pts.length) return ""; var d = "M" + pts[0].x + " " + pts[0].y;
        for (var i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i], my = (a.y + b.y) / 2;
          d += " C" + a.x + " " + my + " " + b.x + " " + my + " " + b.x + " " + b.y; } return d; },
      background: function (e, bg, kit) { bg.appendChild(kit.el("div", { class: "ds-grid" })); bg.appendChild(kit.el("div", { class: "ds-core" })); }
    },
    backdrop: function (c, e, kit) { c.appendChild(kit.el("div", { class: "ds-space" })); },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
