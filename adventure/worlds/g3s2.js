/*!
 * adventure/worlds/g3s2.js — «مدينة الروبوتات»
 * Grade 3 · Semester 2. Lessons/ids/units mirror MNARA.curriculumS2.
 * Completion read: progress[id].done (blob may live under a *.settings.v1 key —
 * the engine scans the whole waha:g3s2:* namespace). Presentation only.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var DISTRICT = { 1: "الحي الأول", 2: "الحي الثاني" };
  var L = [
    ["s2-l1-1","1.1","التعامل مع الخوارزميات",1],["s2-l1-2","1.2","البرمجة في Scratch",1],
    ["s2-l1-3","1.3","تصحيح الأخطاء",1],["s2-l1-4","1.4","الدوران",1],
    ["s2-l1-5","1.5","لنتدرب على Scratch",1],["s2-l1-6","1.6","التكرارات",1],
    ["s2-l1-7","1.7","لنتدرب على التكرارات",1],["s2-l1-8","1.8","الرسم في Scratch",1],
    ["s2-l1-9","1.9","لنتدرب على لبنات القلم",1],["s2-l1-10","1.10","المشروع",1],
    ["s2-l2-1","2.1","الأشكال وطرق عرضها",2],["s2-l2-2","2.2","تحرير الكائنات ثلاثية الأبعاد",2],
    ["s2-l2-3","2.3","لنتدرب على الكائنات ثلاثية الأبعاد",2],["s2-l2-4","2.4","الرسم الحر ثلاثي الأبعاد",2]
  ].map(function (r) { return { id: r[0], no: r[1], ar: r[2], unit: r[3] }; });

  ADV.register({
    code: "g3s2", storageKey: "waha:g3s2:wahat.g3.s2.v1",
    title: "مدينة الروبوتات", subtitle: "الصف الثالث · الفصل الثاني",
    tagline: "أعِد الطاقة إلى المدينة المستقبلية؛ كل مهمة تُشغّل مختبرًا وتُنير مسارات الطاقة.",
    intro: "مدينة الروبوتات نائمة بلا طاقة. مع كل مهمة تُنجزها يُضيء مبنى وتدبّ الحركة في مختبراته، حتى تعمل المدينة بأكملها.",
    lessons: L,
    regionOf: function (l) { return { key: "u" + l.unit, kind: "حي", label: DISTRICT[l.unit] }; },
    msgStart: "جاهز؟ أول مختبر في المدينة ينتظر طاقتك.",
    msgLocked: "أكمل المختبر السابق أولًا لتصل الطاقة.",
    msgDone: "أحسنت! شُغِّل مختبر جديد في المدينة.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "عادت الطاقة إلى المدينة كلها، وبدأت روبوتاتها بالعمل.",
    backdrop: function (c, eng, kit) {
      var e = kit.el, s = kit.svg;
      c.appendChild(e("div", { class: "adv-grid-floor" }));
      var far = e("div", { class: "adv-far" });
      far.appendChild(s("svg", { viewBox: "0 0 1200 460", preserveAspectRatio: "xMidYMax slice" }, [
        s("g", { fill: "#0e1a2a" }, [
          s("rect", { x: "80", y: "150", width: "90", height: "310" }),
          s("rect", { x: "220", y: "220", width: "70", height: "240" }),
          s("rect", { x: "1000", y: "120", width: "100", height: "340" }),
          s("rect", { x: "860", y: "240", width: "70", height: "220" })
        ]),
        s("g", { fill: "#1de1c6", opacity: ".5" }, [
          s("rect", { x: "100", y: "170", width: "12", height: "12" }), s("rect", { x: "130", y: "200", width: "12", height: "12" }),
          s("rect", { x: "1020", y: "150", width: "12", height: "12" }), s("rect", { x: "1055", y: "190", width: "12", height: "12" })
        ])
      ]));
      c.appendChild(far);
      c.appendChild(e("div", { class: "adv-haze-bottom" }));
    },
    place: function (art, ctx, kit) {
      art.appendChild(kit.el("div", { class: "adv-energy", "aria-hidden": "true" }));
      art.appendChild(kit.el("div", { class: "adv-neon" }));
    },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
