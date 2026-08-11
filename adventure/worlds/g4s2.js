/*!
 * adventure/worlds/g4s2.js — «محطة المستقبل والبيانات»
 * Grade 4 · Semester 2. Lessons/ids/units mirror G4S2.curriculum.
 * Completion read: progress[id].done (G4S2.store; id scheme "1.1"…"2.4").
 * Presentation only.
 */
(function () {
  "use strict";
  if (!window.ADV) return;
  var MODULE = { u1: "هيا نبرمج", u2: "لنتعامل مع البيانات" };
  var L = [
    ["1.1","كيفية البرمجة","u1"],["1.2","تحرير مظاهر الكائنات","u1"],["1.3","مبدأ عمل البرمجة","u1"],
    ["1.4","التفاعل في Scratch","u1"],["1.5","لنتدرب على Scratch","u1"],["1.6","إنشاء الرسوم المتحركة","u1"],
    ["1.7","لنتدرب على الرسوم المتحركة","u1"],["1.8","إنشاء لعبة","u1"],["1.9","لنتدرب على الحركة في Scratch","u1"],
    ["1.10","المشروع","u1"],
    ["2.1","الجداول الحسابية","u2"],["2.2","تنظيم البيانات","u2"],
    ["2.3","لنتدرب على الجداول الحسابية","u2"],["2.4","العمليات الحسابية","u2"]
  ].map(function (r) { return { id: r[0], no: r[0], ar: r[1], unit: r[2] }; });

  ADV.register({
    code: "g4s2", storageKey: "waha:g4s2:waha:g4s2:v1",
    title: "محطة المستقبل والبيانات", subtitle: "الصف الرابع · الفصل الثاني",
    tagline: "أعِد الطاقة إلى وحدات المحطة؛ كل مهمة تُشغّل وحدةً وتستعيد نظامًا من أنظمة المحطة.",
    intro: "محطة مستقبلية للبيانات فقدت طاقتها. مع كل مهمة تُنجزها تُشغّل وحدةً وتستعيد أحد أنظمة المحطة، حتى تعود جميع أنظمتها إلى العمل.",
    lessons: L,
    regionOf: function (l) { return { key: l.unit, kind: "قطاع", label: MODULE[l.unit] }; },
    unitOf: function (l) { return MODULE[l.unit]; },
    msgStart: "جاهز؟ أول وحدة في المحطة تنتظر طاقتك.",
    msgLocked: "أكمل الوحدة السابقة أولًا لتصل الطاقة.",
    msgDone: "أحسنت! استعادت وحدة جديدة طاقتها.",
    completeTitle: "أحسنت! أكملت رحلة الفصل الدراسي.",
    completeText: "استعادت المحطة كل أنظمتها، وعادت إلى العمل الكامل.",
    backdrop: function (c, eng, kit) {
      var e = kit.el, s = kit.svg;
      c.appendChild(e("div", { class: "adv-stars" }));
      c.appendChild(e("div", { class: "adv-datacore" }));
      var far = e("div", { class: "adv-far" });
      far.appendChild(s("svg", { viewBox: "0 0 1200 460", preserveAspectRatio: "xMidYMax slice" }, [
        s("g", { fill: "#0d1626", stroke: "#20415e", "stroke-width": "2" }, [
          s("path", { d: "M0 420 h1200" }),
          s("circle", { cx: "600", cy: "150", r: "70", fill: "#0e1c30" }),
          s("path", { d: "M600 80 v-30 M600 220 v30 M530 150 h-40 M670 150 h40" })
        ])
      ]));
      c.appendChild(far);
      c.appendChild(e("div", { class: "adv-haze-bottom" }));
    },
    place: function (art, ctx, kit) {
      art.appendChild(kit.el("div", { class: "adv-module", "aria-hidden": "true" }));
      art.appendChild(kit.el("div", { class: "adv-datastream" }));
    },
    onMissionDone: function (st) { st.setAttribute("data-state", "done"); },
    onWorldComplete: function (eng) { eng.root.classList.add("is-worlddone"); }
  });
})();
