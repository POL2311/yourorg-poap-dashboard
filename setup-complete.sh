#!/bin/bash

echo "🚀 GASLESS INFRASTRUCTURE - SETUP COMPLETO"
echo "=========================================="

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
    exit 1
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

# Verificar que estamos en el directorio correcto
if [ ! -d "gasless_infrastructure_program" ]; then
    error "Directorio gasless_infrastructure_program no encontrado. Ejecuta desde el directorio raíz del proyecto."
fi

# Hacer scripts ejecutables
chmod +x setup-environment.sh
chmod +x deploy-program.sh

echo ""
step "PASO 1: Configurando ambiente de desarrollo"
echo "============================================"
./setup-environment.sh

if [ $? -ne 0 ]; then
    error "Falló la configuración del ambiente"
fi

echo ""
step "PASO 2: Building y deploying programa Solana"
echo "============================================"
./deploy-program.sh

if [ $? -ne 0 ]; then
    error "Falló el deployment del programa"
fi

echo ""
step "PASO 3: Instalando dependencias de Node.js"
echo "==========================================="

# Backend
if [ -d "backend" ]; then
    info "Instalando dependencias del backend..."
    cd backend
    npm install
    cd ..
    log "✅ Backend dependencies instaladas"
fi

# Relayer
if [ -d "relayer" ]; then
    info "Instalando dependencias del relayer..."
    cd relayer
    npm install
    cd ..
    log "✅ Relayer dependencies instaladas"
fi

# Dashboard
if [ -d "dashboard" ]; then
    info "Instalando dependencias del dashboard..."
    cd dashboard
    npm install
    cd ..
    log "✅ Dashboard dependencies instaladas"
fi

# SDK
if [ -d "sdk" ]; then
    info "Instalando dependencias del SDK..."
    cd sdk
    npm install
    npm run build
    cd ..
    log "✅ SDK dependencies instaladas y built"
fi

# NFT Example
if [ -d "examples/nft-claim" ]; then
    info "Instalando dependencias del ejemplo NFT..."
    cd examples/nft-claim
    npm install
    cd ../..
    log "✅ NFT Example dependencies instaladas"
fi

echo ""
step "PASO 4: Configurando variables de entorno"
echo "========================================="

# Leer información de deployment
if [ -f "deployment-info.txt" ]; then
    PROGRAM_ID=$(grep "Program ID:" deployment-info.txt | cut -d' ' -f3)
    ADMIN_WALLET=$(grep "Admin Wallet:" deployment-info.txt | cut -d' ' -f3)
    RELAYER_WALLET=$(grep "Relayer Wallet:" deployment-info.txt | cut -d' ' -f3)
    MASTER_TREASURY=$(grep "Master Treasury:" deployment-info.txt | cut -d' ' -f3)
    
    info "Program ID: $PROGRAM_ID"
    info "Admin Wallet: $ADMIN_WALLET"
    info "Relayer Wallet: $RELAYER_WALLET"
    info "Master Treasury: $MASTER_TREASURY"
else
    error "deployment-info.txt no encontrado"
fi

# Configurar backend .env
if [ -d "backend" ]; then
    cat > backend/.env << EOF
# Gasless Infrastructure Backend Configuration
PORT=3000
NODE_ENV=development

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=$PROGRAM_ID
ADMIN_WALLET=$ADMIN_WALLET
MASTER_TREASURY_PRIVATE_KEY=$(cat keys/master-treasury-keypair.json | tr -d '\n' | tr -d ' ')

# Database (optional)
MONGODB_URI=mongodb://localhost:27017/gasless
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=gasless_infrastructure_jwt_secret_$(date +%s)

# Services
DEFAULT_SERVICE_ID=nft-claim-example
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Logging
LOG_LEVEL=info
EOF
    log "✅ Backend .env configurado"
fi

# Configurar relayer .env
if [ -d "relayer" ]; then
    cat > relayer/.env << EOF
# Gasless Infrastructure Relayer Configuration
NODE_ENV=development

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=$PROGRAM_ID
RELAYER_PRIVATE_KEY=$(cat keys/relayer-keypair.json | tr -d '\n' | tr -d ' ')
MASTER_TREASURY_PRIVATE_KEY=$(cat keys/master-treasury-keypair.json | tr -d '\n' | tr -d ' ')

# API Configuration
API_URL=http://localhost:3000
RELAYER_API_KEY=relayer_api_key_$(date +%s)

# Processing Configuration
PERMIT_POLL_INTERVAL=2000
MAX_RETRIES=3
BATCH_SIZE=10

# Database (optional)
MONGODB_URI=mongodb://localhost:27017/gasless
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
EOF
    log "✅ Relayer .env configurado"
fi

# Configurar dashboard .env
if [ -d "dashboard" ]; then
    cat > dashboard/.env << EOF
# Gasless Infrastructure Dashboard Configuration
VITE_API_URL=http://localhost:3000
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_PROGRAM_ID=$PROGRAM_ID
VITE_NETWORK=devnet
EOF
    log "✅ Dashboard .env configurado"
fi

# Configurar NFT example .env
if [ -d "examples/nft-claim" ]; then
    cat > examples/nft-claim/.env << EOF
# NFT Claim Example Configuration
VITE_GASLESS_API_URL=http://localhost:3000
VITE_GASLESS_SERVICE_ID=nft-claim-example
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_PROGRAM_ID=$PROGRAM_ID
VITE_NETWORK=devnet
EOF
    log "✅ NFT Example .env configurado"
fi

echo ""
step "PASO 5: Inicializando protocolo en blockchain"
echo "============================================="

# Instalar dependencias para el script de inicialización
npm install @solana/web3.js @coral-xyz/anchor

# Ejecutar inicialización
node initialize-protocol.js

if [ $? -ne 0 ]; then
    error "Falló la inicialización del protocolo"
fi

echo ""
step "PASO 6: Creando scripts de gestión"
echo "=================================="

# Script para iniciar servicios
cat > start-services.sh << 'EOF'
#!/bin/bash

echo "🚀 INICIANDO SERVICIOS GASLESS INFRASTRUCTURE"
echo "============================================="

# Crear directorio de logs
mkdir -p logs

# Función para iniciar servicio en background
start_service() {
    local name=$1
    local dir=$2
    local command=$3
    local port=$4
    
    echo "🔄 Iniciando $name..."
    
    cd $dir
    nohup $command > ../logs/$name.log 2>&1 &
    local pid=$!
    echo $pid > ../logs/$name.pid
    cd ..
    
    echo "✅ $name iniciado (PID: $pid, Puerto: $port)"
    echo "   Logs: tail -f logs/$name.log"
}

# Iniciar backend
if [ -d "backend" ]; then
    start_service "backend" "backend" "npm run dev" "3000"
fi

# Iniciar relayer
if [ -d "relayer" ]; then
    start_service "relayer" "relayer" "npm run dev" "N/A"
fi

# Iniciar dashboard
if [ -d "dashboard" ]; then
    start_service "dashboard" "dashboard" "npm run dev" "5173"
fi

# Iniciar NFT example
if [ -d "examples/nft-claim" ]; then
    start_service "nft-example" "examples/nft-claim" "npm run dev" "5174"
fi

echo ""
echo "🎉 TODOS LOS SERVICIOS INICIADOS"
echo "==============================="
echo ""
echo "📱 URLs disponibles:"
echo "   Backend API: http://localhost:3000"
echo "   Dashboard: http://localhost:5173"
echo "   NFT Example: http://localhost:5174"
echo ""
echo "📊 Para monitorear:"
echo "   ./utils.sh status"
echo "   ./utils.sh logs"
echo ""
echo "🛑 Para detener:"
echo "   ./stop-services.sh"
echo ""
EOF

# Script para detener servicios
cat > stop-services.sh << 'EOF'
#!/bin/bash

echo "🛑 DETENIENDO SERVICIOS GASLESS INFRASTRUCTURE"
echo "=============================================="

stop_service() {
    local name=$1
    local pidfile="logs/$name.pid"
    
    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🔄 Deteniendo $name (PID: $pid)..."
            kill "$pid"
            rm "$pidfile"
            echo "✅ $name detenido"
        else
            echo "⚠️  $name ya estaba detenido"
            rm "$pidfile"
        fi
    else
        echo "⚠️  PID file para $name no encontrado"
    fi
}

# Detener servicios
stop_service "backend"
stop_service "relayer"
stop_service "dashboard"
stop_service "nft-example"

echo ""
echo "✅ TODOS LOS SERVICIOS DETENIDOS"
echo ""
EOF

# Script de utilidades
cat > utils.sh << 'EOF'
#!/bin/bash

case "$1" in
    "status")
        echo "📊 ESTADO DE SERVICIOS"
        echo "====================="
        
        check_service() {
            local name=$1
            local port=$2
            local pidfile="logs/$name.pid"
            
            if [ -f "$pidfile" ]; then
                local pid=$(cat "$pidfile")
                if kill -0 "$pid" 2>/dev/null; then
                    if [ "$port" != "N/A" ]; then
                        if curl -s "http://localhost:$port" >/dev/null; then
                            echo "✅ $name: RUNNING (PID: $pid, Port: $port)"
                        else
                            echo "⚠️  $name: PROCESS RUNNING but PORT NOT RESPONDING (PID: $pid, Port: $port)"
                        fi
                    else
                        echo "✅ $name: RUNNING (PID: $pid)"
                    fi
                else
                    echo "❌ $name: STOPPED (stale PID file)"
                    rm "$pidfile"
                fi
            else
                echo "❌ $name: STOPPED"
            fi
        }
        
        check_service "backend" "3000"
        check_service "relayer" "N/A"
        check_service "dashboard" "5173"
        check_service "nft-example" "5174"
        ;;
        
    "logs")
        echo "📋 LOGS DISPONIBLES"
        echo "=================="
        echo "1. backend"
        echo "2. relayer"
        echo "3. dashboard"
        echo "4. nft-example"
        echo ""
        read -p "Selecciona servicio (1-4): " choice
        
        case $choice in
            1) tail -f logs/backend.log ;;
            2) tail -f logs/relayer.log ;;
            3) tail -f logs/dashboard.log ;;
            4) tail -f logs/nft-example.log ;;
            *) echo "Opción inválida" ;;
        esac
        ;;
        
    "restart")
        echo "🔄 REINICIANDO SERVICIOS"
        echo "======================="
        ./stop-services.sh
        sleep 2
        ./start-services.sh
        ;;
        
    "balances")
        echo "💰 BALANCES DE WALLETS"
        echo "====================="
        echo "Admin: $(solana balance ~/.config/solana/id.json 2>/dev/null || echo 'Error')"
        echo "Relayer: $(solana balance keys/relayer-keypair.json 2>/dev/null || echo 'Error')"
        echo "Master Treasury: $(solana balance keys/master-treasury-keypair.json 2>/dev/null || echo 'Error')"
        ;;
        
    "airdrop")
        echo "🪙 OBTENIENDO SOL"
        echo "================"
        solana airdrop 2 ~/.config/solana/id.json
        solana airdrop 2 keys/relayer-keypair.json
        solana airdrop 2 keys/master-treasury-keypair.json
        echo "✅ Airdrop completado"
        ;;
        
    *)
        echo "🛠️  UTILIDADES GASLESS INFRASTRUCTURE"
        echo "===================================="
        echo ""
        echo "Uso: ./utils.sh [comando]"
        echo ""
        echo "Comandos disponibles:"
        echo "  status    - Ver estado de servicios"
        echo "  logs      - Ver logs de servicios"
        echo "  restart   - Reiniciar todos los servicios"
        echo "  balances  - Ver balances de wallets"
        echo "  airdrop   - Obtener SOL para todas las wallets"
        echo ""
        ;;
esac
EOF

# Hacer scripts ejecutables
chmod +x start-services.sh
chmod +x stop-services.sh
chmod +x utils.sh

log "✅ Scripts de gestión creados"

echo ""
echo "🎉 SETUP COMPLETO EXITOSO"
echo "========================="
echo ""
echo "📋 Resumen de lo configurado:"
echo "   ✅ Ambiente de desarrollo (Rust, Solana, Anchor, Node.js)"
echo "   ✅ Programa Solana deployado en devnet"
echo "   ✅ Protocolo inicializado en blockchain"
echo "   ✅ Relayer autorizado"
echo "   ✅ Servicio de ejemplo registrado"
echo "   ✅ Dependencias de Node.js instaladas"
echo "   ✅ Variables de entorno configuradas"
echo "   ✅ Scripts de gestión creados"
echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo "   1. ./start-services.sh (iniciar todos los servicios)"
echo "   2. Ir a http://localhost:5174 (probar ejemplo NFT)"
echo "   3. ./utils.sh status (verificar estado)"
echo ""
echo "📊 INFORMACIÓN IMPORTANTE:"
cat deployment-info.txt
echo ""
echo "🎯 ¡Tu infraestructura gasless está lista para usar!"
echo ""