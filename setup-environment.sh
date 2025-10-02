#!/bin/bash

echo "🚀 CONFIGURANDO AMBIENTE GASLESS INFRASTRUCTURE"
echo "=============================================="

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SETUP] $1${NC}"
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

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para instalar Rust si no existe
install_rust() {
    if ! command_exists rustc; then
        warn "Rust no encontrado, instalando..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
        log "✅ Rust instalado"
    else
        log "✅ Rust ya está instalado: $(rustc --version)"
    fi
}

# Función para instalar Solana CLI
install_solana() {
    if ! command_exists solana; then
        warn "Solana CLI no encontrado, instalando..."
        sh -c "$(curl -sSfL https://release.solana.com/v1.18.18/install)"
        export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
        log "✅ Solana CLI instalado"
    else
        log "✅ Solana CLI ya está instalado: $(solana --version)"
    fi
}

# Función para instalar Anchor
install_anchor() {
    if ! command_exists anchor; then
        warn "Anchor no encontrado, instalando..."
        npm install -g @coral-xyz/anchor-cli
        log "✅ Anchor instalado"
    else
        log "✅ Anchor ya está instalado: $(anchor --version)"
    fi
}

# Función para instalar Node.js si no existe
install_node() {
    if ! command_exists node; then
        warn "Node.js no encontrado, instalando..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
        log "✅ Node.js instalado"
    else
        log "✅ Node.js ya está instalado: $(node --version)"
    fi
}

# Función para configurar Solana
configure_solana() {
    info "Configurando Solana para devnet..."
    
    # Configurar cluster
    solana config set --url https://api.devnet.solana.com
    
    # Crear directorio de keys si no existe
    mkdir -p keys
    
    # Generar keypair de admin si no existe
    if [ ! -f ~/.config/solana/id.json ]; then
        solana-keygen new --no-bip39-passphrase --silent --outfile ~/.config/solana/id.json
        log "✅ Admin keypair generado"
    else
        log "✅ Admin keypair ya existe"
    fi
    
    # Generar relayer keypair si no existe
    if [ ! -f keys/relayer-keypair.json ]; then
        solana-keygen new --no-bip39-passphrase --silent --outfile keys/relayer-keypair.json
        log "✅ Relayer keypair generado"
    else
        log "✅ Relayer keypair ya existe"
    fi
    
    # Generar master treasury keypair si no existe
    if [ ! -f keys/master-treasury-keypair.json ]; then
        solana-keygen new --no-bip39-passphrase --silent --outfile keys/master-treasury-keypair.json
        log "✅ Master treasury keypair generado"
    else
        log "✅ Master treasury keypair ya existe"
    fi
    
    # Obtener SOL para todas las wallets
    info "Obteniendo SOL para wallets..."
    solana airdrop 2 ~/.config/solana/id.json || warn "Airdrop falló para admin"
    solana airdrop 2 keys/relayer-keypair.json || warn "Airdrop falló para relayer"
    solana airdrop 2 keys/master-treasury-keypair.json || warn "Airdrop falló para master treasury"
    
    # Mostrar balances
    info "Balances actuales:"
    echo "Admin: $(solana balance ~/.config/solana/id.json 2>/dev/null || echo 'Error')"
    echo "Relayer: $(solana balance keys/relayer-keypair.json 2>/dev/null || echo 'Error')"
    echo "Master Treasury: $(solana balance keys/master-treasury-keypair.json 2>/dev/null || echo 'Error')"
}

# Función para configurar el programa Anchor
setup_anchor_program() {
    info "Configurando programa Anchor..."
    
    cd gasless_infrastructure_program
    
    # Instalar dependencias si package.json existe
    if [ -f package.json ]; then
        npm install
        log "✅ Dependencias de Node.js instaladas"
    fi
    
    # Configurar Anchor.toml para devnet
    cat > Anchor.toml << EOF
[toolchain]

[features]
resolution = true
skip-lint = false

[programs.devnet]
gasless_infrastructure = "55NZkybMneNX4a1C9dDTtWUq1iv3NRprpgMxRSjRoUSX"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
EOF
    
    log "✅ Anchor.toml configurado para devnet"
    
    cd ..
}

# Función principal
main() {
    log "Iniciando configuración del ambiente..."
    
    # Actualizar sistema
    info "Actualizando sistema..."
    sudo apt-get update -qq
    
    # Instalar herramientas básicas
    sudo apt-get install -y curl wget git build-essential pkg-config libudev-dev
    
    # Instalar herramientas de desarrollo
    install_node
    install_rust
    install_solana
    install_anchor
    
    # Configurar Solana
    configure_solana
    
    # Configurar programa
    setup_anchor_program
    
    # Crear archivo de información de deployment
    cat > deployment-info.txt << EOF
GASLESS INFRASTRUCTURE DEPLOYMENT INFO
=====================================

Program ID: 55NZkybMneNX4a1C9dDTtWUq1iv3NRprpgMxRSjRoUSX
Admin Wallet: $(solana-keygen pubkey ~/.config/solana/id.json 2>/dev/null || echo 'Error')
Relayer Wallet: $(solana-keygen pubkey keys/relayer-keypair.json 2>/dev/null || echo 'Error')
Master Treasury: $(solana-keygen pubkey keys/master-treasury-keypair.json 2>/dev/null || echo 'Error')

Deployment Date: $(date)
Network: Devnet
RPC: https://api.devnet.solana.com

Services:
- Backend: http://localhost:3000
- Dashboard: http://localhost:5173
- NFT Example: http://localhost:5174

Next Steps:
1. Run: anchor build
2. Run: anchor deploy
3. Run: ./start-services.sh
4. Test at: http://localhost:5174
EOF
    
    log "✅ Información de deployment guardada en deployment-info.txt"
    
    echo ""
    echo "🎉 AMBIENTE CONFIGURADO EXITOSAMENTE"
    echo "===================================="
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. cd gasless_infrastructure_program"
    echo "2. anchor build"
    echo "3. anchor deploy"
    echo "4. cd .."
    echo "5. ./start-services.sh"
    echo ""
    echo "🔍 Para verificar:"
    echo "- solana config get"
    echo "- solana balance ~/.config/solana/id.json"
    echo "- anchor --version"
    echo ""
}

# Ejecutar función principal
main "$@"