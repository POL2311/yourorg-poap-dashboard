#!/usr/bin/env bash
set -e

# 1) Carga env en un subshell login-like (no ensucia tu shell)
# 2) Localiza Anchor.toml empezando en el cwd
# 3) Se mete a ese dir y ejecuta anchor build

bash -lc '
set -e

# Cargar entorno (añade scripts/bin al PATH y fija vars de Anchor)
source scripts/load-env.sh

# Buscar Anchor.toml en el directorio actual y subdirectorios (máx. 2 niveles por rapidez)
ANCHOR_DIR=""
if [ -f "Anchor.toml" ]; then
  ANCHOR_DIR="."
else
  # intenta rutas comunes primero
  for d in ./gasless_infrastructure_program ./program ./anchor ./app ./workspace; do
    if [ -f "$d/Anchor.toml" ]; then
      ANCHOR_DIR="$d"
      break
    fi
  done
  # si no lo encontró, busca 2 niveles
  if [ -z "$ANCHOR_DIR" ]; then
    ANCHOR_DIR="$(find . -maxdepth 2 -type f -name Anchor.toml -exec dirname {} \; | head -n 1 || true)"
  fi
fi

if [ -z "$ANCHOR_DIR" ]; then
  echo "❌ No encontré Anchor.toml. Ubícate en la raíz del repo y asegúrate de tener un proyecto Anchor."
  exit 1
fi

echo "📁 Workspace Anchor: $ANCHOR_DIR"
cd "$ANCHOR_DIR"

# Build
anchor build "$@"
' -- "$@"
