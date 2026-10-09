/* Retrato holográfico em CARACTERES MATRIX: a grade do retrato (r-*.bin, 4 bits por célula) vira S x S caracteres
   (katakana, números e símbolos). Células claras usam caracteres "cheios", escuras usam caracteres leves, e os caracteres
   trocam sozinhos (chuva digital). Nuvem 3D em WebGL com um atlas de glifos gerado na hora com as fontes do sistema.
   Sem biblioteca. Pausa fora da tela/aba escondida; "reduzir movimento" desenha um quadro só; sem WebGL cai para 2D. */
(function () {
  var c = document.getElementById('h');
  if (!c) return;
  var S = 48,          // caracteres por lado (menor = caracteres maiores)
      NIV = 9,         // níveis de brilho
      URL = c.getAttribute('data-src'), still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var P, L, R, N = 0, GL = [], FONT = '"MS Gothic","Yu Gothic","Hiragino Kaku Gothic ProN","Noto Sans Mono CJK JP","Noto Sans JP",monospace';
  var CH = '0123456789ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ:.=*+-<>|"';

  // glifos ordenados do mais leve ao mais "cheio" (conta a tinta de cada um): brilho do pixel escolhe a posição
  function glifos() {
    var t = document.createElement('canvas'), x = t.getContext('2d'), out = [], i, d, n, k;
    t.width = t.height = 32; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = 'bold 30px ' + FONT;
    for (i = 0; i < CH.length; i++) {
      x.clearRect(0, 0, 32, 32); x.fillStyle = '#fff'; x.fillText(CH[i], 16, 17);
      d = x.getImageData(0, 0, 32, 32).data; n = 0;
      for (k = 3; k < d.length; k += 4) n += d[k];
      if (n > 0) out.push({ ch: CH[i], n: n });
    }
    out.sort(function (a, b) { return a.n - b.n; });
    return out;
  }

  function decode(b) {
    var H = { cx: b[0], cy: b[1], rx: b[2], ry: b[3], ty: b[4], ts: b[5] || 30 }, G = b[6] || 128, k = S / G;
    var sum = new Float32Array(S * S), cnt = new Uint16Array(S * S), i, v, x, y, j;
    for (i = 0; i < G * G; i++) {
      v = (i & 1) ? b[7 + (i >> 1)] & 15 : b[7 + (i >> 1)] >> 4;
      if (!v) continue;
      j = ((i / G | 0) * k | 0) * S + ((i % G) * k | 0);
      sum[j] += (v - 1) / 14; cnt[j]++;
    }
    var min = 0.5 / (k * k), pts = [];
    for (j = 0; j < S * S; j++) if (cnt[j] >= min) pts.push(j);
    N = pts.length;
    P = new Float32Array(N * 3); L = new Float32Array(N); R = new Float32Array(N);
    var hcx = H.cx * k, hcy = H.cy * k, hrx = H.rx * k * 1.3, hry = H.ry * k * 1.08, ty = H.ty * k, ts = H.ts * k;
    for (i = 0; i < N; i++) {
      j = pts[i]; x = j % S; y = (j / S) | 0;
      var l = Math.round(sum[j] / cnt[j] * NIV) / NIV;
      var e = Math.pow((x - hcx) / hrx, 2) + Math.pow((y - hcy) / hry, 2);
      var head = e < 1 ? Math.sqrt(1 - e) * 0.2 : 0;
      var t = Math.min(1, Math.max(0, (y - ty) / ts));
      var body = t * Math.sqrt(Math.max(0, 1 - Math.pow((x - S / 2) / (S / 2), 2))) * 0.11;
      P[i * 3] = x / (S - 1) * 2 - 1;
      P[i * 3 + 1] = 1 - y / (S - 1) * 2;
      P[i * 3 + 2] = Math.max(head, body) + (l - 0.5) * 0.07;
      L[i] = l; R[i] = Math.random();
    }
  }

  function size() {
    var d = Math.min(devicePixelRatio || 1, 2), w = Math.round(c.clientWidth * d) || 340;
    if (c.width !== w) { c.width = w; c.height = w; }
  }

  function flat(cx) {   // desenho 2D estático (sem WebGL / sem animação)
    size();
    var w = c.width, s = w / S, i, n = GL.length;
    cx.fillStyle = '#000'; cx.fillRect(0, 0, w, w);
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.font = 'bold ' + (s * 1.05 | 0) + 'px ' + FONT;
    for (i = 0; i < N; i++) {
      var b = 0.25 + 0.75 * L[i];
      cx.fillStyle = 'rgb(0,' + (255 * b | 0) + ',' + (60 * b | 0) + ')';
      cx.fillText(GL[Math.min(n - 1, Math.round(L[i] * (n - 1) + (R[i] - 0.5) * 4) | 0)].ch, (P[i * 3] + 1) / 2 * w * 0.86 + w * 0.07, (1 - P[i * 3 + 1]) / 2 * w * 0.86 + w * 0.07 - w * 0.05);
    }
  }

  function gl3d() {
    var g = c.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!g) return false;
    var n = GL.length, COLS = 10, ROWS = Math.ceil(n / COLS), CELL = 32;
    // atlas: um glifo por célula, branco sobre transparente
    var at = document.createElement('canvas'), ax = at.getContext('2d'), i;
    at.width = COLS * CELL; at.height = ROWS * CELL;
    ax.textAlign = 'center'; ax.textBaseline = 'middle'; ax.font = 'bold 30px ' + FONT; ax.fillStyle = '#fff';
    for (i = 0; i < n; i++) ax.fillText(GL[i].ch, (i % COLS) * CELL + 16, ((i / COLS) | 0) * CELL + 17);
    var tex = g.createTexture();
    g.bindTexture(g.TEXTURE_2D, tex);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, at);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);

    function sh(t, s) { var o = g.createShader(t); g.shaderSource(o, s); g.compileShader(o); return o; }
    var pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER,
      'attribute vec3 p;attribute float l;attribute float r;uniform float yw,pt,t,k,n;varying float b;varying vec2 gc;varying float sw;' +
      'void main(){float cy=cos(yw),sy=sin(yw),cp=cos(pt),sp=sin(pt);vec3 q=p;q.z-=.3;' +
      'q=vec3(cy*q.x+sy*q.z,q.y,-sy*q.x+cy*q.z);q=vec3(q.x,cp*q.y-sp*q.z,sp*q.y+cp*q.z);' +
      'float f=2.8/(2.8-q.z);gl_Position=vec4(q.xy*f*.86+vec2(.0,.1),-q.z*.3,1.);' +
      'sw=smoothstep(.07,0.,abs(fract(t*.22)*2.8-1.4-p.y));' +
      // caractere: posição na escala "leve -> cheio" pelo brilho, com troca aleatória a cada ~0,3 s (chuva digital)
      'float h=fract(sin(dot(vec2(r*91.7,floor(t*3.+r*5.)),vec2(12.9898,78.233)))*43758.5453);' +
      'float gi=floor(clamp(pow(l,1.3)*(n-1.)+(h-.5)*5.,0.,n-1.)+.5);' +
      'gc=vec2(mod(gi,10.),floor(gi/10.));' +
      'b=.08+.92*pow(l,1.25)+.6*sw;gl_PointSize=k*f;}'));
    g.attachShader(pr, sh(g.FRAGMENT_SHADER,
      'precision mediump float;varying float b;varying vec2 gc;varying float sw;uniform float n;uniform vec2 gs;uniform sampler2D tx;' +
      'void main(){float a=texture2D(tx,(gc+gl_PointCoord)/gs).a;' +
      'float v=max(min(b*1.55,1.)*a,b*.14);vec3 col=mix(vec3(.0,1.,.2),vec3(.8,1.,.85),sw*.8);gl_FragColor=vec4(col*v,v);}'));
    g.linkProgram(pr); g.useProgram(pr);
    function buf(a, m, name) {
      g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer()); g.bufferData(g.ARRAY_BUFFER, a, g.STATIC_DRAW);
      var loc = g.getAttribLocation(pr, name); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, m, g.FLOAT, false, 0, 0);
    }
    buf(P, 3, 'p'); buf(L, 1, 'l'); buf(R, 1, 'r');
    var U = {}; ['yw', 'pt', 't', 'k', 'n', 'gs', 'tx'].forEach(function (m) { U[m] = g.getUniformLocation(pr, m); });
    g.uniform1f(U.n, n); g.uniform2f(U.gs, COLS, ROWS); g.uniform1i(U.tx, 0);
    g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE); g.clearColor(0, 0, 0, 0);

    var ty = 0, tp = 0, yw = still ? 0.28 : 0, pt = 0, t0 = performance.now(), run = false, vis = true, hid = false;
    addEventListener('pointermove', function (e) { ty = (e.clientX / innerWidth - 0.5) * 1.0; tp = -(e.clientY / innerHeight - 0.5) * 0.45; ptr = 1; });
    var ptr = 0;
    function draw(now) {
      var t = (now - t0) / 1000;
      if (!still) { yw += ((ptr ? ty : Math.sin(t * 0.7) * 0.32) - yw) * 0.08; pt += ((ptr ? tp : Math.sin(t * 0.5) * 0.06) - pt) * 0.08; }
      size(); g.viewport(0, 0, c.width, c.height); g.clear(g.COLOR_BUFFER_BIT);
      g.uniform1f(U.yw, yw); g.uniform1f(U.pt, pt); g.uniform1f(U.t, still ? 0.6 : t); g.uniform1f(U.k, c.width * 0.86 / (S - 1) * 1.2);
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
    GL = glifos();
    decode(new Uint8Array(a));
    c.classList.add('on');
    if (!gl3d()) flat(c.getContext('2d'));
  }).catch(function () {});
})();
