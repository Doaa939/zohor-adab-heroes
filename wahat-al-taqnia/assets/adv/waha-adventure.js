/*!
 * waha-adventure · engine core
 * منصة واحة التقنية — طبقة المغامرة ثلاثية الأبعاد
 * محرك مشترك واحد يقود ثمانية عوالم مختلفة بنيويًا.
 * لا شبكة · لا CDN · لا تتبّع · يعمل دون اتصال.
 * إعداد المنصة: الأستاذة دعاء الجرواني
 */
(function (root) {
"use strict";
var W = root.WAHADV = root.WAHADV || {};
var T = root.THREE;

/* ============================================================ utilities */
var U = W.util = {
  clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
  lerp: function (a, b, t) { return a + (b - a) * t; },
  rand: function (a, b) { return a + Math.random() * (b - a); },
  /* deterministic pseudo-random so a world looks identical every visit */
  seeded: function (seed) {
    var s = seed >>> 0 || 1;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  },
  arabicNum: function (v) {
    return String(v).replace(/[0-9]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".charAt(+d); });
  },
  /* text node only — never innerHTML with dynamic data (XSS discipline) */
  el: function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  },
  prefersReduced: function () {
    return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
};

/* ============================================================ easing/tween */
var Ease = W.ease = {
  linear: function (t) { return t; },
  inOut:  function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
  out:    function (t) { return 1 - Math.pow(1 - t, 3); },
  outBack:function (t) { var c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  outElastic: function (t) { var c4 = (2 * Math.PI) / 3; return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1; }
};

function Tweener() { this.items = []; }
Tweener.prototype.to = function (obj, to, dur, ease, cb) {
  var from = {}; for (var k in to) from[k] = obj[k];
  var it = { obj: obj, from: from, to: to, dur: Math.max(0.0001, dur), t: 0, ease: ease || Ease.inOut, cb: cb };
  this.items.push(it); return it;
};
Tweener.prototype.val = function (set, from, to, dur, ease, cb) {
  var it = { set: set, from: from, to: to, dur: Math.max(0.0001, dur), t: 0, ease: ease || Ease.inOut, cb: cb };
  this.items.push(it); return it;
};
Tweener.prototype.kill = function (it) { var i = this.items.indexOf(it); if (i >= 0) this.items.splice(i, 1); };
Tweener.prototype.clear = function () { this.items.length = 0; };
Tweener.prototype.update = function (dt) {
  for (var i = this.items.length - 1; i >= 0; i--) {
    var it = this.items[i];
    it.t += dt / it.dur;
    var k = U.clamp(it.t, 0, 1), e = it.ease(k);
    if (it.set) it.set(it.from + (it.to - it.from) * e);
    else for (var p in it.to) it.obj[p] = it.from[p] + (it.to[p] - it.from[p]) * e;
    if (k >= 1) { this.items.splice(i, 1); if (it.cb) it.cb(); }
  }
};

/* ============================================================ quality tiers */
var TIERS = W.TIERS = {
  ultra:  { key:"ultra",  label:"فائقة",  dprCap:2,    shadow:2048, shadows:true,  particles:1.0, segments:1.0,  aa:true,  fx:true  },
  high:   { key:"high",   label:"عالية",  dprCap:1.75, shadow:1536, shadows:true,  particles:0.8, segments:0.85, aa:true,  fx:true  },
  medium: { key:"medium", label:"متوسطة", dprCap:1.35, shadow:1024, shadows:true,  particles:0.5, segments:0.65, aa:true,  fx:true  },
  low:    { key:"low",    label:"خفيفة",  dprCap:1,    shadow:0,    shadows:false, particles:0.25,segments:0.45, aa:false, fx:false }
};
var TIER_ORDER = ["ultra", "high", "medium", "low"];

/* Pick a sensible starting tier from device hints (never below what we can raise). */
function detectTier() {
  var mem = root.navigator && navigator.deviceMemory || 0;
  var cores = root.navigator && navigator.hardwareConcurrency || 0;
  var small = Math.min(root.innerWidth, root.innerHeight) < 480;
  var coarse = root.matchMedia && root.matchMedia("(pointer: coarse)").matches;
  if (mem && mem <= 2) return "low";
  if (cores && cores <= 4 && coarse) return "medium";
  if (coarse || small) return "high";
  return "ultra";
}

/* ============================================================ audio (synth) */
var Audio = W.audio = (function () {
  var ctx = null, master = null, ambient = null, enabled = false;
  function ensure() {
    if (ctx) return ctx;
    try {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.0; master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }
  function note(freq, dur, type, vol, delay, slideTo) {
    if (!enabled) return; var c = ensure(); if (!c) return;
    var t0 = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol == null ? 0.16 : vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    o.connect(g).connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  return {
    get enabled() { return enabled; },
    setEnabled: function (on) {
      enabled = !!on; var c = ensure(); if (!c) return;
      if (c.state === "suspended" && enabled) { try { c.resume(); } catch (e) {} }
      if (master) master.gain.setTargetAtTime(enabled ? 0.9 : 0.0, c.currentTime, 0.05);
      if (enabled && !ambient) startAmbient();
    },
    /* ambient bed: filtered noise = wind/sea/hum, shaped per world */
    setAmbientTone: function (cutoff) { if (ambient) try { ambient.filter.frequency.setTargetAtTime(cutoff, ctx.currentTime, 0.4); } catch (e) {} },
    reward: function () { note(880, .45, "sine", .16, 0); note(1320, .45, "sine", .13, .09); note(1760, .55, "sine", .11, .18); },
    unlock: function () { note(180, .55, "triangle", .15, 0, 620); note(520, .4, "sine", .08, .12); },
    travel: function () { note(320, .9, "sine", .07, 0, 180); },
    step:   function () { note(520, .1, "square", .05, 0); },
    click:  function () { note(660, .07, "square", .06, 0); },
    finale: function () { [523,659,784,1046].forEach(function (f, i) { note(f, .7, "sine", .14, i * .13); }); }
  };
  function startAmbient() {
    var c = ensure(); if (!c || ambient) return;
    var len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    var src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    var flt = c.createBiquadFilter(); flt.type = "lowpass"; flt.frequency.value = 500;
    var g = c.createGain(); g.gain.value = 0.05;
    var lfo = c.createOscillator(); lfo.frequency.value = 0.11;
    var lg = c.createGain(); lg.gain.value = 0.025;
    lfo.connect(lg).connect(g.gain);
    src.connect(flt).connect(g).connect(master);
    src.start(); lfo.start();
    ambient = { src: src, filter: flt, gain: g };
  }
})();

/* ============================================================ Engine */
function Engine(canvas) {
  this.canvas = canvas;
  this.tierName = detectTier();
  this.tier = TIERS[this.tierName];
  this.autoQuality = true;
  this.reduced = U.prefersReduced();
  this.tweens = new Tweener();
  this.clock = new T.Clock();
  this.running = false;
  this.disposables = [];
  this.updaters = [];
  this._fps = 60; this._lowSince = 0; this._raf = 0;
  this._onResize = this.resize.bind(this);
  this._onVis = this._visibility.bind(this);

  var r = this.renderer = new T.WebGLRenderer({
    canvas: canvas, antialias: this.tier.aa, powerPreference: "high-performance",
    alpha: false, stencil: false, depth: true
  });
  r.setPixelRatio(Math.min(root.devicePixelRatio || 1, this.tier.dprCap));
  r.shadowMap.enabled = this.tier.shadows;
  r.shadowMap.type = T.PCFSoftShadowMap;
  r.outputEncoding = T.sRGBEncoding;
  r.toneMapping = T.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.88;

  this.scene = new T.Scene();
  this.camera = new T.PerspectiveCamera(52, 1, 0.5, 2000);

  /* camera rig: an orbit target the world drives; user may nudge it */
  this.rig = { target: new T.Vector3(), az: 0, pol: 0.62, dist: 80, fov: 52 };
  this._camLook = new T.Vector3();
  this._userNudge = false;

  this.fx = new FX(this);
  this._bindInput();
  root.addEventListener("resize", this._onResize);
  root.addEventListener("orientationchange", this._onResize);
  document.addEventListener("visibilitychange", this._onVis);
  this.resize();
}

Engine.prototype._visibility = function () {
  /* never let an animation loop run in a hidden tab (battery + no runaway loops) */
  if (document.hidden) this.pause(); else this.play();
};

Engine.prototype._bindInput = function () {
  var self = this, c = this.canvas, dragging = false, lx = 0, ly = 0, pinch = 0;
  this._input = { allow: true };
  function down(e) {
    if (!self._input.allow) return;
    dragging = true; self._userNudge = true;
    lx = e.clientX; ly = e.clientY;
    try { c.setPointerCapture(e.pointerId); } catch (err) {}
  }
  function move(e) {
    if (!dragging || !self._input.allow) return;
    self.rig.az -= (e.clientX - lx) * 0.005;
    self.rig.pol = U.clamp(self.rig.pol - (e.clientY - ly) * 0.004, 0.18, 1.32);
    lx = e.clientX; ly = e.clientY;
  }
  function up(e) { dragging = false; try { c.releasePointerCapture(e.pointerId); } catch (err) {} }
  c.addEventListener("pointerdown", down);
  c.addEventListener("pointermove", move);
  root.addEventListener("pointerup", up);
  root.addEventListener("pointercancel", up);
  c.addEventListener("wheel", function (e) {
    if (!self._input.allow) return;
    self.rig.dist = U.clamp(self.rig.dist + e.deltaY * 0.06, self.rig.minDist || 26, self.rig.maxDist || 200);
    e.preventDefault();
  }, { passive: false });
  c.addEventListener("touchmove", function (e) {
    if (e.touches.length === 2 && self._input.allow) {
      var dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
      var d = Math.hypot(dx, dy);
      if (pinch) self.rig.dist = U.clamp(self.rig.dist + (pinch - d) * 0.14, self.rig.minDist || 26, self.rig.maxDist || 200);
      pinch = d; e.preventDefault();
    }
  }, { passive: false });
  c.addEventListener("touchend", function () { pinch = 0; });
};

Engine.prototype.setInputAllowed = function (on) { this._input.allow = !!on; };

Engine.prototype.resize = function () {
  var w = this.canvas.clientWidth || root.innerWidth;
  var h = this.canvas.clientHeight || root.innerHeight;
  if (!w || !h) return;
  this.viewW = w; this.viewH = h;
  this.portrait = h > w;
  this.shortScreen = h < 480;
  this.camera.aspect = w / h;
  /* widen FOV on narrow/portrait so the world still reads without zooming out */
  var base = this.rig.fov;
  this.camera.fov = this.portrait ? Math.min(74, base + 14) : base;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(w, h, false);
  this.renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, this.tier.dprCap));
  if (this.onResize) this.onResize(this);
};

Engine.prototype.applyTier = function (name) {
  if (!TIERS[name] || name === this.tierName) return;
  this.tierName = name; this.tier = TIERS[name];
  var r = this.renderer;
  r.setPixelRatio(Math.min(root.devicePixelRatio || 1, this.tier.dprCap));
  r.shadowMap.enabled = this.tier.shadows;
  if (this.sun) {
    if (this.tier.shadows) {
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(this.tier.shadow, this.tier.shadow);
      if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    } else { this.sun.castShadow = false; }
  }
  if (this.onTier) this.onTier(this.tier);
  this.resize();
};

Engine.prototype._adapt = function (fps) {
  if (!this.autoQuality) return;
  var now = performance.now(), i = TIER_ORDER.indexOf(this.tierName);
  if (fps < 27 && i < TIER_ORDER.length - 1) {
    if (!this._lowSince) this._lowSince = now;
    else if (now - this._lowSince > 2200) { this.applyTier(TIER_ORDER[i + 1]); this._lowSince = 0; }
  } else if (fps > 55 && i > 0 && !this._raised) {
    /* only ever raise once, and only if we were forced down */
    if (!this._highSince) this._highSince = now;
    else if (now - this._highSince > 6000) { this.applyTier(TIER_ORDER[i - 1]); this._raised = true; this._highSince = 0; }
  } else { this._lowSince = 0; this._highSince = 0; }
};

Engine.prototype.desiredCam = function () {
  var t = this.rig.target, d = this.rig.dist;
  return new T.Vector3(
    t.x + Math.sin(this.rig.az) * Math.cos(this.rig.pol) * d,
    t.y + Math.sin(this.rig.pol) * d * 0.92 + 6,
    t.z + Math.cos(this.rig.az) * Math.cos(this.rig.pol) * d
  );
};

Engine.prototype.play = function () {
  if (this.running || this._destroyed) return;
  this.running = true; this.clock.getDelta();
  var self = this;
  (function tick() {
    if (!self.running) return;
    self._raf = requestAnimationFrame(tick);
    var dt = Math.min(0.1, self.clock.getDelta());
    var t = self.clock.elapsedTime;
    var now = performance.now();
    if (self._last) { var f = 1000 / Math.max(1, now - self._last); self._fps = self._fps * 0.9 + f * 0.1; }
    self._last = now;

    self.tweens.update(dt);
    for (var i = 0; i < self.updaters.length; i++) self.updaters[i](dt, t, self);
    self.fx.update(dt);

    if (!self.cinematic) {
      var d = self.desiredCam();
      self.camera.position.lerp(d, self._userNudge ? 0.16 : 0.07);
      self._camLook.lerp(self.rig.target, 0.12);
      self.camera.lookAt(self._camLook);
    }
    self.renderer.render(self.scene, self.camera);
    self._adapt(self._fps);
    if (self.onFrame) self.onFrame(self._fps, dt);
  })();
};
Engine.prototype.pause = function () { this.running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; };

Engine.prototype.track = function (obj) { this.disposables.push(obj); return obj; };

/* thorough teardown — geometries, materials, textures, listeners, RAF */
Engine.prototype.clearWorld = function () {
  this.tweens.clear();
  this.updaters.length = 0;
  this.fx.reset();
  var scene = this.scene;
  for (var i = scene.children.length - 1; i >= 0; i--) disposeTree(scene.children[i], scene);
  if (scene.environment) { scene.environment.dispose(); scene.environment = null; }
  for (var d = 0; d < this.disposables.length; d++) {
    var o = this.disposables[d];
    if (o && typeof o.dispose === "function") { try { o.dispose(); } catch (e) {} }
  }
  this.disposables.length = 0;
  this.sun = null;
};
function disposeTree(obj, parent) {
  obj.traverse(function (o) {
    if (o.geometry) o.geometry.dispose();
    var m = o.material;
    if (m) {
      (Array.isArray(m) ? m : [m]).forEach(function (mm) {
        for (var k in mm) { var v = mm[k]; if (v && v.isTexture) v.dispose(); }
        mm.dispose();
      });
    }
  });
  if (parent) parent.remove(obj);
}
Engine.prototype.destroy = function () {
  this._destroyed = true;
  this.pause();
  this.clearWorld();
  root.removeEventListener("resize", this._onResize);
  root.removeEventListener("orientationchange", this._onResize);
  document.removeEventListener("visibilitychange", this._onVis);
  try { this.renderer.dispose(); } catch (e) {}
};

/* diagnostics for the perf panel */
Engine.prototype.stats = function () {
  var info = this.renderer.info, mem = "—";
  if (root.performance && performance.memory) mem = Math.round(performance.memory.usedJSHeapSize / 1048576) + " MB";
  return {
    fps: this._fps, ms: 1000 / Math.max(1, this._fps),
    calls: info.render.calls, tris: info.render.triangles,
    geo: info.memory.geometries, tex: info.memory.textures,
    mem: mem, dpr: this.renderer.getPixelRatio(),
    tier: this.tier.label, auto: this.autoQuality
  };
};

W.Engine = Engine;

/* ============================================================ FX system */
function FX(engine) {
  this.e = engine; this.bursts = []; this.rings = []; this.trails = [];
  this._geoCache = {};
}
FX.prototype.reset = function () { this.bursts.length = 0; this.rings.length = 0; this.trails.length = 0; };

FX.prototype.burst = function (pos, color, countScale) {
  if (!this.e.tier.fx) countScale = (countScale || 1) * 0.4;
  var n = Math.max(10, Math.round(70 * (this.e.tier.particles) * (countScale || 1)));
  var geo = new T.BufferGeometry(), arr = new Float32Array(n * 3), vel = [];
  for (var i = 0; i < n; i++) {
    arr[i*3] = pos.x; arr[i*3+1] = pos.y; arr[i*3+2] = pos.z;
    var a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI;
    vel.push(new T.Vector3(Math.sin(e) * Math.cos(a), Math.abs(Math.cos(e)) + 0.35, Math.sin(e) * Math.sin(a)).multiplyScalar(U.rand(7, 19)));
  }
  geo.setAttribute("position", new T.BufferAttribute(arr, 3));
  var mat = new T.PointsMaterial({ color: color, size: 1.5, transparent: true, opacity: 1, depthWrite: false, blending: T.AdditiveBlending });
  var p = new T.Points(geo, mat); p.frustumCulled = false;
  this.e.scene.add(p); this.bursts.push({ o: p, vel: vel, life: 0, ttl: 1.5 });
  return p;
};

FX.prototype.ring = function (pos, color, maxScale, up) {
  var geo = new T.RingGeometry(1, 1.35, 44);
  var mat = new T.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending });
  var m = new T.Mesh(geo, mat);
  m.position.copy(pos);
  if (up !== false) m.rotation.x = -Math.PI / 2;
  this.e.scene.add(m);
  this.rings.push({ o: m, life: 0, ttl: 1.5, max: maxScale || 26 });
  return m;
};

/* a rising column of light — used for gate/unlock moments */
FX.prototype.beam = function (pos, color, height, dur) {
  var geo = new T.CylinderGeometry(1.6, 2.4, height || 60, 16, 1, true);
  var mat = new T.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.0, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending });
  var m = new T.Mesh(geo, mat);
  m.position.copy(pos); m.position.y += (height || 60) / 2;
  this.e.scene.add(m);
  var self = this;
  this.e.tweens.val(function (v) { mat.opacity = v; }, 0, 0.5, (dur || 1.2) * 0.3, Ease.out, function () {
    self.e.tweens.val(function (v) { mat.opacity = v; }, 0.5, 0, (dur || 1.2) * 0.7, Ease.out, function () {
      self.e.scene.remove(m); m.geometry.dispose(); mat.dispose();
    });
  });
  return m;
};

FX.prototype.update = function (dt) {
  var i, x;
  for (i = this.bursts.length - 1; i >= 0; i--) {
    x = this.bursts[i]; x.life += dt;
    var pos = x.o.geometry.attributes.position;
    for (var j = 0; j < x.vel.length; j++) {
      var v = x.vel[j]; v.y -= 15 * dt; v.multiplyScalar(0.985);
      pos.setXYZ(j, pos.getX(j) + v.x * dt, pos.getY(j) + v.y * dt, pos.getZ(j) + v.z * dt);
    }
    pos.needsUpdate = true;
    x.o.material.opacity = Math.max(0, 1 - x.life / x.ttl);
    if (x.life >= x.ttl) { this.e.scene.remove(x.o); x.o.geometry.dispose(); x.o.material.dispose(); this.bursts.splice(i, 1); }
  }
  for (i = this.rings.length - 1; i >= 0; i--) {
    x = this.rings[i]; x.life += dt;
    var k = x.life / x.ttl, s = 1 + k * x.max;
    x.o.scale.set(s, s, s);
    x.o.material.opacity = Math.max(0, 0.9 * (1 - k));
    if (x.life >= x.ttl) { this.e.scene.remove(x.o); x.o.geometry.dispose(); x.o.material.dispose(); this.rings.splice(i, 1); }
  }
};

/* ============================================================ shared sky */
W.makeSky = function (engine, topColor, botColor, sunDir, sunTint) {
  var geo = new T.SphereGeometry(900, 32, 20);
  var mat = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new T.Color(topColor) }, bot: { value: new T.Color(botColor) },
      sun: { value: sunDir.clone() }, tint: { value: new T.Color(sunTint || 0xffd9a0) }
    },
    vertexShader: "varying vec3 vp; void main(){ vp=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: [
      "varying vec3 vp; uniform vec3 top; uniform vec3 bot; uniform vec3 sun; uniform vec3 tint;",
      "void main(){",
      "  float h=clamp(vp.y*1.1+0.18,0.0,1.0);",
      "  vec3 c=mix(bot,top,pow(h,0.85));",
      "  float s=max(dot(normalize(vp),normalize(sun)),0.0);",
      "  c+=tint*pow(s,220.0)*1.5;",
      "  c+=tint*pow(s,8.0)*0.22;",
      "  gl_FragColor=vec4(c,1.0);",
      "}"
    ].join("\n")
  });
  var m = new T.Mesh(geo, mat);
  m.frustumCulled = false;
  engine.scene.add(m);
  /* every sky also seeds the reflection environment so metals read correctly */
  W.makeEnv(engine, topColor, botColor, sunTint || 0xdfe6ee);
  return m;
};

/* Procedural environment map.
 * Metallic/rough materials need something to reflect; without this they render
 * almost black. A tiny canvas gradient (sky→horizon→ground) is enough and
 * costs nothing offline. */
W.makeEnv = function (engine, topColor, botColor, horizonColor) {
  var c = document.createElement("canvas");
  c.width = 128; c.height = 64;
  var g = c.getContext("2d");
  var grad = g.createLinearGradient(0, 0, 0, 64);
  var top = new T.Color(topColor), bot = new T.Color(botColor);
  var hor = new T.Color(horizonColor == null ? 0xdfe6ee : horizonColor);
  grad.addColorStop(0, "#" + top.getHexString());
  grad.addColorStop(0.5, "#" + hor.getHexString());
  grad.addColorStop(1, "#" + bot.getHexString());
  g.fillStyle = grad; g.fillRect(0, 0, 128, 64);
  var tex = new T.CanvasTexture(c);
  tex.mapping = T.EquirectangularReflectionMapping;
  tex.encoding = T.sRGBEncoding;
  engine.scene.environment = tex;
  engine.track(tex);
  return tex;
};

/* starfield for night/space worlds */
W.makeStars = function (engine, count, radius) {
  var n = Math.max(60, Math.round(count * engine.tier.particles));
  var geo = new T.BufferGeometry(), arr = new Float32Array(n * 3);
  var rnd = U.seeded(7);
  for (var i = 0; i < n; i++) {
    var th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), r = radius * (0.8 + rnd() * 0.2);
    arr[i*3] = Math.sin(ph) * Math.cos(th) * r;
    arr[i*3+1] = Math.abs(Math.cos(ph)) * r * 0.7 + 20;
    arr[i*3+2] = Math.sin(ph) * Math.sin(th) * r;
  }
  geo.setAttribute("position", new T.BufferAttribute(arr, 3));
  var mat = new T.PointsMaterial({ color: 0xffffff, size: 1.6, transparent: true, opacity: 0.9, depthWrite: false, sizeAttenuation: false });
  var p = new T.Points(geo, mat); p.frustumCulled = false;
  engine.scene.add(p);
  return p;
};

/* floating dust/motes — cheap atmosphere that sells depth */
W.makeMotes = function (engine, count, spread, color, size) {
  var n = Math.max(20, Math.round(count * engine.tier.particles));
  var geo = new T.BufferGeometry(), arr = new Float32Array(n * 3);
  for (var i = 0; i < n; i++) {
    arr[i*3] = U.rand(-spread, spread); arr[i*3+1] = U.rand(3, 70); arr[i*3+2] = U.rand(-spread, spread);
  }
  geo.setAttribute("position", new T.BufferAttribute(arr, 3));
  var mat = new T.PointsMaterial({ color: color || 0xffffff, size: size || 0.8, transparent: true, opacity: 0.5, depthWrite: false });
  var p = new T.Points(geo, mat); p.frustumCulled = false;
  engine.scene.add(p);
  engine.updaters.push(function (dt, t) { p.rotation.y = t * 0.012; p.position.y = Math.sin(t * 0.22) * 2; });
  return p;
};

/* standard three-point-ish lighting every world starts from */
W.standardLights = function (engine, opt) {
  var o = opt || {};
  var hemi = new T.HemisphereLight(o.skyColor || 0xbfe0ff, o.groundColor || 0x35402f, o.hemi == null ? 0.45 : o.hemi);
  engine.scene.add(hemi);
  var sun = new T.DirectionalLight(o.sunColor || 0xfff2d8, o.sunIntensity == null ? 1.25 : o.sunIntensity);
  var dir = o.dir || new T.Vector3(-0.55, 0.62, 0.35).normalize();
  sun.position.copy(dir).multiplyScalar(200);
  if (engine.tier.shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(engine.tier.shadow, engine.tier.shadow);
    sun.shadow.camera.near = 20; sun.shadow.camera.far = 520;
    var s = o.shadowSpan || 150;
    sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
    sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
    sun.shadow.bias = -0.0006;
  }
  engine.scene.add(sun); engine.scene.add(sun.target);
  engine.sun = sun;
  var fill = new T.DirectionalLight(o.fillColor || 0x88bbff, o.fill == null ? 0.24 : o.fill);
  fill.position.set(80, 50, -90);
  engine.scene.add(fill);
  return { hemi: hemi, sun: sun, fill: fill, dir: dir };
};

})(window);
/*!
 * waha-adventure · kit
 * قطع ثلاثية الأبعاد مشتركة تُركَّب بطرق مختلفة في كل عالم.
 * الهدف: محرك واحد + قطع مشتركة = ثمانية عوالم مختلفة بنيويًا دون تكرار الكود.
 */
(function (root) {
"use strict";
var W = root.WAHADV, T = root.THREE, U = W.util, Ease = W.ease;
var K = W.kit = {};

/* ------------------------------------------------------------ materials */
K.mat = {
  std: function (color, rough, metal, opt) {
    return new T.MeshStandardMaterial(Object.assign({
      color: color, roughness: rough == null ? 0.85 : rough, metalness: metal || 0
    }, opt || {}));
  },
  glow: function (color, intensity) {
    return new T.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: intensity == null ? 1 : intensity, roughness: 0.4, metalness: 0.1 });
  },
  basic: function (color, opacity) {
    return new T.MeshBasicMaterial({ color: color, transparent: opacity != null, opacity: opacity == null ? 1 : opacity });
  }
};

/* ------------------------------------------------------------ character
 * A friendly child explorer. Costume colors change per world so the same
 * rig reads as a different character without new geometry.
 */
K.child = function (opt) {
  var o = opt || {};
  var g = new T.Group();
  var skin = K.mat.std(o.skin || 0xe8bb92, 0.72);
  var robe = K.mat.std(o.robe || 0xf4f1ea, 0.82);
  var accent = K.mat.std(o.accent || 0x1f6f9e, 0.7);

  var body = new T.Mesh(new T.CylinderGeometry(0.86, 1.16, 3.0, 14), robe);
  body.position.y = 2.1; body.castShadow = true; g.add(body);

  var vest = new T.Mesh(new T.CylinderGeometry(0.92, 1.04, 1.5, 14), accent);
  vest.position.y = 2.75; vest.castShadow = true; g.add(vest);

  var head = new T.Mesh(new T.SphereGeometry(0.74, 18, 16), skin);
  head.position.y = 4.2; head.castShadow = true; g.add(head);

  /* headwear: cap / kummah / helmet ring depending on world */
  var cap;
  if (o.hat === "helmet") {
    cap = new T.Mesh(new T.SphereGeometry(0.86, 18, 16), K.mat.std(o.hatColor || 0xdfe9f2, 0.3, 0.5, { transparent: true, opacity: 0.55 }));
    cap.position.y = 4.24;
  } else if (o.hat === "none") {
    cap = null;
  } else {
    cap = new T.Mesh(new T.SphereGeometry(0.79, 18, 14, 0, Math.PI * 2, 0, 1.25), K.mat.std(o.hatColor || 0xefe6d0, 0.8));
    cap.position.y = 4.42;
  }
  if (cap) { cap.castShadow = true; g.add(cap); }

  var armGeo = new T.CylinderGeometry(0.26, 0.24, 2.3, 8);
  var aL = new T.Mesh(armGeo, robe); aL.position.set(-1.12, 2.32, 0); aL.rotation.z = 0.3; aL.castShadow = true; g.add(aL);
  var aR = new T.Mesh(armGeo, robe); aR.position.set(1.12, 2.32, 0); aR.rotation.z = -0.3; aR.castShadow = true; g.add(aR);

  var legGeo = new T.CylinderGeometry(0.32, 0.28, 1.9, 8);
  var lL = new T.Mesh(legGeo, accent); lL.position.set(-0.44, 0.6, 0); lL.castShadow = true; g.add(lL);
  var lR = new T.Mesh(legGeo, accent); lR.position.set(0.44, 0.6, 0); lR.castShadow = true; g.add(lR);

  g.userData = { head: head, arms: [aL, aR], legs: [lL, lR], walk: 0 };
  g.scale.setScalar(o.scale || 1);
  return g;
};

/* animate a child rig: idle breathing, or walking when `moving` */
K.animChild = function (c, dt, t, moving) {
  var d = c.userData; if (!d) return;
  if (moving) {
    d.walk += dt * 9;
    var sw = Math.sin(d.walk) * 0.55;
    d.legs[0].rotation.x = sw; d.legs[1].rotation.x = -sw;
    d.arms[0].rotation.x = -sw * 0.7; d.arms[1].rotation.x = sw * 0.7;
    c.position.y += Math.abs(Math.sin(d.walk * 2)) * 0.012;
  } else {
    d.walk *= 0.9;
    d.legs[0].rotation.x *= 0.9; d.legs[1].rotation.x *= 0.9;
    d.arms[0].rotation.x *= 0.9; d.arms[1].rotation.x *= 0.9;
    if (d.head) d.head.position.y = 4.2 + Math.sin(t * 2) * 0.045;
  }
};

/* ------------------------------------------------------------ water
 * Gerstner-wave shader. Used by sea worlds AND the valley falaj (narrow strip).
 */
K.water = function (engine, opt) {
  var o = opt || {};
  var seg = Math.max(28, Math.round((o.segments || 140) * engine.tier.segments));
  var uniforms = {
    uTime: { value: 0 }, uCam: { value: new T.Vector3() },
    uSun: { value: (o.sunDir || new T.Vector3(-0.55, 0.62, 0.35)).clone().normalize() },
    uDeep: { value: new T.Color(o.deep || 0x073049) },
    uShallow: { value: new T.Color(o.shallow || 0x1a6f8c) },
    uFog: { value: new T.Color(o.fog || 0xcfe3ee) },
    uFogNear: { value: o.fogNear || 70 }, uFogFar: { value: o.fogFar || 420 },
    uAmp: { value: o.amp == null ? 1 : o.amp },
    uWaves: { value: engine.tier.key === "low" ? 2 : (engine.tier.key === "medium" ? 3 : 4) }
  };
  var mat = new T.ShaderMaterial({
    uniforms: uniforms, fog: false,
    vertexShader: [
      "uniform float uTime; uniform int uWaves; uniform float uAmp;",
      "varying vec3 vWorld; varying vec3 vNormal; varying float vH;",
      "vec3 ger(vec2 p, vec2 dir, float steep, float wl, float spd, inout vec3 nrm){",
      "  float k=6.28318/wl; float c=sqrt(9.8/k); float f=k*(dot(normalize(dir),p)-c*spd*uTime);",
      "  float a=steep/k; float cf=cos(f), sf=sin(f); vec2 d=normalize(dir);",
      "  nrm+=vec3(-d.x*k*a*cf, -steep*sf, -d.y*k*a*cf);",
      "  return vec3(d.x*a*cf, a*sf, d.y*a*cf);",
      "}",
      "void main(){",
      "  vec3 pos=position; vec3 nrm=vec3(0.0,1.0,0.0); vec2 p=position.xz;",
      "  pos+=ger(p, vec2(1.0,0.35), 0.17*uAmp, 34.0, 0.7, nrm);",
      "  pos+=ger(p, vec2(-0.6,1.0), 0.13*uAmp, 18.0, 0.9, nrm);",
      "  if(uWaves>2) pos+=ger(p, vec2(0.8,-0.5), 0.09*uAmp, 9.0, 1.2, nrm);",
      "  if(uWaves>3) pos+=ger(p, vec2(-0.3,-1.0), 0.06*uAmp, 5.0, 1.6, nrm);",
      "  vH=pos.y;",
      "  vec4 wp=modelMatrix*vec4(pos,1.0); vWorld=wp.xyz; vNormal=normalize(nrm);",
      "  gl_Position=projectionMatrix*viewMatrix*wp;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "uniform vec3 uSun; uniform vec3 uCam; uniform vec3 uDeep; uniform vec3 uShallow;",
      "uniform vec3 uFog; uniform float uFogNear; uniform float uFogFar;",
      "varying vec3 vWorld; varying vec3 vNormal; varying float vH;",
      "void main(){",
      "  vec3 N=normalize(vNormal); vec3 V=normalize(uCam-vWorld); vec3 L=normalize(uSun);",
      "  float fres=pow(1.0-max(dot(N,V),0.0),4.0);",
      "  float diff=0.55+0.45*max(dot(N,L),0.0);",
      "  vec3 base=mix(uDeep,uShallow,clamp(dot(N,V)*0.9+0.15,0.0,1.0))*diff;",
      "  vec3 col=mix(base, vec3(0.55,0.72,0.86), fres*0.5);",
      "  vec3 H=normalize(L+V); float spec=pow(max(dot(N,H),0.0),220.0);",
      "  col+=vec3(1.0,0.94,0.78)*spec*0.75;",
      "  col+=vec3(0.9,0.95,1.0)*smoothstep(1.6,2.6,vH)*0.3;",
      "  float d=length(uCam-vWorld); float fg=smoothstep(uFogNear,uFogFar,d);",
      "  col=mix(col,uFog,fg);",
      "  gl_FragColor=vec4(col,1.0);",
      "}"
    ].join("\n")
  });
  var mesh = new T.Mesh(new T.PlaneGeometry(o.size || 1400, o.size || 1400, seg, seg), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = o.y || 0;
  engine.scene.add(mesh);
  engine.updaters.push(function (dt, t, e) {
    uniforms.uTime.value = t;
    uniforms.uCam.value.copy(e.camera.position);
  });
  return mesh;
};

/* ------------------------------------------------------------ terrain */
/* low-poly hill mound with deterministic noise */
K.mound = function (radius, height, color, seed) {
  var rnd = U.seeded(seed || 3);
  var geo = new T.CylinderGeometry(radius * 0.55, radius, height || 6, 26, 2);
  var pos = geo.attributes.position;
  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    var a = Math.atan2(z, x);
    if (y > 0) pos.setY(i, y + Math.sin(a * 4 + rnd() * 0.4) * 0.9 + Math.cos(a * 7) * 0.5);
    pos.setX(i, x + Math.sin(a * 5) * 0.3);
  }
  geo.computeVertexNormals();
  var m = new T.Mesh(geo, K.mat.std(color || 0xe9cf95, 1));
  m.castShadow = true; m.receiveShadow = true;
  return m;
};

/* rugged rock ridge — for valley/planet worlds */
K.ridge = function (len, h, color, seed) {
  var rnd = U.seeded(seed || 11);
  var g = new T.Group();
  var n = Math.max(3, Math.round(len / 12));
  for (var i = 0; i < n; i++) {
    var s = 6 + rnd() * 9;
    var rock = new T.Mesh(new T.ConeGeometry(s, h * (0.6 + rnd() * 0.8), 5 + Math.floor(rnd() * 3)), K.mat.std(color || 0x7c6a52, 1));
    rock.position.set((i / (n - 1) - 0.5) * len + rnd() * 6, h * 0.3 * (0.6 + rnd() * 0.8), rnd() * 10 - 5);
    rock.rotation.y = rnd() * 3;
    rock.castShadow = true; rock.receiveShadow = true;
    g.add(rock);
  }
  return g;
};

/* palm tree */
K.palm = function (scale) {
  var g = new T.Group();
  var tr = new T.Mesh(new T.CylinderGeometry(0.42, 0.66, 8, 7), K.mat.std(0x8a5a2b, 0.9));
  tr.position.y = 4; tr.rotation.z = 0.1; tr.castShadow = true; g.add(tr);
  var leaf = new T.ConeGeometry(3.3, 1.3, 5, 1, true);
  var lm = K.mat.std(0x2f9e5a, 0.8, 0, { side: T.DoubleSide });
  for (var i = 0; i < 5; i++) {
    var lf = new T.Mesh(leaf, lm);
    lf.position.set(Math.cos(i * 1.256) * 1.4, 8, Math.sin(i * 1.256) * 1.4);
    lf.rotation.set(0.55, i * 1.256, Math.PI);
    lf.castShadow = true; g.add(lf);
  }
  g.scale.setScalar(scale || 1);
  return g;
};

/* ------------------------------------------------------------ structures */
/* Omani-style tower / fort block */
K.tower = function (w, h, color, crenels) {
  var g = new T.Group();
  var body = new T.Mesh(new T.CylinderGeometry(w * 0.86, w, h, 12), K.mat.std(color || 0xd9c9a6, 0.95));
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  if (crenels !== false) {
    var cg = new T.BoxGeometry(w * 0.28, w * 0.34, w * 0.28);
    var cm = K.mat.std(color || 0xd9c9a6, 0.95);
    for (var i = 0; i < 10; i++) {
      var a = (i / 10) * Math.PI * 2;
      var c = new T.Mesh(cg, cm);
      c.position.set(Math.cos(a) * w * 0.82, h + w * 0.16, Math.sin(a) * w * 0.82);
      c.rotation.y = -a; c.castShadow = true; g.add(c);
    }
  }
  return g;
};

/* generic building block (city worlds) */
K.building = function (w, h, d, color, windowColor, seed, opt) {
  var o = opt || {};
  var rnd = U.seeded(seed || 5);
  var g = new T.Group();
  var body = new T.Mesh(new T.BoxGeometry(w, h, d), K.mat.std(color, 0.75, 0.15));
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  if (o.windows === false) return g;   /* distant skyline: no window meshes at all */

  /* Windows are merged into ONE geometry per face pair instead of one mesh per
     window — the difference between ~2000 draw calls and 2. */
  var rows = Math.max(2, Math.floor(h / 6)), cols = Math.max(2, Math.floor(w / 2.4));
  var verts = [], idx = [], vi = 0;
  var ww = w * 0.12, wh = h * 0.045;
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      if (rnd() < 0.35) continue;
      var x = (cols === 1 ? 0 : (c / (cols - 1) - 0.5) * w * 0.74);
      var y = 3 + r * (h / rows) * 0.92;
      [d / 2 + 0.06, -d / 2 - 0.06].forEach(function (z) {
        verts.push(x - ww / 2, y - wh / 2, z, x + ww / 2, y - wh / 2, z,
                   x + ww / 2, y + wh / 2, z, x - ww / 2, y + wh / 2, z);
        idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3); vi += 4;
      });
    }
  }
  if (verts.length) {
    var wg = new T.BufferGeometry();
    wg.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    wg.setIndex(idx); wg.computeVertexNormals();
    var wm = new T.MeshBasicMaterial({ color: windowColor || 0x6fd8ff, side: T.DoubleSide });
    g.add(new T.Mesh(wg, wm));
  }
  return g;
};

/* arched gate — castle/knowledge worlds */
K.gate = function (w, h, color) {
  var g = new T.Group();
  var pm = K.mat.std(color || 0xc9b391, 0.9);
  var pL = new T.Mesh(new T.BoxGeometry(w * 0.2, h, w * 0.24), pm);
  pL.position.set(-w * 0.42, h / 2, 0); pL.castShadow = true; g.add(pL);
  var pR = pL.clone(); pR.position.x = w * 0.42; g.add(pR);
  var arch = new T.Mesh(new T.TorusGeometry(w * 0.42, w * 0.1, 8, 18, Math.PI), pm);
  arch.position.y = h; arch.castShadow = true; g.add(arch);
  /* the door leaves — these swing open on unlock */
  var dm = K.mat.std(0xa8753f, 0.8);
  var dL = new T.Mesh(new T.BoxGeometry(w * 0.4, h * 0.92, 0.5), dm);
  dL.geometry.translate(w * 0.2, 0, 0);
  dL.position.set(-w * 0.4, h * 0.46, 0); dL.castShadow = true; g.add(dL);
  var dR = new T.Mesh(new T.BoxGeometry(w * 0.4, h * 0.92, 0.5), dm);
  dR.geometry.translate(-w * 0.2, 0, 0);
  dR.position.set(w * 0.4, h * 0.46, 0); dR.castShadow = true; g.add(dR);
  g.userData = { doors: [dL, dR] };
  return g;
};

/* lantern that can light up */
K.lantern = function (color) {
  var g = new T.Group();
  var cage = new T.Mesh(new T.BoxGeometry(1.1, 1.5, 1.1), K.mat.std(0x6b5636, 0.7, 0.4));
  cage.position.y = 0.75; g.add(cage);
  var glass = new T.Mesh(new T.BoxGeometry(0.8, 1.1, 0.8), new T.MeshStandardMaterial({
    color: color || 0xffc978, emissive: color || 0xffc978, emissiveIntensity: 0, roughness: 0.3, transparent: true, opacity: 0.9
  }));
  glass.position.y = 0.78; g.add(glass);
  var light = new T.PointLight(color || 0xffc978, 0, 26);
  light.position.y = 0.8; g.add(light);
  g.userData = { glass: glass, light: light, lit: false };
  return g;
};
K.lightLantern = function (engine, lantern, intensity) {
  if (!lantern.userData || lantern.userData.lit) return;
  lantern.userData.lit = true;
  var gl = lantern.userData.glass, li = lantern.userData.light;
  engine.tweens.val(function (v) { gl.material.emissiveIntensity = v; li.intensity = v * (intensity || 1.6); }, 0, 1, 0.9, Ease.out);
};

/* ------------------------------------------------------------ vehicles */
/* traditional dhow */
K.dhow = function () {
  var g = new T.Group();
  var shape = new T.Shape();
  shape.moveTo(-6, 0); shape.quadraticCurveTo(-7.6, 2.2, -4, 2.6);
  shape.lineTo(5, 2.6); shape.quadraticCurveTo(8.6, 2.4, 6.5, 0.2);
  shape.quadraticCurveTo(4, -2.4, -2, -2.2); shape.quadraticCurveTo(-6, -2.0, -6, 0);
  var hull = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: 4.2, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2 }),
    K.mat.std(0x8a5a30, 0.85));
  hull.rotation.x = Math.PI / 2; hull.position.z = 2.1; hull.castShadow = true; g.add(hull);
  var deck = new T.Mesh(new T.BoxGeometry(11, 0.4, 3.4), K.mat.std(0xb98a54, 0.9));
  deck.position.y = 2.4; deck.castShadow = true; g.add(deck);
  var mast = new T.Mesh(new T.CylinderGeometry(0.2, 0.26, 15, 8), K.mat.std(0x8a5a2b, 0.9));
  mast.position.set(0.5, 9, 0); mast.rotation.z = -0.15; mast.castShadow = true; g.add(mast);
  var sg = new T.BufferGeometry();
  sg.setAttribute("position", new T.BufferAttribute(new Float32Array([-1, 2.6, 0, 6.5, 3.4, 0, 1, 15, 0]), 3));
  sg.setIndex([0, 1, 2]); sg.computeVertexNormals();
  var sail = new T.Mesh(sg, K.mat.std(0xf3ede0, 0.9, 0, { side: T.DoubleSide }));
  sail.castShadow = true; g.add(sail);
  g.userData = { sail: sail };
  return g;
};

/* hover pod / tram — city + data worlds */
K.pod = function (color, glowColor) {
  var g = new T.Group();
  var bodyGeo = T.CapsuleGeometry ? new T.CapsuleGeometry(1.5, 3.4, 6, 12) : new T.CylinderGeometry(1.5, 1.5, 5, 12);
  var body = new T.Mesh(bodyGeo, K.mat.std(color || 0xdfe9f2, 0.35, 0.65));
  body.rotation.z = Math.PI / 2; body.position.y = 2.4; body.castShadow = true; g.add(body);
  var glass = new T.Mesh(new T.SphereGeometry(1.25, 16, 12), new T.MeshStandardMaterial({
    color: 0x9fd8ff, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.55
  }));
  glass.position.set(1.1, 2.7, 0); g.add(glass);
  var ring = new T.Mesh(new T.TorusGeometry(2.1, 0.22, 8, 22), K.mat.glow(glowColor || 0x53e0ff, 1.2));
  ring.rotation.x = Math.PI / 2; ring.position.y = 1.1; g.add(ring);
  var light = new T.PointLight(glowColor || 0x53e0ff, 1.1, 30);
  light.position.y = 1.4; g.add(light);
  g.userData = { ring: ring, light: light };
  return g;
};

/* surface rover — planet world */
K.rover = function (color, glowColor) {
  var g = new T.Group();
  var chassis = new T.Mesh(new T.BoxGeometry(5, 1.3, 3.2), K.mat.std(color || 0xc9d2dd, 0.5, 0.5));
  chassis.position.y = 2; chassis.castShadow = true; g.add(chassis);
  var dome = new T.Mesh(new T.SphereGeometry(1.2, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new T.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.12, metalness: 0.3, transparent: true, opacity: 0.6 }));
  dome.position.set(-0.4, 2.6, 0); g.add(dome);
  var wheelGeo = new T.CylinderGeometry(1, 1, 0.7, 12);
  var wm = K.mat.std(0x2b3038, 0.9);
  var wheels = [];
  [[-1.7, 1.7], [1.7, 1.7], [-1.7, -1.7], [1.7, -1.7]].forEach(function (p) {
    var wl = new T.Mesh(wheelGeo, wm);
    wl.rotation.x = Math.PI / 2; wl.position.set(p[0], 1, p[1]); wl.castShadow = true;
    g.add(wl); wheels.push(wl);
  });
  var mastl = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 2, 6), wm); mastl.position.set(1.6, 3.4, 0); g.add(mastl);
  var eye = new T.Mesh(new T.SphereGeometry(0.34, 12, 10), K.mat.glow(glowColor || 0xffd35b, 1.4));
  eye.position.set(1.6, 4.4, 0); g.add(eye);
  g.userData = { wheels: wheels, eye: eye };
  return g;
};

/* ------------------------------------------------------------ reward tokens */
K.token = function (kind, color) {
  var g = new T.Group(), m;
  if (kind === "key") {
    m = K.mat.std(color || 0xffd35b, 0.25, 0.9, { emissive: 0x3a2600 });
    var ring = new T.Mesh(new T.TorusGeometry(0.8, 0.26, 10, 20), m);
    var shaft = new T.Mesh(new T.BoxGeometry(0.32, 2.2, 0.32), m); shaft.position.y = -1.5;
    var tooth = new T.Mesh(new T.BoxGeometry(0.9, 0.32, 0.32), m); tooth.position.set(0.5, -2.4, 0);
    g.add(ring, shaft, tooth);
  } else if (kind === "gem" || kind === "crystal") {
    m = new T.MeshStandardMaterial({ color: color || 0x53e0ff, emissive: color || 0x53e0ff, emissiveIntensity: 0.55, roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.92 });
    g.add(new T.Mesh(new T.OctahedronGeometry(1.25), m));
  } else if (kind === "star") {
    m = K.mat.glow(color || 0xffd35b, 1.2);
    var s = new T.Mesh(new T.OctahedronGeometry(1.1, 0), m);
    s.scale.set(1, 1.5, 1); g.add(s);
  } else if (kind === "gear") {
    m = K.mat.std(color || 0xffb85b, 0.35, 0.85, { emissive: 0x3a2200 });
    var hub = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.4, 14), m);
    hub.rotation.x = Math.PI / 2; g.add(hub);
    for (var i = 0; i < 8; i++) {
      var tooth2 = new T.Mesh(new T.BoxGeometry(0.34, 0.34, 0.42), m);
      var a = (i / 8) * Math.PI * 2;
      tooth2.position.set(Math.cos(a) * 0.92, Math.sin(a) * 0.92, 0);
      tooth2.rotation.z = a; g.add(tooth2);
    }
  } else if (kind === "core") {
    m = new T.MeshStandardMaterial({ color: color || 0x8affd0, emissive: color || 0x8affd0, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.3 });
    g.add(new T.Mesh(new T.IcosahedronGeometry(1.05, 0), m));
    var shell = new T.Mesh(new T.TorusGeometry(1.5, 0.1, 8, 24), K.mat.glow(color || 0x8affd0, 0.7));
    shell.rotation.x = Math.PI / 2; g.add(shell);
  } else if (kind === "frame") {
    m = K.mat.std(color || 0xf1e2b8, 0.7, 0.2, { emissive: 0x2a2410, side: T.DoubleSide });
    var fr = new T.Mesh(new T.BoxGeometry(2.2, 1.6, 0.14), m); g.add(fr);
    var inner = new T.Mesh(new T.PlaneGeometry(1.8, 1.2), K.mat.glow(0xffd9a0, 0.8));
    inner.position.z = 0.09; g.add(inner);
  } else { /* map fragment */
    m = K.mat.std(color || 0xf1e2b8, 0.85, 0, { emissive: 0x2a2410, side: T.DoubleSide });
    g.add(new T.Mesh(new T.PlaneGeometry(2.2, 2.2), m));
  }
  g.userData = { mat: m };
  return g;
};

/* ------------------------------------------------------------ locked marker
 * Every world needs a clear "this stage is locked" read. The shape differs
 * per world (dome / cage / holo-wall) but the API is identical.
 */
K.lockDome = function (radius, color) {
  var g = new T.Group();
  var dome = new T.Mesh(new T.SphereGeometry(radius, 20, 14, 0, Math.PI * 2, 0, 1.35),
    new T.MeshStandardMaterial({
      color: color || 0x63d0ff, transparent: true, opacity: 0.12, roughness: 0.25,
      metalness: 0.05, emissive: color || 0x134b66, emissiveIntensity: 0.35,
      side: T.DoubleSide, depthWrite: false
    }));
  g.add(dome);
  /* a small, bright, unlit padlock badge — reads at any distance, never a dark blob */
  var lock = new T.Group();
  var lm = new T.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.95 });
  var ring = new T.Mesh(new T.TorusGeometry(0.62, 0.15, 8, 16, Math.PI), lm);
  ring.position.y = 0.62;
  var body = new T.Mesh(new T.BoxGeometry(1.15, 0.95, 0.34), lm);
  lock.add(ring, body);
  lock.position.y = radius * 0.62 + 2.2;
  lock.scale.setScalar(Math.max(1, radius / 9));
  g.add(lock);
  g.userData = { dome: dome, lock: lock };
  return g;
};

/* holographic barrier wall — city/data worlds */
K.lockWall = function (w, h, color) {
  var g = new T.Group();
  var mat = new T.MeshStandardMaterial({
    color: color || 0xff6ba8, transparent: true, opacity: 0.2, emissive: color || 0xff6ba8,
    emissiveIntensity: 0.5, side: T.DoubleSide, depthWrite: false, roughness: 0.3
  });
  var wall = new T.Mesh(new T.PlaneGeometry(w, h), mat);
  wall.position.y = h / 2; g.add(wall);
  /* scan lines */
  var lineMat = new T.MeshBasicMaterial({ color: color || 0xff6ba8, transparent: true, opacity: 0.55, side: T.DoubleSide });
  for (var i = 0; i < 5; i++) {
    var ln = new T.Mesh(new T.PlaneGeometry(w, 0.16), lineMat);
    ln.position.y = (i + 1) * (h / 6); ln.position.z = 0.05;
    g.add(ln);
  }
  g.userData = { dome: wall, lock: null, mat: mat };
  return g;
};

/* ------------------------------------------------------------ helpers */
/* fade any object tree out, then remove + dispose */
K.dissolve = function (engine, obj, dur, cb) {
  var mats = [];
  obj.traverse(function (o) {
    if (!o.material) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) {
      m.transparent = true; mats.push({ m: m, o: m.opacity == null ? 1 : m.opacity });
    });
  });
  engine.tweens.val(function (k) {
    for (var i = 0; i < mats.length; i++) mats[i].m.opacity = mats[i].o * (1 - k);
  }, 0, 1, dur || 0.9, Ease.out, function () {
    if (obj.parent) obj.parent.remove(obj);
    obj.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.dispose(); });
    });
    if (cb) cb();
  });
};

/* desaturate/darken a subtree to read as "locked" (and remember originals) */
K.setDim = function (obj, dim) {
  obj.traverse(function (o) {
    if (!o.material || !o.material.color) return;
    if (!o.userData._orig) {
      o.userData._orig = o.material.color.clone();
      if (o.material.emissiveIntensity != null) o.userData._origEm = o.material.emissiveIntensity;
    }
    if (dim) {
      o.material.color.copy(o.userData._orig).multiplyScalar(0.66);
      if (o.material.emissiveIntensity != null) o.material.emissiveIntensity = 0;
    } else {
      o.material.color.copy(o.userData._orig);
      if (o.material.emissiveIntensity != null && o.userData._origEm != null) o.material.emissiveIntensity = o.userData._origEm;
    }
  });
};

/* smooth path following: returns a point along a curve of stage positions */
K.pathCurve = function (points, tension) {
  return new T.CatmullRomCurve3(points, false, "catmullrom", tension == null ? 0.4 : tension);
};

})(window);
/*!
 * waha-adventure · worlds 1–4
 * كل عالم يختلف في: التكوين المكاني · وسيلة الانتقال · حركة الكاميرا ·
 * شكل المرحلة · طريقة الفتح · نوع المكافأة · الإحساس العام.
 */
(function (root) {
"use strict";
var W = root.WAHADV, T = root.THREE, U = W.util, K = W.kit, Ease = W.ease;
W.worlds = W.worlds || {};

/* shared: glide the rig target toward a point while travelling */
function glide(e, ctx, to, dur, ease) {
  e.tweens.to(e.rig.target, { x: to.x, y: to.y, z: to.z }, dur, ease || Ease.inOut);
}
/* shared: hero hop/step audio + reward spawn */
function spawnReward(e, ctx, pos, kind, color, done) {
  var tok = K.token(kind, color);
  tok.position.copy(pos); tok.position.y += 2.5;
  e.scene.add(tok);
  var spin = function (dt, t) { tok.rotation.y += dt * 2.4; };
  e.updaters.push(spin);
  W.audio.reward();
  e.fx.burst(tok.position.clone(), color || 0xffd35b, 1);
  e.tweens.to(tok.position, { x: tok.position.x, y: tok.position.y + 6.5, z: tok.position.z }, 1.15, Ease.out, function () {
    K.dissolve(e, tok, 0.5, function () {
      var i = e.updaters.indexOf(spin); if (i >= 0) e.updaters.splice(i, 1);
      if (done) done();
    });
  });
  return tok;
}

/* ============================================================================
 * WORLD 1 · قلعة النور — Citadel of Light            (الصف ١ · الفصل ١)
 * تكوين: منحدر حلزوني صاعد حول قلعة · مراحل = بوابات على الطريق
 * انتقال: الشخصية تمشي صعودًا · فتح: مفتاح → تنفتح البوابة → يضيء فانوس → يجري الفلج
 * ==========================================================================*/
W.worlds.citadel = {
  id: "citadel", name: "قلعة النور", nameEn: "CITADEL OF LIGHT",
  tagline: "أشعل فوانيس القلعة وأعد الماء إلى الفلج",
  rewardKind: "key", rewardColor: 0xffd35b,
  ambientTone: 420,
  build: function (e, n) {
    var ctx = { stages: [], falaj: [] };
    W.makeSky(e, 0x2f6ea8, 0xf7d9a8, new T.Vector3(-0.5, 0.5, 0.4).normalize(), 0xffc98a);
    e.scene.fog = new T.Fog(0xe6d3b4, 90, 460);
    var L = W.standardLights(e, { skyColor: 0xd8e8ff, groundColor: 0x6b5a3e, sunColor: 0xffe6b8, sunIntensity: 1.15, shadowSpan: 150 });

    /* ground plateau */
    var ground = new T.Mesh(new T.CylinderGeometry(190, 210, 12, 40), K.mat.std(0xa8895f, 1));
    ground.position.y = -6; ground.receiveShadow = true; e.scene.add(ground);

    /* the citadel core — a stepped hill of towers, the destination */
    var core = new T.Group(); core.position.set(0, 0, -30); e.scene.add(core);
    core.add(K.tower(20, 34, 0xc4a97e));
    var t2 = K.tower(13, 50, 0xbb9f74); t2.position.set(-22, 0, 12); core.add(t2);
    var t3 = K.tower(11, 42, 0xbb9f74); t3.position.set(24, 0, 10); core.add(t3);
    var keep = K.tower(9, 66, 0xcfb489); keep.position.set(0, 0, -14); core.add(keep);
    ctx.keep = keep;
    var beacon = new T.Mesh(new T.SphereGeometry(3.2, 16, 14), K.mat.glow(0xffd98a, 0));
    beacon.position.set(0, 72, -44); e.scene.add(beacon);
    var beaconLight = new T.PointLight(0xffd98a, 0, 160); beaconLight.position.copy(beacon.position); e.scene.add(beaconLight);
    ctx.beacon = beacon; ctx.beaconLight = beaconLight;

    /* spiral ascending ramp — stages sit on it */
    var pts = [];
    for (var i = 0; i < n; i++) {
      var k = i / Math.max(1, n - 1);
      var ang = Math.PI * 1.15 - k * Math.PI * 1.05;
      var rad = 118 - k * 54;
      var y = 2 + k * 40;
      pts.push(new T.Vector3(Math.cos(ang) * rad, y, Math.sin(ang) * rad - 10));
    }
    ctx.curve = K.pathCurve(pts, 0.35);

    /* ramp surface follows the curve */
    var rampPts = ctx.curve.getPoints(Math.max(40, n * 10));
    var rampGeo = new T.BufferGeometry(); var verts = [], idx = [];
    for (var p = 0; p < rampPts.length; p++) {
      var a = rampPts[p], b = rampPts[Math.min(rampPts.length - 1, p + 1)];
      var dir = new T.Vector3().subVectors(b, a).normalize();
      var side = new T.Vector3(-dir.z, 0, dir.x).multiplyScalar(7.5);
      verts.push(a.x + side.x, a.y, a.z + side.z, a.x - side.x, a.y, a.z - side.z);
      if (p < rampPts.length - 1) { var o = p * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    }
    rampGeo.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    rampGeo.setIndex(idx); rampGeo.computeVertexNormals();
    var ramp = new T.Mesh(rampGeo, K.mat.std(0xc2a87c, 0.95, 0, { side: T.DoubleSide }));
    ramp.receiveShadow = true; e.scene.add(ramp);

    /* falaj channel beside the ramp — fills as progress is made */
    for (var f = 0; f < n; f++) {
      var pa = ctx.curve.getPointAt(f / n), pb = ctx.curve.getPointAt((f + 1) / n);
      var seg = new T.Mesh(new T.BoxGeometry(pa.distanceTo(pb) + 1, 0.5, 2.2),
        new T.MeshStandardMaterial({ color: 0x2fa8c8, emissive: 0x0a3a4a, emissiveIntensity: 0, transparent: true, opacity: 0.25, roughness: 0.2 }));
      var mid = pa.clone().lerp(pb, 0.5); seg.position.copy(mid); seg.position.y += 0.4;
      var d2 = new T.Vector3().subVectors(pb, pa);
      seg.rotation.y = -Math.atan2(d2.z, d2.x);
      var off = new T.Vector3(-d2.z, 0, d2.x).normalize().multiplyScalar(9.6);
      seg.position.add(off);
      e.scene.add(seg); ctx.falaj.push(seg);
    }

    /* stages: gate + lantern */
    for (var s = 0; s < n; s++) {
      var pos = ctx.curve.getPointAt(s / Math.max(1, n - 1));
      var node = new T.Group(); node.position.copy(pos); e.scene.add(node);
      var tangent = ctx.curve.getTangentAt(s / Math.max(1, n - 1));
      node.rotation.y = -Math.atan2(tangent.z, tangent.x) + Math.PI / 2;
      var gate = K.gate(9, 8.5, 0xc9ad81); node.add(gate);
      var lantern = K.lantern(0xffc978); lantern.position.set(5.6, 0, 0); lantern.scale.setScalar(1.15); node.add(lantern);
      var lock = null;
      if (s > 0) { lock = K.lockDome(6.5, 0x63d0ff); lock.position.copy(pos); lock.position.y += 1; e.scene.add(lock); K.setDim(node, true); }
      ctx.stages.push({ pos: pos.clone(), node: node, lock: lock, gate: gate, lantern: lantern });
    }

    /* hero walks the ramp */
    var hero = K.child({ robe: 0xf6f2e7, accent: 0x2e6ea8, hatColor: 0xf0e6cf });
    hero.position.copy(ctx.stages[0].pos); hero.position.y += 0.2;
    e.scene.add(hero); ctx.hero = hero;
    ctx.moving = false;
    e.updaters.push(function (dt, t) {
      K.animChild(hero, dt, t, ctx.moving);
      ctx.falaj.forEach(function (fs, i2) { if (fs.userData.on) fs.material.opacity = 0.55 + Math.sin(t * 2 + i2) * 0.12; });
    });

    W.makeMotes(e, 90, 220, 0xffe6bf, 0.7);
    e.rig.minDist = 26; e.rig.maxDist = 190;
    return ctx;
  },
  focus: function (ctx, i, e) {
    var s = ctx.stages[i];
    return { target: s.pos.clone().setY(s.pos.y + 5), dist: 72, az: e.rig.az, pol: 0.44 };
  },
  intro: function (ctx, e, done) {
    e.rig.target.copy(ctx.stages[0].pos).setY(20);
    e.camera.position.set(150, 120, 190);
    e.rig.dist = 190; e.rig.pol = 0.85; e.rig.az = 0.9;
    e.tweens.val(function (v) { e.rig.dist = v; }, 210, 76, 4.2, Ease.inOut);
    e.tweens.val(function (v) { e.rig.pol = v; }, 0.85, 0.5, 4.2, Ease.inOut);
    e.tweens.val(function (v) { e.rig.az = v; }, 0.9, 0.15, 4.2, Ease.inOut);
    var p = ctx.stages[0].pos;
    e.tweens.to(e.rig.target, { x: p.x, y: p.y + 4, z: p.z }, 4.2, Ease.inOut, done);
  },
  unlock: function (ctx, e, i, done) {
    var s = ctx.stages[i]; if (!s) { if (done) done(); return; }
    W.audio.unlock();
    if (s.lock) {
      e.fx.burst(s.pos.clone().setY(s.pos.y + 8), 0x8fe6ff, 1);
      e.fx.ring(s.pos.clone().setY(s.pos.y + 0.6), 0x8fe6ff, 22);
      K.dissolve(e, s.lock, 0.85); s.lock = null;
    }
    K.setDim(s.node, false);
    /* doors swing open */
    var doors = s.gate.userData.doors;
    e.tweens.to(doors[0].rotation, { x: 0, y: -1.35, z: 0 }, 1.2, Ease.out);
    e.tweens.to(doors[1].rotation, { x: 0, y: 1.35, z: 0 }, 1.2, Ease.out, function () { if (done) done(); });
    K.lightLantern(e, s.lantern, 1.7);
    /* falaj segment starts flowing up to this stage */
    for (var f = 0; f <= i && f < ctx.falaj.length; f++) {
      (function (seg) {
        if (seg.userData.on) return; seg.userData.on = true;
        e.tweens.val(function (v) { seg.material.opacity = v; seg.material.emissiveIntensity = v; }, seg.material.opacity, 0.6, 1.1, Ease.out);
      })(ctx.falaj[f]);
    }
  },
  travel: function (ctx, e, from, to, done) {
    var a = ctx.stages[from].pos, b = ctx.stages[to].pos;
    var t0 = from / Math.max(1, ctx.stages.length - 1), t1 = to / Math.max(1, ctx.stages.length - 1);
    ctx.moving = true; W.audio.travel();
    var dur = e.reduced ? 0.4 : 2.8;
    var prog = { v: t0 };
    e.tweens.val(function (v) {
      prog.v = v;
      var p = ctx.curve.getPointAt(U.clamp(v, 0, 1));
      ctx.hero.position.copy(p); ctx.hero.position.y += 0.2;
      var tg = ctx.curve.getTangentAt(U.clamp(v, 0, 1));
      ctx.hero.rotation.y = Math.atan2(tg.x, tg.z);
      e.rig.target.lerp(p.clone().setY(p.y + 4), 0.12);
    }, t0, t1, dur, Ease.inOut, function () {
      ctx.moving = false; if (done) done();
    });
  },
  reward: function (ctx, e, i, done) { spawnReward(e, ctx, ctx.hero.position.clone(), "key", 0xffd35b, done); },
  finale: function (ctx, e, done) {
    W.audio.finale();
    e.tweens.val(function (v) { ctx.beacon.material.emissiveIntensity = v; ctx.beaconLight.intensity = v * 2.4; }, 0, 1, 1.6, Ease.out);
    e.fx.beam(ctx.beacon.position.clone().setY(0), 0xffd98a, 120, 2.4);
    e.fx.ring(ctx.beacon.position.clone().setY(2), 0xffd98a, 60);
    e.tweens.val(function (v) { e.rig.dist = v; }, e.rig.dist, 120, 3, Ease.inOut);
    e.tweens.to(e.rig.target, { x: 0, y: 40, z: -40 }, 3, Ease.inOut, done);
  }
};

/* ============================================================================
 * WORLD 2 · وادي المسارات — Valley of Paths          (الصف ١ · الفصل ٢)
 * تكوين: وادٍ أخضر · مراحل = أحجار عبور فوق جدول ماء
 * انتقال: الشخصية تقفز من حجر إلى حجر · فتح: يرتفع الحجر الغارق ويمتد لوح الجسر
 * ==========================================================================*/
W.worlds.valley = {
  id: "valley", name: "وادي المسارات", nameEn: "VALLEY OF PATHS",
  tagline: "رتّب خطواتك واعبر الوادي حجرًا بعد حجر",
  rewardKind: "gem", rewardColor: 0x6ee7a8,
  ambientTone: 700,
  build: function (e, n) {
    var ctx = { stages: [], planks: [] };
    W.makeSky(e, 0x4a94cf, 0xdff0e4, new T.Vector3(-0.4, 0.7, 0.5).normalize(), 0xfff0c0);
    e.scene.fog = new T.Fog(0xd7e9dd, 80, 400);
    W.standardLights(e, { skyColor: 0xcfe8ff, groundColor: 0x2e4a2a, sunIntensity: 1.45, shadowSpan: 140 });

    /* valley floor: two green banks with a stream between */
    var bankMat = K.mat.std(0x3f7a45, 0.98);
    var bankL = new T.Mesh(new T.BoxGeometry(420, 10, 90), bankMat);
    bankL.position.set(0, -4, -62); bankL.receiveShadow = true; e.scene.add(bankL);
    var bankR = bankL.clone(); bankR.position.z = 62; e.scene.add(bankR);
    /* mountains framing the valley */
    var mL = K.ridge(420, 46, 0x6d7f5a, 21); mL.position.set(0, 0, -118); e.scene.add(mL);
    var mR = K.ridge(420, 52, 0x62734f, 33); mR.position.set(0, 0, 120); e.scene.add(mR);

    /* the stream (narrow water strip using the shared shader) */
    ctx.water = K.water(e, { size: 420, segments: 110, deep: 0x14506b, shallow: 0x39a8c0, amp: 0.42, fog: 0xd7e9dd, fogNear: 90, fogFar: 400 });
    ctx.water.scale.set(1, 1, 0.28);
    ctx.water.position.y = -1.4;

    /* stones laid across the valley in a gentle S */
    for (var i = 0; i < n; i++) {
      var k = i / Math.max(1, n - 1);
      var x = -170 + k * 340;
      var z = Math.sin(k * Math.PI * 1.7) * 26;
      var pos = new T.Vector3(x, 0, z);
      var node = new T.Group(); node.position.copy(pos); e.scene.add(node);
      var stone = K.mound(7.5, 4, 0x8d9a7e, 40 + i);
      stone.position.y = 0.5; node.add(stone);
      var top = new T.Mesh(new T.CylinderGeometry(5.4, 5.8, 0.7, 14), K.mat.std(0xa9b394, 0.95));
      top.position.y = 2.5; top.receiveShadow = true; node.add(top);
      /* a small marker post that lights when done */
      var post = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 5, 6), K.mat.std(0x7a5a34, 0.9));
      post.position.set(3.4, 5, 0); node.add(post);
      var lamp = new T.Mesh(new T.SphereGeometry(0.75, 12, 10), K.mat.glow(0x9dffc4, 0));
      lamp.position.set(3.4, 7.6, 0); node.add(lamp);
      var lock = null;
      if (i > 0) {
        node.position.y = -4.2;   /* submerged until unlocked */
        K.setDim(node, true);
        lock = K.lockDome(8, 0x7fd8ff); lock.position.copy(pos); e.scene.add(lock);
      }
      ctx.stages.push({ pos: pos.clone(), node: node, lock: lock, lamp: lamp, base: pos.clone() });
      /* connecting plank (appears on unlock) */
      if (i > 0) {
        var prev = ctx.stages[i - 1].pos;
        var mid = prev.clone().lerp(pos, 0.5);
        var len = prev.distanceTo(pos) - 9;
        var plank = new T.Mesh(new T.BoxGeometry(Math.max(2, len), 0.5, 2.4), K.mat.std(0x9c6b3c, 0.9));
        plank.position.copy(mid); plank.position.y = 2.4;
        plank.rotation.y = -Math.atan2(pos.z - prev.z, pos.x - prev.x);
        plank.castShadow = true; plank.visible = false;
        e.scene.add(plank); ctx.planks.push(plank);
      } else ctx.planks.push(null);
    }

    /* waterwheel at the far end — the finale payoff */
    var wheel = new T.Group(); wheel.position.set(190, 6, 10); e.scene.add(wheel);
    var hub = new T.Mesh(new T.CylinderGeometry(1, 1, 3, 10), K.mat.std(0x7a5a34, 0.9));
    hub.rotation.z = Math.PI / 2; wheel.add(hub);
    for (var b = 0; b < 8; b++) {
      var blade = new T.Mesh(new T.BoxGeometry(1.2, 11, 3.6), K.mat.std(0x8b6239, 0.9));
      blade.rotation.x = (b / 8) * Math.PI * 2; blade.castShadow = true;
      var holder = new T.Group(); holder.rotation.x = (b / 8) * Math.PI * 2;
      var bl = new T.Mesh(new T.BoxGeometry(1, 10, 3.4), K.mat.std(0x8b6239, 0.9));
      bl.position.y = 5.5; holder.add(bl); wheel.add(holder);
    }
    ctx.wheel = wheel; ctx.wheelSpin = 0;

    var hero = K.child({ robe: 0xfdf6e9, accent: 0x2f8f6f, hatColor: 0xe8d9b8 });
    hero.position.copy(ctx.stages[0].pos); hero.position.y = 2.9;
    e.scene.add(hero); ctx.hero = hero;
    ctx.moving = false;
    e.updaters.push(function (dt, t) {
      K.animChild(hero, dt, t, false);
      if (ctx.wheelSpin > 0) wheel.rotation.x += dt * ctx.wheelSpin;
      ctx.stages.forEach(function (s) { if (s.lamp.material.emissiveIntensity > 0) s.lamp.material.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.2; });
    });
    W.makeMotes(e, 110, 200, 0xdfffe8, 0.6);
    e.rig.minDist = 26; e.rig.maxDist = 190;
    return ctx;
  },
  focus: function (ctx, i, e) {
    var s = ctx.stages[i];
    return { target: s.pos.clone().setY(5), dist: 62, az: 0.05, pol: 0.38 };
  },
  intro: function (ctx, e, done) {
    e.rig.target.copy(ctx.stages[0].pos).setY(6);
    e.rig.dist = 180; e.rig.pol = 0.75; e.rig.az = -0.8;
    e.camera.position.set(-160, 130, 150);
    e.tweens.val(function (v) { e.rig.dist = v; }, 190, 64, 4.4, Ease.inOut);
    e.tweens.val(function (v) { e.rig.pol = v; }, 0.75, 0.42, 4.4, Ease.inOut);
    e.tweens.val(function (v) { e.rig.az = v; }, -0.8, 0.05, 4.4, Ease.inOut, done);
  },
  unlock: function (ctx, e, i, done) {
    var s = ctx.stages[i]; if (!s) { if (done) done(); return; }
    W.audio.unlock();
    if (s.lock) { e.fx.ring(s.pos.clone().setY(1), 0x8fe6ff, 20); K.dissolve(e, s.lock, 0.8); s.lock = null; }
    K.setDim(s.node, false);
    e.fx.burst(s.pos.clone().setY(3), 0x9dffc4, 0.8);
    /* the stone rises out of the stream */
    e.tweens.to(s.node.position, { x: s.pos.x, y: 0, z: s.pos.z }, 1.3, Ease.outBack, function () {
      /* then the plank bridges the gap */
      var pk = ctx.planks[i];
      if (pk) { pk.visible = true; pk.scale.set(0.01, 1, 1); e.tweens.to(pk.scale, { x: 1, y: 1, z: 1 }, 0.6, Ease.out, done); }
      else if (done) done();
    });
    e.tweens.val(function (v) { s.lamp.material.emissiveIntensity = v; }, 0, 1, 1.2, Ease.out);
  },
  travel: function (ctx, e, from, to, done) {
    /* hop arc from stone to stone */
    var a = ctx.stages[from].pos.clone().setY(2.9), b = ctx.stages[to].pos.clone().setY(2.9);
    var dur = e.reduced ? 0.3 : 1.5;
    var p = { v: 0 };
    W.audio.step();
    ctx.hero.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    e.tweens.val(function (v) {
      var pos = a.clone().lerp(b, v);
      pos.y = 2.9 + Math.sin(v * Math.PI) * 7;       /* the arc */
      ctx.hero.position.copy(pos);
      ctx.hero.rotation.z = Math.sin(v * Math.PI) * 0.12;
      e.rig.target.lerp(b.clone().setY(4), 0.1);
    }, 0, 1, dur, Ease.inOut, function () {
      ctx.hero.position.copy(b); ctx.hero.rotation.z = 0; W.audio.step();
      if (done) done();
    });
    glide(e, ctx, b.clone().setY(4), dur);
  },
  reward: function (ctx, e, i, done) { spawnReward(e, ctx, ctx.hero.position.clone(), "gem", 0x6ee7a8, done); },
  finale: function (ctx, e, done) {
    W.audio.finale();
    ctx.wheelSpin = 1.5;
    e.fx.ring(ctx.wheel.position.clone().setY(1), 0x9dffc4, 40);
    e.fx.burst(ctx.wheel.position.clone(), 0x9dffc4, 1.4);
    e.tweens.val(function (v) { e.rig.dist = v; }, e.rig.dist, 90, 2.6, Ease.inOut);
    e.tweens.to(e.rig.target, { x: 170, y: 10, z: 8 }, 2.6, Ease.inOut, done);
  }
};

/* ============================================================================
 * WORLD 3 · مدينة المصمّمين — Makers' City            (الصف ٢ · الفصل ١)
 * تكوين: ساحات ورش على شبكة · نصب مركزي يتجمّع قطعةً قطعة
 * انتقال: مركبة معلّقة على سكة · فتح: تضيء الورشة وتطير قطعة إلى النصب
 * ==========================================================================*/
W.worlds.makers = {
  id: "makers", name: "مدينة المصمّمين", nameEn: "MAKERS' CITY",
  tagline: "شغّل الورش وابنِ النصب قطعةً قطعة",
  rewardKind: "gear", rewardColor: 0xffb85b,
  ambientTone: 900,
  build: function (e, n) {
    var ctx = { stages: [], pieces: [] };
    W.makeSky(e, 0x27406e, 0xf0b48a, new T.Vector3(-0.6, 0.45, -0.3).normalize(), 0xffc08a);
    e.scene.fog = new T.Fog(0xbcc6dd, 90, 430);
    W.standardLights(e, { skyColor: 0xc8dbff, groundColor: 0x2a3040, sunColor: 0xffe3c0, sunIntensity: 1.3, shadowSpan: 160 });

    var plaza = new T.Mesh(new T.CylinderGeometry(180, 190, 8, 44), K.mat.std(0x39404f, 0.9));
    plaza.position.y = -4; plaza.receiveShadow = true; e.scene.add(plaza);
    /* grid lines to sell "design city" */
    var gridMat = new T.MeshBasicMaterial({ color: 0x5a7fb0, transparent: true, opacity: 0.28 });
    for (var gx = -160; gx <= 160; gx += 32) {
      var ln = new T.Mesh(new T.PlaneGeometry(0.4, 340), gridMat); ln.rotation.x = -Math.PI / 2;
      ln.position.set(gx, 0.06, 0); e.scene.add(ln);
      var ln2 = new T.Mesh(new T.PlaneGeometry(340, 0.4), gridMat); ln2.rotation.x = -Math.PI / 2;
      ln2.position.set(0, 0.06, gx); e.scene.add(ln2);
    }

    /* central monument that assembles as lessons complete */
    var monument = new T.Group(); monument.position.set(0, 0, 0); e.scene.add(monument);
    var pedestal = new T.Mesh(new T.CylinderGeometry(13, 16, 6, 8), K.mat.std(0x8f9ab0, 0.7, 0.3));
    pedestal.position.y = 3; pedestal.castShadow = true; pedestal.receiveShadow = true; monument.add(pedestal);
    ctx.monument = monument;

    /* workshop plazas around the monument in a grid-like ring */
    var rnd = U.seeded(19);
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2 + 0.4;
      var rad = 92 + (i % 3) * 14;
      var pos = new T.Vector3(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
      var node = new T.Group(); node.position.copy(pos); node.rotation.y = -ang; e.scene.add(node);
      /* workshop: a shed with a glowing roof sign */
      var shed = new T.Mesh(new T.BoxGeometry(20, 12, 16), K.mat.std(0x6b7590, 0.8, 0.2));
      shed.position.y = 6; shed.castShadow = true; shed.receiveShadow = true; node.add(shed);
      var roof = new T.Mesh(new T.ConeGeometry(15, 6, 4), K.mat.std(0x50607d, 0.8));
      roof.position.y = 15; roof.rotation.y = Math.PI / 4; roof.castShadow = true; node.add(roof);
      var sign = new T.Mesh(new T.BoxGeometry(12, 2.4, 0.5), K.mat.glow(0x53e0ff, 0));
      sign.position.set(0, 13.4, 8.2); node.add(sign);
      var lamp = new T.PointLight(0x53e0ff, 0, 44); lamp.position.set(0, 12, 10); node.add(lamp);
      /* the piece that will fly to the monument */
      var piece = new T.Mesh(new T.BoxGeometry(5, 5, 5), K.mat.std([0xffb85b, 0x53e0ff, 0xa98bff, 0x6ee7a8][i % 4], 0.5, 0.4));
      piece.position.set(0, 20, 0); piece.castShadow = true; node.add(piece);
      var lock = null;
      if (i > 0) { lock = K.lockWall(24, 18, 0xff6ba8); lock.position.copy(pos); lock.rotation.y = -ang + Math.PI / 2; lock.position.add(new T.Vector3(Math.cos(ang), 0, Math.sin(ang)).multiplyScalar(-13)); e.scene.add(lock); K.setDim(node, true); }
      ctx.stages.push({ pos: pos.clone(), node: node, lock: lock, sign: sign, lamp: lamp, piece: piece, ang: ang });
    }

    /* rail ring + tram pod */
    var rail = new T.Mesh(new T.TorusGeometry(92, 0.5, 8, 80), K.mat.std(0x8fa4c8, 0.4, 0.7));
    rail.rotation.x = Math.PI / 2; rail.position.y = 5; e.scene.add(rail);
    var pod = K.pod(0xe6edf6, 0x53e0ff); ctx.pod = pod; e.scene.add(pod);
    var p0 = ctx.stages[0];
    pod.position.set(Math.cos(p0.ang) * 92, 5, Math.sin(p0.ang) * 92);
    var hero = K.child({ robe: 0xf2f6fb, accent: 0xc76a2a, hatColor: 0xe9d7bd, scale: 0.85 });
    hero.position.copy(p0.pos).setY(0); e.scene.add(hero); ctx.hero = hero;

    e.updaters.push(function (dt, t) {
      K.animChild(hero, dt, t, false);
      pod.position.y = 5 + Math.sin(t * 1.6) * 0.35;
      if (pod.userData.ring) pod.userData.ring.rotation.z += dt * 1.4;
      ctx.pieces.forEach(function (pc) { pc.rotation.y += dt * 0.5; });
    });
    W.makeMotes(e, 80, 220, 0xbfe4ff, 0.7);
    e.rig.minDist = 34; e.rig.maxDist = 230;
    return ctx;
  },
  focus: function (ctx, i, e) {
    var s = ctx.stages[i];
    return { target: s.pos.clone().setY(9), dist: 78, az: s.ang + Math.PI, pol: 0.42 };
  },
  intro: function (ctx, e, done) {
    e.rig.target.set(0, 14, 0);
    e.rig.dist = 250; e.rig.pol = 0.95; e.rig.az = 0;
    e.camera.position.set(0, 250, 250);
    e.tweens.val(function (v) { e.rig.dist = v; }, 260, 82, 4.4, Ease.inOut);
    e.tweens.val(function (v) { e.rig.pol = v; }, 0.95, 0.46, 4.4, Ease.inOut);
    e.tweens.val(function (v) { e.rig.az = v; }, 0, ctx.stages[0].ang + Math.PI, 4.4, Ease.inOut);
    var p = ctx.stages[0].pos;
    e.tweens.to(e.rig.target, { x: p.x, y: 8, z: p.z }, 4.4, Ease.inOut, done);
  },
  unlock: function (ctx, e, i, done) {
    var s = ctx.stages[i]; if (!s) { if (done) done(); return; }
    W.audio.unlock();
    if (s.lock) { e.fx.ring(s.pos.clone().setY(1), 0xff9bc8, 22); K.dissolve(e, s.lock, 0.8); s.lock = null; }
    K.setDim(s.node, false);
    e.tweens.val(function (v) { s.sign.material.emissiveIntensity = v; s.lamp.intensity = v * 1.6; }, 0, 1, 1.0, Ease.out);
    e.fx.beam(s.pos.clone(), 0x53e0ff, 40, 1.4);
    if (done) setTimeout(done, e.reduced ? 0 : 700);
  },
  /* the world visibly reacts: a piece flies from the workshop into the monument */
  onComplete: function (ctx, e, i) {
    var s = ctx.stages[i]; if (!s || !s.piece) return;
    var piece = s.piece;
    var world = new T.Vector3(); piece.getWorldPosition(world);
    ctx.monument.add(piece);
    piece.position.copy(ctx.monument.worldToLocal(world.clone()));
    var slot = ctx.pieces.length;
    var ty = 8 + slot * 5.4;
    var ta = slot * 1.1;
    e.tweens.to(piece.position, { x: Math.cos(ta) * 3.2, y: ty, z: Math.sin(ta) * 3.2 }, 1.6, Ease.inOut, function () {
      e.fx.burst(new T.Vector3(0, ty, 0), 0xffd9a0, 0.6);
    });
    ctx.pieces.push(piece);
  },
  travel: function (ctx, e, from, to, done) {
    var a = ctx.stages[from], b = ctx.stages[to];
    var dur = e.reduced ? 0.4 : 3.0;
    W.audio.travel();
    /* hero boards the pod, pod slides along the rail, hero rides it */
    var a0 = a.ang, a1 = b.ang;
    if (a1 < a0) a1 += Math.PI * 2;
    e.tweens.val(function (v) {
      var x = Math.cos(v) * 92, z = Math.sin(v) * 92;
      ctx.pod.position.x = x; ctx.pod.position.z = z;
      ctx.pod.rotation.y = -v + Math.PI / 2;
      ctx.hero.position.set(x, 3.2, z);
      ctx.hero.rotation.y = -v + Math.PI / 2;
      e.rig.target.lerp(new T.Vector3(x, 8, z), 0.1);
      e.rig.az = U.lerp(e.rig.az, -v + Math.PI, 0.05);
    }, a0, a1, dur, Ease.inOut, function () {
      ctx.hero.position.copy(b.pos).setY(0);
      if (done) done();
    });
  },
  reward: function (ctx, e, i, done) { spawnReward(e, ctx, ctx.hero.position.clone(), "gear", 0xffb85b, done); },
  finale: function (ctx, e, done) {
    W.audio.finale();
    var cap = new T.Mesh(new T.OctahedronGeometry(7), K.mat.glow(0xffd9a0, 1.2));
    cap.position.set(0, 8 + ctx.pieces.length * 5.4 + 8, 0);
    ctx.monument.add(cap);
    e.fx.beam(new T.Vector3(0, 0, 0), 0xffd9a0, 150, 3);
    e.fx.ring(new T.Vector3(0, 1, 0), 0xffd9a0, 70);
    e.tweens.val(function (v) { e.rig.dist = v; }, e.rig.dist, 150, 3, Ease.inOut);
    e.tweens.to(e.rig.target, { x: 0, y: 30, z: 0 }, 3, Ease.inOut, done);
  }
};

/* ============================================================================
 * WORLD 4 · استوديو الحركة — Motion Studio            (الصف ٢ · الفصل ٢)
 * تكوين: حلقة مشاهد تصوير حول جهاز عرض مركزي · جدار إطارات
 * انتقال: عربة كاميرا (دوللي) تدور على سكة دائرية · فتح: كشّاف يضيء ويشتعل الإطار
 * ==========================================================================*/
W.worlds.studio = {
  id: "studio", name: "استوديو الحركة", nameEn: "MOTION STUDIO",
  tagline: "أضئ المشاهد وشغّل فيلمك إطارًا بعد إطار",
  rewardKind: "frame", rewardColor: 0xffd9a0,
  ambientTone: 620,
  build: function (e, n) {
    var ctx = { stages: [], frames: [] };
    /* interior: dark studio, so a night-ish sky dome + strong practicals */
    W.makeSky(e, 0x1a1030, 0x3a2140, new T.Vector3(0, 1, 0), 0x6a4a80);
    e.scene.fog = new T.Fog(0x241536, 60, 320);
    W.standardLights(e, { skyColor: 0x8b6ab5, groundColor: 0x1a1020, hemi: 0.5, sunColor: 0xd9c0ff, sunIntensity: 0.55, fill: 0.12, shadowSpan: 120 });

    var floor = new T.Mesh(new T.CylinderGeometry(150, 150, 4, 48), K.mat.std(0x2a1a38, 0.75, 0.1));
    floor.position.y = -2; floor.receiveShadow = true; e.scene.add(floor);
    /* reflective-ish inner disc */
    var disc = new T.Mesh(new T.CircleGeometry(58, 48), K.mat.std(0x3a2450, 0.35, 0.5));
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.06; disc.receiveShadow = true; e.scene.add(disc);

    /* central projector — the payoff object */
    var proj = new T.Group(); proj.position.set(0, 0, 0); e.scene.add(proj);
    var base = new T.Mesh(new T.CylinderGeometry(5, 7, 5, 12), K.mat.std(0x4a3a60, 0.6, 0.4));
    base.position.y = 2.5; base.castShadow = true; proj.add(base);
    var barrel = new T.Mesh(new T.CylinderGeometry(2.6, 3.4, 9, 14), K.mat.std(0x6a5a86, 0.4, 0.6));
    barrel.position.y = 9; barrel.castShadow = true; proj.add(barrel);
    var lens = new T.Mesh(new T.CircleGeometry(2.5, 20), K.mat.glow(0xffe9b0, 0));
    lens.position.set(0, 9, 3.5); proj.add(lens);
    ctx.projLens = lens;
    var projLight = new T.PointLight(0xffe9b0, 0, 120); projLight.position.set(0, 10, 0); proj.add(projLight);
    ctx.projLight = projLight;

    /* stages: film sets arranged in a ring, each with a spotlight */
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      var rad = 74;
      var pos = new T.Vector3(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
      var node = new T.Group(); node.position.copy(pos); node.rotation.y = -ang + Math.PI / 2; e.scene.add(node);
      /* a small stage platform + backdrop flat */
      var stage = new T.Mesh(new T.BoxGeometry(22, 1.6, 18), K.mat.std(0x4a3560, 0.8));
      stage.position.y = 0.8; stage.receiveShadow = true; stage.castShadow = true; node.add(stage);
      var flat = new T.Mesh(new T.PlaneGeometry(20, 13), K.mat.std([0x2f9e5a, 0x2f6fd0, 0xd2513b, 0xffb03b, 0x6d4fd0][i % 5], 0.95, 0, { side: T.DoubleSide }));
      flat.position.set(0, 8, -8.4); node.add(flat);
      /* a prop character/shape on the set */
      var prop = new T.Mesh(new T.SphereGeometry(2.2, 14, 12), K.mat.std(0xffe0a8, 0.7));
      prop.position.set(0, 4, 0); prop.castShadow = true; node.add(prop);
      /* spotlight rig */
      var rig = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 14, 6), K.mat.std(0x2a2038, 0.8));
      rig.position.set(9, 7, 6); node.add(rig);
      var head = new T.Mesh(new T.ConeGeometry(1.7, 3, 12), K.mat.std(0x3a3050, 0.5, 0.5));
      head.position.set(9, 13.5, 6); head.rotation.x = -0.5; node.add(head);
      var spot = new T.SpotLight(0xfff0c8, 0, 60, 0.55, 0.5, 1.2);
      spot.position.set(9, 13.5, 6); spot.target = prop;
      node.add(spot); node.add(spot.target);
      var lock = null;
      if (i > 0) { lock = K.lockWall(22, 15, 0xff6ba8); lock.position.copy(pos); lock.rotation.y = -ang; lock.position.add(new T.Vector3(Math.cos(ang), 0, Math.sin(ang)).multiplyScalar(-11)); e.scene.add(lock); K.setDim(node, true); }
      ctx.stages.push({ pos: pos.clone(), node: node, lock: lock, spot: spot, prop: prop, ang: ang });

      /* matching frame on the outer wall */
      var fang = ang, frad = 128;
      var frame = new T.Group();
      frame.position.set(Math.cos(fang) * frad, 16, Math.sin(fang) * frad);
      frame.rotation.y = -fang + Math.PI / 2;
      var fb = new T.Mesh(new T.BoxGeometry(16, 11, 0.8), K.mat.std(0x4a3a60, 0.7, 0.3));
      frame.add(fb);
      var fi = new T.Mesh(new T.PlaneGeometry(13.5, 8.6), K.mat.glow(0xffd9a0, 0));
      fi.position.z = 0.5; frame.add(fi);
      e.scene.add(frame);
      ctx.frames.push(fi);
    }

    /* camera dolly the hero rides */
    var dolly = new T.Group();
    var dbase = new T.Mesh(new T.BoxGeometry(7, 1.2, 5), K.mat.std(0x3a3050, 0.6, 0.4));
    dbase.position.y = 1.4; dbase.castShadow = true; dolly.add(dbase);
    var col = new T.Mesh(new T.CylinderGeometry(0.5, 0.6, 5, 8), K.mat.std(0x4a4060, 0.5, 0.5));
    col.position.y = 4; dolly.add(col);
    var cam = new T.Mesh(new T.BoxGeometry(3.4, 2.6, 5), K.mat.std(0x22182f, 0.5, 0.6));
    cam.position.y = 7; cam.castShadow = true; dolly.add(cam);
    var camLens = new T.Mesh(new T.CylinderGeometry(1, 1.1, 2, 14), K.mat.std(0x111018, 0.3, 0.8));
    camLens.rotation.x = Math.PI / 2; camLens.position.set(0, 7, 3.2); dolly.add(camLens);
    e.scene.add(dolly); ctx.dolly = dolly;
    var s0 = ctx.stages[0];
    dolly.position.set(Math.cos(s0.ang) * 52, 0, Math.sin(s0.ang) * 52);

    var hero = K.child({ robe: 0xf6efff, accent: 0x7a4ad0, hatColor: 0xe0d0f5, scale: 0.85 });
    hero.position.copy(s0.pos).setY(1.6); e.scene.add(hero); ctx.hero = hero;

    /* circular dolly track */
    var track = new T.Mesh(new T.TorusGeometry(52, 0.35, 8, 72), K.mat.std(0x584a75, 0.5, 0.5));
    track.rotation.x = Math.PI / 2; track.position.y = 0.3; e.scene.add(track);

    e.updaters.push(function (dt, t) {
      K.animChild(hero, dt, t, false);
      ctx.stages.forEach(function (s) { if (s.spot.intensity > 0) s.prop.rotation.y += dt * 0.7; });
      if (ctx.projLens.material.emissiveIntensity > 0) ctx.projLens.material.emissiveIntensity = 0.7 + Math.sin(t * 6) * 0.3;
    });
    W.makeMotes(e, 130, 150, 0xd8c0ff, 0.55);
    e.rig.minDist = 30; e.rig.maxDist = 220;
    return ctx;
  },
  focus: function (ctx, i, e) {
    var s = ctx.stages[i];
    return { target: s.pos.clone().setY(7), dist: 70, az: s.ang + Math.PI / 2, pol: 0.36 };
  },
  intro: function (ctx, e, done) {
    e.rig.target.set(0, 10, 0);
    e.rig.dist = 210; e.rig.pol = 1.0; e.rig.az = -1.4;
    e.camera.position.set(-150, 190, 120);
    e.tweens.val(function (v) { e.rig.dist = v; }, 220, 74, 4.6, Ease.inOut);
    e.tweens.val(function (v) { e.rig.pol = v; }, 1.0, 0.4, 4.6, Ease.inOut);
    e.tweens.val(function (v) { e.rig.az = v; }, -1.4, ctx.stages[0].ang + Math.PI / 2, 4.6, Ease.inOut);
    var p = ctx.stages[0].pos;
    e.tweens.to(e.rig.target, { x: p.x, y: 6, z: p.z }, 4.6, Ease.inOut, done);
  },
  unlock: function (ctx, e, i, done) {
    var s = ctx.stages[i]; if (!s) { if (done) done(); return; }
    W.audio.unlock();
    if (s.lock) { e.fx.ring(s.pos.clone().setY(1), 0xff9bc8, 20); K.dissolve(e, s.lock, 0.7); s.lock = null; }
    K.setDim(s.node, false);
    /* the spotlight snaps on — the signature moment of this world */
    e.tweens.val(function (v) { s.spot.intensity = v; }, 0, 2.6, 0.5, Ease.out);
    e.fx.burst(s.pos.clone().setY(6), 0xfff0c8, 0.7);
    if (done) setTimeout(done, e.reduced ? 0 : 600);
  },
  onComplete: function (ctx, e, i) {
    var fi = ctx.frames[i]; if (!fi) return;
    e.tweens.val(function (v) { fi.material.emissiveIntensity = v; }, 0, 0.95, 1.1, Ease.out);
  },
  travel: function (ctx, e, from, to, done) {
    var a = ctx.stages[from], b = ctx.stages[to];
    var a0 = a.ang, a1 = b.ang; if (a1 < a0) a1 += Math.PI * 2;
    var dur = e.reduced ? 0.4 : 2.8;
    W.audio.travel();
    e.tweens.val(function (v) {
      var x = Math.cos(v) * 52, z = Math.sin(v) * 52;
      ctx.dolly.position.set(x, 0, z);
      ctx.dolly.rotation.y = -v + Math.PI / 2;
      ctx.hero.position.set(x, 2.6, z);
      ctx.hero.rotation.y = -v + Math.PI / 2;
      /* the camera itself orbits with the dolly — this world's signature move */
      e.rig.az = -v + Math.PI / 2;
      e.rig.target.lerp(new T.Vector3(x * 1.35, 6, z * 1.35), 0.1);
    }, a0, a1, dur, Ease.inOut, function () {
      ctx.hero.position.copy(b.pos).setY(1.6);
      if (done) done();
    });
  },
  reward: function (ctx, e, i, done) { spawnReward(e, ctx, ctx.hero.position.clone(), "frame", 0xffd9a0, done); },
  finale: function (ctx, e, done) {
    W.audio.finale();
    e.tweens.val(function (v) { ctx.projLens.material.emissiveIntensity = v; ctx.projLight.intensity = v * 2.2; }, 0, 1, 1.4, Ease.out);
    e.fx.ring(new T.Vector3(0, 2, 0), 0xffe9b0, 80);
    ctx.frames.forEach(function (fi, i2) {
      e.tweens.val(function (v) { fi.material.emissiveIntensity = v; }, fi.material.emissiveIntensity, 1.2, 0.8, Ease.out);
    });
    e.tweens.val(function (v) { e.rig.dist = v; }, e.rig.dist, 150, 3, Ease.inOut);
    e.tweens.val(function (v) { e.rig.pol = v; }, e.rig.pol, 0.75, 3, Ease.inOut);
    e.tweens.to(e.rig.target, { x: 0, y: 12, z: 0 }, 3, Ease.inOut, done);
  }
};

})(window);
/*!
 * waha-adventure · worlds 5–8
 */
(function (root) {
"use strict";
var W = root.WAHADV, T = root.THREE, U = W.util, K = W.kit, Ease = W.ease;

function spawnReward(e, ctx, pos, kind, color, done) {
  var tok = K.token(kind, color);
  tok.position.copy(pos); tok.position.y += 2.5;
  e.scene.add(tok);
  var spin = function (dt) { tok.rotation.y += dt * 2.4; };
  e.updaters.push(spin);
  W.audio.reward();
  e.fx.burst(tok.position.clone(), color || 0xffd35b, 1);
  e.tweens.to(tok.position, { x: tok.position.x, y: tok.position.y + 6.5, z: tok.position.z }, 1.15, Ease.out, function () {
    K.dissolve(e, tok, 0.5, function () {
      var i = e.updaters.indexOf(spin); if (i >= 0) e.updaters.splice(i, 1);
      if (done) done();
    });
  });
}

/* ============================================================================
 * WORLD 5 · منارة المعرفة — Beacon of Knowledge       (الصف ٣ · الفصل ١)
 * تكوين: رأسي — مدرج حلزوني يلتف حول منارة فوق جزيرة
 * انتقال: الشخصية تصعد · فتح: تُركَّب عدسة فيمتدّ الشعاع أبعد
 * كاميرا: تصعد رأسيًا (مختلفة جذريًا عن العوالم الأفقية)
 * ==========================================================================*/
W.worlds.beacon = {
  id: "beacon", name: "منارة المعرفة", nameEn: "BEACON OF KNOWLEDGE",
  tagline: "اصعد المنارة وركّب عدساتها حتى يعمّ الشعاع",
  rewardKind: "crystal", rewardColor: 0x9fe8ff,
  ambientTone: 480,
  build: function (e, n) {
    var ctx = { stages: [], lenses: [] };
    W.makeSky(e, 0x143d63, 0xf0c48a, new T.Vector3(0.5, 0.35, -0.5).normalize(), 0xffc07a);
    e.scene.fog = new T.Fog(0xbcd2e0, 110, 520);
    W.standardLights(e, { skyColor: 0xbcd8f5, groundColor: 0x2f4050, sunColor: 0xffdcb0, sunIntensity: 1.25, shadowSpan: 120 });

    /* sea all around — vertical world above water */
    ctx.water = K.water(e, { size: 1600, segments: 130, deep: 0x062a42, shallow: 0x186f8c, fog: 0xbcd2e0, fogNear: 120, fogFar: 560, amp: 0.9 });

    /* rock island base */
    var island = K.mound(46, 16, 0x6f6a5c, 9);
    island.position.y = -3; e.scene.add(island);
    var beach = new T.Mesh(new T.CylinderGeometry(54, 58, 3, 30), K.mat.std(0xd9c79a, 1));
    beach.position.y = -6; beach.receiveShadow = true; e.scene.add(beach);

    /* the lighthouse tower */
    var H = 30 + n * 7.5;
    var tower = new T.Mesh(new T.CylinderGeometry(7, 12, H, 18), K.mat.std(0xf0ece0, 0.9));
    tower.position.y = H / 2 + 6; tower.castShadow = true; tower.receiveShadow = true; e.scene.add(tower);
    /* red bands */
    for (var bd = 0; bd < 4; bd++) {
      var band = new T.Mesh(new T.CylinderGeometry(7.4 - bd * 0.1, 11.6 - bd * 1.2, 4, 18), K.mat.std(0xc0392b, 0.85));
      band.position.y = 12 + bd * (H / 4.4); e.scene.add(band);
    }
    /* lamp room at the top */
    var lampRoom = new T.Mesh(new T.CylinderGeometry(9, 9, 9, 16), new T.MeshStandardMaterial({ color: 0xbfe0f5, transparent: true, opacity: 0.4, roughness: 0.1, metalness: 0.3 }));
    lampRoom.position.y = H + 10; e.scene.add(lampRoom);
    var cap = new T.Mesh(new T.ConeGeometry(10, 7, 16), K.mat.std(0x2f4050, 0.6, 0.4));
    cap.position.y = H + 18; cap.castShadow = true; e.scene.add(cap);
    var lampCore = new T.Mesh(new T.SphereGeometry(3.4, 16, 14), K.mat.glow(0xfff0c0, 0));
    lampCore.position.y = H + 10; e.scene.add(lampCore);
    var lampLight = new T.PointLight(0xfff0c0, 0, 240); lampLight.position.y = H + 10; e.scene.add(lampLight);
    ctx.lampCore = lampCore; ctx.lampLight = lampLight; ctx.towerH = H;

    /* rotating beam (grows with each lens) */
    var beamGeo = new T.ConeGeometry(9, 150, 18, 1, true);
    var beamMat = new T.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending });
    var beam = new T.Mesh(beamGeo, beamMat);
    beam.geometry.translate(0, -75, 0);
    beam.rotation.z = Math.PI / 2 - 0.25;
    beam.position.y = H + 10; e.scene.add(beam);
    ctx.beam = beam; ctx.beamLen = 0;

    /* stages spiral UP the tower — platforms with a lens mount */
    for (var i = 0; i < n; i++) {
      var k = i / Math.max(1, n - 1);
      var ang = k * Math.PI * 2.6;
      var y = 12 + k * (H - 16);
      var rad = 15;
      var pos = new T.Vector3(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
      var node = new T.Group(); node.position.copy(pos); node.rotation.y = -ang; e.scene.add(node);
      var plat = new T.Mesh(new T.CylinderGeometry(6.5, 6.5, 1, 14), K.mat.std(0xd8cfb8, 0.9));
      plat.castShadow = true; plat.receiveShadow = true; node.add(plat);
      var railing = new T.Mesh(new T.TorusGeometry(6.2, 0.22, 6, 18), K.mat.std(0x5a6470, 0.5, 0.6));
      railing.rotation.x = Math.PI / 2; railing.position.y = 2.2; node.add(railing);
      /* lens mount */
      var mount = new T.Mesh(new T.BoxGeometry(1, 3.4, 1), K.mat.std(0x5a6470, 0.6, 0.5));
      mount.position.set(3.4, 2, 0); node.add(mount);
      var lens = new T.Mesh(new T.CylinderGeometry(2.1, 2.1, 0.45, 18), new T.MeshStandardMaterial({
        color: 0x9fe8ff, emissive: 0x9fe8ff, emissiveIntensity: 0, transparent: true, opacity: 0.75, roughness: 0.05, metalness: 0.2
      }));
      lens.rotation.x = Math.PI / 2; lens.position.set(3.4, 4.2, 0); node.add(lens);
      /* stair flight connecting to previous */
      if (i > 0) {
        var prev = ctx.stages[i - 1].pos;
        var steps = 7;
        for (var st = 0; st < steps; st++) {
          var sk = (st + 1) / (steps + 1);
          var sa = U.lerp((i - 1) / Math.max(1, n - 1), k, sk) * Math.PI * 2.6;
          var sy = U.lerp(prev.y, y, sk);
          var stp = new T.Mesh(new T.BoxGeometry(4.6, 0.5, 2.4), K.mat.std(0xcfc4ab, 0.9));
          stp.position.set(Math.cos(sa) * rad, sy, Math.sin(sa) * rad);
          stp.rotation.y = -sa; stp.castShadow = true; stp.receiveShadow = true;
          e.scene.add(stp);
        }
      }
      var lock = null;
      if (i > 0) {
        lock = K.lockDome(8, 0x7fd8ff); lock.position.copy(pos); e.scene.add(lock);
        K.setDim(node, true);
      }
      ctx.stages.push({ pos: pos.clone(), node: node, lock: lock, lens: lens, ang: ang });
      ctx.lenses.push(lens);
    }

    var hero = K.child({ robe: 0xf7f4ec, accent: 0x1f6f9e, hatColor: 0xe6dcc4, scale: 0.8 });
    hero.position.copy(ctx.stages[0].pos).setY(ctx.stages[0].pos.y + 0.7);
    e.scene.add(hero); ctx.hero = hero;
    ctx.moving = false;

    e.updaters.push(function (dt, t) {
      K.animChild(hero, dt, t, ctx.moving);
      if (ctx.beamLen > 0) { beam.rotation.y += dt * 0.45; }
      if (ctx.lampCore.material.emissiveIntensity > 0)
        ctx.lampCore.material.emissiveIntensity = 0.75 + Math.sin(t * 2.4) * 0.25;
    });
    W.makeMotes(e, 70, 260, 0xdfefff, 0.7);
    e.rig.minDist = 30; e.rig.maxDist = 260;
    return ctx;
  },
  focus: function (ctx, i, e) {
    var s = ctx.stages[i];
    return { target: s.pos.clone().setY(s.pos.y + 4), dist: 58, az: s.ang + Math.PI, pol: 0.26 };
  },
  intro: function (ctx, e, done) {
    /* rise from the sea up the tower — a vertical reveal */
    e.rig.target.set(0, 2, 0);
    e.rig.dist = 200; e.rig.pol = 0.12; e.rig.az = 1.2;
    e.camera.position.set(180, 12, 120);
    var s0 = ctx.stages[0];
    e.tweens.val(function (v) { e.rig.dist = v; }, 210, 62, 5.0, Ease.inOut);
    e.tweens.val(function (v) { e.rig.pol = v; }, 0.12, 0.28, 5.0, Ease.inOut);
    e.tweens.val(function (v) { e.rig.az = v; }, 1.2, s0.ang + Math.PI, 5.0, Ease.inOut);
    e.tweens.to(e.rig.target, { x: s0.pos.x, y: s0.pos.y + 3, z: s0.pos.z }, 5.0, Ease.inOut, done);
  },
  unlock: function (ctx, e, i, done) {
    var s = ctx.stages[i]; if (!s) { if (done) done(); return; }
    W.audio.unlock();
    if (s.lock) { e.fx.ring(s.pos.clone(), 0x9fe8ff, 18); K.dissolve(e, s.lock, 0.8); s.lock = null; }
    K.setDim(s.node, false);
    if (done) setTimeout(done, e.reduced ? 0 : 650);
  },
  /* each completed lesson installs a lens → the beam grows and the lamp brightens */
  onComplete: function (ctx, e, i) {
    var s = ctx.stages[i]; if (!s) return;
    e.tweens.val(function (v) { s.lens.material.emissiveIntensity = v; }, 0, 0.9, 1.0, Ease.out);
    ctx.beamLen++;
    var frac = ctx.beamLen / ctx.stages.length;
    e.tweens.val(function (v) { ctx.beam.material.opacity = v; }, ctx.beam.material.opacity, 0.10 + frac * 0.22, 1.2, Ease.out);
    e.tweens.val(function (v) { ctx.beam.scale.set(v, v, v); }, ctx.beam.scale.x, 0.35 + frac * 0.9, 1.2, Ease.out);
    e.tweens.val(function (v) { ctx.lampCore.material.emissiveIntensity = v; ctx.lampLight.intensity = v * 1.6; },
      ctx.lampCore.material.emissiveIntensity, 0.3 + frac * 0.7, 1.2, Ease.out);
    e.fx.beam(new T.Vector3(s.pos.x, s.pos.y, s.pos.z), 0x9fe8ff, 26, 1.2);
  },
  travel: function (ctx, e, from, to, done) {
    /* climb the stairs: interpolate along the spiral, camera rises with the hero */
    var a = ctx.stages[from], b = ctx.stages[to];
    var n = ctx.stages.length;
    var k0 = from / Math.max(1, n - 1), k1 = to / Math.max(1, n - 1);
    var rad = 15, H = ctx.towerH;
    ctx.moving = true; W.audio.travel();
    var dur = e.reduced ? 0.4 : 2.6;
    e.tweens.val(function (v) {
      var ang = v * Math.PI * 2.6;
      var y = 12 + v * (H - 16);
      var p = new T.Vector3(Math.cos(ang) * rad, y + 0.7, Math.sin(ang) * rad);
      ctx.hero.position.copy(p);
      ctx.hero.rotation.y = -ang + Math.PI / 2;
      e.rig.target.lerp(p.clone().setY(y + 3), 0.14);
      e.rig.az = U.lerp(e.rig.az, ang + Math.PI, 0.06);
    }, k0, k1, dur, Ease.inOut, function () { ctx.moving = false; if (done) done(); });
  },
  reward: function (ctx, e, i, done) { spawnReward(e, ctx, ctx.hero.position.clone(), "crystal", 0x9fe8ff, done); },
  finale: function (ctx, e, done) {
    W.audio.finale();
    e.tweens.val(function (v) { ctx.beam.material.opacity = v; }, ctx.beam.material.opacity, 0.42, 1.5, Ease.out);
    e.tweens.val(function (v) { ctx.beam.scale.set(v, v, v); }, ctx.beam.scale.x, 1.5, 1.5, Ease.out);
    e.tweens.val(function (v) { ctx.lampCore.material.emissiveIntensity = v; ctx.lampLight.intensity = v * 2.4; },
      ctx.lampCore.material.emissiveIntensity, 1.2, 1.5, Ease.out);
    e.fx.ring(new T.Vector3(0, ctx.towerH + 10, 0), 0xfff0c0, 90);
    e.tweens.val(function (v) { e.rig.dist = v; }, e.rig.dist, 180, 3.2, Ease.inOut);
    e.tweens.val(function (v) { e.rig.pol = v; }, e.rig.pol, 0.5, 3.2, Ease.inOut);
    e.tweens.to(e.rig.target, { x: 0, y: ctx.towerH * 0.7, z: 0 }, 3.2, Ease.inOut, done);
  }
};

/* ============================================================================
 * WORLD 6 · كوكب الشيفرة — Code Planet                (الصف ٣ · الفصل ٢)
 * تكوين: سطح كوكب منحنٍ + محطة مدارية · مراحل = وحدات على السطح
 * انتقال: مركبة جوّالة تسير على السطح · فتح: تشتعل الوحدة وينتشر هوائيها
 * ==========================================================================*/
W.worlds.planet = {
  id: "planet", name: "كوكب الشيفرة", nameEn: "CODE PLANET",
  tagline: "شغّل وحدات الكوكب وأرسل الإشارة إلى المدار",
  rewardKind: "core", rewardColor: 0x8affd0,
  ambientTone: 320,
  build: function (e, n) {
    var ctx = { stages: [], modules: [] };
    W.makeSky(e, 0x05060f, 0x161a3a, new T.Vector3(-0.4, 0.5, 0.6).normalize(), 0x9db4ff);
    e.scene.fog = new T.FogExp2(0x0a0d20, 0.0016);
    W.makeStars(e, 700, 800);
    W.standardLights(e, { skyColor: 0x4a5a9a, groundColor: 0x1a1030, hemi: 0.42, sunColor: 0xdfe8ff, sunIntensity: 1.5, fill: 0.1, shadowSpan: 150 });

    /* curved planet surface: a very large sphere, we stand near its top */
    var R = 460;
    var planetGeo = new T.SphereGeometry(R, 64, 48);
    var pos = planetGeo.attributes.position;
    var rnd = U.seeded(77);
    for (var i = 0; i < pos.count; i++) {
      var v = new T.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      var noise = Math.sin(v.x * 0.02) * Math.cos(v.z * 0.021) * 5 + Math.sin(v.y * 0.03 + 1.3) * 3;
      v.setLength(R + noise);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    planetGeo.computeVertexNormals();
    var planet = new T.Mesh(planetGeo, K.mat.std(0x6b4a7a, 0.98));
    planet.position.y = -R; planet.receiveShadow = true; e.scene.add(planet);
    ctx.R = R;

    /* craters */
    for (var c = 0; c < 14; c++) {
      var ca = rnd() * Math.PI * 2, cr = 40 + rnd() * 200;
      var crater = new T.Mesh(new T.TorusGeometry(6 + rnd() * 10, 2.4, 6, 18), K.mat.std(0x543a63, 1));
      crater.rotation.x = Math.PI / 2;
      crater.position.set(Math.cos(ca) * cr, -0.6, Math.sin(ca) * cr);
      crater.receiveShadow = true; e.scene.add(crater);
    }

    /* orbital station overhead */
    var station = new T.Group(); station.position.set(60, 170, -110); e.scene.add(station);
    var ring = new T.Mesh(new T.TorusGeometry(26, 3, 10, 40), K.mat.std(0xc7d2e0, 0.35, 0.75));
    ring.rotation.x = 1.1; station.add(ring);
    var hub = new T.Mesh(new T.SphereGeometry(8, 18, 14), K.mat.std(0xdfe9f5, 0.3, 0.6));
    station.add(hub);
    var panel1 = new T.Mesh(new T.BoxGeometry(30, 0.6, 12), K.mat.std(0x2b3a6a, 0.4, 0.6));
    panel1.position.set(-26, 0, 0); station.add(panel1);
    var panel2 = panel1.clone(); panel2.position.set(26, 0, 0); station.add(panel2);
    ctx.station = station;

    /* modules laid across the visible surface */
    for (var s = 0; s < n; s++) {
      var k = s / Math.max(1, n - 1);
      var ang = -Math.PI * 0.62 + k * Math.PI * 1.24;
      var rad = 120 + Math.sin(k * Math.PI * 2) * 34;
      var px = Math.cos(ang) * rad, pz = Math.sin(ang) * rad - 40;
      var py = surfaceY(px, pz, R);
      var p = new T.Vector3(px, py, pz);
      var node = new T.Group(); node.position.copy(p); e.scene.add(node);
      node.lookAt(new T.Vector3(px, -R, pz));  /* stand upright on the curve */
      node.rotateX(Math.PI / 2);
      /* module: a habitat pod with antenna */
      var padm = new T.Mesh(new T.CylinderGeometry(9, 10, 1.2, 14), K.mat.std(0x4a3a5e, 0.9));
      padm.receiveShadow = true; node.add(padm);
      var podm = new T.Mesh(new T.SphereGeometry(5.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), K.mat.std(0xd7e2f0, 0.4, 0.5));
      podm.position.y = 0.6; podm.castShadow = true; node.add(podm);
      var vis = new T.Mesh(new T.CircleGeometry(2.3, 18), K.mat.glow(0x8affd0, 0));
      vis.position.set(0, 3, 5.0); node.add(vis);
      var ant = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 8, 6), K.mat.std(0x9fb0c4, 0.4, 0.7));
      ant.position.set(3.6, 4, 0); ant.rotation.z = -0.3; node.add(ant);
      var dish = new T.Mesh(new T.SphereGeometry(2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), K.mat.std(0xc7d2e0, 0.3, 0.6, { side: T.DoubleSide }));
      dish.position.set(4.6, 8, 0); dish.rotation.x = -0.9; node.add(dish);
      var mlight = new T.PointLight(0x8affd0, 0, 46); mlight.position.set(0, 5, 0); node.add(mlight);
      var lock = null;
      if (s > 0) { lock = K.lockDome(11, 0xff8fd0); lock.position.copy(p); e.scene.add(lock); K.setDim(node, true); }
      ctx.stages.push({ pos: p.clone(), node: node, lock: lock, vis: vis, light: mlight, dish: dish, ang: ang });
    }

    var rover = K.rover(0xc9d2dd, 0xffd35b);
    var s0 = ctx.stages[0];
    rover.position.copy(s0.pos); e.scene.add(rover); ctx.rover = rover;
    var hero = K.child({ robe: 0xe8eef7, accent: 0xd4622c, hat: "helmet", hatColor: 0xdfe9f2, scale: 0.78 });
    hero.position.copy(s0.pos).setX(s0.pos.x + 7); e.scene.add(hero); ctx.hero = hero;

    ctx.driving = false;
    e.updaters.push(function (dt, t) {
      K.animChild(hero, dt, t, false);
      station.rotation.y += dt * 0.08;
      if (ctx.driving) rover.userData.wheels.forEach(function (w) { w.rotation.y += dt * 9; });
      ctx.stages.forEach(function (st) { if (st.light.intensity > 0) st.dish.rotation.z = Math.sin(t * 0.6) * 0.25; });
    });
    W.makeMotes(e, 60, 300, 0xbfd0ff, 0.6);
    e.rig.minDist = 30; e.rig.maxDist = 260;
    return ctx;

    function surfaceY(x, z, R) { var d2 = x * x + z * z; return Math.sqrt(Math.max(0, R * R - d2)) - R; }
  },
  focus: function (ctx, i, e) {
    var s = ctx.stages[i];
    return { target: s.pos.clone().setY(s.pos.y + 6), dist: 64, az: e.rig.az, pol: 0.22 };
  },
  intro: function (ctx, e, done) {
    /* low, cinematic sweep across the curved horizon */
    var s0 = ctx.stages[0];
    e.rig.target.copy(s0.pos).setY(s0.pos.y + 5);
    e.rig.dist = 240; e.rig.pol = 0.08; e.rig.az = -1.6;
    e.camera.position.set(-220, 20, 60);
    e.tweens.val(function (v) { e.rig.dist = v; }, 250, 68, 5.0, Ease.inOut);
    e.tweens.val(function (v) { e.rig.pol = v; }, 0.08, 0.22, 5.0, Ease.inOut);
    e.tweens.val(function (v) { e.rig.az = v; }, -1.6, 0.4, 5.0, Ease.inOut, done);
  },
  unlock: function (ctx, e, i, done) {
    var s = ctx.stages[i]; if (!s) { if (done) done(); return; }
    W.audio.unlock();
    if (s.lock) { e.fx.ring(s.pos.clone().setY(s.pos.y + 0.5), 0xff9bd8, 22); K.dissolve(e, s.lock, 0.8); s.lock = null; }
    K.setDim(s.node, false);
    e.tweens.val(function (v) { s.vis.material.emissiveIntensity = v; s.light.intensity = v * 1.5; }, 0, 1, 1.0, Ease.out);
    e.fx.beam(s.pos.clone(), 0x8affd0, 34, 1.3);
    if (done) setTimeout(done, e.reduced ? 0 : 700);
  },
  travel: function (ctx, e, from, to, done) {
    var a = ctx.stages[from], b = ctx.stages[to];
    var dur = e.reduced ? 0.4 : 3.2;
    ctx.driving = true; W.audio.travel();
    var start = a.pos.clone(), end = b.pos.clone();
    var dir = Math.atan2(end.x - start.x, end.z - start.z);
    e.tweens.val(function (v) { ctx.rover.rotation.y = v; }, ctx.rover.rotation.y, dir, 0.7, Ease.inOut);
    e.tweens.val(function (v) {
      var p = start.clone().lerp(end, v);
      /* keep the rover hugging the curved surface */
      p.y = Math.sqrt(Math.max(0, ctx.R * ctx.R - (p.x * p.x + p.z * p.z))) - ctx.R;
      ctx.rover.position.copy(p);
      ctx.hero.position.set(p.x + 7, p.y, p.z);
      ctx.hero.rotation.y = dir;
      e.rig.target.lerp(p.clone().setY(p.y + 5), 0.1);
    }, 0, 1, dur, Ease.inOut, function () {
      ctx.driving = false;
      ctx.hero.position.copy(end).setX(end.x + 7);
      if (done) done();
    });
  },
  reward: function (ctx, e, i, done) { spawnReward(e, ctx, ctx.hero.position.clone(), "core", 0x8affd0, done); },
  finale: function (ctx, e, done) {
    W.audio.finale();
    /* signal beam from the last module up to the orbital station */
    var last = ctx.stages[ctx.stages.length - 1];
    e.fx.beam(last.pos.clone(), 0x8affd0, 220, 3);
    e.fx.ring(last.pos.clone().setY(last.pos.y + 1), 0x8affd0, 60);
    var hub = ctx.station.children[1];
    e.tweens.val(function (v) { hub.material.emissive = new T.Color(0x8affd0); hub.material.emissiveIntensity = v; }, 0, 1.2, 1.6, Ease.out);
    e.tweens.val(function (v) { e.rig.dist = v; }, e.rig.dist, 180, 3.2, Ease.inOut);
    e.tweens.val(function (v) { e.rig.pol = v; }, e.rig.pol, 0.62, 3.2, Ease.inOut);
    e.tweens.to(e.rig.target, { x: 40, y: 90, z: -70 }, 3.2, Ease.inOut, done);
  }
};

/* ============================================================================
 * WORLD 7 · بعثة السواحل — Coastal Expedition         (الصف ٤ · الفصل ١)
 * تكوين: بحر مفتوح + سلسلة جزر متراجعة في العمق
 * انتقال: سفينة شراعية تبحر · فتح: ترتفع الجزيرة من الماء
 * ==========================================================================*/
W.worlds.coastal = {
  id: "coastal", name: "بعثة السواحل", nameEn: "COASTAL EXPEDITION",
  tagline: "أبحر بين الجزر واجمع خريطة الكنز",
  rewardKind: "map", rewardColor: 0xf1e2b8,
  ambientTone: 520,
  build: function (e, n) {
    var ctx = { stages: [] };
    W.makeSky(e, 0x2a6fb0, 0xfbe6c4, new T.Vector3(-0.55, 0.6, 0.35).normalize(), 0xffd9a0);
    e.scene.fog = new T.Fog(0xcfe3ee, 90, 480);
    W.standardLights(e, { skyColor: 0xbfe0ff, groundColor: 0x2e4634, sunIntensity: 1.5, shadowSpan: 150 });
    ctx.water = K.water(e, { size: 1600, segments: 150, fog: 0xcfe3ee, fogNear: 90, fogFar: 480 });

    for (var i = 0; i < n; i++) {
      var x = -60 + i * 30, z = -18 - i * 27;
      var p = new T.Vector3(x, 0, z);
      var node = new T.Group(); node.position.copy(p); e.scene.add(node);
      var isl = K.mound(11 - i * 0.35, 7, 0xe9cf95, 20 + i);
      isl.position.y = -1; node.add(isl);
      var beach = new T.Mesh(new T.CylinderGeometry(13 - i * 0.4, 13.6 - i * 0.4, 1.4, 26), K.mat.std(0xf3e2b0, 1));
      beach.position.y = -2.6; beach.receiveShadow = true; node.add(beach);
      var palm = K.palm(1 - i * 0.03); palm.position.set(2.5, 1.2, -1.5); node.add(palm);
      var pole = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 11, 6), K.mat.std(0x8a5a2b, 0.9));
      pole.position.set(-4.5, 5, 0); node.add(pole);
      var flag = new T.Mesh(new T.PlaneGeometry(3.4, 1.9), K.mat.std(0x1f9e5a, 0.8, 0, { side: T.DoubleSide, emissive: 0x06210f, emissiveIntensity: 0 }));
      flag.position.set(-2.8, 9.4, 0); node.add(flag);
      var lock = null;
      if (i > 0) {
        node.position.y = -5.5;
        K.setDim(node, true);
        lock = K.lockDome(13 - i * 0.4, 0x63d0ff); lock.position.copy(p); e.scene.add(lock);
      }
      ctx.stages.push({ pos: p.clone(), node: node, lock: lock, flag: flag, base: p.clone() });
    }

    /* treasure sits on the last island */
    var last = ctx.stages[n - 1];
    var chest = new T.Group(); chest.position.copy(last.pos).setY(2.4);
    var box = new T.Mesh(new T.BoxGeometry(4, 2.6, 2.8), K.mat.std(0x7a4a24, 0.8));
    box.castShadow = true; chest.add(box);
    var lid = new T.Mesh(new T.BoxGeometry(4.3, 1, 3.1), K.mat.std(0x5a3418, 0.8));
    lid.geometry.translate(0, 0, -1.5); lid.position.set(0, 1.6, 1.5); chest.add(lid);
    var gold = new T.Mesh(new T.SphereGeometry(1.4, 14, 12), K.mat.glow(0xffd35b, 0));
    gold.position.y = 1; chest.add(gold);
    e.scene.add(chest);
    ctx.chest = chest; ctx.chestLid = lid; ctx.gold = gold;

    var ship = K.dhow(); e.scene.add(ship); ctx.ship = ship;
    ship.position.copy(ctx.stages[0].pos).add(new T.Vector3(11, 0.4, 5));
    ship.rotation.y = -0.5;
    var hero = K.child({ robe: 0xf4f1ea, accent: 0x1f6f9e, hatColor: 0xefe6d0, scale: 0.8 });
    hero.position.copy(ctx.stages[0].pos).add(new T.Vector3(-2.5, 3.2, 3));
    e.scene.add(hero); ctx.hero = hero;

    e.updaters.push(function (dt, t) {
      K.animChild(hero, dt, t, false);
      ship.position.y = 0.4 + Math.sin(t * 1.3) * 0.28;
      ship.rotation.z = Math.sin(t * 0.9) * 0.035;
    });
    W.makeMotes(e, 90, 280, 0xffffff, 0.6);
    e.rig.minDist = 28; e.rig.maxDist = 220;
    return ctx;
  },
  focus: function (ctx, i, e) {
    var s = ctx.stages[i];
    return { target: s.pos.clone().setY(5), dist: 70, az: 0, pol: 0.32 };
  },
  intro: function (ctx, e, done) {
    e.rig.target.copy(ctx.stages[0].pos).setY(4);
    e.rig.dist = 210; e.rig.pol = 0.9; e.rig.az = -0.9;
    e.camera.position.set(-80, 170, 210);
    e.tweens.val(function (v) { e.rig.dist = v; }, 220, 74, 4.6, Ease.inOut);
    e.tweens.val(function (v) { e.rig.pol = v; }, 0.9, 0.34, 4.6, Ease.inOut);
    e.tweens.val(function (v) { e.rig.az = v; }, -0.9, 0, 4.6, Ease.inOut, done);
  },
  unlock: function (ctx, e, i, done) {
    var s = ctx.stages[i]; if (!s) { if (done) done(); return; }
    W.audio.unlock();
    if (s.lock) {
      e.fx.burst(s.pos.clone().setY(9), 0x8fe6ff, 1);
      e.fx.ring(s.pos.clone().setY(1), 0x8fe6ff, 26);
      K.dissolve(e, s.lock, 0.85); s.lock = null;
    }
    K.setDim(s.node, false);
    e.tweens.to(s.node.position, { x: s.pos.x, y: 0, z: s.pos.z }, 1.5, Ease.outBack, done);
  },
  onComplete: function (ctx, e, i) {
    var s = ctx.stages[i]; if (!s) return;
    e.tweens.val(function (v) { s.flag.material.emissiveIntensity = v; }, 0, 0.7, 1, Ease.out);
  },
  travel: function (ctx, e, from, to, done) {
    var a = ctx.stages[from].pos, b = ctx.stages[to].pos;
    var shipFrom = ctx.ship.position.clone();
    var shipTo = b.clone().add(new T.Vector3(11, 0.4, 5));
    var dir = Math.atan2(shipTo.x - shipFrom.x, shipTo.z - shipFrom.z);
    var dur = e.reduced ? 0.4 : 3.6;
    W.audio.travel();
    e.tweens.val(function (v) { ctx.ship.rotation.y = v; }, ctx.ship.rotation.y, dir, 0.9, Ease.inOut);
    e.tweens.val(function (v) {
      var p = shipFrom.clone().lerp(shipTo, v);
      ctx.ship.position.x = p.x; ctx.ship.position.z = p.z;
      ctx.hero.position.set(p.x - 2, 3.4, p.z);
      e.rig.target.lerp(b.clone().setY(4), 0.08);
    }, 0, 1, dur, Ease.inOut, function () {
      e.tweens.val(function (v) { ctx.ship.rotation.y = v; }, ctx.ship.rotation.y, -0.5, 0.8, Ease.inOut);
      e.tweens.to(ctx.hero.position, { x: b.x - 2.5, y: 3.2, z: b.z + 3 }, 0.9, Ease.out, done);
    });
  },
  reward: function (ctx, e, i, done) { spawnReward(e, ctx, ctx.hero.position.clone(), "map", 0xf1e2b8, done); },
  finale: function (ctx, e, done) {
    W.audio.finale();
    e.tweens.to(ctx.chestLid.rotation, { x: -1.25, y: 0, z: 0 }, 1.1, Ease.out);
    e.tweens.val(function (v) { ctx.gold.material.emissiveIntensity = v; }, 0, 1.4, 1.4, Ease.out);
    e.fx.beam(ctx.chest.position.clone().setY(0), 0xffd35b, 90, 2.6);
    e.fx.ring(ctx.chest.position.clone().setY(1), 0xffd35b, 50);
    e.fx.burst(ctx.chest.position.clone().setY(4), 0xffd35b, 1.5);
    e.tweens.val(function (v) { e.rig.dist = v; }, e.rig.dist, 90, 3, Ease.inOut);
    e.tweens.to(e.rig.target, { x: ctx.chest.position.x, y: 8, z: ctx.chest.position.z }, 3, Ease.inOut, done);
  }
};

/* ============================================================================
 * WORLD 8 · مدينة البيانات — Data City                (الصف ٤ · الفصل ٢)
 * تكوين: جوّي ليلي — قمم أبراج نيون متصلة بجسور ضوء
 * انتقال: كبسولة طائرة بين القمم · فتح: يضيء البرج طابقًا طابقًا ويمتد جسر
 * ==========================================================================*/
W.worlds.datacity = {
  id: "datacity", name: "مدينة البيانات", nameEn: "DATA CITY",
  tagline: "أعد تشغيل الأبراج حتى تضيء المدينة كلّها",
  rewardKind: "crystal", rewardColor: 0x53e0ff,
  ambientTone: 1100,
  build: function (e, n) {
    var ctx = { stages: [], bridges: [] };
    W.makeSky(e, 0x05081c, 0x1b1040, new T.Vector3(0.3, 0.4, -0.6).normalize(), 0x6a4aa0);
    e.scene.fog = new T.FogExp2(0x080b20, 0.0022);
    W.makeStars(e, 420, 700);
    W.standardLights(e, { skyColor: 0x3a4a8a, groundColor: 0x0a0a18, hemi: 0.38, sunColor: 0x9db4ff, sunIntensity: 0.5, fill: 0.16, shadowSpan: 150 });

    /* ground far below — reads as a city floor grid */
    var floor = new T.Mesh(new T.PlaneGeometry(900, 900), K.mat.std(0x0a0f22, 0.9));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -6; floor.receiveShadow = true; e.scene.add(floor);
    var gridMat = new T.MeshBasicMaterial({ color: 0x2a4a8a, transparent: true, opacity: 0.35 });
    for (var g = -400; g <= 400; g += 40) {
      var l1 = new T.Mesh(new T.PlaneGeometry(0.6, 800), gridMat); l1.rotation.x = -Math.PI / 2; l1.position.set(g, -5.9, 0); e.scene.add(l1);
      var l2 = new T.Mesh(new T.PlaneGeometry(800, 0.6), gridMat); l2.rotation.x = -Math.PI / 2; l2.position.set(0, -5.9, g); e.scene.add(l2);
    }

    /* background skyline (not interactive) */
    var rnd = U.seeded(51);
    for (var b2 = 0; b2 < 26; b2++) {
      var ba = rnd() * Math.PI * 2, br = 180 + rnd() * 190;
      var bh = 30 + rnd() * 90;
      var bld = K.building(14 + rnd() * 10, bh, 14 + rnd() * 10, 0x131a36, 0x2a6fd0, 100 + b2, { windows: false });
      bld.position.set(Math.cos(ba) * br, -6, Math.sin(ba) * br);
      e.scene.add(bld);
    }

    /* interactive towers — stages sit on their tops (aerial composition) */
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2 * 0.82 - 0.5;
      var rad = 78 + (i % 2) * 26;
      var h = 46 + (i % 3) * 16;
      var px = Math.cos(ang) * rad, pz = Math.sin(ang) * rad;
      var top = new T.Vector3(px, h, pz);
      var node = new T.Group(); node.position.set(px, -6, pz); e.scene.add(node);
      var tower = K.building(17, h, 17, 0x1a2447, 0x53e0ff, 200 + i);
      node.add(tower);
      /* the roof pad = the actual stage surface */
      var pad = new T.Mesh(new T.CylinderGeometry(11, 12, 1.6, 16), K.mat.std(0x24305c, 0.6, 0.4));
      pad.position.y = h + 0.8; pad.castShadow = true; pad.receiveShadow = true; node.add(pad);
      var halo = new T.Mesh(new T.TorusGeometry(10, 0.34, 8, 30), K.mat.glow(0x53e0ff, 0));
      halo.rotation.x = Math.PI / 2; halo.position.y = h + 2.2; node.add(halo);
      var core = new T.Mesh(new T.OctahedronGeometry(3.2), K.mat.glow(0x53e0ff, 0));
      core.position.y = h + 6.5; node.add(core);
      var tlight = new T.PointLight(0x53e0ff, 0, 70); tlight.position.y = h + 6; node.add(tlight);
      var lock = null;
      if (i > 0) {
        lock = K.lockWall(26, 20, 0xff6ba8);
        lock.position.set(px, h + 1, pz); lock.rotation.y = -ang;
        e.scene.add(lock);
        K.setDim(node, true);
      }
      ctx.stages.push({ pos: top, node: node, lock: lock, halo: halo, core: core, light: tlight, ang: ang, h: h });

      /* light bridge to previous tower (appears on unlock) */
      if (i > 0) {
        var prev = ctx.stages[i - 1].pos;
        var mid = prev.clone().lerp(top, 0.5);
        var len = prev.distanceTo(top);
        var br2 = new T.Mesh(new T.BoxGeometry(len, 0.35, 3.4), new T.MeshStandardMaterial({
          color: 0x53e0ff, emissive: 0x53e0ff, emissiveIntensity: 0.8, transparent: true, opacity: 0.5, roughness: 0.3
        }));
        br2.position.copy(mid);
        br2.rotation.y = -Math.atan2(top.z - prev.z, top.x - prev.x);
        br2.rotation.z = Math.asin((top.y - prev.y) / len);
        br2.visible = false; e.scene.add(br2);
        ctx.bridges.push(br2);
      } else ctx.bridges.push(null);
    }

    var pod = K.pod(0xdfe9f6, 0x53e0ff); ctx.pod = pod; e.scene.add(pod);
    pod.position.copy(ctx.stages[0].pos).setY(ctx.stages[0].pos.y + 3);
    var hero = K.child({ robe: 0xeaf2ff, accent: 0x2f6fd0, hatColor: 0xcfe0ff, scale: 0.8 });
    hero.position.copy(ctx.stages[0].pos).setY(ctx.stages[0].pos.y + 1.6);
    e.scene.add(hero); ctx.hero = hero;

    e.updaters.push(function (dt, t) {
      K.animChild(hero, dt, t, false);
      pod.position.y = ctx.stages[0] ? pod.position.y : pod.position.y;
      if (pod.userData.ring) pod.userData.ring.rotation.z += dt * 1.6;
      ctx.stages.forEach(function (s) {
        if (s.core.material.emissiveIntensity > 0) {
          s.core.rotation.y += dt * 0.9;
          s.halo.rotation.z += dt * 0.4;
        }
      });
    });
    W.makeMotes(e, 110, 260, 0x8fd0ff, 0.7);
    e.rig.minDist = 34; e.rig.maxDist = 280;
    return ctx;
  },
  focus: function (ctx, i, e) {
    var s = ctx.stages[i];
    return { target: s.pos.clone().setY(s.pos.y + 5), dist: 82, az: s.ang + Math.PI, pol: 0.3 };
  },
  intro: function (ctx, e, done) {
    /* fly in over the night skyline */
    var s0 = ctx.stages[0];
    e.rig.target.copy(s0.pos).setY(s0.pos.y + 4);
    e.rig.dist = 300; e.rig.pol = 0.85; e.rig.az = -1.9;
    e.camera.position.set(-260, 230, 140);
    e.tweens.val(function (v) { e.rig.dist = v; }, 320, 92, 5.0, Ease.inOut);
    e.tweens.val(function (v) { e.rig.pol = v; }, 0.85, 0.3, 5.0, Ease.inOut);
    e.tweens.val(function (v) { e.rig.az = v; }, -1.9, s0.ang + Math.PI, 5.0, Ease.inOut, done);
  },
  unlock: function (ctx, e, i, done) {
    var s = ctx.stages[i]; if (!s) { if (done) done(); return; }
    W.audio.unlock();
    if (s.lock) { e.fx.ring(s.pos.clone(), 0xff9bc8, 24); K.dissolve(e, s.lock, 0.8); s.lock = null; }
    K.setDim(s.node, false);
    /* tower powers up */
    e.tweens.val(function (v) {
      s.halo.material.emissiveIntensity = v; s.core.material.emissiveIntensity = v; s.light.intensity = v * 1.8;
    }, 0, 1, 1.1, Ease.out);
    e.fx.beam(s.pos.clone().setY(-6), 0x53e0ff, s.h + 30, 1.6);
    /* light bridge extends from the previous tower */
    var br = ctx.bridges[i];
    if (br) {
      br.visible = true; br.scale.set(0.01, 1, 1);
      e.tweens.to(br.scale, { x: 1, y: 1, z: 1 }, 0.9, Ease.out, function () { if (done) done(); });
    } else if (done) setTimeout(done, e.reduced ? 0 : 700);
  },
  travel: function (ctx, e, from, to, done) {
    var a = ctx.stages[from].pos, b = ctx.stages[to].pos;
    var dur = e.reduced ? 0.4 : 3.0;
    W.audio.travel();
    var dir = Math.atan2(b.x - a.x, b.z - a.z);
    e.tweens.val(function (v) { ctx.pod.rotation.y = v; }, ctx.pod.rotation.y, dir, 0.8, Ease.inOut);
    e.tweens.val(function (v) {
      var p = a.clone().lerp(b, v);
      p.y += Math.sin(v * Math.PI) * 16;    /* flight arc between towers */
      ctx.pod.position.copy(p).setY(p.y + 3);
      ctx.hero.position.copy(p).setY(p.y + 1.6);
      ctx.hero.rotation.y = dir;
      e.rig.target.lerp(p.clone().setY(p.y + 4), 0.1);
      e.rig.az = U.lerp(e.rig.az, ctx.stages[to].ang + Math.PI, 0.03);
    }, 0, 1, dur, Ease.inOut, function () {
      ctx.pod.position.copy(b).setY(b.y + 3);
      ctx.hero.position.copy(b).setY(b.y + 1.6);
      if (done) done();
    });
  },
  reward: function (ctx, e, i, done) { spawnReward(e, ctx, ctx.hero.position.clone(), "crystal", 0x53e0ff, done); },
  finale: function (ctx, e, done) {
    W.audio.finale();
    /* the whole skyline ignites */
    ctx.stages.forEach(function (s, i2) {
      e.tweens.val(function (v) { s.light.intensity = v; }, s.light.intensity, 2.4, 1.4, Ease.out);
      setTimeout(function () { if (!e._destroyed) e.fx.ring(s.pos.clone(), 0x53e0ff, 26); }, i2 * 120);
    });
    e.fx.ring(new T.Vector3(0, 40, 0), 0x53e0ff, 120);
    e.tweens.val(function (v) { e.rig.dist = v; }, e.rig.dist, 210, 3.4, Ease.inOut);
    e.tweens.val(function (v) { e.rig.pol = v; }, e.rig.pol, 0.6, 3.4, Ease.inOut);
    e.tweens.to(e.rig.target, { x: 0, y: 50, z: 0 }, 3.4, Ease.inOut, done);
  }
};

/* map semester → world */
W.worldFor = {
  g1s1: "citadel", g1s2: "valley",
  g2s1: "makers",  g2s2: "studio",
  g3s1: "beacon",  g3s2: "planet",
  g4s1: "coastal", g4s2: "datacity"
};

})(window);
/*!
 * waha-adventure · state + bridge
 * State  : نموذج تقدّم المغامرة، مستقل عن تخزين الدروس ولا يكسره.
 * Bridge : محوّلات لكل فصل — تقرأ الدروس، تراقب الإكمال، تفتح الدرس.
 *          المبدأ: نراقب ولا نقود. لا نغيّر شرط النجاح ولا محتوى الدرس.
 */
(function (root) {
"use strict";
var W = root.WAHADV;

/* ============================================================ State */
var State = W.State = (function () {
  var KEY = "waha.adv.v1";
  var mem = {}, usable = true;
  try { root.localStorage.setItem("__adv_probe__", "1"); root.localStorage.removeItem("__adv_probe__"); }
  catch (e) { usable = false; }

  function rawGet() {
    try { if (usable) { var s = root.localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } }
    catch (e) {}
    return mem[KEY] || null;
  }
  function rawSet(o) {
    mem[KEY] = o;
    try { if (usable) root.localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }
  function blank() {
    return { v: 1, mode: null, worlds: {}, settings: { sound: false, quality: "auto" } };
  }
  var data = Object.assign(blank(), rawGet() || {});
  if (!data.worlds) data.worlds = {};
  if (!data.settings) data.settings = { sound: false, quality: "auto" };

  function slot(key) {
    var w = data.worlds[key];
    if (!w) w = data.worlds[key] = { current: 0, unlocked: 1, completed: [], rewards: 0, finished: false, lastAt: null };
    if (!Array.isArray(w.completed)) w.completed = [];
    return w;
  }
  function save() { rawSet(data); }

  return {
    get storageOk() { return usable; },
    get mode() { return data.mode; },
    setMode: function (m) { data.mode = m; save(); },
    get settings() { return data.settings; },
    setSetting: function (k, v) { data.settings[k] = v; save(); },
    world: slot,
    hasProgress: function (key) { var w = slot(key); return w.completed.length > 0 || w.current > 0; },
    /* record a completed stage; returns true if this is new progress */
    complete: function (key, lessonId, index) {
      var w = slot(key);
      if (w.completed.indexOf(lessonId) >= 0) return false;
      w.completed.push(lessonId);
      w.rewards++;
      w.unlocked = Math.max(w.unlocked, index + 2);
      w.lastAt = new Date().toISOString();
      save(); return true;
    },
    setCurrent: function (key, i) { var w = slot(key); w.current = i; save(); },
    setFinished: function (key, v) { var w = slot(key); w.finished = !!v; save(); },
    /* sync adventure unlocks with the platform's own completion truth */
    syncFrom: function (key, lessons, isDone) {
      var w = slot(key), changed = false;
      for (var i = 0; i < lessons.length; i++) {
        if (isDone(lessons[i].id) && w.completed.indexOf(lessons[i].id) < 0) {
          w.completed.push(lessons[i].id); changed = true;
          w.unlocked = Math.max(w.unlocked, i + 2);
        }
      }
      if (changed) { w.rewards = w.completed.length; save(); }
      return w;
    },
    reset: function (key) { delete data.worlds[key]; save(); },
    resetAll: function () { data = blank(); save(); }
  };
})();

/* ============================================================ Bridge
 * Each semester app has its own namespace, lesson model and completion
 * choke-point. An adapter normalises them to one small interface:
 *   lessons() · isDone(id) · open(id) · onComplete(cb) · isBuilt(id)
 * Everything is defensive: a missing piece disables adventure rather than
 * throwing inside a lesson.
 */
var Bridge = W.Bridge = (function () {
  function safe(fn, dflt) { try { return fn(); } catch (e) { return dflt; } }

  /* wrap a store method so we learn about completion without changing it */
  function observe(store, method, onFire, wasDone) {
    if (!store || typeof store[method] !== "function") return false;
    if (store["__adv_" + method]) return true;      /* already wrapped */
    var orig = store[method];
    store["__adv_" + method] = orig;
    store[method] = function (id) {
      var before = wasDone ? safe(function () { return !!wasDone(id); }, false) : false;
      var out = orig.apply(this, arguments);
      var after = wasDone ? safe(function () { return !!wasDone(id); }, true) : true;
      if (!before && after) { try { onFire(id); } catch (e) {} }
      return out;
    };
    return true;
  }

  var adapters = {
    /* ---------------------------------------------------------- g1s1 */
    g1s1: function () {
      var N = root.W; if (!N || !root.WAHAT_CURRICULUM) return null;
      var st = N.store; if (!st) return null;
      return {
        lessons: function () {
          return (root.WAHAT_CURRICULUM.lessons || []).map(function (l) {
            return { id: l.id, title: l.ar || l.id, unit: l.unit };
          });
        },
        isBuilt: function (id) { return safe(function () { return N.lessons.has(id); }, true); },
        isDone: function (id) { return safe(function () { return !!(st.lessonState(id) || {}).completed; }, false); },
        open: function (id) { safe(function () { N.scene.go("lesson", { id: id }); }); },
        onComplete: function (cb) {
          return observe(st, "lessonCompleted", cb, function (id) { return (st.lessonState(id) || {}).completed; });
        }
      };
    },
    /* ------------------------------------------------ g1s2 / g2s2 (WADI) */
    wadi: function () {
      var N = root.WADI; if (!N || !N.store || !N.curriculum) return null;
      var st = N.store;
      return {
        lessons: function () {
          return (N.curriculum.lessons || []).map(function (l) {
            return { id: l.id, title: l.title || l.ar || l.id, unit: l.unit };
          });
        },
        isBuilt: function (id) { return safe(function () { return N.lessons.has(id); }, true); },
        isDone: function (id) { return safe(function () { return !!st.isMastered(id); }, false); },
        open: function (id) { safe(function () { N.scene.go("lesson", { id: id }); }); },
        onComplete: function (cb) {
          return observe(st, "markMastered", cb, function (id) { return st.isMastered(id); });
        }
      };
    },
    /* ---------------------------------------------------------- g2s1 */
    g2s1: function () {
      var N = root.WAHAT2; if (!N || !N.Store || !N.curriculum) return null;
      var st = N.Store;
      return {
        lessons: function () {
          return (N.curriculum.LESSONS || []).map(function (l) {
            return { id: l.id, title: l.title || l.id, unit: l.unit };
          });
        },
        isBuilt: function (id) { return safe(function () { return N.Lessons.has(id); }, true); },
        isDone: function (id) { return safe(function () { return !!st.isMastered(id); }, false); },
        open: function (id) { safe(function () { N.scenes.go("lesson", id); }); },
        onComplete: function (cb) {
          return observe(st, "markMastered", cb, function (id) { return st.isMastered(id); });
        }
      };
    },
    /* ---------------------------------------------------------- g3s1 */
    g3s1: function () {
      var N = root.MNARA; if (!N || !N.store || !N.curriculum) return null;
      var st = N.store;
      return {
        lessons: function () {
          return (N.curriculum.lessons || []).map(function (l) {
            return { id: l.id, title: l.title || l.ar || l.id, unit: l.unit };
          });
        },
        isBuilt: function (id) { return safe(function () { return N.lessons.has ? N.lessons.has(id) : !!N.lessons.def(id); }, true); },
        isDone: function (id) { return safe(function () { return !!st.isMastered(id); }, false); },
        open: function (id) { safe(function () { N.scene.go("lesson", { id: id }); }); },
        onComplete: function (cb) {
          return observe(st, "markMastered", cb, function (id) { return st.isMastered(id); });
        }
      };
    },
    /* ---------------------------------------------------------- g3s2 */
    g3s2: function () {
      var N = root.MNARA; if (!N || !N.s2store || !N.curriculumS2) return null;
      var st = N.s2store;
      return {
        lessons: function () {
          return (N.curriculumS2.lessons || []).map(function (l) {
            return { id: l.id, title: l.title || l.ar || l.id, unit: l.unit };
          });
        },
        isBuilt: function (id) { return safe(function () { return !!N.s2lessons.def(id); }, true); },
        isDone: function (id) { return safe(function () { return !!st.isMastered(id); }, false); },
        open: function (id) { safe(function () { N.scene.go("s2lesson", { id: id }); }); },
        onComplete: function (cb) {
          return observe(st, "markMastered", cb, function (id) { return st.isMastered(id); });
        }
      };
    },
    /* ---------------------------------------------------------- g4s1 */
    g4s1: function () {
      var N = root.G4; if (!N || !N.store || !root.G4_CURRICULUM) return null;
      var st = N.store;
      return {
        lessons: function () {
          return (root.G4_CURRICULUM.lessons || []).map(function (l) {
            return { id: l.id, title: l.title || l.ar || l.id, unit: l.unit };
          });
        },
        isBuilt: function (id) { return safe(function () { return N.lessons.has(id); }, true); },
        isDone: function (id) { return safe(function () { return !!st.isMastered(id); }, false); },
        open: function (id) { safe(function () { N.scene.go("lesson", { id: id }); }); },
        onComplete: function (cb) {
          return observe(st, "markMastered", cb, function (id) { return st.isMastered(id); });
        }
      };
    },
    /* ---------------------------------------------------------- g4s2 */
    g4s2: function () {
      var N = root.G4S2; if (!N || !N.store || !N.curriculum) return null;
      var st = N.store;
      return {
        lessons: function () {
          return (N.curriculum.lessons || []).map(function (l) {
            return { id: l.id, title: l.ar || l.title || l.id, unit: l.unit };
          });
        },
        isBuilt: function () { return true; },
        isDone: function (id) { return safe(function () { return !!(st.lesson(id) || {}).done; }, false); },
        open: function (id) { safe(function () { N.hub.openLesson(id); }); },
        onComplete: function (cb) {
          return observe(st, "finishLesson", cb, function (id) { return (st.lesson(id) || {}).done; });
        }
      };
    }
  };

  var MAP = { g1s1: "g1s1", g1s2: "wadi", g2s1: "g2s1", g2s2: "wadi", g3s1: "g3s1", g3s2: "g3s2", g4s1: "g4s1", g4s2: "g4s2" };

  return {
    /* which semester page are we on? */
    key: function () {
      var k = document.documentElement.getAttribute("data-waha");
      return /^g[1-4]s[1-2]$/.test(k || "") ? k : null;
    },
    /* resolve an adapter, retrying until the host app has booted */
    resolve: function (key, cb, timeoutMs) {
      var name = MAP[key];
      if (!name || !adapters[name]) { cb(null); return; }
      var t0 = Date.now(), limit = timeoutMs || 12000;
      (function attempt() {
        var a = null;
        try { a = adapters[name](); } catch (e) { a = null; }
        if (a && (a.lessons() || []).length) { cb(a); return; }
        if (Date.now() - t0 > limit) { cb(null); return; }
        setTimeout(attempt, 180);
      })();
    }
  };
})();

})(window);
/*!
 * waha-adventure · shell
 * غلاف اللعبة: HUD مدمج · قائمة المراحل · الحلقة الكاملة
 * درس → إكمال حقيقي → عودة للمغامرة → نجاح → مكافأة → فتح → انتقال → مرحلة تالية
 */
(function (root) {
"use strict";
var W = root.WAHADV, T = root.THREE, U = W.util, State = W.State, Bridge = W.Bridge;

var AR = U.arabicNum;

function Adventure(opt) {
  this.o = opt || {};
  this.key = this.o.key;                 /* g1s1 … g4s2 */
  this.world = W.worlds[this.o.worldId];
  this.adapter = this.o.adapter;
  this.mode = this.o.mode || "student";  /* student | teacher */
  this.lessons = [];
  this.state = "boot";
  this.current = 0;
  this.built = false;
  this._pendingComplete = null;
}

Adventure.prototype.mount = function () {
  var self = this;
  var all = this.adapter.lessons() || [];
  /* only lessons the host app can actually open become stages */
  this.lessons = all.filter(function (l) { return self.adapter.isBuilt(l.id) !== false; });
  if (!this.lessons.length) this.lessons = all;
  if (!this.lessons.length) return false;

  /* Adventure progress is deliberately isolated from direct/teacher usage:
     finishing a lesson outside an adventure session must never unlock a stage. */
  var slot = State.world(this.key);
  this.slot = slot;
  this.current = U.clamp(slot.current || this.firstIncomplete(), 0, this.lessons.length - 1);

  this.buildDOM();
  this.engine = new W.Engine(this.canvas);
  if (State.settings.quality && State.settings.quality !== "auto") {
    this.engine.autoQuality = false; this.engine.applyTier(State.settings.quality);
  }
  W.audio.setEnabled(!!State.settings.sound);
  if (this.world.ambientTone) W.audio.setAmbientTone(this.world.ambientTone);

  this.ctx = this.world.build(this.engine, this.lessons.length);
  this.applyProgressToWorld();
  this.engine.play();
  this.built = true;

  /* observe the host app's own completion signal — never drive it */
  this.adapter.onComplete(function (id) { self.onLessonComplete(id); });

  this.renderStages();
  this.state = "intro";
  this.setCinematic(true);
  this.world.intro(this.ctx, this.engine, function () {
    self.setCinematic(false);
    self.state = "idle";
    self.focusCurrent(true);
    self.el.intro.classList.add("adv-hide");
  });
  return true;
};

Adventure.prototype.firstIncomplete = function () {
  var self = this;
  for (var i = 0; i < this.lessons.length; i++) if (!self.isDone(i)) return i;
  return Math.max(0, this.lessons.length - 1);
};
/* "done" for the adventure means: completed INSIDE an adventure session. */
Adventure.prototype.isDone = function (i) {
  var l = this.lessons[i]; if (!l) return false;
  return this.slot.completed.indexOf(l.id) >= 0;
};
/* what the platform itself thinks (shown as a hint only, never unlocks) */
Adventure.prototype.isDoneInPlatform = function (i) {
  var l = this.lessons[i]; if (!l) return false;
  try { return !!this.adapter.isDone(l.id); } catch (e) { return false; }
};
Adventure.prototype.isUnlocked = function (i) {
  if (this.mode === "teacher") return true;      /* teachers are never gated */
  if (i === 0) return true;
  if (this.isDone(i)) return true;
  return i < (this.slot.unlocked || 1);
};

/* reflect saved progress in the 3D world without playing the animations */
Adventure.prototype.applyProgressToWorld = function () {
  var K = W.kit;
  for (var i = 0; i < this.lessons.length; i++) {
    var s = this.ctx.stages[i]; if (!s) continue;
    var open = this.isUnlocked(i);
    if (open && s.lock) {
      if (s.lock.parent) s.lock.parent.remove(s.lock);
      s.lock = null;
      K.setDim(s.node, false);
      if (s.node.position.y < s.pos.y) s.node.position.copy(s.pos);
      if (this.world.id === "citadel" && s.gate) {
        s.gate.userData.doors[0].rotation.y = -1.35;
        s.gate.userData.doors[1].rotation.y = 1.35;
        K.lightLantern(this.engine, s.lantern, 1.7);
      }
      if (this.world.id === "valley" && this.ctx.planks[i]) this.ctx.planks[i].visible = true;
      if (this.world.id === "datacity" && this.ctx.bridges[i]) this.ctx.bridges[i].visible = true;
    }
    if (this.isDone(i) && this.world.onComplete) {
      try { this.world.onComplete(this.ctx, this.engine, i); } catch (e) {}
    }
  }
  /* place the traveller at the current stage */
  var cur = this.ctx.stages[this.current];
  if (cur) {
    if (this.ctx.hero) this.ctx.hero.position.copy(cur.pos).setY(cur.pos.y + (this.world.id === "valley" ? 2.9 : 1.6));
    if (this.ctx.ship) this.ctx.ship.position.copy(cur.pos).add(new T.Vector3(11, 0.4, 5));
    if (this.ctx.pod) this.ctx.pod.position.copy(cur.pos).setY(cur.pos.y + 3);
    if (this.ctx.rover) this.ctx.rover.position.copy(cur.pos);
  }
};

/* ------------------------------------------------------------------ DOM */
Adventure.prototype.buildDOM = function () {
  var self = this, el = this.el = {};
  var host = this.host = U.el("div", "adv-root");
  host.setAttribute("dir", "rtl");
  host.setAttribute("lang", "ar");

  var canvas = this.canvas = document.createElement("canvas");
  canvas.className = "adv-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  /* ---- top bar: world identity + progress ---- */
  var top = U.el("div", "adv-top");
  var badge = U.el("div", "adv-world glass");
  var mark = U.el("span", "adv-mark", "✦");
  var wt = U.el("div", "adv-wt");
  wt.appendChild(U.el("b", null, this.world.name));
  wt.appendChild(U.el("span", null, this.world.tagline));
  badge.appendChild(mark); badge.appendChild(wt);
  top.appendChild(badge);

  var prog = U.el("div", "adv-prog glass");
  el.progLabel = U.el("div", "adv-prog-l", "");
  el.pips = U.el("div", "adv-pips");
  prog.appendChild(el.progLabel); prog.appendChild(el.pips);
  top.appendChild(prog);
  host.appendChild(top);

  /* ---- mode chip (student/teacher) ---- */
  el.modeChip = U.el("button", "adv-chip adv-modechip glass");
  el.modeChip.type = "button";
  el.modeChip.textContent = this.mode === "teacher" ? "👩‍🏫 وضع المعلم" : "🎒 وضع الطالب";
  el.modeChip.title = "تغيير وضع التجربة";
  el.modeChip.addEventListener("click", function () { self.openMenu(); });
  host.appendChild(el.modeChip);

  /* ---- stage list (the only scrollable region) ---- */
  var list = el.list = U.el("aside", "adv-list glass");
  var lh = U.el("div", "adv-list-h");
  lh.appendChild(U.el("span", null, "المراحل"));
  el.listToggle = U.el("button", "adv-listbtn");
  el.listToggle.type = "button"; el.listToggle.textContent = "▾";
  el.listToggle.setAttribute("aria-label", "طيّ قائمة المراحل");
  el.listToggle.addEventListener("click", function () {
    list.classList.toggle("collapsed");
    el.listToggle.textContent = list.classList.contains("collapsed") ? "▴" : "▾";
  });
  lh.appendChild(el.listToggle);
  list.appendChild(lh);
  el.listBody = U.el("div", "adv-list-b");
  list.appendChild(el.listBody);
  host.appendChild(list);

  /* ---- bottom dock: current stage + primary action ---- */
  var dock = U.el("div", "adv-dock");
  el.stageName = U.el("div", "adv-stage glass", "—");
  el.play = U.el("button", "adv-play");
  el.play.type = "button";
  el.play.appendChild(U.el("span", "adv-play-i", "▶"));
  el.play.appendChild(U.el("span", null, "ابدأ الدرس"));
  el.play.addEventListener("click", function () { self.enterCurrent(); });
  dock.appendChild(el.stageName); dock.appendChild(el.play);
  host.appendChild(dock);

  /* ---- tools ---- */
  var tools = U.el("div", "adv-tools");
  el.sound = mkChip(W.audio.enabled ? "🔊" : "🔈", "الصوت", function () {
    var on = !W.audio.enabled; W.audio.setEnabled(on); State.setSetting("sound", on);
    el.sound.firstChild.textContent = on ? "🔊" : "🔈";
  });
  el.perfBtn = mkChip("📊", "الأداء", function () {
    el.perf.classList.toggle("on"); self._perfOn = el.perf.classList.contains("on");
  });
  el.qual = U.el("select", "adv-select");
  [["auto", "جودة: تلقائي"], ["ultra", "فائقة"], ["high", "عالية"], ["medium", "متوسطة"], ["low", "خفيفة"]]
    .forEach(function (p) { var o = document.createElement("option"); o.value = p[0]; o.textContent = p[1]; el.qual.appendChild(o); });
  el.qual.value = State.settings.quality || "auto";
  el.qual.setAttribute("aria-label", "مستوى الجودة");
  el.qual.addEventListener("change", function () {
    var v = el.qual.value; State.setSetting("quality", v);
    if (v === "auto") { self.engine.autoQuality = true; }
    else { self.engine.autoQuality = false; self.engine.applyTier(v); }
  });
  /* مخرج صريح من العالم إلى واحة المغامرة. لوحة العالم تملأ الإطار كلّه،
     فلولا هذا الزرّ لبقي التلميذ داخل العالم بلا طريق عودة ظاهر. */
  el.exit = mkChip("🏛️", "الخروج", function () { self.leaveWorld(); });
  el.exit.classList.add("adv-exitchip");
  el.exit.title = "الخروج إلى واحة المغامرة";
  tools.appendChild(el.exit);
  tools.appendChild(el.sound); tools.appendChild(el.perfBtn); tools.appendChild(el.qual);
  host.appendChild(tools);

  function mkChip(icon, label, fn) {
    var b = U.el("button", "adv-chip glass"); b.type = "button";
    b.appendChild(U.el("span", null, icon));
    b.appendChild(U.el("span", "adv-chip-t", label));
    b.addEventListener("click", fn);
    return b;
  }

  /* ---- perf panel ---- */
  el.perf = U.el("div", "adv-perf");
  host.appendChild(el.perf);

  /* ---- intro title ---- */
  el.intro = U.el("div", "adv-intro");
  var ib = U.el("div", "adv-intro-b");
  ib.appendChild(U.el("div", "adv-intro-e", "واحة التقنية · وضع المغامرة"));
  ib.appendChild(U.el("h1", null, this.world.name));
  ib.appendChild(U.el("p", null, this.world.tagline));
  el.intro.appendChild(ib);
  el.intro.addEventListener("click", function () { self.skipIntro(); });
  host.appendChild(el.intro);

  /* ---- toast ---- */
  el.toast = U.el("div", "adv-toast");
  host.appendChild(el.toast);

  /* ---- success card ---- */
  el.card = U.el("div", "adv-modal");
  host.appendChild(el.card);

  document.body.appendChild(host);

  /* keyboard: P toggles perf, Esc opens menu */
  this._onKey = function (ev) {
    if (ev.key === "p" || ev.key === "P") { el.perf.classList.toggle("on"); self._perfOn = el.perf.classList.contains("on"); }
    if (ev.key === "Escape" && self.state === "idle") self.openMenu();
  };
  root.addEventListener("keydown", this._onKey);

  /* perf readout */
  var acc = 0;
  this.engineFrameHook = function (fps, dt) {
    acc += dt; if (acc < 0.5 || !self._perfOn) return; acc = 0;
    var s = self.engine.stats();
    el.perf.textContent = "";
    var rows = [
      ["FPS", s.fps.toFixed(0), s.fps < 30 ? "bad" : (s.fps < 50 ? "warn" : "ok")],
      ["الإطار", s.ms.toFixed(1) + " ms", ""],
      ["Draw calls", s.calls, ""],
      ["مثلثات", (s.tris / 1000).toFixed(1) + "k", ""],
      ["هندسة/نسيج", s.geo + "/" + s.tex, ""],
      ["ذاكرة JS", s.mem, ""],
      ["DPR", s.dpr.toFixed(2), ""],
      ["الجودة", s.tier + (s.auto ? " (تلقائي)" : ""), ""]
    ];
    var h = U.el("b", null, "الأداء"); el.perf.appendChild(h);
    rows.forEach(function (r) {
      var d = U.el("div", null);
      d.appendChild(U.el("span", "adv-perf-k", r[0] + ": "));
      d.appendChild(U.el("span", r[2] ? "adv-" + r[2] : null, String(r[1])));
      el.perf.appendChild(d);
    });
  };
};

Adventure.prototype.setCinematic = function (on) {
  this.host.classList.toggle("cine", !!on);
  if (this.engine) this.engine.setInputAllowed(!on);
};

Adventure.prototype.skipIntro = function () {
  if (this.state !== "intro") return;
  this.engine.tweens.clear();
  this.setCinematic(false);
  this.state = "idle";
  this.el.intro.classList.add("adv-hide");
  this.focusCurrent(true);
};

/* ---------------------------------------------------------- rendering UI */
/* الطريق خارج العالم: إلى واحة المغامرة التي دخل منها التلميذ.
   يُشتقّ المسار من العنوان الحالي كي يصحّ في أي مجلّد جذر. */
Adventure.prototype.leaveWorld = function () {
  var p = "../../adventure.html";
  try {
    var path = root.location.pathname, i = path.indexOf("/grade");
    if (i >= 0) { p = path.slice(0, i + 1) + "adventure.html"; }
  } catch (e) {}
  try { root.location.href = p; } catch (e) {}
};

Adventure.prototype.renderStages = function () {
  var self = this, el = this.el;
  el.listBody.textContent = "";
  this.lessons.forEach(function (l, i) {
    var done = self.isDone(i), open = self.isUnlocked(i), cur = i === self.current;
    var row = U.el("button", "adv-row" + (done ? " done" : "") + (cur ? " cur" : "") + (!open ? " locked" : ""));
    row.type = "button";
    var ic = U.el("span", "adv-row-i", done ? "✓" : (open ? (cur ? "▶" : "○") : "🔒"));
    var tx = U.el("span", "adv-row-t");
    tx.appendChild(U.el("span", "adv-row-n", AR(i + 1) + ". " + l.title));
    tx.appendChild(U.el("span", "adv-row-s", done ? "مكتمل" : (open ? (cur ? "المرحلة الحالية" : "متاح") : "مغلق")));
    row.appendChild(ic); row.appendChild(tx);
    if (open) row.addEventListener("click", function () { self.goStage(i); });
    else row.setAttribute("aria-disabled", "true");
    el.listBody.appendChild(row);
  });

  var doneCount = this.lessons.filter(function (l, i) { return self.isDone(i); }).length;
  el.progLabel.textContent = AR(doneCount) + " / " + AR(this.lessons.length);
  el.pips.textContent = "";
  var maxPips = 14;
  var step = this.lessons.length > maxPips ? Math.ceil(this.lessons.length / maxPips) : 1;
  for (var i = 0; i < this.lessons.length; i += step) {
    var p = U.el("span", "adv-pip" + (this.isDone(i) ? " done" : (i === this.current ? " cur" : "")));
    el.pips.appendChild(p);
  }
  var l = this.lessons[this.current];
  el.stageName.textContent = l ? ("المرحلة " + AR(this.current + 1) + ": " + l.title) : "—";
  el.play.lastChild.textContent = this.isDone(this.current) ? "أعد الدرس" : "ابدأ الدرس";
};

Adventure.prototype.focusCurrent = function (instant) {
  var f = this.world.focus(this.ctx, this.current, this.engine);
  var e = this.engine;
  if (instant) {
    e.rig.target.copy(f.target); e.rig.dist = f.dist;
    if (f.az != null) e.rig.az = f.az;
    if (f.pol != null) e.rig.pol = f.pol;
  } else {
    e.tweens.to(e.rig.target, { x: f.target.x, y: f.target.y, z: f.target.z }, 1.2, W.ease.inOut);
    e.tweens.val(function (v) { e.rig.dist = v; }, e.rig.dist, f.dist, 1.2, W.ease.inOut);
  }
  e._userNudge = false;
};

Adventure.prototype.toast = function (txt, kind) {
  var el = this.el.toast;
  el.textContent = txt;
  el.className = "adv-toast show" + (kind ? " " + kind : "");
  clearTimeout(this._toastT);
  this._toastT = setTimeout(function () { el.className = "adv-toast"; }, 2600);
};

/* ------------------------------------------------------------- flow */
Adventure.prototype.goStage = function (i) {
  if (this.state !== "idle") return;
  if (!this.isUnlocked(i)) { this.toast("أكمل المرحلة الحالية أولًا 🔒", "warn"); return; }
  if (i === this.current) { this.enterCurrent(); return; }
  var self = this;
  this.state = "travel"; this.setCinematic(true);
  var from = this.current;
  this.world.travel(this.ctx, this.engine, from, i, function () {
    self.current = i;
    if (self.mode === "student") State.setCurrent(self.key, i);
    self.state = "idle"; self.setCinematic(false);
    self.renderStages(); self.focusCurrent(false);
  });
};

/* open the REAL lesson — the platform renders it exactly as before */
Adventure.prototype.enterCurrent = function () {
  if (this.state !== "idle" && this.state !== "intro") return;
  if (this.state === "intro") this.skipIntro();
  var l = this.lessons[this.current]; if (!l) return;
  W.audio.click();
  this._expecting = l.id;
  this.state = "lesson";
  this.hide();                    /* the adventure steps aside entirely */
  this.adapter.open(l.id);
};

/* the host app told us a lesson was genuinely completed */
Adventure.prototype.onLessonComplete = function (id) {
  var idx = -1;
  for (var i = 0; i < this.lessons.length; i++) if (this.lessons[i].id === id) { idx = i; break; }
  if (idx < 0) return;                       /* not one of our stages */
  if (this.state !== "lesson" && this.state !== "hidden") return;
  /* the lesson must be the one this adventure opened, from a valid stage */
  if (this._expecting !== id) return;
  var self = this;
  /* teacher preview must never advance a student's adventure */
  var record = this.mode === "student";
  var isNew = record ? State.complete(this.key, id, idx) : false;
  this.current = idx;
  this.show();
  this.state = "success";
  setTimeout(function () { self.runSuccess(idx, isNew, record); }, 260);
};

Adventure.prototype.runSuccess = function (idx, isNew, record) {
  var self = this, e = this.engine, world = this.world;
  this.setCinematic(true);
  this.renderStages();
  this.focusCurrent(false);

  var lesson = this.lessons[idx];
  this.showCard({
    badge: "أحسنت!",
    title: this.mode === "teacher" ? "تم عرض الدرس" : "أتممت المرحلة",
    body: lesson ? lesson.title : "",
    note: this.mode === "teacher" ? "وضع المعلم: لا يُسجَّل تقدم الطالب." : null
  });

  /* world reacts to the achievement */
  if (world.onComplete) { try { world.onComplete(this.ctx, e, idx); } catch (err) {} }

  world.reward(this.ctx, e, idx, function () {
    self.hideCard();
    var next = idx + 1;
    var allDone = true;
    for (var i = 0; i < self.lessons.length; i++) if (!self.isDone(i)) { allDone = false; break; }
    if (allDone) { self.runFinale(); return; }          /* FINAL WORLD COMPLETION */
    if (next >= self.lessons.length) {
      /* last stage done but earlier ones still open — go back to the first gap */
      var gap = self.firstIncomplete();
      self.state = "idle"; self.setCinematic(false); self.renderStages();
      if (gap !== self.current) self.goStage(gap);
      return;
    }
    /* unlock the next stage, then travel to it */
    if (record) { self.slot = State.world(self.key); }
    world.unlock(self.ctx, e, next, function () {
      self.renderStages();
      world.travel(self.ctx, e, idx, next, function () {
        self.current = next;
        if (record) State.setCurrent(self.key, next);
        self.state = "idle"; self.setCinematic(false);
        self.renderStages(); self.focusCurrent(false);
        self.toast("فُتحت المرحلة التالية ✦", "good");
      });
    });
  });
};

Adventure.prototype.runFinale = function () {
  var self = this;
  this.state = "finale";
  if (this.mode === "student") State.setFinished(this.key, true);
  this.world.finale(this.ctx, this.engine, function () {
    self.showCard({
      badge: "اكتملت الرحلة",
      title: "🏆 أنهيت " + self.world.name,
      body: "أكملت كل مراحل هذا الفصل. تقدّمك في اللعبة جاء من تعلّمك.",
      actions: [{ label: "العودة إلى العالم", primary: true, fn: function () {
        self.hideCard(); self.state = "idle"; self.setCinematic(false); self.focusCurrent(false);
      } }]
    });
  });
};

/* ------------------------------------------------------------- cards */
Adventure.prototype.showCard = function (o) {
  var el = this.el.card;
  el.textContent = "";
  var box = U.el("div", "adv-card");
  if (o.badge) box.appendChild(U.el("div", "adv-card-b", o.badge));
  if (o.title) box.appendChild(U.el("h2", null, o.title));
  if (o.body) box.appendChild(U.el("p", null, o.body));
  if (o.note) box.appendChild(U.el("div", "adv-card-n", o.note));
  if (o.actions) {
    var row = U.el("div", "adv-card-r");
    o.actions.forEach(function (a) {
      var b = U.el("button", "adv-btn" + (a.primary ? " primary" : ""), a.label);
      b.type = "button"; b.addEventListener("click", a.fn);
      row.appendChild(b);
    });
    box.appendChild(row);
  }
  el.appendChild(box);
  el.classList.add("show");
};
Adventure.prototype.hideCard = function () { this.el.card.classList.remove("show"); };

/* ------------------------------------------------------------- menu */
Adventure.prototype.openMenu = function () {
  var self = this;
  var acts = [];
  acts.push({ label: "العودة إلى عالم المغامرة", fn: function () {
    self.hideCard(); root.location.href = self.rootPath() + "adventure.html";
  } });
  acts.push({ label: "العودة إلى واحة التقنية", fn: function () {
    self.hideCard(); root.location.href = self.rootPath() + "home.html";
  } });
  if (this.mode === "student") acts.push({ label: "إعادة المغامرة من البداية", fn: function () {
    self.hideCard();
    State.reset(self.key);
    root.location.reload();
  } });
  acts.push({ label: "متابعة المغامرة", primary: true, fn: function () { self.hideCard(); } });
  this.showCard({
    badge: "القائمة",
    title: this.mode === "teacher" ? "وضع المعلم" : "وضع الطالب",
    body: "المغامرة إطار حول الدروس — المحتوى التعليمي لا يتغيّر.",
    note: this.mode === "student" ? "لتغيير نوع الدخول ارجع إلى بوابة الدخول الرئيسية." : null,
    actions: acts
  });
};

Adventure.prototype.rootPath = function () { return "../../"; };
Adventure.prototype.exitToBasic = function () {
  try { root.sessionStorage.setItem("waha.adv.optout", "1"); } catch (e) {}
  this.destroy();
};

/* ---------------------------------------------------- show / hide / destroy */
Adventure.prototype.hide = function () {
  document.documentElement.classList.remove("adv-world-visible");
  this.host.classList.add("adv-off");
  if (this.engine) this.engine.pause();      /* zero GPU cost while a lesson is open */
  document.documentElement.classList.remove("adv-on");
  this._wasState = this.state;
  this.state = "hidden";
};
Adventure.prototype.show = function () {
  this.host.classList.remove("adv-off");
  document.documentElement.classList.add("adv-on");
  document.documentElement.classList.add("adv-world-visible");
  if (this.engine) { this.engine.resize(); this.engine.play(); }
};
Adventure.prototype.destroy = function () {
  root.removeEventListener("keydown", this._onKey);
  if (this.engine) this.engine.destroy();
  if (this.host && this.host.parentNode) this.host.parentNode.removeChild(this.host);
  document.documentElement.classList.remove("adv-on");
  document.documentElement.classList.remove("adv-world-visible");
  W.active = null;
};

W.Adventure = Adventure;

/* ============================================================ boot helper */
W.launch = function (opts) {
  var key = opts.key, worldId = opts.worldId || (W.worldFor && W.worldFor[key]);
  if (!worldId || !W.worlds[worldId]) return null;
  var adv = new Adventure({ key: key, worldId: worldId, adapter: opts.adapter, mode: opts.mode });
  document.documentElement.classList.add("adv-on");
  document.documentElement.classList.add("adv-world-visible");
  if (!adv.mount()) { adv.destroy(); return null; }
  W.active = adv;
  adv.engine.onFrame = adv.engineFrameHook;
  return adv;
};

})(window);
/*!
 * waha-adventure · boot (semester pages)
 * يقرّر إن كانت المغامرة مطلوبة، ثم يربطها بمحرّك الفصل دون لمس الدروس.
 */
(function (root) {
"use strict";
var W = root.WAHADV;
if (!W || !root.THREE) return;
var U = W.util;

function param(name) {
  try { return new URLSearchParams(root.location.search).get(name); } catch (e) { return null; }
}
function webglOK() {
  try {
    var c = document.createElement("canvas");
    return !!(root.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (e) { return false; }
}

function ready(fn) {
  if (document.readyState === "complete" || document.readyState === "interactive") setTimeout(fn, 0);
  else document.addEventListener("DOMContentLoaded", fn);
}

/* a small floating way back into the world while a lesson is open */
function mountReturnButton(adv) {
  var b = U.el("button", "adv-return", "🎮 العودة إلى المغامرة");
  b.type = "button";
  b.style.cssText = [
    "position:fixed","z-index:2147482000","inset-inline-end:12px",
    "bottom:calc(12px + env(safe-area-inset-bottom,0px))",
    "background:linear-gradient(180deg,#ffe08a,#ffbf4b)","color:#07202e","border:0",
    "font-family:inherit","font-weight:800","font-size:.82rem","padding:11px 16px",
    "border-radius:12px","box-shadow:0 8px 22px rgba(0,0,0,.35)","min-height:44px",
    "cursor:pointer","display:none"
  ].join(";");
  b.addEventListener("click", function () {
    adv.show();
    adv.state = adv._wasState === "hidden" ? "idle" : (adv._wasState || "idle");
    if (adv.state !== "idle") adv.state = "idle";
    adv.setCinematic(false);
    adv.renderStages();
    adv.focusCurrent(false);
    b.style.display = "none";
  });
  document.body.appendChild(b);
  var _hide = adv.hide.bind(adv), _show = adv.show.bind(adv);
  adv.hide = function () { _hide(); b.style.display = "block"; };
  adv.show = function () { _show(); b.style.display = "none"; };
  adv._returnBtn = b;
  return b;
}

/* «متابعة / بدء جديد» — يخص هذا الفصل وحده ولا يمسّ أي فصل أو صف آخر */
function askResume(key, start) {
  var w = W.State.world(key);
  var done = (w.completed || []).length;
  var back = U.el("div", "advres");
  var card = U.el("div", "advres-c");
  card.appendChild(U.el("p", "advres-e", "مغامرة هذا الفصل"));
  card.appendChild(U.el("h2", null, "لديك تقدّم محفوظ"));
  card.appendChild(U.el("p", "advres-s",
    "أكملت " + U.arabicNum(done) + " مرحلة في هذا الفصل. هل تريد المتابعة من حيث توقفت؟"));
  var row = U.el("div", "advres-r");
  var bContinue = U.el("button", "advres-b accent", "▶ متابعة المغامرة");
  bContinue.type = "button";
  bContinue.addEventListener("click", function () { close(); start(false); });
  var bNew = U.el("button", "advres-b", "↻ بدء مغامرة جديدة");
  bNew.type = "button";
  bNew.addEventListener("click", function () {
    bNew.textContent = "تأكيد البدء من جديد؟";
    bNew.className = "advres-b danger";
    bNew.onclick = function () { close(); start(true); };
  });
  row.appendChild(bContinue); row.appendChild(bNew);
  card.appendChild(row);
  card.appendChild(U.el("p", "advres-n", "«بدء جديد» يعيد هذا الفصل فقط — لا يمسّ الفصول أو الصفوف الأخرى."));
  back.appendChild(card);
  document.body.appendChild(back);
  requestAnimationFrame(function () { back.classList.add("show"); });
  setTimeout(function () { bContinue.focus(); }, 60);
  function close() { if (back.parentNode) back.parentNode.removeChild(back); }
}

ready(function () {
  var key = W.Bridge.key();
  if (!key) return;                                   /* not a semester page */

  /* explicit opt-out for this tab (student pressed “exit to basic mode”) */
  try { if (root.sessionStorage.getItem("waha.adv.optout") === "1" && param("adv") !== "1") return; } catch (e) {}

  var want = param("adv");
  var role = param("role");
  if (role === "teacher" || role === "student") W.State.setMode(role);
  var mode = W.State.mode || "student";

  /* The adventure only runs when the adventure entrance asked for it.
     Direct/teacher browsing never turns into an adventure session. */
  if (want !== "1") return;
  if (!webglOK()) return;                             /* silently stay in basic mode */

  W.Bridge.resolve(key, function (adapter) {
    if (!adapter) return;                             /* host app not ready → basic mode */
    var start = function (fresh) {
      if (fresh) W.State.reset(key);
      var adv = W.launch({ key: key, adapter: adapter, mode: mode });
      if (!adv) return;
      mountReturnButton(adv);
    };
    /* teachers never see a save prompt; students resume or restart THIS semester only */
    if (mode === "teacher" || !W.State.hasProgress(key)) { start(false); return; }
    askResume(key, start);
  });
});

})(window);
