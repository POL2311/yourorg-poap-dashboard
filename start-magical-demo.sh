#!/bin/bash

echo "🚀 INICIANDO GASLESS INFRASTRUCTURE - MODO SIMULACIÓN"
echo "===================================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

step() {
    echo -e "${PURPLE}[STEP] $1${NC}"
}

# Crear directorio de logs
mkdir -p logs

# Función para iniciar servicio en background
start_service() {
    local name=$1
    local dir=$2
    local command=$3
    local port=$4
    
    step "Iniciando $name..."
    
    if [ ! -d "$dir" ]; then
        error "$dir no existe"
        return 1
    fi
    
    cd $dir
    
    # Instalar dependencias si no existen
    if [ ! -d "node_modules" ] && [ -f "package.json" ]; then
        info "Instalando dependencias de $name..."
        npm install
    fi
    
    # Iniciar servicio
    nohup $command > ../logs/$name.log 2>&1 &
    local pid=$!
    echo $pid > ../logs/$name.pid
    cd ..
    
    # Verificar que inició correctamente
    sleep 2
    if kill -0 $pid 2>/dev/null; then
        log "✅ $name iniciado (PID: $pid, Puerto: $port)"
        echo "   Logs: tail -f logs/$name.log"
        return 0
    else
        error "❌ $name falló al iniciar"
        return 1
    fi
}

# Verificar Node.js
if ! command -v node >/dev/null 2>&1; then
    error "Node.js no está instalado"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    error "npm no está instalado"
    exit 1
fi

log "✅ Node.js $(node --version) y npm $(npm --version) disponibles"

echo ""
step "PASO 1: Iniciando Backend (Simulación Completa)"
echo "=============================================="

if start_service "backend" "backend" "npm run dev" "3000"; then
    # Esperar a que el backend esté listo
    info "Esperando a que el backend esté listo..."
    for i in {1..10}; do
        if curl -s http://localhost:3000/health >/dev/null 2>&1; then
            log "✅ Backend respondiendo en http://localhost:3000"
            break
        fi
        sleep 1
    done
else
    error "No se pudo iniciar el backend"
    exit 1
fi

echo ""
step "PASO 2: Iniciando Frontend NFT Example"
echo "======================================"

if start_service "nft-example" "examples/nft-claim" "npm run dev" "5174"; then
    # Esperar a que el frontend esté listo
    info "Esperando a que el frontend esté listo..."
    for i in {1..15}; do
        if curl -s http://localhost:5174 >/dev/null 2>&1; then
            log "✅ Frontend respondiendo en http://localhost:5174"
            break
        fi
        sleep 1
    done
else
    warn "Frontend puede tardar en iniciar, continuando..."
fi

echo ""
step "PASO 3: Verificando Sistema"
echo "=========================="

# Verificar backend
info "Probando endpoint de health..."
if curl -s http://localhost:3000/health | grep -q '"ok":true'; then
    log "✅ Backend health check OK"
else
    warn "⚠️  Backend health check falló"
fi

# Verificar endpoint mágico
info "Probando endpoint mágico..."
if curl -s http://localhost:3000/api/permits/claim-nft-simple -X POST -H "Content-Type: application/json" -d '{}' | grep -q 'userPublicKey is required'; then
    log "✅ Endpoint mágico respondiendo correctamente"
else
    warn "⚠️  Endpoint mágico puede tener problemas"
fi

echo ""
log "🎉 GASLESS INFRASTRUCTURE INICIADO EXITOSAMENTE"
echo "=============================================="
echo ""
echo "📱 URLs disponibles:"
echo "   🎨 NFT Claim (Frontend): http://localhost:5174"
echo "   🔗 Backend API: http://localhost:3000"
echo "   📊 Health Check: http://localhost:3000/health"
echo "   ✨ Endpoint Mágico: POST http://localhost:3000/api/permits/claim-nft-simple"
echo ""
echo "🎯 CÓMO PROBAR LA MAGIA:"
echo "   1. Ir a http://localhost:5174"
echo "   2. Conectar wallet (Phantom, Solflare, etc.)"
echo "   3. Click en 'Claim Free NFT (No Gas!)'"
echo "   4. ¡Ver la magia suceder!"
echo ""
echo "📊 Para monitorear:"
echo "   - Backend logs: tail -f logs/backend.log"
echo "   - Frontend logs: tail -f logs/nft-example.log"
echo "   - Treasury stats: curl http://localhost:3000/api/treasury/stats"
echo ""
echo "🛑 Para detener:"
echo "   ./stop-services.sh"
echo ""
echo "✨ CARACTERÍSTICAS DE LA SIMULACIÓN:"
echo "   💰 Master Treasury con 10 SOL simulados"
echo "   🎨 NFT minting completamente simulado"
echo "   📊 Base de datos en memoria"
echo "   🔗 Sin dependencias de blockchain real"
echo "   ⚡ Experiencia de usuario 100% mágica"
echo ""

# Mostrar estadísticas iniciales
info "Obteniendo estadísticas iniciales..."
sleep 2
if command -v curl >/dev/null 2>&1; then
    echo ""
    echo "📊 ESTADÍSTICAS INICIALES:"
    curl -s http://localhost:3000/api/treasury/stats | python3 -m json.tool 2>/dev/null || echo "   (Estadísticas no disponibles aún)"
fi

echo ""
log "🚀 ¡Sistema listo para demostrar la experiencia gasless mágica!"