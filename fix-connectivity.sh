#!/bin/bash

echo "🔧 SOLUCIONANDO PROBLEMAS DE CONECTIVIDAD"
echo "========================================"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[FIX] $1${NC}"
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

# Función para probar conectividad
test_rpc() {
    local url=$1
    local name=$2
    
    info "Probando conectividad con $name ($url)..."
    
    if curl -s -m 10 -X POST -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
        "$url" >/dev/null 2>&1; then
        log "✅ $name: Conectividad OK"
        return 0
    else
        warn "❌ $name: Sin conectividad"
        return 1
    fi
}

# Lista de RPCs alternativos para probar
declare -a RPC_ENDPOINTS=(
    "https://api.devnet.solana.com"
    "https://devnet.helius-rpc.com"
    "https://rpc.ankr.com/solana_devnet"
    "https://solana-devnet.g.alchemy.com/v2/demo"
    "https://devnet.sonic.game"
    "http://localhost:8899"
)

declare -a RPC_NAMES=(
    "Solana Official Devnet"
    "Helius Devnet"
    "Ankr Devnet"
    "Alchemy Devnet"
    "Sonic Devnet"
    "Local Validator"
)

echo ""
info "Probando conectividad con diferentes RPCs..."

WORKING_RPC=""
WORKING_NAME=""

for i in "${!RPC_ENDPOINTS[@]}"; do
    if test_rpc "${RPC_ENDPOINTS[$i]}" "${RPC_NAMES[$i]}"; then
        WORKING_RPC="${RPC_ENDPOINTS[$i]}"
        WORKING_NAME="${RPC_NAMES[$i]}"
        break
    fi
done

if [ -n "$WORKING_RPC" ]; then
    log "✅ RPC funcional encontrado: $WORKING_NAME"
    log "   URL: $WORKING_RPC"
    
    # Configurar Solana CLI con RPC funcional
    info "Configurando Solana CLI..."
    
    # Crear configuración de Solana si no existe
    mkdir -p ~/.config/solana
    
    # Configurar RPC
    if command -v solana >/dev/null 2>&1; then
        solana config set --url "$WORKING_RPC"
        log "✅ Solana CLI configurado con $WORKING_NAME"
    else
        warn "Solana CLI no disponible, configurando manualmente..."
        
        cat > ~/.config/solana/cli/config.yml << EOF
json_rpc_url: "$WORKING_RPC"
websocket_url: ""
keypair_path: ~/.config/solana/id.json
address_labels:
  "11111111111111111111111111111111": System Program
commitment: confirmed
EOF
        log "✅ Configuración manual de Solana creada"
    fi
    
    # Actualizar Anchor.toml
    if [ -f "gasless_infrastructure_program/Anchor.toml" ]; then
        info "Actualizando Anchor.toml..."
        
        # Determinar cluster basado en RPC
        CLUSTER="devnet"
        if [[ "$WORKING_RPC" == *"localhost"* ]]; then
            CLUSTER="localnet"
        fi
        
        cat > gasless_infrastructure_program/Anchor.toml << EOF
[toolchain]

[features]
resolution = true
skip-lint = false

[programs.devnet]
gasless_infrastructure = "49LhAwtW2UEbaLVGbZkgniT7XFGfFXMDnTUsboojgmQS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "$CLUSTER"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"

[[test.validator.account]]
address = "49LhAwtW2UEbaLVGbZkgniT7XFGfFXMDnTUsboojgmQS"
filename = "target/deploy/gasless_infrastructure.so"

[test.validator]
url = "$WORKING_RPC"
EOF
        log "✅ Anchor.toml actualizado"
    fi
    
else
    error "❌ No se pudo conectar a ningún RPC"
    warn "Iniciando validador local como alternativa..."
    
    # Intentar iniciar validador local
    if command -v solana-test-validator >/dev/null 2>&1; then
        info "Iniciando solana-test-validator..."
        
        # Matar cualquier validador existente
        pkill -f solana-test-validator 2>/dev/null || true
        
        # Iniciar validador en background
        nohup solana-test-validator \
            --ledger /tmp/test-ledger \
            --reset \
            --quiet \
            --rpc-port 8899 \
            --faucet-port 9900 \
            > /tmp/validator.log 2>&1 &
        
        # Esperar a que inicie
        sleep 5
        
        # Probar conectividad
        if test_rpc "http://localhost:8899" "Local Validator"; then
            WORKING_RPC="http://localhost:8899"
            WORKING_NAME="Local Validator"
            
            # Configurar Solana CLI
            if command -v solana >/dev/null 2>&1; then
                solana config set --url "http://localhost:8899"
            fi
            
            # Actualizar Anchor.toml para localnet
            cat > gasless_infrastructure_program/Anchor.toml << EOF
[toolchain]

[features]
resolution = true
skip-lint = false

[programs.localnet]
gasless_infrastructure = "49LhAwtW2UEbaLVGbZkgniT7XFGfFXMDnTUsboojgmQS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
EOF
            
            log "✅ Validador local iniciado y configurado"
        else
            error "❌ No se pudo iniciar validador local"
        fi
    else
        error "❌ solana-test-validator no disponible"
    fi
fi

# Actualizar archivos .env con RPC funcional
if [ -n "$WORKING_RPC" ]; then
    info "Actualizando archivos .env..."
    
    # Backend
    if [ -f "backend/.env" ]; then
        sed -i "s|SOLANA_RPC_URL=.*|SOLANA_RPC_URL=$WORKING_RPC|g" backend/.env
        log "✅ Backend .env actualizado"
    fi
    
    # Relayer
    if [ -f "relayer/.env" ]; then
        sed -i "s|SOLANA_RPC_URL=.*|SOLANA_RPC_URL=$WORKING_RPC|g" relayer/.env
        log "✅ Relayer .env actualizado"
    fi
    
    # Dashboard
    if [ -f "dashboard/.env" ]; then
        sed -i "s|VITE_SOLANA_RPC_URL=.*|VITE_SOLANA_RPC_URL=$WORKING_RPC|g" dashboard/.env
        log "✅ Dashboard .env actualizado"
    fi
    
    # NFT Example
    if [ -f "examples/nft-claim/.env" ]; then
        sed -i "s|VITE_SOLANA_RPC_URL=.*|VITE_SOLANA_RPC_URL=$WORKING_RPC|g" examples/nft-claim/.env
        log "✅ NFT Example .env actualizado"
    fi
fi

echo ""
if [ -n "$WORKING_RPC" ]; then
    log "🎉 PROBLEMA DE CONECTIVIDAD SOLUCIONADO"
    echo "======================================"
    echo ""
    echo "✅ RPC funcional: $WORKING_NAME"
    echo "✅ URL: $WORKING_RPC"
    echo "✅ Configuración actualizada"
    echo ""
    echo "🚀 Próximo paso:"
    echo "   ./deploy-program.sh"
    echo ""
else
    error "❌ NO SE PUDO SOLUCIONAR LA CONECTIVIDAD"
    echo ""
    echo "🔧 Alternativas:"
    echo "1. Usar ambiente local con mejor conectividad"
    echo "2. Configurar proxy/VPN"
    echo "3. Usar modo simulación"
    echo ""
fi