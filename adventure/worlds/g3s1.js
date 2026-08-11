/*!
 * adventure/worlds/g3s1.js — «قلعة المعرفة الرقمية»
 * Grade 3 · Semester 1. Lessons/ids/units mirror MNARA.curriculum.
 * Completion read: progress[id].done. Presentation only.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
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

  ADV.register({
    code: "g3s1", storageKey: "waha:g3s1:manara.g3.v1",
    title: "قلعة المعرفة الرقمية", subtitle: "الصف الثالث · الفصل الأول",
    tagline: "اصعد في القلعة طابقًا بعد طابق؛ كل مهمة تُشعل مشعلها وتفتح بابها نحو الأعلى.",
    intro: "من بوابة القلعة تبدأ رحلة الصعود. كل مهمة تُنجزها تُشعل مشعلًا وتفتح بابًا يقودك إلى طابق أعلى في قلعة المعرفة.",
    lessons: L,
    regionOf: function (l) { return { key: "u" + l.unit, kind: "الطابق", label: FLOOR[l.unit] }; },
    msgStart: "جاهز؟ بوابة القلعة مفتوحة لأول مهمة.",
    msgLocked: "أكمل الغرفة السابقة أولًا لتصعد أعلى.",
    msgDone: "أحسنت! أشعلتَ مشعلًا وفُتح باب جديد.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "بلغتَ أعلى أبراج القلعة بعد أن أشعلتَ كل مشاعلها.",
    backdrop: function (c, eng, kit) {
      var e = kit.el, s = kit.svg;
      c.appendChild(e("div", { class: "adv-sky-haze" }));
      var far = e("div", { class: "adv-far" });
      far.appendChild(s("svg", { viewBox: "0 0 1200 480", preserveAspectRatio: "xMidYMax slice" }, [
        s("g", { fill: "#131c28" }, [
          s("path", { d: "M180 480 V180 h120 V120 h40 V180 h120 V480 z" }),
          s("path", { d: "M760 480 V220 h100 V160 h34 V220 h100 V480 z" }),
          /* battlements */
          s("path", { d: "M180 180 h20 v-18 h20 v18 h20 v-18 h20 v18 h20 v-18 h20 v18 h20 v-18 h20 v18 h20 v-18 h20 v18 h20 v-18 h20 v18 h20 v18 h-280z" })
        ])
      ]));
      c.appendChild(far);
      c.appendChild(e("div", { class: "adv-haze-bottom" }));
    },
    place: function (art, ctx, kit) {
      art.appendChild(kit.el("div", { class: "adv-torch", "aria-hidden": "true" }));
      art.appendChild(kit.el("div", { class: "adv-door" }));
    },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
