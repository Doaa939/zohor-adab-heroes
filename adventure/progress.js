/*!
 * adventure/progress.js — Shared, documented READ-ONLY progress adapter.
 * Single source of truth used by BOTH the session gate (grade pages) and the
 * adventure engine (world pages), so "completed" is decided identically
 * everywhere. Reads the ORIGINAL platforms' own namespaced localStorage blobs.
 * Never writes. Handles the heterogeneous shapes actually used by the 8
 * platforms (verified at runtime):
 *   progress[id].done          · progress[id].mastered · progress[id].completed
 *   progress.lessons[id].completed  (g1s1)   · lessons[id].mastered  (g2s1)
 */
(function (global) {
  "use strict";
  function entryDone(e) {
    return !!(e && typeof e === "object" && (e.done === true || e.mastered === true || e.completed === true));
  }
  /* the object(s) that may hold per-lesson completion inside one parsed blob */
  function buckets(parsed) {
    var bs = [];
    if (!parsed || typeof parsed !== "object") return bs;
    if (parsed.progress && parsed.progress.lessons && typeof parsed.progress.lessons === "object") bs.push(parsed.progress.lessons);
    if (parsed.progress && typeof parsed.progress === "object") bs.push(parsed.progress);
    if (parsed.lessons && typeof parsed.lessons === "object") bs.push(parsed.lessons);
    return bs;
  }
  /* is a specific lesson id complete within one parsed blob? */
  function doneInBlob(parsed, id) {
    var bs = buckets(parsed), i;
    for (i = 0; i < bs.length; i++) { if (entryDone(bs[i][id])) return true; }
    return false;
  }
  /* every parsed blob under waha:<code>:*  */
  function blobs(code) {
    var pfx = "waha:" + code + ":", out = [], i, k, raw;
    try {
      for (i = 0; i < global.localStorage.length; i++) {
        k = global.localStorage.key(i);
        if (k && k.indexOf(pfx) === 0) { raw = global.localStorage.getItem(k); if (raw) { try { out.push(JSON.parse(raw)); } catch (e) {} } }
      }
    } catch (e) {}
    return out;
  }
  /* Set of completed lesson ids for a world (optionally restricted to a list). */
  function doneSet(code, lessonIds) {
    var bs = blobs(code), done = Object.create(null), i, b, id, bk;
    if (lessonIds && lessonIds.length) {
      lessonIds.forEach(function (lid) {
        for (i = 0; i < bs.length; i++) { if (doneInBlob(bs[i], lid)) { done[lid] = true; break; } }
      });
      return done;
    }
    /* no id list: count every completed entry found across the blobs' buckets */
    for (i = 0; i < bs.length; i++) {
      var bkts = buckets(bs[i]);
      for (b = 0; b < bkts.length; b++) { bk = bkts[b];
        for (id in bk) { if (Object.prototype.hasOwnProperty.call(bk, id) && entryDone(bk[id])) done[id] = true; }
      }
    }
    return done;
  }
  function count(code, lessonIds) { return Object.keys(doneSet(code, lessonIds)).length; }
  function hasAny(code) {
    /* any namespace key at all (progress may be recorded but zero mastered) */
    var pfx = "waha:" + code + ":", i, k;
    try { for (i = 0; i < global.localStorage.length; i++) { k = global.localStorage.key(i); if (k && k.indexOf(pfx) === 0) return true; } } catch (e) {}
    return false;
  }

  global.AdvProgress = {
    entryDone: entryDone, buckets: buckets, doneInBlob: doneInBlob,
    blobs: blobs, doneSet: doneSet, count: count, hasAny: hasAny
  };
})(window);
