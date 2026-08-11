/*!
 * adventure/worlds/g1s2.js — «قطار الأوامر العجيب»
 * Grade 1 · Semester 2. Lessons/ids/units mirror WADI.curriculum.
 * Completion read: progress[id].done. Presentation only.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
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

  ADV.register({
    code: "g1s2", storageKey: "waha:g1s2:wadi.g1s2.v1",
    title: "قطار الأوامر العجيب", subtitle: "الصف الأول · الفصل الثاني",
    layout: "track",
    tagline: "اركب القطار وتنقّل بين المحطات؛ كلما أتممت مهمة أضأتَ محطتها وتحرّك القطار نحو التالية.",
    intro: "استعدّ للرحلة! قطار الأوامر العجيب يقف عند أول محطة. كل مهمة تُنجزها تُضيء محطةً ويتقدّم القطار في رحلته عبر الجسور والوديان.",
    lessons: L,
    regionOf: function (l) { return { key: "u" + l.unit, kind: "رحلة", label: UNITS[l.unit] }; },
    unitOf: function (l) { return UNITS[l.unit]; },
    msgStart: "جاهز؟ القطار ينتظرك عند المحطة الأولى.",
    msgLocked: "أكمل المحطة السابقة أولًا ليتقدّم القطار.",
    msgDone: "أحسنت! أضأتَ المحطة وتحرّك القطار.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "وصل القطار إلى محطته الأخيرة بعد أن أضأتَ كل محطات الطريق.",
    backdrop: function (c, eng, kit) {
      var e = kit.el, s = kit.svg;
      c.appendChild(e("div", { class: "adv-sky-haze" }));
      var far = e("div", { class: "adv-far" });
      far.appendChild(s("svg", { viewBox: "0 0 1200 460", preserveAspectRatio: "xMidYMax slice" }, [
        s("path", { d: "M0 300 L200 250 L420 300 L640 240 L860 300 L1080 250 L1200 290 L1200 460 L0 460 Z", fill: "#132433" }),
        /* rail line */
        s("path", { d: "M0 402 H1200", stroke: "#26506a", "stroke-width": "6" }),
        s("path", { d: "M0 402 H1200", stroke: "#3fd1c7", "stroke-width": "2", "stroke-dasharray": "10 26", opacity: ".6" }),
        s("g", { fill: "#0f1d29" }, [
          s("path", { d: "M0 402 h40 v-16 h-40 z M80 402 h40 v-16 h-40 z M160 402 h40 v-16 h-40 z" })
        ])
      ]));
      c.appendChild(far);
      c.appendChild(e("div", { class: "adv-haze-bottom" }));
    },
    place: function (art, ctx, kit) {
      art.appendChild(kit.el("div", { class: "adv-lamp", "aria-hidden": "true" }));
      art.appendChild(kit.el("div", { class: "adv-rail" }));
    },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
