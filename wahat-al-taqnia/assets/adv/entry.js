/*!
 * واحة التقنية · بوابة الدخول
 * تثبّت نوع الدخول بوضوح قبل أي مسار، فلا يتحوّل الطالب إلى معلم بالصدفة.
 */
(function (root) {
"use strict";
function setRole(r) {
  try {
    root.localStorage.setItem("waha.adv.role", r);
    var raw = root.localStorage.getItem("waha.adv.v1"), o = raw ? JSON.parse(raw) : {};
    o.mode = r; if (!o.v) o.v = 1; if (!o.worlds) o.worlds = {};
    root.localStorage.setItem("waha.adv.v1", JSON.stringify(o));
  } catch (e) {}
}
function boot() {
  var doors = document.querySelectorAll(".door");
  Array.prototype.forEach.call(doors, function (a) {
    a.addEventListener("click", function () {
      var href = a.getAttribute("href") || "";
      setRole(href.indexOf("role=teacher") >= 0 ? "teacher" : "student");
      /* a fresh entry should never inherit a previous "exit to basic" flag */
      try { root.sessionStorage.removeItem("waha.adv.optout"); } catch (e) {}
    });
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
})(window);
