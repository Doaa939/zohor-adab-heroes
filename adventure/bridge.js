/*!
 * adventure/bridge.js — جسر التنقّل: يفتح الدرس الأصلي المحدَّد مباشرةً
 * (canonical source; this exact code is inlined into each semester file — see
 * §Navigation Bridge in the delivery report. It is inlined rather than linked
 * because some platforms declare an inline CSP of script-src 'unsafe-inline'
 * WITHOUT 'self', which blocks external scripts. Inlining uses the platform's
 * existing 'unsafe-inline' allowance, so NO security policy is weakened.)
 *
 * When a mission is entered from Adventure Mode, the adventure page stores the
 * target lesson in sessionStorage("adv:target:<gNsM>") and opens the ORIGINAL
 * platform. This bridge reads it and calls the platform's OWN lesson-opening
 * API so the correct lesson opens directly. It does NOT touch educational
 * content or the lesson engine — it only invokes an existing public function,
 * exactly as the platform's own menu does. Normal (Basic) entry → complete
 * no-op. No eval, no new Function, no remote requests, no innerHTML.
 */
(function () {
  "use strict";
  var code = (document.documentElement.getAttribute("data-waha") || "").trim();
  if (!/^g[1-4]s[12]$/.test(code)) return;
  var raw = null;
  try { raw = window.sessionStorage.getItem("adv:target:" + code); } catch (e) { raw = null; }
  if (!raw) return;                                   /* Basic Mode → no-op */
  try { window.sessionStorage.removeItem("adv:target:" + code); } catch (e) {}
  var t; try { t = JSON.parse(raw); } catch (e) { t = { id: raw, ar: "" }; }
  if (!t || !t.id) return;

  var OPEN = {
    g1s1: function (id) { window.W.scene.go("lesson", { id: id }); },
    g1s2: function (id) { window.WADI.scene.go("lesson", { id: id }); },
    g2s1: function (id) {
      var W = window.WAHAT2, L = (W.curriculum.LESSONS || []).filter(function (x) { return x.id === id; })[0];
      var host = document.getElementById("stage") || document.querySelector(".stage") || document.body;
      W.mountLesson(host, L);
    },
    g2s2: function (id) { window.WADI.scene.go("lesson", { id: id }); },
    g3s1: function (id) { window.MNARA.scene.go("lesson", { id: id }); },
    g3s2: function (id) { window.MNARA.scene.go("s2lesson", { id: id }); },
    g4s1: function (id) { window.G4.scene.go("lesson", { id: id }); },
    g4s2: function (id) {
      var W = window.G4S2, host = document.getElementById("stage") || document.querySelector(".stage") || document.body;
      W.lesson.open(id, host, function () { try { if (W.flow && W.flow.build) W.flow.build(); } catch (e) {} });
    }
  };
  function sceneReady(g, name) {
    try {
      var s = window[g] && window[g].scene;
      if (!s) return false;
      if (typeof s.has === "function") return s.has(name);   /* precise where available */
      return true;                                            /* fallback: scene exists (retry absorbs early throws) */
    } catch (e) { return false; }
  }
  var READY = {
    g1s1: function () { return sceneReady("W", "lesson"); },
    g1s2: function () { return sceneReady("WADI", "lesson"); },
    g2s1: function () { return !!(window.WAHAT2 && window.WAHAT2.mountLesson && window.WAHAT2.curriculum && (window.WAHAT2.curriculum.LESSONS || []).length); },
    g2s2: function () { return sceneReady("WADI", "lesson"); },
    g3s1: function () { return sceneReady("MNARA", "lesson"); },
    g3s2: function () { return sceneReady("MNARA", "s2lesson"); },
    g4s1: function () { return sceneReady("G4", "lesson"); },
    g4s2: function () { return !!(window.G4S2 && window.G4S2.lesson && window.G4S2.curriculum); }
  };
  var open = OPEN[code], ready = READY[code];
  if (!open || !ready) return;

  var strip = function (s) { return String(s || "").replace(/[ً-ٰٟ]/g, ""); };
  var want = strip(t.ar);
  function shown() {
    if (!want) return false;
    try { return strip(document.body.innerText || "").indexOf(want) >= 0; } catch (e) { return false; }
  }

  /* Call the platform's opener, then verify the lesson actually rendered; some
     platforms mount an opening/home scene that can override an early call, so we
     retry until the target title appears (or we time out). Once shown, we stop
     — so a lesson already open is never re-mounted. */
  var tries = 0, MAX = 40;             /* ~10s at 250ms */
  function tick() {
    tries++;
    if (shown()) return;               /* success — stop, no re-mount */
    try { if (ready()) open(t.id); } catch (e) { /* not ready yet */ }
    if (tries < MAX) setTimeout(tick, 250);
  }
  function start() { setTimeout(tick, 250); }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
