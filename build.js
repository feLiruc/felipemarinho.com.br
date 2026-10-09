#!/usr/bin/env node
/**
 * Gera o site felipemarinho.com.br (PT + EN) a partir de UM template.
 *   node build.js     -> dist/index.html, dist/en/index.html, robots.txt, sitemap.xml, .htaccess, favicon.svg
 *
 * Meta: abrir em menos de 1 segundo. HTML único por idioma, CSS/JS/SVG embutidos, zero requisição externa,
 * fonte do sistema, animação em canvas leve (pausa fora da tela e respeita "reduzir movimento").
 * Dados do LinkedIn (perfil lido em 2026-10-09). Telefone/e-mail abaixo: confirme antes de publicar.
 */
const fs = require('fs');
const path = require('path');

const SITE = 'https://felipemarinho.com.br';
const LINKEDIN = 'https://www.linkedin.com/in/felipemarinho91/';
const EMAIL = 'contato@proxyus.com.br';
const WHATS = '5543910174744';            // (43) 91017-4744, WhatsApp comercial da ProxyUS
const PROXYUS = 'https://proxyus.com.br';

// Retrato holográfico: grade 128x128 em 4 bits (gerar-retrato.py) -> r-<hash>.bin; holo.js desenha a nuvem de pontos em WebGL
const rBin = fs.readFileSync(path.join(__dirname, 'retrato', 'r.bin'));
const rNome = 'r-' + require('crypto').createHash('md5').update(rBin).digest('hex').slice(0, 8) + '.bin';
const ogBin = fs.readFileSync(path.join(__dirname, 'retrato', 'og.png'));
const ogNome = 'og-' + require('crypto').createHash('md5').update(ogBin).digest('hex').slice(0, 8) + '.png';
const HOLO = fs.readFileSync(path.join(__dirname, 'holo.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1').replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();

const T = require('./conteudo')(SITE);

const esc = s => String(s).replace(/&(?!amp;|lt;|gt;)/g, '&amp;');

const CSS = `
:root{--g:#00ff41;--g2:#00c030;--g3:#0b3d1a;--bg:#000;--tx:#c4ffd2;--mut:#63b378;--card:rgba(0,22,7,.82)}
*{box-sizing:border-box;margin:0}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--tx);font:16px/1.65 ui-monospace,"Cascadia Mono",Consolas,Menlo,"DejaVu Sans Mono",monospace;-webkit-text-size-adjust:100%}
body::after{content:"";position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px);z-index:5}
#m{position:fixed;inset:0;width:100%;height:100%;z-index:0;opacity:.5}
a{color:var(--g);text-underline-offset:3px}
a:hover{color:#fff}
:focus-visible{outline:2px solid var(--g);outline-offset:3px}
.skip{position:absolute;left:-999px;top:8px;background:var(--g);color:#001a07;padding:8px 12px;z-index:20}
.skip:focus{left:8px}
.w{position:relative;z-index:2;max-width:1060px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;z-index:10;background:rgba(0,0,0,.86);border-bottom:1px solid var(--g3);backdrop-filter:blur(4px)}
header .w{display:flex;align-items:center;gap:14px;height:54px}
.logo{color:var(--g);font-weight:700;text-decoration:none;text-shadow:0 0 8px rgba(0,255,65,.55)}
.sp{flex:1}
.lang{border:1px solid var(--g2);padding:3px 10px;text-decoration:none;font-weight:700}
.btn{display:inline-block;padding:11px 18px;border:1px solid var(--g);color:var(--g);text-decoration:none;font-weight:700;letter-spacing:.02em;transition:.15s}
.btn:hover{background:rgba(0,255,65,.12);color:#fff;box-shadow:0 0 14px rgba(0,255,65,.45)}
.btn.p{background:var(--g);color:#001a07}
.btn.p:hover{background:#7dffa0;color:#001a07}
.hero{display:grid;grid-template-columns:1.25fr .75fr;gap:28px;align-items:center;padding:44px 0 34px}
.term{border:1px solid var(--g3);background:var(--card);padding:12px 14px;font-size:14px;margin-bottom:22px;max-width:440px}
.term div{white-space:nowrap;overflow:hidden;width:0;animation:ty .9s steps(40,end) forwards}
.term div:nth-child(2){animation-delay:.2s}.term div:nth-child(3){animation-delay:1.1s}.term div:nth-child(4){animation-delay:1.3s}.term div:nth-child(5){animation-delay:2.2s}.term div:nth-child(6){animation-delay:2.4s}
.term .c{color:var(--g)}.term .c::before{content:"$ ";color:var(--mut)}
.term .o{color:var(--tx)}
@keyframes ty{to{width:100%}}
h1{font-size:clamp(28px,5.2vw,48px);line-height:1.12;color:#fff;text-shadow:0 0 18px rgba(0,255,65,.35);letter-spacing:-.01em;text-wrap:balance}
h1 span{color:var(--g);text-shadow:0 0 14px rgba(0,255,65,.7)}
.sub{margin:18px 0 24px;color:var(--tx);max-width:60ch}
.sub b{color:var(--g)}
.cta{display:flex;flex-wrap:wrap;gap:12px}
.badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px;list-style:none;padding:0}
.badges li{border:1px solid var(--g3);color:var(--mut);padding:3px 10px;font-size:13px}
.fig{position:relative;justify-self:center;width:100%;max-width:400px;aspect-ratio:1}
.fig::before{content:"";position:absolute;inset:6%;background:radial-gradient(circle,rgba(0,255,65,.2),transparent 68%);filter:blur(12px)}
.fig canvas{position:relative;display:block;width:100%;height:100%;opacity:0;transition:opacity .6s;-webkit-mask-image:radial-gradient(closest-side,#000 62%,transparent 100%);mask-image:radial-gradient(closest-side,#000 62%,transparent 100%)}
.fig::after{content:"";position:absolute;inset:4%;border-radius:50%;border:1px solid rgba(0,255,65,.22);box-shadow:0 0 18px rgba(0,255,65,.1),inset 0 0 24px rgba(0,255,65,.08);pointer-events:none}
.fig .rg{position:absolute;inset:4%;border-radius:50%;filter:drop-shadow(0 0 5px rgba(0,255,65,.7));pointer-events:none}
.fig .rg i{display:block;width:100%;height:100%;border-radius:50%;background:conic-gradient(from 0deg,rgba(0,255,65,0) 0,rgba(0,255,65,0) 52%,rgba(0,255,65,.18) 72%,rgba(0,255,65,.95) 100%);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2px));mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2px));animation:giro 7s linear infinite}
@keyframes giro{to{transform:rotate(360deg)}}
.fig canvas.on{opacity:1}
section{padding:34px 0}
h2{font-size:clamp(20px,3.2vw,28px);color:var(--g);text-shadow:0 0 10px rgba(0,255,65,.4);margin-bottom:16px;text-wrap:balance}
h2::before{content:"// ";color:var(--mut)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.card{border:1px solid var(--g3);background:var(--card);padding:16px 18px}
.card:hover{border-color:var(--g);box-shadow:0 0 16px rgba(0,255,65,.2)}
.card h3{font-size:16px;color:#fff;margin-bottom:6px}
.card p{color:var(--tx);font-size:14.5px}
.steps{counter-reset:s;display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;list-style:none;padding:0}
.steps li{counter-increment:s;border-left:2px solid var(--g);padding:2px 0 2px 14px}
.steps li::before{content:"0" counter(s);color:var(--mut);display:block;font-size:13px}
.steps b{color:#fff;display:block}
.tags{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0}
.tags li{border:1px solid var(--g2);color:var(--g);padding:4px 12px;font-size:14px}
.log{list-style:none;padding:0;border-left:1px solid var(--g3);margin-left:6px}
.log li{padding:0 0 18px 18px;position:relative}
.log li::before{content:"";position:absolute;left:-5px;top:8px;width:9px;height:9px;background:var(--g);box-shadow:0 0 8px var(--g)}
.log time{color:var(--mut);font-size:13px;display:block}
.log b{color:#fff}
.ul{padding-left:20px}.ul li{margin:6px 0}
details{border:1px solid var(--g3);background:var(--card);margin:10px 0;padding:0}
summary{cursor:pointer;padding:12px 16px;color:#fff;font-weight:700;list-style:none}
summary::before{content:"> ";color:var(--g)}
details[open] summary::before{content:"v ";}
details p{padding:0 16px 14px;color:var(--tx);font-size:15px}
.final{text-align:center;border:1px solid var(--g);background:var(--card);padding:34px 20px;margin:20px 0;box-shadow:0 0 24px rgba(0,255,65,.25)}
.final h2{margin-bottom:8px}.final h2::before{content:""}
.final p{margin-bottom:20px;color:var(--tx)}
.final .cta{justify-content:center}
footer{position:relative;z-index:2;border-top:1px solid var(--g3);padding:22px 0 40px;color:var(--mut);font-size:14px;text-align:center}
@media(max-width:760px){.hero{grid-template-columns:1fr;padding-top:26px}.fig{max-width:230px;order:-1}.term{max-width:none;font-size:13px}.cta .btn{width:100%;text-align:center}header .btn{padding:7px 12px;font-size:13px;white-space:nowrap}.logo{white-space:nowrap}.logo span{display:none}}
@media(prefers-reduced-motion:reduce){.term div{animation:none;width:100%}.fig .rg i{animation:none;transform:rotate(40deg)}html{scroll-behavior:auto}}
`.replace(/\s*\n\s*/g, '').replace(/;}/g, '}');

const JS = `
(function(){var c=document.getElementById("m");if(!c)return;var q=matchMedia("(prefers-reduced-motion:reduce)").matches,x=c.getContext("2d"),w,h,n,d,t=0,r=0,s="01{}<>/;=$#アイウエオカキクケコ";
function z(){w=c.width=innerWidth>>1;h=c.height=innerHeight>>1;n=Math.ceil(w/14);d=[];for(var i=0;i<n;i++)d[i]=Math.random()*h/14|0}
function f(){x.fillStyle="rgba(0,0,0,.12)";x.fillRect(0,0,w,h);x.fillStyle="#00ff41";x.font="12px monospace";for(var i=0;i<n;i++){x.fillText(s[Math.random()*s.length|0],i*14,d[i]*14);if(d[i]*14>h&&Math.random()>.975)d[i]=0;d[i]++}}
function l(a){if(document.hidden){r=0;return}if(a-t>60){f();t=a}r=requestAnimationFrame(l)}
z();addEventListener("resize",z);
if(q){for(var k=0;k<40;k++)f();return}
document.addEventListener("visibilitychange",function(){if(!document.hidden&&!r)r=requestAnimationFrame(l)});
r=requestAnimationFrame(l)})();
`.replace(/\n/g, '');

function pagina(k) {
  const t = T[k];
  const wa = `https://wa.me/${WHATS}?text=${encodeURIComponent(t.waText)}`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Person', name: 'Felipe Marinho', url: t.url, jobTitle: k === 'pt' ? 'Engenheiro de Dados' : 'Data Engineer',
      description: t.desc, sameAs: [LINKEDIN, PROXYUS], email: EMAIL, address: { '@type': 'PostalAddress', addressLocality: 'Londrina', addressRegion: 'PR', addressCountry: 'BR' },
      knowsAbout: ['Data Warehouse', 'PostgreSQL', 'DuckDB', 'Business Intelligence', 'Dashboards', 'Chatbots com IA', 'WhatsApp', 'Python', 'dbt', 'Apache Airflow', 'Power BI', 'Qlik Sense', 'ETL', 'Azure Databricks', 'Data Engineering'], knowsLanguage: ['pt-BR', 'en'] },
    { '@context': 'https://schema.org', '@type': 'ProfessionalService', name: 'Felipe Marinho · ' + (k === 'pt' ? 'Engenharia de Dados' : 'Data Engineering'), url: t.url,
      areaServed: 'Worldwide', serviceType: t.del.map(d => d[0]), provider: { '@type': 'Person', name: 'Felipe Marinho' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];
  const termHtml = t.term.map((v, i) => `<div class="${i % 2 === 0 ? 'c' : 'o'}">${esc(v)}</div>`).join('');
  return `<!doctype html>
<html lang="${t.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.desc)}">
<link rel="canonical" href="${t.url}">
<link rel="alternate" hreflang="pt-BR" href="${SITE}/"><link rel="alternate" hreflang="en" href="${SITE}/en/"><link rel="alternate" hreflang="x-default" href="${SITE}/">
<meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#000000">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(t.title)}"><meta property="og:description" content="${esc(t.desc)}"><meta property="og:url" content="${t.url}"><meta property="og:locale" content="${t.og}"><meta property="og:image" content="${SITE}/${ogNome}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preload" href="/${rNome}" as="fetch" crossorigin="anonymous">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head><body>
<a class="skip" href="#c">${t.skip}</a>
<canvas id="m" aria-hidden="true"></canvas>
<header><div class="w"><a class="logo" href="${t.url}">&gt;_ felipe<span>marinho</span></a><span class="sp"></span><a class="lang" href="${t.altUrl}" hreflang="${t.alt}" lang="${t.alt}" title="${t.switchTitle}">${t.switchLabel}</a><a class="btn p" href="${wa}" rel="noopener">${t.cta1}</a></div></header>
<main id="c" class="w">
<div class="hero"><div>
<div class="term" aria-hidden="true">${termHtml}</div>
<h1>${esc(t.h1a)} <span>${esc(t.h1b)}</span></h1>
<p class="sub">${t.sub}</p>
<div class="cta"><a class="btn p" href="${wa}" rel="noopener">${t.cta1}</a><a class="btn" href="${LINKEDIN}" rel="me noopener">${t.cta2}</a><a class="btn" href="mailto:${EMAIL}">${t.cta3}</a></div>
<ul class="badges">${t.badges.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
</div><div class="fig"><span class="rg"><i></i></span><canvas id="h" data-src="/${rNome}" role="img" aria-label="${k === 'pt' ? 'Retrato holográfico 3D de Felipe Marinho, engenheiro de dados' : '3D holographic portrait of Felipe Marinho, data engineer'}"></canvas></div></div>

<section><h2>${t.probH}</h2><p>${esc(t.probP)}</p></section>
<section><h2>${t.delH}</h2><div class="grid">${t.del.map(([a, b]) => `<div class="card"><h3>${esc(a)}</h3><p>${esc(b)}</p></div>`).join('')}</div></section>
<section><h2>${t.pxH}</h2><p>${esc(t.pxP)}</p><div class="grid" style="margin:14px 0">${t.px.map(([a, b]) => `<div class="card"><h3>${a}</h3><p>${esc(b)}</p></div>`).join('')}</div><a class="btn" href="${PROXYUS}" rel="noopener">${t.pxLink}</a></section>
<section><h2>${t.howH}</h2><ol class="steps">${t.how.map(([a, b]) => `<li><b>${esc(a)}</b>${esc(b)}</li>`).join('')}</ol></section>
<section><h2>${t.stackH}</h2><ul class="tags">${t.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul></section>
<section><h2>${t.expH}</h2><ul class="log">${t.exp.map(([d, a, b]) => `<li><time>${esc(d)}</time><b>${esc(a)}</b><br>${esc(b)}</li>`).join('')}</ul></section>
<section><h2>${t.credH}</h2><ul class="ul">${t.cred.map(c => `<li>${esc(c)}</li>`).join('')}</ul></section>
<section><h2>${t.faqH}</h2>${t.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
<section class="final"><h2>${esc(t.ctaH)}</h2><p>${esc(t.ctaP)}</p><div class="cta"><a class="btn p" href="${wa}" rel="noopener">${t.cta1}</a><a class="btn" href="mailto:${EMAIL}">${t.cta3}</a><a class="btn" href="${LINKEDIN}" rel="me noopener">${t.cta2}</a></div></section>
</main>
<footer><div class="w">© ${new Date().getFullYear()} Felipe Marinho · ${t.foot}</div></footer>
<script>${JS}</script><script>${HOLO}</script>
</body></html>`.replace(/>\s+</g, '><');
}

const dist = path.join(__dirname, 'dist');
fs.mkdirSync(path.join(dist, 'en'), { recursive: true });
for (const f of fs.readdirSync(dist)) if (/^r-[0-9a-f]{8}\.bin$/.test(f)) fs.unlinkSync(path.join(dist, f));
fs.writeFileSync(path.join(dist, rNome), rBin);
for (const f of fs.readdirSync(dist)) if (/^og(-[0-9a-f]{8}|-3d)?\.png$/.test(f)) fs.unlinkSync(path.join(dist, f));
fs.writeFileSync(path.join(dist, ogNome), ogBin);
fs.writeFileSync(path.join(dist, 'index.html'), pagina('pt'));
fs.writeFileSync(path.join(dist, 'en', 'index.html'), pagina('en'));
fs.writeFileSync(path.join(dist, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#000"/><text x="4" y="22" font-family="monospace" font-size="18" font-weight="700" fill="#00ff41">&gt;_</text></svg>');
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
const hoje = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  [['/', 'pt-BR', '/en/', 'en'], ['/en/', 'en', '/', 'pt-BR']].map(([u, l1, u2, l2]) =>
    `<url><loc>${SITE}${u}</loc><lastmod>${hoje}</lastmod><xhtml:link rel="alternate" hreflang="${l1}" href="${SITE}${u}"/><xhtml:link rel="alternate" hreflang="${l2}" href="${SITE}${u2}"/></url>`).join('\n') + `\n</urlset>\n`);
fs.writeFileSync(path.join(dist, '.htaccess'), `# Velocidade e segurança (Apache). Gerado por build.js
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml text/xml application/xml text/plain
</IfModule>
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType text/html "access plus 10 minutes"
ExpiresByType image/svg+xml "access plus 30 days"
ExpiresByType image/png "access plus 30 days"
ExpiresByType image/jpeg "access plus 30 days"
ExpiresByType application/octet-stream "access plus 30 days"
</IfModule>
<IfModule mod_headers.c>
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
</IfModule>
Options -Indexes
DirectoryIndex index.html
# www -> sem www
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]
`);
for (const f of ['index.html', 'en/index.html']) {
  const b = fs.statSync(path.join(dist, f)).size;
  console.log(`${f}: ${(b / 1024).toFixed(1)} KB (antes de gzip)`);
}
