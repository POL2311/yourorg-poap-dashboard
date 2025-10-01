#!/usr/bin/env bash
# Solana/Anchor Doctor — valida entorno y proyecto (macOS/Linux)
# Uso:
#   ./solana_anchor_doctor.sh            # solo diagnóstico
#   ./solana_anchor_doctor.sh --fix      # intenta arreglos seguros (PATH, corepack, etc.)

set -u
FIX=0
[[ "${1:-}" == "--fix" ]] && FIX=1

########################
# helpers de impresión #
########################
bold()  { printf "\033[1m%s\033[0m\n" "$*"; }
ok()    { printf "✅ %s\n" "$*"; }
warn()  { printf "⚠️  %s\n" "$*"; }
err()   { printf "❌ %s\n" "$*"; }
info()  { printf "ℹ️  %s\n" "$*"; }
sep()   { printf "\n————— %s —————\n" "$*"; }

have()  { command -v "$1" >/dev/null 2>&1; }
try()   { "$@" >/tmp/_doctor_out 2>/tmp/_doctor_err; local rc=$?; cat /tmp/_doctor_out; return $rc; }
line()  { printf "%s\n" "$*" | sed 's/[[:cntrl:]]\+//g'; }

########################
# 1) Sistema & shell   #
########################
sep "Sistema"
UNAME=$(uname -a 2>/dev/null || true)
ARCH=$(uname -m 2>/dev/null || true)
OS=$(uname -s 2>/dev/null || true)
bold "OS: $(line "$OS")"
bold "Kernel: $(line "$UNAME")"
bold "Arch: $(line "$ARCH")"
bold "Shell: $SHELL"
bold "PATH:"
echo "$PATH" | tr ":" "\n" | nl -w2 -s". "

########################
# 2) Herramientas base #
########################
sep "Herramientas base"
if have rustup; then
  bold "rustup: $(rustup --version)"
  bold "toolchain activo: $(rustup show active-toolchain 2>/dev/null || echo 'desconocido')"
else
  err "rustup no está instalado."
fi

have cargo   && bold "cargo: $(cargo --version)"    || err "cargo no disponible"
have rustc   && bold "rustc: $(rustc --version)"    || err "rustc no disponible"
have node    && bold "node: $(node -v)"             || warn "node no disponible"
have npm     && bold "npm: $(npm -v 2>/dev/null)"   || warn "npm no disponible"
have corepack && ok "corepack presente"             || warn "corepack no disponible (yarn/pnpm)"
have python3 && bold "python3: $(python3 --version)"|| :

########################
# 3) Solana & Anchor   #
########################
sep "Solana & Anchor"

SOL_OK=1
if have solana; then
  bold "solana: $(solana --version)"
  info "solana config get:"
  try solana config get | sed 's/^/  /'
  # Detección de instalaciones duplicadas de solana en PATH
  MAP_SOL=$(which -a solana | nl -w2 -s". " | sed 's/^/  /')
  if [ "$(echo "$MAP_SOL" | wc -l | tr -d ' ')" -gt 1 ]; then
    warn "Varias rutas de 'solana' en PATH:"
    echo "$MAP_SOL"
    warn "Esto puede causar que 'cargo-build-sbf' no coincida con la versión activa."
  fi
else
  SOL_OK=0
  err "solana CLI no encontrado. Instala con:
  sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
fi

CARGO_SBF_OK=1
if have cargo-build-sbf; then
  bold "cargo-build-sbf: $(cargo-build-sbf --version 2>/dev/null || echo 'ok')"
else
  CARGO_SBF_OK=0
  err "cargo-build-sbf no está en PATH."
  info "Lo provee Solana CLI; o instala el crate:"
  echo "  cargo install cargo-build-sbf --locked"
fi

if have anchor; then
  bold "anchor: $(anchor --version)"
else
  warn "anchor CLI no encontrado."
  info "Instala AVM y Anchor:"
  echo "  cargo install --git https://github.com/coral-xyz/anchor avm --locked"
  echo "  avm install latest && avm use latest"
fi

# BPF tools
if have llvm-ar && have clang; then
  ok "Herramientas LLVM detectadas (clang/llvm-ar)."
else
  warn "clang/llvm-ar no detectados. El toolchain de Solana trae sus propias herramientas,"
  warn "pero tener clang del sistema a veces ayuda (brew install llvm)."
fi

########################
# 4) Proyecto (si hay) #
########################
IN_REPO=0
if [ -d ".git" ] || git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  IN_REPO=1
fi

if [ "$IN_REPO" -eq 1 ]; then
  sep "Proyecto (repo detectado)"
  ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
  bold "raíz del repo: $ROOT"
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')
  COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo '?')
  bold "rama: $BRANCH @ $COMMIT"

  # Anchor.toml
  if [ -f "$ROOT/Anchor.toml" ]; then
    ok "Anchor.toml encontrado."
    info "programs declarados:"
    awk '/\[programs\./,0' "$ROOT/Anchor.toml" | sed 's/^/  /'
  else
    warn "No se encontró Anchor.toml en la raíz."
  fi

  # programs dir
  if [ -d "$ROOT/programs" ]; then
    bold "programs/"
    find "$ROOT/programs" -maxdepth 2 -name Cargo.toml -print | sed 's/^/  /'
  else
    warn "No existe carpeta programs/ (layout típico de Anchor)."
  fi

  # rust-toolchain(.toml)
  if [ -f "$ROOT/rust-toolchain.toml" ] || [ -f "$ROOT/rust-toolchain" ]; then
    ok "rust-toolchain* detectado (fija toolchain)."
    info "contenido:"
    cat "$ROOT/rust-toolchain.toml" 2>/dev/null || cat "$ROOT/rust-toolchain" 2>/dev/null || true
  else
    warn "No hay rust-toolchain(.toml). Recomendado para fijar versión compatible con Solana."
  fi

  # Cargo.lock versión
  if [ -f "$ROOT/Cargo.lock" ]; then
    VLINE=$(grep -m1 '^version = ' "$ROOT/Cargo.lock" | sed 's/[" ]//g' | cut -d= -f2 || echo "")
    if [ "$VLINE" = "4" ]; then
      warn "Cargo.lock usa version=4 (generado por cargo moderno)."
      warn "Si tu toolchain (o scripts) esperan v3 o requieren nightly con -Znext-lockfile-bump, habrá errores."
    else
      ok "Cargo.lock versión: ${VLINE:-desconocida}"
    fi
  fi

  # Node lockfiles
  if [ -f "$ROOT/package-lock.json" ] || [ -f "$ROOT/yarn.lock" ] || [ -f "$ROOT/pnpm-lock.yaml" ]; then
    ok "Lockfile(s) de Node detectados."
    if ! have corepack; then
      warn "corepack no instalado — Yarn/Pnpm podrían resolverse mal."
      [ $FIX -eq 1 ] && {
        if have node; then
          info "Habilitando corepack…"
          if corepack enable 2>/dev/null; then ok "corepack habilitado"; else warn "no se pudo habilitar corepack"; fi
        fi
      }
    fi
  fi

  # PATH Solana activo_release delante
  if have solana; then
    ACTIVE=$(dirname "$(dirname "$(which solana)")")
    # Ruta típica: ~/.local/share/solana/install/active_release/bin/solana
    case "$ACTIVE" in
      *"/solana/install/active_release/bin")
        ok "solana activo desde: $ACTIVE"
        ;;
      *)
        warn "solana no parece venir de active_release/bin. Actualiza tu PATH:"
        warn '  export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"'
        if [ $FIX -eq 1 ]; then
          SHELLRC="$HOME/.zshrc"
          [ -n "${BASH_VERSION:-}" ] && SHELLRC="$HOME/.bashrc"
          if ! grep -q 'solana/install/active_release/bin' "$SHELLRC" 2>/dev/null; then
            echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> "$SHELLRC"
            ok "Añadido a $SHELLRC (abre nueva terminal)."
          fi
        fi
        ;;
    esac
  fi

  # Chequeo leve de build (sin compilar todo)
  if have anchor && have cargo; then
    info "Verificando que Anchor vea el workspace (anchor keys, sin build pesado)…"
    try anchor keys list | sed 's/^/  /' || warn "No se pudieron listar keys (no crítico)."
  fi

  # Sugerencias conocidas
  sep "Sugerencias"
  if [ $SOL_OK -eq 0 ]; then
    err "Instala Solana CLI estable para obtener cargo-build-sbf."
  elif [ $CARGO_SBF_OK -eq 0 ]; then
    warn "Falta cargo-build-sbf. Solución rápida:"
    echo "  sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    echo "  # o bien:"
    echo "  cargo install cargo-build-sbf --locked"
  fi

  if [ -f "$ROOT/Cargo.lock" ] && grep -q '^version = 4' "$ROOT/Cargo.lock"; then
    warn "Si tu pipeline/Anchor se queja de lockfile v4:"
    echo "  • Usa un cargo reciente (>=1.82) o"
    echo "  • Regenera lock con una versión compatible del toolchain del proyecto:"
    echo "      rustup default <toolchain_compatible>"
    echo "      cargo update -w"
  fi

else
  sep "Proyecto"
  warn "No estás dentro de un repo git (o no hay proyecto Anchor). Párate en tu raíz y vuelve a correr el script."
fi

########################
# 5) Quick fixes (op)  #
########################
if [ $FIX -eq 1 ]; then
  sep "Aplicando fixes seguros"
  # Intento habilitar corepack si hay Node
  if have node; then
    if have corepack; then
      ok "corepack ya está habilitado."
    else
      info "Habilitando corepack…"
      corepack enable 2>/dev/null && ok "corepack habilitado" || warn "no se pudo habilitar corepack"
    fi
  fi
  # Recordatorio de update Solana
  if have solana; then
    info "Puedes actualizar Solana a estable con:"
    echo "  solana-install update"
  fi
  ok "Fixes mínimos aplicados. Abre una nueva terminal si se tocó el PATH."
fi

sep "Fin"
ok "Listo. Copia/pega este output si quieres que te diga exactamente qué falta y cómo arreglarlo."
