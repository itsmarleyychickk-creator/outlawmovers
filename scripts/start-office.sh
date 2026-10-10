#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")/.."
node -e 'if(Number(process.versions.node.split(".")[0])<24) { console.error("Install Node.js 24 or newer from nodejs.org first."); process.exit(1); }'
echo 'Starting your local office workspace. Open the office login on this computer at port 3000.'
echo 'The generated password is stored privately in data/office-password.txt. Keep the data folder backed up.'
exec node server.js
