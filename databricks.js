/**
 * Página /databricks/: tutorial e download da Trilha Databricks (pacote gerado por estudo-databricks/empacotar.js).
 * O zip e o .json de metadados ficam em dist/downloads/ (gerar com:
 *   node ../estudo-databricks/empacotar.js dist/downloads/trilha-databricks.zip).
 */
const fs = require('fs');
const path = require('path');

module.exports = function gerar({ CSS, JS, SITE, LINKEDIN, EMAIL, esc, dist }) {
  const metaF = path.join(dist, 'downloads', 'trilha-databricks.json');
  if (!fs.existsSync(metaF)) { console.log('databricks: sem dist/downloads/trilha-databricks.json, página não gerada'); return null; }
  const M = JSON.parse(fs.readFileSync(metaF, 'utf8'));
  const kb = Math.round(M.bytes / 1024);
  const dataBR = M.versao.split('-').reverse().join('/');
  const url = SITE + '/databricks/';
  const zip = '/downloads/trilha-databricks.zip?v=' + M.sha256.slice(0, 8);
  const title = 'Trilha Databricks grátis: estudo para as certificações Data Engineer Associate e Professional';
  const desc = `Duas trilhas (Associate e Professional), aulas, ${M.questoes + (M.questoesPro || 0)} questões comentadas, flashcards, simulados e um laboratório Spark + Delta Lake que roda no seu computador com Docker, sem conta e sem login.`;
  const DOCKER = 'https://www.docker.com/products/docker-desktop/';

  const css = CSS + `
pre{background:#000;border:1px solid var(--g3);padding:12px 14px;overflow-x:auto;font-size:14px;color:var(--g);margin:10px 0;white-space:pre}
code{color:var(--g);overflow-wrap:anywhere}
pre code{overflow-wrap:normal}
.tut{list-style:none;padding:0;counter-reset:t}
.tut>li{counter-increment:t;border:1px solid var(--g3);background:var(--card);padding:16px 18px 14px;margin:0 0 14px;position:relative}
.tut>li>h3{color:#fff;font-size:17px;margin-bottom:8px}
.tut>li>h3::before{content:"0" counter(t) " ";color:var(--g)}
.tut p,.tut li li{font-size:15px}
.tut ul{padding-left:20px;margin:6px 0}
.dl{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:20px 0 8px}
.meta{color:var(--mut);font-size:13px;overflow-wrap:anywhere}
.ok{color:var(--mut);font-size:14px}
.aviso{border-left:2px solid #ffcc00;padding:4px 0 4px 12px;color:var(--tx);font-size:14.5px;margin:10px 0}
.hero1{padding:40px 0 10px;max-width:820px}
table{border-collapse:collapse;width:100%;font-size:14.5px}
td{border-top:1px solid var(--g3);padding:8px 6px;vertical-align:top}
td:first-child{color:#fff;white-space:nowrap;padding-right:14px}
@media(max-width:760px){td:first-child{white-space:normal}}
`.replace(/\s*\n\s*/g, '');

  const inclui = [
    ['Aulas por objetivo', 'Os objetivos dos guias oficiais dos exames, com aula para ler, exemplos e um resumo para revisar. No fim de cada parte há links para a documentação oficial da Databricks, para você ir mais fundo.'],
    ['Guia da plataforma', 'Mapa da plataforma em camadas, produtos com o estágio de cada um (GA, Beta, preview), padrões de arquitetura, trilha de certificações, cursos oficiais da Academy (muitos em português) e um glossário, tudo ligado às aulas.'],
    ['Duas trilhas, cada uma com o seu progresso', `Associate (${M.objetivos} objetivos, ${M.questoes} questões) e Professional (${M.objetivosPro || 0} objetivos, ${M.questoesPro || 0} questões, com laboratórios e simulado de 60 questões). Um botão no topo do app troca de trilha, e o percentual de conclusão de cada uma aparece ali.`],
    [`${M.questoes + (M.questoesPro || 0)} questões comentadas`, 'Cada desafio sorteia 10 de uma base de 20 por objetivo. Em cada uma você vê por que a certa é a certa e por que cada errada está errada.'],
    ['Jornada guiada', 'Um passo a passo do zero até a prova: aula, laboratório, desafio e flashcards, com checkpoints e simulados cronometrados.'],
    ['Laboratório local', 'Spark 4, Delta Lake 4 e PostgreSQL rodando no seu computador. Você escreve e executa o código direto no app, sem criar conta em lugar nenhum.'],
    ['Revisão espaçada', 'Os flashcards e os erros voltam na hora certa, e o caderno de erros guarda o que você precisa rever.'],
    ['Tudo offline e seu', 'Roda no seu computador e o progresso fica salvo nele. Nada é enviado para fora.'],
  ];

  const faq = [
    ['O Docker diz que precisa do WSL 2 (Windows)', 'Aceite a instalação que o Docker Desktop oferece e reinicie o computador. Se ele pedir para ativar a virtualização, ela fica na BIOS do computador (Intel VT-x ou AMD-V).'],
    ['A primeira vez está demorando', 'É normal: o Docker baixa o Java, o Spark, o Delta Lake e o PostgreSQL (uns 2 GB). Leva de 5 a 15 minutos, conforme a internet. Das próximas vezes sobe em segundos.'],
    ['O laboratório diz que está desligado', 'O laboratório leva até 1 minuto para ligar depois que o app abre. Espere e clique em "Testar conexão" de novo. Se continuar, abra o Docker Desktop e veja se os 3 contêineres do projeto trilha-databricks estão verdes.'],
    ['O código do laboratório falha por falta de memória', 'No Docker Desktop, em Settings > Resources, deixe pelo menos 6 GB de memória.'],
    ['A porta 8790 já está em uso', 'No docker-compose.yml, troque 8790 por outra porta (8791, por exemplo) no trecho ${TRILHA_PORTA:-8790}, rode iniciar de novo e abra http://localhost:8791.'],
    ['Funciona no Mac com chip M1, M2, M3 ou M4?', 'Sim. O pacote funciona em Intel, AMD e Apple Silicon.'],
    ['Dá para estudar pelo celular?', 'Dá, na mesma rede Wi-Fi do computador. O passo a passo está no arquivo LEIA-ME.txt do pacote. Como o laboratório executa código, só faça isso numa rede de confiança.'],
    ['É oficial? Tem questões da prova?', 'Não. É um material independente, sem vínculo com a Databricks, escrito a partir do guia público do exame. Não tem questões vazadas da prova real (usar dumps viola as regras da certificação).'],
    ['Como atualizo para uma versão nova?', 'Baixe o zip de novo, extraia por cima da mesma pasta e rode iniciar. O progresso e as tabelas que você criou ficam num volume do Docker e não se perdem. Se você baixou uma versão antiga, a atualização também acerta as permissões da pasta de dados sozinha.'],
    ['O laboratório é seguro?', 'O código que você digita roda dentro de um contêiner sem internet, sem acesso ao seu computador e sem privilégios de administrador, com limite de memória, de processos e de tempo por célula. Mesmo assim, não rode o pacote num computador com dados sensíveis expostos na rede.'],
  ];

  const ld = [
    { '@context': 'https://schema.org', '@type': 'HowTo', name: 'Como instalar a Trilha Databricks no seu computador', description: desc,
      tool: [{ '@type': 'HowToTool', name: 'Docker Desktop' }],
      step: ['Instale o Docker Desktop', 'Baixe e extraia o pacote', 'Inicie a trilha', 'Abra no navegador e siga a Jornada'].map((n, i) => ({ '@type': 'HowToStep', position: i + 1, name: n })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow"><meta name="theme-color" content="#000000">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:locale" content="pt_BR">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>${css}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head><body>
<a class="skip" href="#c">Pular para o conteúdo</a>
<canvas id="m" aria-hidden="true"></canvas>
<header><div class="w"><a class="logo" href="/">&gt;_ felipe<span>marinho</span></a><span class="sp"></span><a class="btn p" href="${zip}" download>Baixar</a></div></header>
<main id="c" class="w">
<div class="hero1">
<h1>Trilha <span>Databricks</span></h1>
<p class="sub">Um curso completo e gratuito para as certificações <b>Databricks Certified Data Engineer Associate</b> e <b>Professional</b>, em duas trilhas separadas: aulas, ${M.questoes + (M.questoesPro || 0)} questões comentadas, flashcards, simulados e um laboratório Spark + Delta Lake que roda no seu computador. Sem conta, sem login e sem pagar nuvem.</p>
<div class="dl"><a class="btn p" href="${zip}" download>Baixar a Trilha (zip, ${kb} KB)</a><a class="btn" href="#passo">Ver o passo a passo</a></div>
<p class="meta">Versão ${dataBR} · Windows, Mac e Linux · SHA-256: ${M.sha256}</p>
</div>

<section><h2>O que vem no pacote</h2><div class="grid">${inclui.map(([a, b]) => `<div class="card"><h3>${esc(a)}</h3><p>${esc(b)}</p></div>`).join('')}</div></section>

<section><h2>Antes de começar</h2>
<table><tbody>
<tr><td>Sistema</td><td>Windows 10 ou 11 (64 bits), macOS (Intel ou Apple Silicon) ou Linux</td></tr>
<tr><td>Memória</td><td>8 GB de RAM ou mais (o laboratório usa até 4 GB)</td></tr>
<tr><td>Disco</td><td>Uns 4 GB livres</td></tr>
<tr><td>Programa</td><td><a href="${DOCKER}" rel="noopener">Docker Desktop</a> (grátis para uso pessoal e estudo). É a única coisa que você instala.</td></tr>
<tr><td>Internet</td><td>Só na primeira vez, para baixar o Spark e o Java. Depois funciona offline.</td></tr>
</tbody></table></section>

<section id="passo"><h2>Passo a passo</h2>
<ol class="tut">
<li><h3>Instale o Docker Desktop</h3>
<p>Baixe em <a href="${DOCKER}" rel="noopener">docker.com/products/docker-desktop</a>, instale e abra. Espere aparecer <b>Engine running</b> no canto inferior esquerdo.</p>
<ul><li><b>Windows:</b> se ele pedir para instalar ou atualizar o WSL 2, aceite e reinicie o computador.</li>
<li><b>Mac:</b> escolha o instalador do seu chip (Apple Silicon ou Intel).</li>
<li><b>Linux:</b> o Docker Engine com o plugin <code>docker compose</code> também funciona.</li></ul>
<p class="ok">Para conferir, abra um terminal e rode:</p>
<pre><code>docker compose version</code></pre></li>

<li><h3>Baixe e extraia o pacote</h3>
<p><a class="btn p" href="${zip}" download>Baixar trilha-databricks.zip</a></p>
<p>Extraia o zip numa pasta fácil de achar, como <code>Documentos\\trilha-databricks</code>. No Windows: botão direito no arquivo, <b>Extrair tudo</b>.</p>
<p class="aviso">Não rode direto de dentro do zip: extraia primeiro.</p></li>

<li><h3>Inicie a trilha</h3>
<p><b>Windows:</b> abra a pasta extraída e dê dois cliques em <code>iniciar.bat</code>. Se o Windows mostrar "O Windows protegeu o computador", clique em <b>Mais informações</b> e depois em <b>Executar assim mesmo</b>: o arquivo só chama o Docker (dá para abrir no Bloco de Notas e conferir).</p>
<p><b>Mac ou Linux:</b> abra o Terminal na pasta extraída e rode:</p>
<pre><code>sh iniciar.sh</code></pre>
<p>Na primeira vez leva de 5 a 15 minutos, porque o Docker baixa o Java, o Spark e o PostgreSQL. Das próximas vezes sobe em segundos, e sobe sozinho quando o Docker abre.</p></li>

<li><h3>Abra no navegador</h3>
<p>O navegador abre sozinho no fim. Se não abrir, acesse:</p>
<pre><code>http://localhost:8790</code></pre>
<p>Comece pela aba <b>Jornada</b>. No primeiro passo, clique em <b>Testar conexão</b> para confirmar que o laboratório está ligado (pode levar até 1 minuto depois que o app abre).</p></li>

<li><h3>Estude todo dia um pouco</h3>
<p>A Jornada diz o que fazer em seguida. Em cada objetivo, você lê a aula, faz o laboratório, passa no desafio (meta de 70%) e revisa os flashcards. No fim vêm os simulados no formato da prova.</p></li>
</ol></section>

<section><h2>Comandos úteis</h2>
<table><tbody>
<tr><td>Parar</td><td><code>parar.bat</code> (Windows) ou <code>sh parar.sh</code>. O progresso fica salvo.</td></tr>
<tr><td>Ligar de novo</td><td><code>iniciar.bat</code> ou <code>sh iniciar.sh</code></td></tr>
<tr><td>Atualizar</td><td>Baixe o zip novo, extraia por cima da mesma pasta e rode iniciar. O progresso continua.</td></tr>
<tr><td>Ver o que está acontecendo</td><td><code>docker compose logs -f</code>, rodado na pasta do pacote</td></tr>
<tr><td>Apagar tudo</td><td><code>docker compose down -v</code>, rodado na pasta (apaga também o progresso)</td></tr>
</tbody></table></section>

<section><h2>Problemas comuns</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>

<section class="final"><h2>Bons estudos</h2><p>Achou um erro numa questão ou tem uma sugestão? Fale comigo.</p><div class="cta"><a class="btn p" href="${zip}" download>Baixar a Trilha</a><a class="btn" href="mailto:${EMAIL}?subject=Trilha%20Databricks">E-mail</a><a class="btn" href="${LINKEDIN}" rel="me noopener">LinkedIn</a></div></section>
</main>
<footer><div class="w">© ${new Date().getFullYear()} <a href="/">Felipe Marinho</a> · Material independente, sem vínculo com a Databricks. Databricks e Delta Lake são marcas de seus donos.</div></footer>
<script>${JS}</script>
</body></html>`.replace(/>\s+</g, '><');

  fs.mkdirSync(path.join(dist, 'databricks'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'databricks', 'index.html'), html);
  console.log(`databricks/index.html: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
  return '/databricks/';
};
