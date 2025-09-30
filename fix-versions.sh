#!/bin/bash

echo "🔧 SOLUCIONANDO PROBLEMA DE VERSIONES"
echo "====================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

# 1. VERIFICAR VERSIONES ACTUALES
log "🔍 Verificando versiones actuales..."

echo "Rust: $(rustc --version 2>/dev/null || echo 'No instalado')"
echo "Solana: $(solana --version 2>/dev/null || echo 'No instalado')"
echo "Anchor: $(anchor --version 2>/dev/null || echo 'No instalado')"

# 2. ACTUALIZAR RUST A LA VERSIÓN CORRECTA
log "🦀 Actualizando Rust..."

if ! command -v rustc &> /dev/null; then
    log "Instalando Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
fi

# Actualizar Rust
rustup update
rustup default stable

# 3. INSTALAR SOLANA VERSIÓN COMPATIBLE
log "⚡ Instalando Solana versión compatible..."

# Limpiar instalación anterior
rm -rf ~/.local/share/solana

# Instalar Solana 1.18.x (versión más reciente estable)
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Configurar PATH
export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

# Verificar instalación
if command -v solana &> /dev/null; then
    log "✅ Solana instalado: $(solana --version)"
else
    error "Solana no se instaló correctamente"
    exit 1
fi

# 4. INSTALAR ANCHOR VERSIÓN COMPATIBLE
log "⚓ Instalando Anchor versión compatible..."

# Desinstalar versión anterior
cargo uninstall anchor-cli 2>/dev/null || true

# Instalar AVM (Anchor Version Manager)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Instalar Anchor 0.29.0 (compatible con Solana 1.18)
avm install 0.29.0
avm use 0.29.0

# Verificar Anchor
if command -v anchor &> /dev/null; then
    log "✅ Anchor instalado: $(anchor --version)"
else
    error "Anchor no se instaló correctamente"
    exit 1
fi

# 5. CONFIGURAR SOLANA
log "🔧 Configurando Solana..."

solana config set --url https://api.devnet.solana.com

# Crear keypair si no existe
if [ ! -f ~/.config/solana/id.json ]; then
    solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase
fi

ADMIN_PUBKEY=$(solana-keygen pubkey ~/.config/solana/id.json)
log "Admin wallet: $ADMIN_PUBKEY"

# Obtener SOL
log "💰 Obteniendo SOL..."
for i in {1..3}; do
    if solana airdrop 2 $ADMIN_PUBKEY; then
        log "✅ Airdrop exitoso"
        break
    else
        warn "Intento $i/3 falló, esperando..."
        sleep 10
    fi
done

# 6. ACTUALIZAR ANCHOR.TOML PARA VERSIÓN CORRECTA
log "📝 Actualizando Anchor.toml..."

cd gasless_infrastructure_program

# Crear Anchor.toml compatible con versión nueva
cat > Anchor.toml << EOF
[toolchain]

[features]
seeds = false
skip-lint = false

[programs.devnet]
gasless_infrastructure = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"

[test]
startup_wait = 5000
shutdown_wait = 2000
upgradeable = false

[[test.genesis]]
address = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
program = "target/deploy/gasless_infrastructure.so"
EOF

# 7. LIMPIAR Y REBUILD
log "🧹 Limpiando proyecto..."
anchor clean

log "🔨 Building con versiones actualizadas..."
if anchor build; then
    log "✅ Build exitoso!"
    
    # Deploy
    log "🚀 Deploying..."
    DEPLOY_OUTPUT=$(anchor deploy 2>&1)
    echo "$DEPLOY_OUTPUT"
    
    # Extraer Program ID
    PROGRAM_ID=$(echo "$DEPLOY_OUTPUT" | grep -oE "Program Id: [A-Za-z0-9]+" | cut -d' ' -f3)
    
    if [ -z "$PROGRAM_ID" ]; then
        # Buscar en formato diferente
        PROGRAM_ID=$(echo "$DEPLOY_OUTPUT" | grep -oE "[A-Za-z0-9]{32,}" | head -1)
    fi
    
    if [ -n "$PROGRAM_ID" ]; then
        log "✅ Deploy exitoso! Program ID: $PROGRAM_ID"
        
        # Actualizar Anchor.toml con Program ID real
        sed -i "s/gasless_infrastructure = .*/gasless_infrastructure = \"$PROGRAM_ID\"/" Anchor.toml
        
        cd ..
        
        # Guardar información
        cat > deployment-info.txt << EOF
GASLESS INFRASTRUCTURE DEPLOYMENT INFO
=====================================

Program ID: $PROGRAM_ID
Admin Wallet: $ADMIN_PUBKEY
Deployment Date: $(date)
Network: Devnet
RPC: https://api.devnet.solana.com

Versions:
- Rust: $(rustc --version)
- Solana: $(solana --version)
- Anchor: $(anchor --version)

Status: Successfully deployed
EOF
        
        log "✅ Deployment info guardada"
        
    else
        warn "No se pudo extraer Program ID"
        echo "Deploy output:"
        echo "$DEPLOY_OUTPUT"
    fi
    
else
    error "Build falló"
    echo ""
    echo "🔧 Intentando con configuración alternativa..."
    
    # Intentar con configuración más simple
    cat > Anchor.toml << EOF
[toolchain]

[features]
seeds = false
skip-lint = false

[programs.devnet]
gasless_infrastructure = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
EOF
    
    log "Intentando build con configuración simplificada..."
    if anchor build; then
        log "✅ Build exitoso con configuración simplificada!"
        anchor deploy
    else
        error "Build sigue fallando"
    fi
fi

cd ..

echo ""
echo "📊 RESUMEN FINAL"
echo "==============="
echo "Rust: $(rustc --version)"
echo "Solana: $(solana --version)"
echo "Anchor: $(anchor --version)"
echo "Admin: $ADMIN_PUBKEY"
echo "Balance: $(solana balance $ADMIN_PUBKEY 2>/dev/null || echo 'Error')"

if [ -n "$PROGRAM_ID" ]; then
    echo "Program ID: $PROGRAM_ID"
    echo ""
    echo "🎉 ¡VERSIONES ACTUALIZADAS Y DEPLOY EXITOSO!"
    echo ""
    echo "🚀 Próximos pasos:"
    echo "1. Configurar servicios: ./configure-services.sh"
    echo "2. Iniciar servicios: ./start-services.sh"
else
    echo ""
    echo "⚠️  Versiones actualizadas pero deploy pendiente"
    echo "Revisa los errores arriba y intenta deploy manual"
fi