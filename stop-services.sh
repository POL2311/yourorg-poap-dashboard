#!/bin/bash

echo "🛑 DETENIENDO TODOS LOS SERVICIOS GASLESS"
echo "========================================"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

# Función para detener servicio
stop_service() {
    local name=$1
    local port=$2
    
    log "Deteniendo $name..."
    
    # Detener por PID file si existe
    if [ -f "logs/$name.pid" ]; then
        local pid=$(cat logs/$name.pid)
        if ps -p $pid > /dev/null 2>&1; then
            kill -TERM $pid 2>/dev/null
            sleep 3
            if ps -p $pid > /dev/null 2>&1; then
                warn "Proceso $name no respondió a SIGTERM, usando SIGKILL..."
                kill -9 $pid 2>/dev/null
            fi
            log "$name detenido (PID: $pid)"
        else
            warn "Proceso $name ya no está corriendo"
        fi
        rm -f logs/$name.pid
    fi
    
    # Detener por puerto si se especifica
    if [ "$port" != "none" ] && [ -n "$port" ]; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            local port_pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
            warn "Proceso adicional encontrado en puerto $port (PID: $port_pid)"
            kill -9 $port_pid 2>/dev/null
        fi
    fi
}

# Detener servicios en orden inverso
stop_service "nft-example" "5174"
stop_service "dashboard" "5173"
stop_service "relayer" "none"
stop_service "backend" "3000"

# Limpiar procesos node adicionales relacionados con el proyecto
log "🧹 Limpiando procesos adicionales..."

# Buscar procesos node que puedan estar relacionados
NODE_PROCESSES=$(ps aux | grep -E "(npm run dev|vite|ts-node)" | grep -v grep | awk '{print $2}' || true)

if [ -n "$NODE_PROCESSES" ]; then
    warn "Encontrados procesos Node.js adicionales, deteniéndolos..."
    echo "$NODE_PROCESSES" | xargs -r kill -9 2>/dev/null || true
fi

# Verificar que los puertos estén libres
echo ""
echo "🔍 VERIFICANDO PUERTOS"
echo "====================="

check_port() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "❌ Puerto $port ($name): ${RED}Aún ocupado${NC}"
        local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        warn "Proceso en puerto $port: PID $pid"
        # Forzar cierre
        kill -9 $pid 2>/dev/null || true
    else
        echo -e "✅ Puerto $port ($name): ${GREEN}Libre${NC}"
    fi
}

check_port "3000" "Backend"
check_port "5173" "Dashboard"
check_port "5174" "NFT Example"

# Limpiar archivos temporales
log "🧹 Limpiando archivos temporales..."

# Limpiar logs antiguos (mantener solo los últimos)
if [ -d "logs" ]; then
    find logs -name "*.log" -mtime +1 -delete 2>/dev/null || true
fi

# Limpiar archivos de sesión
rm -f session-info.txt

echo ""
echo "✅ TODOS LOS SERVICIOS DETENIDOS"
echo "==============================="
echo ""
echo "📊 Estado final:"
echo "   - Todos los procesos detenidos"
echo "   - Puertos liberados"
echo "   - Archivos temporales limpiados"
echo ""
echo "🚀 Para volver a iniciar:"
echo "   ./start-services.sh"
echo ""
echo "🔧 Para setup completo desde cero:"
echo "   ./setup-complete.sh"
echo ""

# Verificación final
REMAINING_PROCESSES=$(ps aux | grep -E "(gasless|npm run dev)" | grep -v grep | wc -l)
if [ "$REMAINING_PROCESSES" -gt 0 ]; then
    warn "Aún hay $REMAINING_PROCESSES procesos relacionados corriendo"
    echo "Para ver procesos restantes: ps aux | grep -E '(gasless|npm run dev)' | grep -v grep"
else
    log "✅ No hay procesos relacionados corriendo"
fi