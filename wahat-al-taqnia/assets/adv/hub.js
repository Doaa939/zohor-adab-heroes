/*!
 * PACKAGE B · واحة التقنية — العالم الواحد
 * الواجهة الرئيسية نفسها عالم ثلاثي الأبعاد قابل للاستكشاف.
 * لا لوحة تحكم · لا شبكة بطاقات · لا صفحة ويب تقليدية.
 *
 * البنية: واحة مركزية يجري فيها فَلَج، وحولها أربع منارات = الصفوف.
 * تختار طالبًا أو معلمًا، ثم تطير إلى منارة الصف، فتنكشف بوابتا الفصلين،
 * ومن البوابة تدخل عالم المغامرة الخاص بذلك الفصل.
 */
(function (root) {
"use strict";
var W = root.WAHADV, T = root.THREE;
if (!W || !T) return;
var U = W.util, K = W.kit, Ease = W.ease;

var GRADES = [
  { n: 1, ar: "الصف الأول",  color: 0xffb45b, worlds: ["citadel", "valley"] },
  { n: 2, ar: "الصف الثاني", color: 0x4fd8c0, worlds: ["makers", "studio"] },
  { n: 3, ar: "الصف الثالث", color: 0x7fb0ff, worlds: ["beacon", "planet"] },
  { n: 4, ar: "الصف الرابع", color: 0xc79bff, worlds: ["coastal", "datacity"] }
];
var SEM = ["الفصل الدراسي الأول", "الفصل الدراسي الثاني"];

function role() { try { return root.localStorage.getItem("waha.adv.role"); } catch (e) { return null; } }
function setRole(r) {
  try {
    root.localStorage.setItem("waha.adv.role", r);
    var raw = root.localStorage.getItem("waha.adv.v1"), o = raw ? JSON.parse(raw) : {};
    o.mode = r; if (!o.v) o.v = 1; if (!o.worlds) o.worlds = {};
    root.localStorage.setItem("waha.adv.v1", JSON.stringify(o));
  } catch (e) {}
}
/* Semester pages run behind the platform's storage shim, which prefixes every
   key with "waha:gNsM:". From the hub (unshimmed) the real key therefore is
   "waha:g2s2:waha.adv.v1". We read that first and fall back to the plain key. */
function progressOf(key) {
  var names = ["waha:" + key + ":waha.adv.v1", "waha.adv.v1"];
  for (var i = 0; i < names.length; i++) {
    try {
      var raw = root.localStorage.getItem(names[i]);
      if (!raw) continue;
      var o = JSON.parse(raw);
      var w = o && o.worlds && o.worlds[key];
      if (w) return w;
    } catch (e) {}
  }
  return null;
}

var Hub = { state: "boot", grade: null };

Hub.init = function () {
  var canvas = document.getElementById("hubCanvas");
  var e = this.e = new W.Engine(canvas);
  e.rig.minDist = 40; e.rig.maxDist = 340;

  /* ---------------- world: a night oasis under a wide sky ---------------- */
  W.makeSky(e, 0x03081a, 0x1b2444, new T.Vector3(-0.45, 0.18, 0.5).normalize(), 0xff9a4a);
  e.scene.fog = new T.Fog(0x14203a, 170, 640);
  W.makeStars(e, 900, 640);
  W.standardLights(e, {
    skyColor: 0x2a4a8a, groundColor: 0x120e06, hemi: 0.3,
    sunColor: 0xffb066, sunIntensity: 0.72, fillColor: 0x4a6ab0, fill: 0.14, shadowSpan: 190,
    dir: new T.Vector3(-0.45, 0.32, 0.5).normalize()
  });

  /* sand plateau */
  var ground = new T.Mesh(new T.CylinderGeometry(250, 280, 14, 56), K.mat.std(0x5c4527, 1));
  ground.position.y = -7; ground.receiveShadow = true; e.scene.add(ground);

  /* the falaj: a ring of water threading the oasis */
  var ringWater = new T.Mesh(new T.TorusGeometry(96, 3.4, 10, 90),
    new T.MeshStandardMaterial({ color: 0x2fa8c8, emissive: 0x1f9ec4, emissiveIntensity: 0.55, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9 }));
  ringWater.rotation.x = Math.PI / 2; ringWater.position.y = 0.4; e.scene.add(ringWater);
  this.ringWater = ringWater;

  /* central palm cluster + a still pool */
  var pool = new T.Mesh(new T.CircleGeometry(26, 40),
    new T.MeshStandardMaterial({ color: 0x0e4f6b, emissive: 0x0a3f57, emissiveIntensity: 0.4, roughness: 0.06, metalness: 0.35, transparent: true, opacity: 0.92 }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.15; e.scene.add(pool);
  for (var p = 0; p < 7; p++) {
    var a = (p / 7) * Math.PI * 2, r = 30 + (p % 3) * 5;
    var pm = K.palm(1.05 + (p % 3) * 0.15);
    pm.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    pm.rotation.y = a; e.scene.add(pm);
  }

  /* ---------------- four grade beacons around the oasis ---------------- */
  this.monuments = [];
  var self = this;
  GRADES.forEach(function (g, i) {
    var ang = -Math.PI / 2 + (i / GRADES.length) * Math.PI * 2;
    var rad = 132;
    var pos = new T.Vector3(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
    var node = new T.Group(); node.position.copy(pos); node.rotation.y = -ang; e.scene.add(node);

    /* a stepped tower with a floating crystal — one per grade, each tinted */
    var base = new T.Mesh(new T.CylinderGeometry(15, 18, 5, 8), K.mat.std(0x7a6340, 0.95));
    base.position.y = 2.5; base.castShadow = true; base.receiveShadow = true; node.add(base);
    var shaft = K.tower(9, 26 + i * 3, 0x8d7550);
    shaft.position.y = 5; node.add(shaft);
    var crystal = new T.Mesh(new T.OctahedronGeometry(6.4),
      new T.MeshStandardMaterial({ color: g.color, emissive: g.color, emissiveIntensity: 0.72, roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.96 }));
    crystal.position.y = 5 + 26 + i * 3 + 9; node.add(crystal);
    var light = new T.PointLight(g.color, 2.6, 165); light.position.copy(crystal.position); node.add(light);
    /* light beam marking the grade from far away */
    var beam = new T.Mesh(new T.CylinderGeometry(1.5, 3.2, 90, 12, 1, true),
      new T.MeshBasicMaterial({ color: g.color, transparent: true, opacity: 0.2, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
    beam.position.y = crystal.position.y + 40; node.add(beam);

    /* the two semester portals — hidden until the grade is chosen */
    var portals = [];
    for (var s = 0; s < 2; s++) {
      var pnode = new T.Group();
      var px = (s === 0 ? -20 : 20);
      pnode.position.set(px, 0, 26);
      var arch = K.gate(15, 14, 0x9a8158);
      pnode.add(arch);
      arch.userData.doors[0].rotation.y = -1.2;
      arch.userData.doors[1].rotation.y = 1.2;
      var veil = new T.Mesh(new T.PlaneGeometry(12, 12),
        new T.MeshBasicMaterial({ color: g.color, transparent: true, opacity: 0.34, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
      veil.position.set(0, 7, 0); pnode.add(veil);
      pnode.visible = false; pnode.scale.setScalar(0.01);
      node.add(pnode);
      portals.push({ node: pnode, veil: veil, sem: s + 1 });
    }
    self.monuments.push({ g: g, node: node, crystal: crystal, light: light, pos: pos, ang: ang, portals: portals, beam: beam });
  });

  W.makeMotes(e, 220, 320, 0xffd9a0, 0.9);

  /* gentle life: crystals spin, falaj shimmers */
  e.updaters.push(function (dt, t) {
    self.monuments.forEach(function (m, i) {
      m.crystal.rotation.y += dt * (0.35 + i * 0.04);
      m.crystal.position.y += Math.sin(t * 1.1 + i) * dt * 1.4;
      m.light.intensity = 2.4 + Math.sin(t * 1.6 + i) * 0.5;
    });
    ringWater.material.emissiveIntensity = 0.5 + Math.sin(t * 1.2) * 0.14;
  });

  /* opening camera move: a slow descent into the oasis */
  e.rig.target.set(0, 12, 0);
  e.rig.dist = 330; e.rig.pol = 0.92; e.rig.az = -0.7;
  e.camera.position.set(-250, 300, 240);
  e.tweens.val(function (v) { e.rig.dist = v; }, 340, 178, 6, Ease.inOut);
  e.tweens.val(function (v) { e.rig.pol = v; }, 0.92, 0.24, 6, Ease.inOut);
  e.tweens.val(function (v) { e.rig.az = v; }, -0.7, 0.25, 6, Ease.inOut, function () { self.endIntro(); });
  e.play();

  /* raycast picking for the monuments and portals */
  this.ray = new T.Raycaster();
  this.pointer = new T.Vector2();
  canvas.addEventListener("pointerdown", function (ev) { self._downAt = { x: ev.clientX, y: ev.clientY }; });
  canvas.addEventListener("pointerup", function (ev) {
    if (!self._downAt) return;
    var moved = Math.hypot(ev.clientX - self._downAt.x, ev.clientY - self._downAt.y);
    self._downAt = null;
    if (moved > 8) return;                       /* that was an orbit drag */
    if (self.state === "boot") { self.endIntro(); return; }
    self.pick(ev);
  });

  this.buildUI();
  if (!role()) this.askRole(); else this.setRoleUI(role());
};

/* End the opening camera move immediately (any interaction, or when it ends).
   On a slow device the intro would otherwise swallow the first taps. */
Hub.endIntro = function () {
  if (this.state !== "boot") return;
  var e = this.e;
  e.tweens.clear();
  e.rig.dist = 178; e.rig.pol = 0.24; e.rig.az = 0.25;
  e.rig.target.set(0, 12, 0);
  this.state = "oasis";
};

/* ------------------------------------------------------------ picking */
Hub.pick = function (ev) {
  var rect = this.e.canvas.getBoundingClientRect();
  this.pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  this.pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  this.ray.setFromCamera(this.pointer, this.e.camera);
  var hits = this.ray.intersectObjects(this.e.scene.children, true);
  if (!hits.length) return;
  var obj = hits[0].object, m = null, portal = null;
  /* walk up to find which monument/portal was hit */
  for (var o = obj; o; o = o.parent) {
    for (var i = 0; i < this.monuments.length; i++) {
      var mm = this.monuments[i];
      for (var pI = 0; pI < mm.portals.length; pI++) if (mm.portals[pI].node === o && o.visible) { portal = mm.portals[pI]; m = mm; }
      if (mm.node === o) { if (!m) m = mm; }
    }
    if (portal) break;
  }
  if (portal && this.state === "grade") { this.enterPortal(this.grade, portal.sem); return; }
  if (m && this.state === "oasis") this.focusGrade(m);
};

/* ------------------------------------------------------------ flow */
Hub.focusGrade = function (m) {
  var self = this, e = this.e;
  this.state = "grade"; this.grade = m;
  W.audio.click();
  document.body.classList.add("hub-grade");
  this.el.gradeName.textContent = m.g.ar;
  this.el.backBtn.style.display = "inline-flex";

  /* reveal the two portals */
  m.portals.forEach(function (p, i) {
    p.node.visible = true;
    e.tweens.val(function (v) { p.node.scale.setScalar(v); }, 0.01, 1, 0.8, Ease.outBack);
    e.fx.ring(m.pos.clone().add(new T.Vector3(0, 1, 0)), m.g.color, 22);
  });
  W.audio.unlock();

  /* camera flies to the monument */
  var look = m.pos.clone().setY(12);
  e.tweens.to(e.rig.target, { x: look.x, y: look.y, z: look.z }, 1.9, Ease.inOut);
  e.tweens.val(function (v) { e.rig.dist = v; }, e.rig.dist, 86, 1.9, Ease.inOut);
  e.tweens.val(function (v) { e.rig.pol = v; }, e.rig.pol, 0.3, 1.9, Ease.inOut);
  e.tweens.val(function (v) { e.rig.az = v; }, e.rig.az, m.ang + Math.PI, 1.9, Ease.inOut);

  this.renderSemesters(m);
};

Hub.backToOasis = function () {
  var self = this, e = this.e;
  if (this.state !== "grade") return;
  this.state = "oasis";
  document.body.classList.remove("hub-grade");
  this.el.backBtn.style.display = "none";
  if (this.grade) this.grade.portals.forEach(function (p) {
    e.tweens.val(function (v) { p.node.scale.setScalar(v); }, 1, 0.01, 0.5, Ease.out, function () { p.node.visible = false; });
  });
  this.grade = null;
  e.tweens.to(e.rig.target, { x: 0, y: 12, z: 0 }, 1.7, Ease.inOut);
  e.tweens.val(function (v) { e.rig.dist = v; }, e.rig.dist, 178, 1.7, Ease.inOut);
  e.tweens.val(function (v) { e.rig.pol = v; }, e.rig.pol, 0.24, 1.7, Ease.inOut);
};

Hub.enterPortal = function (m, sem) {
  var self = this, e = this.e;
  if (this.state === "enter") return;
  this.state = "enter";
  W.audio.reward();
  var p = m.portals[sem - 1];
  e.fx.beam(m.pos.clone().add(new T.Vector3(sem === 1 ? -20 : 20, 0, 26)), m.g.color, 90, 2);
  e.fx.ring(m.pos.clone().setY(2), m.g.color, 44);
  /* dive through the portal, then hand over to the semester world */
  var target = m.pos.clone().add(new T.Vector3(sem === 1 ? -20 : 20, 7, 26));
  e.tweens.to(e.rig.target, { x: target.x, y: target.y, z: target.z }, 1.5, Ease.inOut);
  e.tweens.val(function (v) { e.rig.dist = v; }, e.rig.dist, 12, 1.5, Ease.inOut);
  this.el.flash.classList.add("on");
  setTimeout(function () {
    var r = role() || "student";
    root.location.href = "grade" + m.g.n + "/semester" + sem + "/index.html?adv=1&role=" + r;
  }, 1250);
};

/* ------------------------------------------------------------ UI layer */
Hub.buildUI = function () {
  var self = this, el = this.el = {};
  el.root = document.getElementById("hubUI");

  el.title = document.getElementById("hubTitle");
  el.gradeName = document.getElementById("hubGradeName");
  el.semWrap = document.getElementById("hubSemesters");
  el.flash = document.getElementById("hubFlash");

  el.backBtn = document.getElementById("hubBack");
  el.backBtn.addEventListener("click", function () { self.backToOasis(); });

  el.roleChip = document.getElementById("hubRole");
  el.roleChip.addEventListener("click", function () { self.askRole(true); });

  /* «عن واحة التقنية» — تفاصيل المشروع دون تحويل العالم إلى صفحة نصوص */
  el.about = document.getElementById("hubAboutPanel");
  var openAbout = document.getElementById("hubAbout");
  if (openAbout && el.about) {
    var closeAbout = function () { el.about.hidden = true; openAbout.focus(); };
    openAbout.addEventListener("click", function () {
      el.about.hidden = false;
      var x = el.about.querySelector(".ab-x"); if (x) x.focus();
    });
    var xb = el.about.querySelector(".ab-x");
    if (xb) xb.addEventListener("click", closeAbout);
    el.about.addEventListener("click", function (ev) { if (ev.target === el.about) closeAbout(); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !el.about.hidden) closeAbout(); });
  }

  el.soundBtn = document.getElementById("hubSound");
  el.soundBtn.addEventListener("click", function () {
    var on = !W.audio.enabled; W.audio.setEnabled(on);
    el.soundBtn.textContent = on ? "🔊" : "🔈";
    try { var raw = root.localStorage.getItem("waha.adv.v1"), o = raw ? JSON.parse(raw) : { v: 1, worlds: {} };
      o.settings = o.settings || {}; o.settings.sound = on; root.localStorage.setItem("waha.adv.v1", JSON.stringify(o)); } catch (e) {}
  });

  /* grade shortcuts, for keyboard/screen-reader users and impatient children */
  el.quick = document.getElementById("hubQuick");
  GRADES.forEach(function (g, i) {
    var b = U.el("button", "hub-quick-b", g.ar);
    b.type = "button";
    b.style.setProperty("--c", "#" + new T.Color(g.color).getHexString());
    b.addEventListener("click", function () {
      if (self.state === "boot") self.endIntro();
      var wasGrade = self.state === "grade";
      if (wasGrade) self.backToOasis();
      setTimeout(function () {
        if (self.state === "enter") return;
        self.focusGrade(self.monuments[i]);
      }, wasGrade ? 700 : 0);
    });
    el.quick.appendChild(b);
  });
};

Hub.renderSemesters = function (m) {
  var self = this, wrap = this.el.semWrap;
  wrap.textContent = "";
  for (var s = 1; s <= 2; s++) {
    (function (sem) {
      var key = "g" + m.g.n + "s" + sem;
      var pr = progressOf(key);
      var card = U.el("button", "hub-sem");
      card.type = "button";
      card.style.setProperty("--c", "#" + new T.Color(m.g.color).getHexString());
      var wid = m.g.worlds[sem - 1];
      var world = W.worlds[wid];
      card.appendChild(U.el("span", "hub-sem-k", SEM[sem - 1]));
      card.appendChild(U.el("span", "hub-sem-w", world ? world.name : ""));
      card.appendChild(U.el("span", "hub-sem-t", world ? world.tagline : ""));
      var st = U.el("span", "hub-sem-s");
      if (pr && pr.completed && pr.completed.length) {
        st.textContent = "متابعة · " + U.arabicNum(pr.completed.length) + " مرحلة مكتملة";
        st.className = "hub-sem-s on";
      } else st.textContent = "ابدأ الرحلة";
      card.appendChild(st);
      card.addEventListener("click", function () { self.enterPortal(m, sem); });
      wrap.appendChild(card);
    })(s);
  }
};

/* ------------------------------------------------------------ role gate */
Hub.setRoleUI = function (r) {
  this.el.roleChip.textContent = r === "teacher" ? "👩‍🏫 معلم" : "🎒 طالب";
};
Hub.askRole = function (dismissible) {
  var self = this;
  var back = U.el("div", "hub-gate");
  var card = U.el("div", "hub-gate-c");
  card.appendChild(U.el("p", "hub-gate-e", "واحة التقنية"));
  card.appendChild(U.el("h2", null, "من يدخل الواحة الآن؟"));
  card.appendChild(U.el("p", "hub-gate-s", "لكل مستخدم رحلة مختلفة — يمكنك تغييرها في أي وقت."));
  var row = U.el("div", "hub-gate-r");
  [
    { k: "student", ic: "🎒", t: "دخول الطالب", s: "مغامرة متسلسلة: كل درسٍ يفتح المرحلة التالية", a: true },
    { k: "teacher", ic: "👩‍🏫", t: "دخول المعلم", s: "وصول حر ومباشر إلى كل الفصول والدروس", a: false }
  ].forEach(function (c) {
    var b = U.el("button", "hub-gate-b" + (c.a ? " accent" : ""));
    b.type = "button";
    b.appendChild(U.el("span", "hub-gate-i", c.ic));
    b.appendChild(U.el("span", "hub-gate-t", c.t));
    b.appendChild(U.el("span", "hub-gate-d", c.s));
    b.addEventListener("click", function () {
      setRole(c.k); self.setRoleUI(c.k);
      back.classList.remove("show");
      setTimeout(function () { if (back.parentNode) back.parentNode.removeChild(back); }, 300);
      W.audio.click();
    });
    row.appendChild(b);
  });
  card.appendChild(row);
  card.appendChild(U.el("p", "hub-gate-n", "بلا حسابات وبلا بيانات شخصية — الاختيار محفوظ على هذا الجهاز فقط."));
  if (dismissible) {
    var x = U.el("button", "hub-gate-x", "✕"); x.type = "button";
    x.addEventListener("click", function () {
      back.classList.remove("show");
      setTimeout(function () { if (back.parentNode) back.parentNode.removeChild(back); }, 300);
    });
    card.appendChild(x);
  }
  back.appendChild(card);
  document.body.appendChild(back);
  requestAnimationFrame(function () { back.classList.add("show"); });
  setTimeout(function () { var f = card.querySelector("button"); if (f) f.focus(); }, 80);
};

/* ------------------------------------------------------------ boot */
function start() {
  var canvas = document.getElementById("hubCanvas");
  if (!canvas) return;
  var ok = (function () {
    try { var c = document.createElement("canvas"); return !!(root.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); }
    catch (e) { return false; }
  })();
  var boot = document.getElementById("hubBoot");
  if (!ok) {
    /* No WebGL: never a black screen. Fall back to a clear, complete list that
       still reaches every class, plus the way back to واحة التقنية. */
    document.body.classList.add("hub-nogl");
    if (boot) {
      boot.textContent = "";
      var box = U.el("div", "nogl-box");
      box.appendChild(U.el("p", "nogl-t", "لا يدعم هذا المتصفح العرض ثلاثي الأبعاد"));
      box.appendChild(U.el("p", "nogl-s", "يمكنك متابعة الدروس كاملةً من واحة التقنية، أو اختيار صفك مباشرةً من هنا."));
      var list = U.el("div", "nogl-grid");
      GRADES.forEach(function (g) {
        for (var sem = 1; sem <= 2; sem++) {
          (function (semester) {
            var a = U.el("a", "nogl-b");
            a.href = "grade" + g.n + "/semester" + semester + "/index.html?adv=0";
            a.appendChild(U.el("b", null, g.ar));
            a.appendChild(U.el("span", null, SEM[semester - 1]));
            list.appendChild(a);
          })(sem);
        }
      });
      box.appendChild(list);
      var home = U.el("a", "nogl-home", "🏛️ العودة إلى واحة التقنية");
      home.href = "home.html";
      box.appendChild(home);
      boot.appendChild(box);
    }
    return;
  }
  try { W.audio.setEnabled(false); } catch (e) {}
  Hub.init();
  if (boot) boot.style.display = "none";
  document.body.classList.add("hub-ready");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();

root.WAHAHUB = Hub;
})(window);
