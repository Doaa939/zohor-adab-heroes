/*!
 * adventure/scenery.js — shared cinematic SVG scenery primitives.
 * Reusable layered-art building blocks (mountains, dunes, palms, lanterns,
 * buildings, water, stars, drones…) that each world composes DIFFERENTLY into
 * its own dense, deep scene. Pure SVG, local, deterministic (no Math.random).
 * The functional engine stays shared; the visual composition per world is not.
 */
(function (global) {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function S(tag, attrs, kids) {
    var n = document.createElementNS(NS, tag), k;
    if (attrs) for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k) && attrs[k] != null) n.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function P(d, a) { a = a || {}; a.d = d; return S("path", a); }
  /* deterministic pseudo-random so scenes are stable across renders/resumes */
  function rng(seed) { var s = (seed | 0) || 1; return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

  var art = {
    S: S, P: P, rng: rng,

    /* smooth path string through a list of {x,y} points */
    smoothPath: function (pts) {
      if (!pts.length) return "";
      var d = "M" + pts[0].x + " " + pts[0].y, i, a, b, my;
      for (i = 1; i < pts.length; i++) { a = pts[i - 1]; b = pts[i]; my = (a.y + b.y) / 2;
        d += " C" + a.x + " " + my + " " + b.x + " " + my + " " + b.x + " " + b.y; }
      return d;
    },
    /* glowing waypoint stamps along the path (done = solid, else faint) */
    waypoints: function (pts, opt) {
      opt = opt || {}; var g = S("g", {}), i, p, mid, on;
      for (i = 0; i < pts.length - 1; i++) {
        p = pts[i]; mid = { x: (p.x + pts[i + 1].x) / 2, y: (p.y + pts[i + 1].y) / 2 };
        on = p.state === "done";
        g.appendChild(S("circle", { cx: mid.x, cy: mid.y, r: 5,
          fill: on ? (opt.on || "var(--adv-accent)") : "none",
          stroke: on ? (opt.on || "var(--adv-accent)") : (opt.off || "rgba(255,255,255,.28)"),
          "stroke-width": 1.5, opacity: on ? 0.9 : 0.6,
          style: on ? "filter:drop-shadow(0 0 4px var(--adv-glow))" : "" }));
      }
      return g;
    },
    /* a reusable linear gradient (top→bottom) */
    grad: function (id, stops) {
      var lg = S("linearGradient", { id: id, x1: 0, y1: 0, x2: 0, y2: 1 });
      stops.forEach(function (s) { lg.appendChild(S("stop", { offset: s[0], "stop-color": s[1] })); });
      return lg;
    },

    /* jagged mountain range across the full width at a given y band */
    mountains: function (w, opt) {
      opt = opt || {}; var y = opt.y || 120, h = opt.h || 90, fill = opt.fill || "#1a2432",
        op = opt.opacity != null ? opt.opacity : 1, r = rng(opt.seed || 7), step = opt.step || 90;
      var d = "M0 " + (y + h), x, peak;
      for (x = 0; x <= w; x += step) { peak = y + (0.2 + r() * 0.8) * h; d += " L" + x + " " + peak.toFixed(1); }
      d += " L" + w + " " + (y + h) + " Z";
      return P(d, { fill: fill, opacity: op });
    },
    /* soft rolling ridge */
    ridge: function (w, opt) {
      opt = opt || {}; var y = opt.y || 200, a = opt.amp || 22, fill = opt.fill || "#16202c",
        op = opt.opacity != null ? opt.opacity : 1, r = rng(opt.seed || 3), step = opt.step || 160;
      var d = "M0 " + (y + a * 2), x, py = y, ny;
      for (x = 0; x <= w; x += step) { ny = y + (r() - 0.5) * a; d += " Q" + (x - step / 2) + " " + py + " " + x + " " + ny; py = ny; }
      d += " L" + w + " " + (y + a * 3) + " L0 " + (y + a * 3) + " Z";
      return P(d, { fill: fill, opacity: op });
    },
    /* a warm glowing lantern (post optional) */
    lantern: function (x, y, s, opt) {
      opt = opt || {}; s = s || 1;
      var g = S("g", { transform: "translate(" + x + " " + y + ") scale(" + s + ")" });
      if (opt.post) g.appendChild(S("rect", { x: -1.4, y: 0, width: 2.8, height: opt.post, fill: "#3c2f20" }));
      g.appendChild(S("circle", { cx: 0, cy: 0, r: 9, fill: "url(#advLampGlow)", opacity: opt.lit === false ? 0.15 : 0.9 }));
      g.appendChild(S("rect", { x: -3.2, y: -5, width: 6.4, height: 9, rx: 1.6, fill: opt.lit === false ? "#2a2418" : "#ffcf7a", stroke: "#6a4f2c", "stroke-width": 0.8 }));
      g.appendChild(S("rect", { x: -3.6, y: -6.4, width: 7.2, height: 1.8, rx: 0.6, fill: "#4a381f" }));
      return g;
    },
    /* palm tree */
    palm: function (x, y, s, opt) {
      opt = opt || {}; s = s || 1; var trunk = opt.trunk || "#3f3120", frond = opt.frond || "#2f5233";
      var g = S("g", { transform: "translate(" + x + " " + y + ") scale(" + s + ")" });
      g.appendChild(P("M-2 0 q3 -26 0 -46 q-3 20 0 46 z", { fill: trunk }));
      g.appendChild(P("M0 -46 q-20 -6 -32 -20 M0 -46 q20 -6 32 -20 M0 -46 q-12 -18 -16 -34 M0 -46 q12 -18 16 -34 M0 -46 q-26 2 -34 -4 M0 -46 q26 2 34 -4",
        { fill: "none", stroke: frond, "stroke-width": 4.5, "stroke-linecap": "round" }));
      return g;
    },
    /* a small silhouette building with (optionally lit) windows */
    building: function (x, y, w, h, opt) {
      opt = opt || {}; var fill = opt.fill || "#20303f", roof = opt.roof || "#152230", win = opt.win || "#0d1622";
      var g = S("g", { transform: "translate(" + x + " " + y + ")" });
      g.appendChild(S("rect", { x: 0, y: -h, width: w, height: h, fill: fill }));
      if (opt.roof !== false) g.appendChild(S("rect", { x: -2, y: -h - 5, width: w + 4, height: 6, fill: roof }));
      var cols = Math.max(1, Math.floor(w / 16)), rows = Math.max(1, Math.floor(h / 18)), i, j, r = rng((x + y) | 1);
      for (i = 0; i < cols; i++) for (j = 0; j < rows; j++) {
        g.appendChild(S("rect", { x: 5 + i * 16, y: -h + 8 + j * 18, width: 7, height: 9, rx: 1,
          fill: r() > 0.4 ? (opt.litWin || "#ffcf7a") : win, opacity: r() > 0.4 ? 0.85 : 1 }));
      }
      return g;
    },
    /* glowing water/energy stream following a path */
    stream: function (d, opt) {
      opt = opt || {}; var g = S("g", {});
      g.appendChild(P(d, { fill: "none", stroke: opt.base || "rgba(63,209,199,.25)", "stroke-width": opt.w || 10, "stroke-linecap": "round" }));
      g.appendChild(P(d, { fill: "none", stroke: opt.glow || "rgba(120,240,230,.85)", "stroke-width": (opt.w || 10) * 0.4, "stroke-linecap": "round",
        style: "filter:drop-shadow(0 0 5px " + (opt.glow || "rgba(120,240,230,.8)") + ")" }));
      return g;
    },
    /* scattered stars in the upper band */
    stars: function (w, opt) {
      opt = opt || {}; var n = opt.n || 40, ymax = opt.ymax || 200, r = rng(opt.seed || 11), g = S("g", {}), i;
      for (i = 0; i < n; i++) g.appendChild(S("circle", { cx: (r() * w).toFixed(0), cy: (r() * ymax).toFixed(0), r: (0.5 + r() * 1.3).toFixed(1), fill: "#fff", opacity: (0.3 + r() * 0.5).toFixed(2) }));
      return g;
    },
    /* soft cloud */
    cloud: function (x, y, s, col) {
      s = s || 1; return P("M0 0 q-14 -14 6 -18 q4 -14 22 -8 q16 -12 26 4 q18 0 10 16 z",
        { transform: "translate(" + x + " " + y + ") scale(" + s + ")", fill: col || "rgba(255,255,255,.10)" });
    },
    /* little flying drone (tech worlds) */
    drone: function (x, y, s, col) {
      s = s || 1; var g = S("g", { transform: "translate(" + x + " " + y + ") scale(" + s + ")" });
      g.appendChild(S("ellipse", { cx: 0, cy: 0, rx: 7, ry: 3, fill: col || "#2b3b52" }));
      g.appendChild(S("rect", { x: -12, y: -2, width: 6, height: 1.6, fill: col || "#2b3b52" }));
      g.appendChild(S("rect", { x: 6, y: -2, width: 6, height: 1.6, fill: col || "#2b3b52" }));
      g.appendChild(S("circle", { cx: 0, cy: 1, r: 1.6, fill: "#7fe0ff" }));
      return g;
    },
    /* reusable defs (glow gradients) — call once per scene svg */
    defs: function () {
      return S("defs", {}, [
        (function () { var rg = S("radialGradient", { id: "advLampGlow" });
          rg.appendChild(S("stop", { offset: "0%", "stop-color": "rgba(255,207,122,.9)" }));
          rg.appendChild(S("stop", { offset: "100%", "stop-color": "rgba(255,207,122,0)" })); return rg; })()
      ]);
    }
  };
  global.ADV = global.ADV || {};
  global.ADV.art = art;
})(window);
