#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok(){ echo -e "${GREEN}✅ $*${NC}"; }
warn(){ echo -e "${YELLOW}⚠️  $*${NC}"; }
err(){ echo -e "${RED}❌ $*${NC}"; }

echo "🔎 AUDITORÍA DE SETUP (solo lectura)"
echo "===================================="
OS="$(uname -s)"; echo "SO: $OS"
if [[ "$OS" != "Darwin" ]]; then warn "Este script está pensado para macOS (Homebrew)."; fi
echo ""

# 0) Homebrew
if command -v brew >/dev/null 2>&1; then
  ok "Homebrew: $(brew --version | head -n1)"
else
  err "Homebrew no encontrado."
fi

echo ""
echo "🗄️  BASES DE DATOS"
echo "-------------------"
# 1) MongoDB
MONGO_TAP_OK=false
if command -v brew >/dev/null 2>&1; then
  if brew list --formula | grep -q '^mongodb-community@7\.0$'; then
    ok "MongoDB (brew): mongodb-community@7.0 instalado"
    MONGO_TAP_OK=true
  else
    warn "MongoDB 7.0 no detectado vía brew."
  fi
fi
if command -v mongod >/dev/null 2>&1; then
  ok "mongod: $(mongod --version 2>/dev/null | head -n1)"
else
  [[ "$MONGO_TAP_OK" == true ]] || err "mongod no está en PATH"
fi
# Estado del servicio (si brew existe)
if command -v brew >/dev/null 2>&1; then
  if brew services list | grep -E 'mongodb-community@7\.0' | grep -q started; then
    ok "MongoDB en ejecución (brew services started)"
  else
    warn "MongoDB no aparece como 'started' en brew services"
  fi
fi

# 2) Redis
if command -v redis-server >/dev/null 2>&1; then
  ok "Redis: $(redis-server --version | awk '{print $1,$2,$3}')"
else
  warn "Redis no encontrado"
fi
if command -v brew >/dev/null 2>&1; then
  if brew services list | grep -E '^redis\s' | grep -q started; then
    ok "Redis en ejecución (brew services started)"
  else
    warn "Redis no aparece como 'started' en brew services"
  fi
fi

echo ""
echo "🧰 SOLANA / RUST / ANCHOR"
echo "-------------------------"
# 3) Solana CLI
if command -v solana >/dev/null 2>&1; then
  ok "Solana CLI: $(solana --version)"
else
  err "Solana CLI no encontrado"
fi

# 4) cargo-build-sbf (necesario para anchor build)
if command -v cargo-build-sbf >/dev/null 2>&1; then
  ok "cargo-build-sbf disponible: $(which cargo-build-sbf)"
else
  err "cargo-build-sbf NO está en PATH (Anchor build fallará sin esto)"
fi

# 5) Rust / Cargo
if command -v rustc >/dev/null 2>&1; then
  ok "rustc: $(rustc --version)"
else
  err "rustc no encontrado"
fi
if command -v cargo >/dev/null 2>&1; then
  ok "cargo: $(cargo --version)"
else
  err "cargo no encontrado"
fi

# 6) Anchor + AVM
if command -v anchor >/dev/null 2>&1; then
  ok "Anchor: $(anchor --version)"
else
  err "Anchor no encontrado"
fi
if command -v avm >/dev/null 2>&1; then
  ok "avm: $(avm --version)"
else
  warn "avm (Anchor Version Manager) no encontrado"
fi

echo ""
echo "🔑 SOLANA CONFIG / WALLETS"
echo "--------------------------"
solana config get || true
KEYPATH="${HOME}/.config/solana/id.json"
if [[ -f "$KEYPATH" ]]; then
  ok "Keypair existe: $KEYPATH"
else
  warn "No existe keypair en $KEYPATH"
fi
if command -v solana >/dev/null 2>&1 && [[ -f "$KEYPATH" ]]; then
  PUB=$(solana-keygen pubkey "$KEYPATH" 2>/dev/null || true)
  [[ -n "${PUB}" ]] && ok "Admin pubkey: $PUB" || warn "No se pudo leer pubkey"
  BAL=$(solana balance "$PUB" 2>/dev/null | awk '{print $1}' || true)
  [[ -n "${BAL}" ]] && ok "Balance devnet: ${BAL} SOL" || warn "No se pudo obtener balance (RPC devnet)"
fi

echo ""
echo "📦 NODE / NPM / YARN (opcional para tus proyectos)"
echo "--------------------------------------------------"
if command -v node >/dev/null 2>&1; then ok "node: $(node -v)"; else warn "node no encontrado"; fi
if command -v npm  >/dev/null 2>&1; then ok "npm: $(npm -v)"; else warn "npm no encontrado"; fi
if command -v yarn >/dev/null 2>&1; then ok "yarn: $(yarn -v)"; else warn "yarn no encontrado"; fi

echo ""
echo "📁 PROYECTO (Anchor.toml y Program ID)"
echo "--------------------------------------"
if [[ -d gasless_infrastructure_program ]]; then
  echo "Directorio: gasless_infrastructure_program"
  if [[ -f gasless_infrastructure_program/Anchor.toml ]]; then
    PID_LINE=$(grep -E 'gasless_infrastructure\s*=' gasless_infrastructure_program/Anchor.toml || true)
    if [[ -n "$PID_LINE" ]]; then
      ok "Anchor.toml program id: ${PID_LINE#*= }"
    else
      warn "No encontré program id en Anchor.toml"
    fi
  else
    warn "Anchor.toml no encontrado en gasless_infrastructure_program"
  fi
else
  warn "No existe ./gasless_infrastructure_program (se omite chequeo)"
fi

echo ""
echo "🧾 RESUMEN"
echo "----------"
echo "• Si ves ❌ en 'cargo-build-sbf', reabre la terminal y verifica PATH de Solana."
echo "• Si Mongo/Redis no están 'started', puedes iniciarlos con 'brew services start ...' (manualmente)."
echo "• Nada fue instalado ni modificado por este script."
echo ""
echo "✅ Auditoría terminada."
