/*!
 * adventure/worlds/g2s1.js — «متحف المخترعين السري»
 * Grade 2 · Semester 1. Lessons/ids/units mirror WAHAT2.curriculum.LESSONS.
 * Completion read: lessons[id].mastered (WAHAT2.Store). Presentation only.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
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

  ADV.register({
    code: "g2s1", storageKey: "waha:g2s1:wahat2.rebuild.v1.progress",
    title: "متحف المخترعين السري", subtitle: "الصف الثاني · الفصل الأول",
    tagline: "استكشف أجنحة المتحف المظلمة؛ كل مهمة تُنجزها تُضيء قاعةً وتفتح بابها المغلق.",
    intro: "أبوابٌ موصدة وقاعاتٌ في العتمة تنتظر من يكشف أسرارها. مع كل مهمة تُضاء قاعة في متحف المخترعين، وتنكشف مقتنياتها شيئًا فشيئًا.",
    lessons: L,
    /* WAHAT2 stores completion as lessons[id].mastered */
    readDone: function (p, l) {
      var box = p && (p.lessons || (p.progress && p.progress.lessons));
      var e = box && box[l.id];
      return !!(e && (e.mastered || e.done));
    },
    regionOf: function (l) { return { key: "u" + l.unit, kind: "جناح", label: UNITS[l.unit] }; },
    unitOf: function (l) { return UNITS[l.unit]; },
    msgStart: "جاهز؟ أول قاعة في المتحف تنتظر ضوءك.",
    msgLocked: "أكمل القاعة السابقة أولًا ليُفتح هذا الباب.",
    msgDone: "أحسنت! أُضيئت قاعة جديدة في المتحف.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "أضأتَ المتحف كله وفتحتَ كل أبوابه المغلقة.",
    backdrop: function (c, eng, kit) {
      var e = kit.el, s = kit.svg;
      c.appendChild(e("div", { class: "adv-museum-spot" }));
      var far = e("div", { class: "adv-far" });
      far.appendChild(s("svg", { viewBox: "0 0 1200 460", preserveAspectRatio: "xMidYMax slice" }, [
        /* museum colonnade */
        s("rect", { x: "0", y: "70", width: "1200", height: "34", fill: "#101d2b" }),
        s("g", { fill: "#0e1a26" }, (function () {
          var cols = [], x; for (x = 60; x < 1200; x += 150) cols.push(s("rect", { x: x, y: "104", width: "44", height: "300" }));
          return cols;
        })()),
        s("rect", { x: "0", y: "404", width: "1200", height: "56", fill: "#0e1a26" })
      ]));
      c.appendChild(far);
      c.appendChild(e("div", { class: "adv-haze-bottom" }));
    },
    place: function (art, ctx, kit) {
      art.appendChild(kit.el("div", { class: "adv-exhibit", "aria-hidden": "true" }));
    },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
