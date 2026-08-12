/*!
 * واحة التقنية · طبقة الربط على الواجهة الأصلية
 * لا تحذف أي محتوى أصلي — تضيف فقط:
 *   • زر الانتقال إلى عالم المغامرة
 *   • رابط العودة إلى بوابة الدخول
 *   • شارة «وضع المعلم» عند الدخول من بوابة المعلم
 *   • تمرير المسار المباشر (adv=0) إلى منصات الفصول
 */
(function (root) {
"use strict";
var doc = document;
var KEY_ROLE = "waha.adv.role";

function el(tag, cls, text) {
  var n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function get(k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } }
function set(k, v) { try { root.localStorage.setItem(k, v); } catch (e) {} }
function param(n) { try { return new URLSearchParams(root.location.search).get(n); } catch (e) { return null; } }

/* depth: "" on home.html, "../" inside /gradeN/ */
function rootPath() { return doc.documentElement.getAttribute("data-root") || ""; }

function boot() {
  var body = doc.body;
  var isHome = body.classList.contains("page--home");
  var isGrade = body.classList.contains("page--grade");
  if (!isHome && !isGrade) return;

  /* the entry gate may hand us a role */
  var qRole = param("role");
  if (qRole === "teacher" || qRole === "student") set(KEY_ROLE, qRole);
  var role = get(KEY_ROLE);

  /* ---------------------------------------------- top links (both pages) */
  var bar = el("div", "wh-bar");
  var gate = el("a", "wh-gate", "⌂ بوابة الدخول");
  gate.href = rootPath() + "index.html";
  bar.appendChild(gate);
  if (role === "teacher") {
    var t = el("span", "wh-teacher", "👩‍🏫 وضع المعلم — كل الدروس مفتوحة");
    bar.appendChild(t);
  }
  doc.body.appendChild(bar);

  /* ---------------------------------------------- adventure call-to-action */
  var cta = el("a", "wh-adv");
  cta.href = rootPath() + "adventure.html";
  cta.appendChild(el("span", "wh-adv-i", "🎮"));
  var txt = el("span", "wh-adv-t");
  txt.appendChild(el("b", null, "الانتقال إلى عالم المغامرة"));
  txt.appendChild(el("span", null, "تجربة ثلاثية الأبعاد: تتقدّم في العالم كلما أتقنت درسًا"));
  cta.appendChild(txt);
  cta.appendChild(el("span", "wh-adv-go", "←"));

  if (isHome) {
    /* place it right under the hero copy so it reads as part of the page */
    var stage = doc.querySelector(".stage__copy") || doc.querySelector(".stage");
    if (stage) stage.appendChild(cta);
    else doc.querySelector("main").insertBefore(cta, doc.querySelector("main").firstChild);
  } else {
    var head = doc.querySelector(".gradehead");
    if (head && head.parentNode) head.parentNode.insertBefore(cta, head.nextSibling);
  }

  /* ---------------------------------------------- direct path on semesters */
  /* The original home is the DIRECT route: open the platform as it always was.
     No second "basic or adventure?" question — that choice was made at the gate. */
  var links = doc.querySelectorAll("a[data-launch]");
  Array.prototype.forEach.call(links, function (a) {
    var href = a.getAttribute("href");
    if (!href || href.indexOf("adv=") >= 0) return;
    a.setAttribute("href", href + (href.indexOf("?") >= 0 ? "&" : "?") + "adv=0" + (role ? "&role=" + role : ""));
  });
}

if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
else boot();

})(window);
