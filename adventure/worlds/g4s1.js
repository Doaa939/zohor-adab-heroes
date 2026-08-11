/*!
 * adventure/worlds/g4s1.js — «استوديو الإنتاج الرقمي»
 * Grade 4 · Semester 1. Lessons/ids/units mirror G4_CURRICULUM (worlds/lessons).
 * Completion read: progress[id].done (G4.store). Presentation only.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
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

  ADV.register({
    code: "g4s1", storageKey: "waha:g4s1:waha:g4s1:progress",
    title: "استوديو الإنتاج الرقمي", subtitle: "الصف الرابع · الفصل الأول",
    tagline: "شغّل مرافق الاستوديو مرفقًا بعد مرفق؛ كل مهمة تُضيء لوحة «على الهواء» وتفتح قاعة إنتاج.",
    intro: "مجمّع إنتاج رقمي احترافي بانتظار فريقه. مع كل مهمة تُضيء لوحة «على الهواء» في أحد الاستوديوهات، حتى تُفتح قاعة العرض الكبرى في النهاية.",
    lessons: L,
    regionOf: function (l) { return { key: "u" + l.unit, kind: "جناح", label: WING[l.unit] }; },
    unitOf: function (l) { return WING[l.unit]; },
    msgStart: "جاهز؟ أول استوديو ينتظر إشارتك.",
    msgLocked: "أكمل الاستوديو السابق أولًا ليُفتح التالي.",
    msgDone: "أحسنت! أُضيئت لوحة «على الهواء» في استوديو جديد.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "شغّلتَ كل مرافق الاستوديو، وفُتحت قاعة العرض الكبرى.",
    backdrop: function (c, eng, kit) {
      var e = kit.el, s = kit.svg;
      c.appendChild(e("div", { class: "adv-studio-glow" }));
      var far = e("div", { class: "adv-far" });
      far.appendChild(s("svg", { viewBox: "0 0 1200 460", preserveAspectRatio: "xMidYMax slice" }, [
        s("rect", { x: "0", y: "60", width: "1200", height: "10", fill: "#171326" }),
        /* studio spotlights */
        s("g", { fill: "#1a1530" }, [
          s("path", { d: "M180 60 l70 40 l-70 40 z" }), s("path", { d: "M520 60 l70 40 l-70 40 z" }),
          s("path", { d: "M860 60 l70 40 l-70 40 z" })
        ]),
        s("rect", { x: "0", y: "404", width: "1200", height: "56", fill: "#120f22" })
      ]));
      c.appendChild(far);
      c.appendChild(e("div", { class: "adv-haze-bottom" }));
    },
    place: function (art, ctx, kit) {
      art.appendChild(kit.el("div", { class: "adv-onair", "aria-hidden": "true" }, [kit.el("span", { text: "ON AIR" })]));
    },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
