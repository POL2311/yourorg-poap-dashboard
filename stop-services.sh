#!/bin/bash

echo "🛑 DETENIENDO GASLESS INFRASTRUCTURE"
echo "===================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[STOP] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

stop_service() {
    local name=$1
    local pidfile="logs/$name.pid"
    
    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🔄 Deteniendo $name (PID: $pid)..."
            kill "$pid"
            
            # Esperar a que termine
            for i in {1..5}; do
                if ! kill -0 "$pid" 2>/dev/null; then
                    break
                fi
                sleep 1
            done
            
            # Force kill si es necesario
            if kill -0 "$pid" 2>/dev/null; then
                echo "   Forzando cierre..."
                kill -9 "$pid" 2>/dev/null
            fi
            
            rm "$pidfile"
            log "✅ $name detenido"
        else
            warn "⚠️  $name ya estaba detenido"
            rm "$pidfile"
        fi
    else
        warn "⚠️  PID file para $name no encontrado"
    fi
}

# Detener servicios
stop_service "backend"
stop_service "nft-example"
stop_service "relayer"
stop_service "dashboard"

# Limpiar puertos si están ocupados
echo ""
echo "🧹 Limpiando puertos..."

# Función para matar procesos en puerto específico
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "   Liberando puerto $port..."
        echo $pids | xargs kill -9 2>/dev/null
    fi
}

kill_port 3000  # Backend
kill_port 5173  # Dashboard
kill_port 5174  # NFT Example

echo ""
log "✅ TODOS LOS SERVICIOS DETENIDOS"
echo ""
echo "📊 Para verificar:"
echo "   ps aux | grep node"
echo "   lsof -i :3000,5173,5174"
echo ""
echo "🚀 Para reiniciar:"
echo "   ./start-magical-demo.sh"
echo ""