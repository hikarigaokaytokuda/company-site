(function () {
  var canvas = document.getElementById('skyline-canvas');
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H, buildings, lights;

  function seededRandom(seed) {
    var s = seed;
    return function () {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function buildSkyline() {
    var rand = seededRandom(42);
    buildings = [];
    var x = -20;
    while (x < W + 40) {
      var w = 34 + rand() * 70;
      var h = H * (0.16 + rand() * 0.5);
      buildings.push({ x: x, w: w, h: h });
      x += w + (rand() * 6);
    }
    lights = buildings.map(function (b) {
      var count = Math.floor(2 + Math.random() * 5);
      var pts = [];
      for (var i = 0; i < count; i++) {
        pts.push({
          x: b.x + 6 + Math.random() * (b.w - 12),
          y: (H - b.h) + 10 + Math.random() * (b.h - 20),
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 0.6
        });
      }
      return pts;
    });
  }

  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildSkyline();
  }

  function draw(t) {
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0a1220');
    sky.addColorStop(0.45, '#16223d');
    sky.addColorStop(0.72, '#3a3450');
    sky.addColorStop(1, '#c98a52');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // sun / glow near horizon
    var glow = ctx.createRadialGradient(W * 0.5, H * 0.98, 10, W * 0.5, H * 0.98, H * 0.6);
    glow.addColorStop(0, 'rgba(224,164,72,0.35)');
    glow.addColorStop(1, 'rgba(224,164,72,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    buildings.forEach(function (b, i) {
      ctx.fillStyle = '#0c1424';
      ctx.fillRect(b.x, H - b.h, b.w, b.h);

      lights[i].forEach(function (p) {
        var flicker = reduced ? 0.85 : 0.55 + 0.45 * Math.sin(t * 0.001 * p.speed + p.phase);
        ctx.fillStyle = 'rgba(230,180,110,' + (flicker * 0.9).toFixed(2) + ')';
        ctx.fillRect(p.x, p.y, 3, 4);
      });
    });

    // horizon line
    ctx.strokeStyle = 'rgba(240,222,180,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - 0.5);
    ctx.lineTo(W, H - 0.5);
    ctx.stroke();
  }

  function loop(t) {
    draw(t);
    if (!reduced) requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);
  if (reduced) {
    draw(0);
  } else {
    requestAnimationFrame(loop);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
})();
