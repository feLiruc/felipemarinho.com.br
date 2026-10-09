# felipemarinho.com.br

Site pessoal (PT + EN), estilo Matrix, feito para ser leve (≈ 21 KB por página, sem requisições externas) e para atrair leads do Google.

- `build.js` gera `dist/` (páginas PT e EN, `sitemap.xml`, `robots.txt`, `.htaccess`, favicon) a partir de um único modelo.
- Retrato holográfico 3D: `gerar-retrato.py` transforma a foto (`foto-origem.png`, fora do git) em `retrato/r.bin` (grade 128x128 em 4 bits, 8 KB); `holo.js` (WebGL, sem biblioteca) desenha a nuvem de pontos girando com o mouse. `build.js` copia o `.bin` com hash no nome. `caricatura.svg` é a versão antiga (não usada).
- `gerar-og.js` gera `dist/og.png` (imagem de compartilhamento) com o retrato.
- O servidor serve **somente** `dist/` (DocumentRoot `/var/www/html/felipemarinho.com.br/dist`).

## Alterar e publicar

```bash
node build.js        # edite textos/contatos no topo e em T{} de build.js
bash deploy.sh "mensagem do commit"   # build + commit + push + git pull no servidor
```

Contatos ficam nas constantes `EMAIL` e `WHATS` de `build.js`.

Imagem de compartilhamento (precisa do Brave/Chrome):
`brave --headless=new --window-size=1200,630 --screenshot=dist/og.png file:///.../og-src.html`
