/*!
 * sw.js — منصة واحة التقنية · Master Shell
 * Offline support for the portal shell (portal + grade pages + shared assets).
 *
 * بنية الإصدار / Release structure
 * ---------------------------------
 * SHELL_PRECACHE  : ملفات الهيكل الرئيسي فقط. لا تحوي ولن تحوي أي ملف منصة فصل.
 * PLATFORM_ROUTES : مسارات منصات الفصول المركّبة فعليًا. فارغة في الهيكل النظيف.
 *
 * عند تركيب المنصات الثماني في مرحلة الدمج التالية:
 *   1) أضف مسار كل منصة إلى PLATFORM_ROUTES بالصيغة "./gradeN/semesterM/index.html".
 *   2) ارفع CACHE_VERSION.
 * لا تُضف أسماء ملفات دروس أو محاكيات أو أصول داخلية — كل منصة ملف HTML مفرد مكتفٍ ذاتيًا.
 *
 * أي مسار /gradeN/semesterM/ غير مُدرج في PLATFORM_ROUTES يُعامل كموضع محجوز
 * (Placeholder) فلا يُخزَّن في أي cache إطلاقًا، حتى لا تبقى له آثار بعد التركيب.
 *
 * رفع CACHE_VERSION يحذف كل cache سابق في مرحلة activate، فلا يبقى أثر لأي بناء قديم.
 * إعداد وتنفيذ الأستاذة دعاء الجرواني
 */
"use strict";

var CACHE_VERSION = "v4.0.0-adventure-gameworlds-2026-08-11";
var SHELL = "waha-shell-" + CACHE_VERSION;
var RUNTIME = "waha-runtime-" + CACHE_VERSION;

/* ملفات الهيكل الرئيسي — لا تحتوي على أي محتوى منصة فصل. */
var SHELL_PRECACHE = [
  "./",
  "./index.html",
  "./404.html",
  "./about.html",
  "./manifest.webmanifest",
  "./assets/css/portal.css",
  "./assets/css/visual-polish.css",
  "./assets/css/grade-compact.css",
  "./assets/js/app.js",
  "./assets/data/stats.json",
  "./assets/img/moe-logo-168.png",
  "./assets/img/moe-logo-336.png",
  "./assets/img/hero-1280.avif",
  "./assets/img/hero-1280.webp",
  "./assets/img/signature-white.png",
  "./assets/img/favicon-64.png",
  "./assets/img/icon-192.png",
  "./grade1/index.html",
  "./grade2/index.html",
  "./grade3/index.html",
  "./grade4/index.html",
  /* طبقة المغامرة الاختيارية — أصول الهيكل المشتركة (لا تمسّ محتوى الدروس) */
  "./adventure/core.css",
  "./adventure/scene.css",
  "./adventure/engine.js",
  "./adventure/progress.js",
  "./adventure/scenery.js",
  "./adventure/gate.css",
  "./adventure/gate.js",
  "./adventure/worlds/g1s1.css",
  "./adventure/worlds/g1s2.css",
  "./adventure/worlds/g2s1.css",
  "./adventure/worlds/g2s2.css",
  "./adventure/worlds/g3s1.css",
  "./adventure/worlds/g3s2.css",
  "./adventure/worlds/g4s1.css",
  "./adventure/worlds/g4s2.css",
  "./adventure/worlds/g1s1.js",
  "./adventure/worlds/g1s2.js",
  "./adventure/worlds/g2s1.js",
  "./adventure/worlds/g2s2.js",
  "./adventure/worlds/g3s1.js",
  "./adventure/worlds/g3s2.js",
  "./adventure/worlds/g4s1.js",
  "./adventure/worlds/g4s2.js",
  /* بوابات عوالم المغامرة (ملفات إقلاع خفيفة، منفصلة عن منصات الدروس) */
  "./grade1/semester1/adventure.html",
  "./grade1/semester2/adventure.html",
  "./grade2/semester1/adventure.html",
  "./grade2/semester2/adventure.html",
  "./grade3/semester1/adventure.html",
  "./grade3/semester2/adventure.html",
  "./grade4/semester1/adventure.html",
  "./grade4/semester2/adventure.html"
];

/* مسارات منصات الفصول المركّبة. فارغة في الهيكل النظيف — تُملأ عند الدمج. */
var PLATFORM_ROUTES = [
  "./grade1/semester1/index.html",
  "./grade1/semester2/index.html",
  "./grade2/semester1/index.html",
  "./grade2/semester2/index.html",
  "./grade3/semester1/index.html",
  "./grade3/semester2/index.html",
  "./grade4/semester1/index.html",
  "./grade4/semester2/index.html"
];

var PRECACHE = SHELL_PRECACHE.concat(PLATFORM_ROUTES);

/* /gradeN/semesterM/… */
var SEMESTER_PATH = /\/grade[1-4]\/semester[1-2]\//;

/* هل هذا المسار منصة فصل مركّبة فعلًا؟ */
function isInstalledPlatform(pathname) {
  var i, route, tail;
  for (i = 0; i < PLATFORM_ROUTES.length; i++) {
    route = PLATFORM_ROUTES[i].replace(/^\.\//, "/");
    tail = route.replace(/index\.html$/, "");
    if (pathname === route || pathname === tail) { return true; }
    if (pathname.indexOf(tail) === 0) { return true; }
  }
  return false;
}

/* موضع محجوز: مسار فصل غير مُدرج ضمن المنصات المركّبة — لا يُخزَّن أبدًا. */
function isPlaceholderSlot(pathname) {
  return SEMESTER_PATH.test(pathname) && !isInstalledPlatform(pathname);
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(SHELL).then(function (cache) {
      /* addAll is all-or-nothing; add one by one so a single miss cannot
         abort the whole installation. */
      return Promise.all(PRECACHE.map(function (url) {
        return cache.add(new Request(url, { cache: "reload" })).catch(function () { return null; });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      /* احذف كل cache لا ينتمي إلى هذا الإصدار بالضبط، فلا ينجو بناء قديم من نشر جديد. */
      return Promise.all(keys.map(function (key) {
        if (key !== SHELL && key !== RUNTIME) { return caches.delete(key); }
        return null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("message", function (event) {
  if (event.data === "SKIP_WAITING") { self.skipWaiting(); }
});

function fromCache(request) {
  return caches.match(request, { ignoreVary: true });
}

function putRuntime(request, response) {
  if (!response || !response.ok || response.type === "opaque") { return response; }
  var copy = response.clone();
  caches.open(RUNTIME).then(function (cache) { cache.put(request, copy); });
  return response;
}

self.addEventListener("fetch", function (event) {
  var request = event.request;

  if (request.method !== "GET") { return; }

  var url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return;
  }

  /* Same-origin only. Nothing external is ever cached or served. */
  if (url.origin !== self.location.origin) { return; }

  /* Anything carrying a query string is treated as live data and is never
     served from the cache, so stored progress can never go stale. */
  if (url.search) { return; }

  if (request.headers.get("range")) { return; }

  /* موضع فصل محجوز: تجاوز الـService Worker كليًا — لا قراءة ولا كتابة cache. */
  if (isPlaceholderSlot(url.pathname)) { return; }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(function (response) { return putRuntime(request, response); })
        .catch(function () {
          return fromCache(request).then(function (hit) {
            if (hit) { return hit; }
            /* شكل المجلد (/gradeN/) دون اتصال: المخزَّن هو index.html بداخله */
            var alt = url.pathname.slice(-1) === "/" ? url.pathname + "index.html" : null;
            return (alt ? fromCache(alt) : Promise.resolve(null)).then(function (h2) {
              if (h2) { return h2; }
              return fromCache("./index.html").then(function (h3) {
                return h3 || Response.error();
              });
            });
          });
        })
    );
    return;
  }

  /* HTML documents are never served from cache first. A semester platform is a
     single large HTML file; serving a stale copy would run an older build.
     Network wins; cache is the offline fallback only. */
  if (/\.html?$/.test(url.pathname) || url.pathname.slice(-1) === "/") {
    event.respondWith(
      fetch(request)
        .then(function (response) { return putRuntime(request, response); })
        .catch(function () { return fromCache(request).then(function (h) { return h || Response.error(); }); })
    );
    return;
  }

  event.respondWith(
    fromCache(request).then(function (hit) {
      if (hit) {
        /* refresh quietly in the background */
        fetch(request).then(function (response) {
          putRuntime(request, response);
        }).catch(function () { /* offline: keep the cached copy */ });
        return hit;
      }
      return fetch(request).then(function (response) {
        return putRuntime(request, response);
      });
    })
  );
});
