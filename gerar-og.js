#!/usr/bin/env node
/**
 * Gera dist/og-3d.png (imagem de compartilhamento 1200x630) com o retrato holográfico real.
 * Precisa do Brave/Chrome e de um servidor estático em dist/:
 *   (cd dist && python -m http.server 8800) &   node gerar-og.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const dist = path.join(__dirname, 'dist');
const holo = fs.readFileSync(path.join(__dirname, 'holo.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const r = fs.readdirSync(dist).find(f => /^r-.*\.bin$/.test(f));
const html = `<!doctype html><meta charset=utf-8><style>*{margin:0}html,body{width:1200px;height:630px;overflow:hidden}body{background:#000;color:#c4ffd2;font:28px ui-monospace,Consolas,monospace;display:flex;align-items:center;padding:0 40px 0 70px;gap:20px;position:relative}body::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.3) 0 1px,transparent 1px 3px);pointer-events:none}.t{flex:1;min-width:0}.k{color:#63b378;font-size:24px;margin-bottom:18px}h1{font-size:60px;line-height:1.1;color:#fff;text-shadow:0 0 18px rgba(0,255,65,.4)}h1 span{color:#00ff41}p{margin-top:24px;font-size:25px;color:#00ff41}.f{flex:none;width:470px;height:470px;position:relative}.f::before{content:"";position:absolute;inset:6%;background:radial-gradient(circle,rgba(0,255,65,.25),transparent 68%);filter:blur(14px)}canvas{position:relative;width:470px;height:470px;display:block}</style><div class=t><div class=k>&gt;_ felipemarinho.com.br</div><h1>Seu SQL Server legado, <span>agora em Lakehouse.</span></h1><p>Felipe Marinho · Engenheiro de Dados<br>Azure · Databricks · PySpark</p></div><div class=f><canvas id=h data-src="/${r}"></canvas></div><script>${holo}</script>`;
fs.writeFileSync(path.join(dist, '_og.html'), html);
try {
  const brave = process.env.BROWSER_EXE || 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe';
  execFileSync(brave, ['--headless=new', '--disable-gpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1200,630', '--virtual-time-budget=4000', `--screenshot=${path.join(dist, 'og-3d.png')}`, 'http://localhost:8800/_og.html'], { stdio: 'ignore' });
} finally { fs.unlinkSync(path.join(dist, '_og.html')); }
console.log('dist/og-3d.png gerado');
