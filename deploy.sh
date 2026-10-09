#!/usr/bin/env bash
# Local -> GitHub -> servidor (git pull). Nunca edite direto no servidor.
set -euo pipefail
cd "$(dirname "$0")"
MSG="${1:-Atualiza o site}"
node build.js
git add -A
git commit -m "$MSG" || echo "(nada novo para commitar)"
git push origin main
ssh root@89.117.61.84 'cd /var/www/html/felipemarinho.com.br && git pull -q && git log --oneline | head -1'
