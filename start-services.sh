#!/usr/bin/env bash
set -euo pipefail

echo "🚀 INICIANDO TODOS LOS SERVICIOS GASLESS"
echo "======================================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {  echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"; }
err()  { echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"; }

# Verificación de setup
if [ ! -f "deployment-info.txt" ]; then
  err "No se encontró deployment-info.txt"
  echo "🔧 Ejecuta primero: ./setup-complete.sh"
  exit 1
fi

# Directorios base
ROOT_DIR="$(pwd)"                 # carpeta 'program'
LOG_DIR="${ROOT_DIR}/logs"        # logs absolutos
mkdir -p "${LOG_DIR}"

# Arranque de servicios de BD (macOS)
log "📊 Verificando bases de datos..."

start_brew_service_if_needed () {
  local svc="$1"
  local brew_name="$2"
  if ! pgrep -f "${svc}" >/dev/null 2>&1; then
    if command -v brew >/dev/null 2>&1; then
      if brew list --versions "${brew_name}" >/dev/null 2>&1; then
        log "Iniciando ${brew_name} con brew services..."
        brew services start "${brew_name}" >/dev/null 2>&1 || warn "No se pudo iniciar ${brew_name} con brew services"
      else
        warn "Homebrew instalado pero ${brew_name} no está instalado. (brew install ${brew_name})"
      fi
    else
      warn "Homebrew no encontrado. Puedes usar Docker para ${svc}."
    fi
  fi
}

# Redis
start_brew_service_if_needed "redis-server" "redis"
# MongoDB (solo si lo usas)
start_brew_service_if_needed "mongod" "mongodb-community@7.0"

# Función genérica para iniciar servicios Node
start_service() {
  local name="$1"       # backend | relayer | dashboard | nft-example
  local dir="$2"        # carpeta relativa al ROOT_DIR
  local command="$3"    # "npm run dev" etc.
  local port="${4:-}"   # número de puerto o cadena vacía/none

  log "Iniciando ${name}..."
  pushd "${ROOT_DIR}/${dir}" >/dev/null

  # Instalar deps si falta node_modules
  if [ ! -d "node_modules" ]; then
    log "[${name}] Instalando dependencias..."
    if [ -f "yarn.lock" ] && command -v yarn >/dev/null 2>&1; then
      yarn install --frozen-lockfile || yarn install
    else
      npm install
    fi
  fi

  # Matar proceso en puerto si aplica
  if [[ -n "${port}" && "${port}" != "none" ]]; then
    if lsof -Pi ":${port}" -sTCP:LISTEN -t >/dev/null 2>&1; then
      warn "Puerto ${port} ocupado, matando proceso existente..."
      kill -9 "$(lsof -Pi ":${port}" -sTCP:LISTEN -t)" 2>/dev/null || true
      sleep 2
    fi
  fi

  # Lanzar servicio con logs ABSOLUTOS (no ../logs)
  nohup ${command} > "${LOG_DIR}/${name}.log" 2>&1 &
  local pid=$!
  echo "${pid}" > "${LOG_DIR}/${name}.pid"
  log "${name} iniciado (PID: ${pid}, Puerto: ${port:-N/A})"

  popd >/dev/null
}

# 1) Backend
start_service "backend" "backend" "npm run dev" "3000"

# Esperar a que el backend responda /health
log "⏳ Esperando a que el backend esté listo..."
BACKEND_READY=0
for i in {1..40}; do
  if curl -sf "http://localhost:3000/health" >/dev/null 2>&1; then
    log "✅ Backend listo"
    BACKEND_READY=1
    break
  fi
  sleep 2
done
if [ "${BACKEND_READY}" -eq 0 ]; then
  warn "Backend tardó mucho en iniciar (http://localhost:3000/health no responde aún)"
fi

# 2) Relayer (sin puerto conocido)
start_service "relayer" "relayer" "npm run dev" "none"

# 3) Dashboard (Vite por defecto 5173)
start_service "dashboard" "dashboard" "npm run dev" "5173"

# 4) Example NFT (nota: está dos niveles abajo)
start_service "nft-example" "examples/nft-claim" "npm run dev" "5174"

# Verificaciones
log "⏳ Esperando a que todos los servicios estén listos..."
sleep 8

echo ""
echo "🔍 VERIFICANDO SERVICIOS"
echo "======================="

check_service() {
  local name="$1"
  local url="$2"
  if curl -sf "${url}" >/dev/null 2>&1; then
    echo -e "✅ ${name}: ${GREEN}Running${NC} (${url})"
  else
    echo -e "❌ ${name}: ${RED}Not responding${NC} (${url})"
  fi
}

# /health para backend; Vite devuelve HTML en '/', con curl -sf vale
check_service "Backend API" "http://localhost:3000/health"
check_service "Dashboard"   "http://localhost:5173/"
check_service "NFT Example" "http://localhost:5174/"

echo ""
echo "📋 PROCESOS ACTIVOS"
echo "=================="
show_process() {
  local name="$1"
  local pidfile="${LOG_DIR}/${name}.pid"
  if [ -f "${pidfile}" ]; then
    local pid
    pid=$(cat "${pidfile}")
    if ps -p "${pid}" >/dev/null 2>&1; then
      echo -e "✅ ${name}: PID ${pid}"
    else
      echo -e "❌ ${name}: Proceso no encontrado"
    fi
  else
    echo -e "❓ ${name}: PID file no encontrado"
  fi
}
show_process "backend"
show_process "relayer"
show_process "dashboard"
show_process "nft-example"

echo ""
echo "📄 LOGS EN TIEMPO REAL"
echo "====================="
echo "Backend:   tail -f ${LOG_DIR}/backend.log"
echo "Relayer:   tail -f ${LOG_DIR}/relayer.log"
echo "Dashboard: tail -f ${LOG_DIR}/dashboard.log"
echo "NFT Demo:  tail -f ${LOG_DIR}/nft-example.log"

echo ""
echo "🎉 TODOS LOS SERVICIOS INICIADOS"
echo "==============================="
echo "🌐 URLs:"
echo "  📊 Dashboard:   http://localhost:5173"
echo "  🎨 NFT Example: http://localhost:5174"
echo "  🔗 API Backend: http://localhost:3000"
echo "  📄 Health:      http://localhost:3000/health"
echo ""
echo "🔧 Detener todos: ./stop-services.sh"
echo ""

cat > "${ROOT_DIR}/session-info.txt" << EOF
GASLESS INFRASTRUCTURE SESSION
=============================

Started: $(date)
Services Running:
- Backend:  http://localhost:3000 (PID: $(cat "${LOG_DIR}/backend.pid" 2>/dev/null || echo "N/A"))
- Dashboard: http://localhost:5173 (PID: $(cat "${LOG_DIR}/dashboard.pid" 2>/dev/null || echo "N/A"))
- NFT Example: http://localhost:5174 (PID: $(cat "${LOG_DIR}/nft-example.pid" 2>/dev/null || echo "N/A"))
- Relayer: PID $(cat "${LOG_DIR}/relayer.pid" 2>/dev/null || echo "N/A")

Logs: ${LOG_DIR}
EOF

log "📄 Información de sesión guardada en ${ROOT_DIR}/session-info.txt"
