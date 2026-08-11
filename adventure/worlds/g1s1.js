/*!
 * adventure/worlds/g1s1.js — «قرية التقنية المفقودة»
 * Grade 1 · Semester 1. Lessons/ids/units mirror the ORIGINAL platform
 * (WAHAT_CURRICULUM / W.store). Completion read: progress.lessons[id].completed.
 * Presentation only.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var UNITS = { 1: "حاسوبي", 2: "هيا نرسم", 3: "لنتصفح" };
  var L = [
    ["1.1","الحاسوب في حياتنا",1],["1.2","أجزاء جهاز الحاسوب",1],["1.3","سطح المكتب",1],
    ["1.4","انقر واكتب",1],["1.5","دعنا نتذكر",1],["1.6","لنطبق معًا",1],
    ["2.1","مقدمة إلى الرسم الرقمي",2],["2.2","رسم الأشكال",2],["2.3","لنتدرب على الأشكال",2],
    ["2.4","دمج الأشكال",2],["2.5","لنتدرب على دمج الأشكال",2],["2.6","الرسم الحر",2],
    ["3.1","الإنترنت",3],["3.2","استمتع",3],["3.3","تواصل",3],["3.4","ابحث",3]
  ].map(function (r) { return { id: r[0], no: r[0], ar: r[1], unit: r[2] }; });

  ADV.register({
    code: "g1s1",
    storageKey: "waha:g1s1:wahat.g1.v1",
    title: "قرية التقنية المفقودة",
    subtitle: "الصف الأول · الفصل الأول",
    tagline: "أعِد الحياة إلى القرية بيتًا بعد بيت؛ كل مهمة تُنجزها تُضيء ركنًا نائمًا من القرية.",
    intro: "قريةٌ عُمانية هادئة تنتظر من يُعيد إليها الحياة. مع كل مهمة تُنجزها يُضيء بيتٌ أو ورشة، ويجري ماء الفلج، حتى تعود القرية كلها نابضة بالنور.",
    lessons: L,
    /* g1s1 stores completion as progress.lessons[id].completed */
    readDone: function (p, l) {
      var e = p && p.progress && p.progress.lessons && p.progress.lessons[l.id];
      return !!(e && e.completed);
    },
    regionOf: function (l) { return { key: "u" + l.unit, kind: "حَيّ", label: UNITS[l.unit] }; },
    unitOf: function (l) { return UNITS[l.unit]; },
    msgStart: "جاهز؟ أول بيت في القرية ينتظر نورك.",
    msgLocked: "أكمل المهمة السابقة أولًا لتُضيء هذا الركن.",
    msgDone: "أحسنت! أضأتَ ركنًا جديدًا من القرية.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "أضأتَ القرية بأكملها، وعادت الحياة إلى كل بيوتها.",
    backdrop: function (c, eng, kit) {
      var e = kit.el, s = kit.svg;
      c.appendChild(e("div", { class: "adv-sky-haze" }));
      c.appendChild(e("div", { class: "adv-sun" }));
      var far = e("div", { class: "adv-far" });
      far.appendChild(s("svg", { viewBox: "0 0 1200 460", preserveAspectRatio: "xMidYMax slice" }, [
        s("path", { d: "M0 360 L1200 360 L1200 460 L0 460 Z", fill: "#13202b" }),
        /* simple house silhouettes */
        s("g", { fill: "#0f1a24" }, [
          s("path", { d: "M120 360 v-70 h80 v70 z M110 290 l40 -34 l40 34 z" }),
          s("path", { d: "M320 360 v-92 h96 v92 z M312 268 l48 -38 l48 38 z" }),
          s("path", { d: "M980 360 v-84 h88 v84 z M972 276 l44 -36 l44 36 z" }),
          s("path", { d: "M760 360 v-64 h72 v64 z M752 296 l36 -30 l36 30 z" })
        ]),
        s("g", { stroke: "#0f1a24", "stroke-width": "5", fill: "none", "stroke-linecap": "round" }, [
          s("path", { d: "M560 360 q6 -60 2 -96 M562 264 q-28 -10 -44 -28 M562 264 q28 -10 44 -28" })
        ])
      ]));
      c.appendChild(far);
      c.appendChild(e("div", { class: "adv-haze-bottom" }));
    },
    place: function (art, ctx, kit) {
      art.appendChild(kit.el("div", { class: "adv-window", "aria-hidden": "true" }));
      art.appendChild(kit.el("div", { class: "adv-falaj" }));
    },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
