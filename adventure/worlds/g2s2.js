/*!
 * adventure/worlds/g2s2.js — «وادي الشيفرات والكنز الرقمي»
 * Grade 2 · Semester 2. Lesson data mirrors the ORIGINAL platform curriculum
 * (WADI.curriculum) verbatim — official titles, order, unit, and numbering.
 * Completion is read from the original blob: waha:g2s2:wadi.g2s2.v1 →
 * progress[lessonId].done. This file adds presentation only.
 */
(function () {
  "use strict";
  if (!window.ADV) return;

  var UNIT = "هَيَّا نُبَرْمِجُ";

  /* The 14 official lessons, exactly as the platform defines them. */
  var LESSONS = [
    { id: "l1",  no: "1.1",  ar: "كَيْفِيَّةُ البَرْمَجَةِ" },
    { id: "l2",  no: "1.2",  ar: "التَّحَكُّمُ في الوَقْتِ" },
    { id: "l3",  no: "1.3",  ar: "حَلُّ الْمُشْكِلاتِ" },
    { id: "l4",  no: "1.4",  ar: "طُرُقُ تَشْغيلِ البَرْنامَجِ" },
    { id: "l5",  no: "1.5",  ar: "لِنَتَدَرَّبْ على طُرُقِ تَشْغيلِ البَرْنامَجِ" },
    { id: "l6",  no: "1.6",  ar: "الرُّسومُ الـمُتَحَرِّكَةُ" },
    { id: "l7",  no: "1.7",  ar: "لِنَتَدَرَّبْ على الرُّسومِ الـمُتَحَرِّكَةِ" },
    { id: "l8",  no: "1.8",  ar: "التَّعامُلُ مَعَ الصَّفَحاتِ" },
    { id: "l9",  no: "1.9",  ar: "الأنْماطُ" },
    { id: "l10", no: "1.10", ar: "التَّكْرارُ" },
    { id: "l11", no: "1.11", ar: "لِنَتَدَرَّبْ على التَّكْرارِ" },
    { id: "l12", no: "1.12", ar: "التَّحَكُّمُ في ظُهورِ كائِنٍ" },
    { id: "l13", no: "1.13", ar: "لِنَتَدَرَّبْ على التَّحَكُّمِ في ظُهورِ الكائِنِ" },
    { id: "l14", no: "1.14", ar: "الـمَشْروعُ" }
  ];
  LESSONS.forEach(function (l) { l.unit = "u1"; });

  function lantern() {
    var s = ADV._svg;
    return ADV._el("span", { class: "adv-lantern", "aria-hidden": "true" }, [
      s("svg", { viewBox: "0 0 24 32" }, [
        s("path", { d: "M9 2h6v3H9z", fill: "rgba(255,255,255,.35)" }),
        s("path", { d: "M7 6h10l1.4 3H5.6z", fill: "#3a4652" }),
        s("rect", { x: "6.5", y: "9", width: "11", height: "15", rx: "2", fill: "rgba(0,0,0,.28)", stroke: "#4a5764" }),
        s("path", { "class": "flame", d: "M12 11c1.6 1.8 2.4 3 2.4 4.4A2.4 2.4 0 0 1 12 18a2.4 2.4 0 0 1-2.4-2.6c0-1.4.8-2.6 2.4-4.4z" }),
        s("path", { d: "M8 24h8l1 4H7z", fill: "#3a4652" })
      ])
    ]);
  }

  ADV.register({
    code: "g2s2",
    storageKey: "waha:g2s2:wadi.g2s2.v1",
    title: "وادي الشيفرات والكنز الرقمي",
    subtitle: "الصف الثاني · الفصل الثاني",
    gradeLabel: "الصف الثاني · الفصل الثاني",
    tagline: "ارتحل في الوادي، أضئ فوانيسه بإتمام كل مهمة، حتى تكشف الكنز الرقمي في نهايته.",
    intro: "أهلًا بك في وادي الشيفرات! على امتداد الوادي فوانيسُ خامدة، وكل مهمة تُنجزها تُضيء فانوسًا وتُجري ماء الفلج، حتى تصل إلى الكنز الرقمي في نهاية الرحلة.",
    lessons: LESSONS,
    unitOf: function () { return UNIT; },

    msgStart: "جاهز؟ مهمتك الأولى في الوادي تنتظرك.",
    msgLocked: "أكمل المهمة السابقة أولًا ليضيء الطريق.",
    msgDone: "أحسنت! أضأتَ فانوس المهمة.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "أضأتَ الوادي كله وكشفتَ الكنز الرقمي. يمكنك العودة لأي مهمة متى شئت.",

    /* cinematic layered backdrop */
    backdrop: function (container, eng, kit) {
      var s = kit.svg, e = kit.el;
      container.appendChild(e("div", { class: "adv-sky-haze" }));
      container.appendChild(e("div", { class: "adv-sun" }));
      /* far silhouette layer: mountains + fort + palms */
      var far = e("div", { class: "adv-far" });
      far.appendChild(
        s("svg", { viewBox: "0 0 1200 500", preserveAspectRatio: "xMidYMax slice" }, [
          /* distant ridge */
          s("path", { d: "M0 320 L120 250 L240 300 L380 220 L520 300 L680 210 L820 290 L980 230 L1120 300 L1200 260 L1200 500 L0 500 Z", fill: "#16283a", opacity: "0.8" }),
          /* nearer ridge */
          s("path", { d: "M0 380 L160 320 L320 372 L470 310 L640 380 L820 320 L1000 384 L1200 330 L1200 500 L0 500 Z", fill: "#12202f" }),
          /* fort silhouette */
          s("g", { fill: "#0e1a26", opacity: "0.95" }, [
            s("path", { d: "M900 300 h150 v100 h-150 z" }),
            s("path", { d: "M900 300 h12 v-14 h12 v14 h14 v-14 h12 v14 h14 v-14 h12 v14 h14 v-14 h12 v14 h14 v-14 h12 v14 h6 v10 h-150z" }),
            s("rect", { x: "960", y: "340", width: "30", height: "60", fill: "#1a2a38" })
          ]),
          /* palms */
          s("g", { stroke: "#0e1a26", "stroke-width": "5", fill: "none", opacity: "0.9", "stroke-linecap": "round" }, [
            s("path", { d: "M170 400 q6 -60 2 -96" }),
            s("path", { d: "M172 306 q-30 -10 -46 -30 M172 306 q30 -10 46 -30 M172 306 q-16 -26 -20 -50 M172 306 q16 -26 20 -50" }),
            s("path", { d: "M250 400 q6 -50 2 -80" }),
            s("path", { d: "M252 322 q-24 -8 -38 -24 M252 322 q24 -8 38 -24 M252 322 q-12 -22 -16 -42 M252 322 q12 -22 16 -42" })
          ])
        ])
      );
      container.appendChild(far);
      container.appendChild(e("div", { class: "adv-haze-bottom" }));
    },

    /* per-station "place" art: falaj ribbon + lantern; last mission = treasure */
    place: function (art, ctx, kit) {
      var e = kit.el;
      var isTreasure = ctx.lesson.id === "l14";
      if (isTreasure) {
        ctx.stationEl.classList.add("adv-station--treasure");
        art.appendChild(e("div", { class: "adv-treasure-glow" }));
      }
      art.appendChild(e("div", { class: "adv-falaj" }));
      ctx.placeEl.appendChild(lantern());
    },

    onMissionDone: function (stationEl /*, id, eng */) {
      stationEl.setAttribute("data-state", "done");
    },
    onWorldComplete: function (eng) {
      eng.root.classList.add("is-worlddone");
    }
  });
})();
