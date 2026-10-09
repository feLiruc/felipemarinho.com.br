/* Retrato holográfico: nuvem de pontos 3D (WebGL) a partir de uma grade 128x128 em 4 bits (r-*.bin).
   Sem biblioteca. Pausa fora da tela/aba escondida; com "reduzir movimento" desenha um quadro só.
   Cai para desenho 2D se o navegador não tiver WebGL. */
(function () {
  var c = document.getElementById('h');
  if (!c) return;
  var G = 128, URL = c.getAttribute('data-src'), still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var P, L, N = 0;

  function decode(b) {
    var xs = [], ys = [], ls = [], i, v, x, y, H = { cx: b[0], cy: b[1], rx: b[2], ry: b[3], ty: b[4], ts: b[5] || 30 };
    G = b[6] || 128;
    for (i = 0; i < G * G; i++) {
      v = (i & 1) ? b[7 + (i >> 1)] & 15 : b[7 + (i >> 1)] >> 4;
      if (!v) continue;
      x = i % G; y = (i / G) | 0;
      xs.push(x); ys.push(y); ls.push((v - 1) / 14);
    }
    N = xs.length;
    P = new Float32Array(N * 3); L = new Float32Array(N);
    for (i = 0; i < N; i++) {
      x = xs[i]; y = ys[i];
      var e = Math.pow((x - H.cx) / (H.rx * 1.3), 2) + Math.pow((y - H.cy) / (H.ry * 1.08), 2);
      var head = e < 1 ? Math.sqrt(1 - e) * 0.42 : 0;
      var t = Math.min(1, Math.max(0, (y - H.ty) / H.ts));
      var body = t * Math.sqrt(Math.max(0, 1 - Math.pow((x - G / 2) / (G / 2), 2))) * 0.22;
      P[i * 3] = x / (G - 1) * 2 - 1;
      P[i * 3 + 1] = 1 - y / (G - 1) * 2;
      P[i * 3 + 2] = Math.max(head, body) + (ls[i] - 0.5) * 0.1;
      L[i] = ls[i];
    }
  }

  function size() {
    var d = Math.min(devicePixelRatio || 1, 2), w = Math.round(c.clientWidth * d) || 340;
    if (c.width !== w) { c.width = w; c.height = w; }
  }

  function flat(cx) {   // desenho 2D estático (sem WebGL / sem animação)
    size();
    var w = c.width, s = w / G, i;
    cx.fillStyle = '#000'; cx.fillRect(0, 0, w, w);
    for (i = 0; i < N; i++) {
      var b = 0.25 + 0.75 * L[i];
      cx.fillStyle = 'rgba(0,' + (255 * b | 0) + ',' + (70 * b | 0) + ',.95)';
      cx.beginPath(); cx.arc((P[i * 3] + 1) / 2 * w, (1 - P[i * 3 + 1]) / 2 * w, s * 0.6, 0, 6.3); cx.fill();
    }
  }

  function gl3d() {
    var g = c.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!g) return false;
    function sh(t, s) { var o = g.createShader(t); g.shaderSource(o, s); g.compileShader(o); return o; }
    var pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER,
      'attribute vec3 p;attribute float l;uniform float yw,pt,t,k;varying float b;' +
      'void main(){float cy=cos(yw),sy=sin(yw),cp=cos(pt),sp=sin(pt);vec3 q=p;q.z-=.3;' +
      'q=vec3(cy*q.x+sy*q.z,q.y,-sy*q.x+cy*q.z);q=vec3(q.x,cp*q.y-sp*q.z,sp*q.y+cp*q.z);' +
      'float f=2.8/(2.8-q.z);gl_Position=vec4(q.xy*f*.9,q.z*.3,1.);' +
      'float sw=smoothstep(.07,0.,abs(fract(t*.22)*2.8-1.4-p.y));' +
      'b=.1+.9*pow(l,1.35)+.8*sw;gl_PointSize=k*(.95+.4*f);}'));
    g.attachShader(pr, sh(g.FRAGMENT_SHADER,
      'precision mediump float;varying float b;void main(){float a=smoothstep(.5,.12,length(gl_PointCoord-.5));' +
      'float v=min(b*1.3,1.)*a;gl_FragColor=vec4(.0,v,v*.16,v);}'));
    g.linkProgram(pr); g.useProgram(pr);
    function buf(a, n, name) {
      g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer()); g.bufferData(g.ARRAY_BUFFER, a, g.STATIC_DRAW);
      var loc = g.getAttribLocation(pr, name); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, n, g.FLOAT, false, 0, 0);
    }
    buf(P, 3, 'p'); buf(L, 1, 'l');
    var U = {}; ['yw', 'pt', 't', 'k'].forEach(function (n) { U[n] = g.getUniformLocation(pr, n); });
    g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE); g.clearColor(0, 0, 0, 0);

    var ty = 0, tp = 0, yw = still ? 0.28 : 0, pt = 0, t0 = performance.now(), run = false, vis = true, hid = false;
    addEventListener('pointermove', function (e) { ty = (e.clientX / innerWidth - 0.5) * 1.0; tp = -(e.clientY / innerHeight - 0.5) * 0.45; ptr = 1; });
    var ptr = 0;
    function draw(now) {
      var t = (now - t0) / 1000;
      if (!still) { yw += ((ptr ? ty : Math.sin(t * 0.7) * 0.32) - yw) * 0.08; pt += ((ptr ? tp : Math.sin(t * 0.5) * 0.06) - pt) * 0.08; }
      size(); g.viewport(0, 0, c.width, c.height); g.clear(g.COLOR_BUFFER_BIT);
      g.uniform1f(U.yw, yw); g.uniform1f(U.pt, pt); g.uniform1f(U.t, still ? 0.6 : t); g.uniform1f(U.k, c.width / G * 1.25);
      g.drawArrays(g.POINTS, 0, N);
    }
    function loop(now) { if (vis && !hid) { draw(now); requestAnimationFrame(loop); } else run = false; }
    function go() { if (!run && vis && !hid) { run = true; requestAnimationFrame(loop); } }
    draw(performance.now());
    if (still) { addEventListener('resize', function () { draw(performance.now()); }); return true; }
    document.addEventListener('visibilitychange', function () { hid = document.hidden; go(); });
    if (window.IntersectionObserver) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; go(); }).observe(c);
    go();
    return true;
  }

  fetch(URL).then(function (r) { return r.arrayBuffer(); }).then(function (a) {
    decode(new Uint8Array(a));
    c.classList.add('on');
    if (!gl3d()) flat(c.getContext('2d'));
  }).catch(function () {});
})();
