#!/bin/bash

echo "🔧 SOLUCIONANDO PROBLEMAS DE SETUP"
echo "=================================="

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

# 1. INSTALAR MONGODB CORRECTAMENTE
log "📦 Paso 1: Instalando MongoDB correctamente..."

# Instalar MongoDB Community Edition
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar MongoDB
if sudo systemctl is-active --quiet mongod; then
    log "✅ MongoDB instalado y corriendo"
else
    warn "MongoDB no está corriendo, intentando iniciar..."
    sudo systemctl start mongod
fi

# 2. INSTALAR SOLANA CLI TOOLS CORRECTAMENTE
log "🔗 Paso 2: Instalando Solana CLI tools..."

# Desinstalar versión anterior si existe
rm -rf ~/.local/share/solana

# Instalar Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Agregar al PATH
export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

# Verificar instalación
if command -v solana &> /dev/null; then
    log "✅ Solana CLI instalado: $(solana --version)"
else
    error "Solana CLI no se instaló correctamente"
    exit 1
fi

# Verificar cargo-build-bpf
if command -v cargo-build-bpf &> /dev/null; then
    log "✅ cargo-build-bpf disponible"
else
    warn "cargo-build-bpf no disponible, instalando..."
    # Instalar herramientas BPF
    solana install
fi

# 3. CONFIGURAR SOLANA PARA DEVNET
log "⚙️  Paso 3: Configurando Solana..."

# Configurar para devnet
solana config set --url https://api.devnet.solana.com

# Crear keypair si no existe
if [ ! -f ~/.config/solana/id.json ]; then
    log "Creando keypair de admin..."
    solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase
fi

# Verificar balance
ADMIN_PUBKEY=$(solana-keygen pubkey ~/.config/solana/id.json)
BALANCE=$(solana balance $ADMIN_PUBKEY 2>/dev/null | cut -d' ' -f1)

log "Admin wallet: $ADMIN_PUBKEY"
log "Balance actual: $BALANCE SOL"

# Intentar airdrop si el balance es bajo
if (( $(echo "$BALANCE < 1" | bc -l) )); then
    log "💰 Intentando obtener SOL..."
    for i in {1..3}; do
        if solana airdrop 2 $ADMIN_PUBKEY; then
            log "✅ Airdrop exitoso"
            break
        else
            warn "Intento $i/3 de airdrop falló, esperando..."
            sleep 5
        fi
    done
fi

# 4. ACTUALIZAR ANCHOR.TOML PARA DEVNET
log "📝 Paso 4: Configurando Anchor para devnet..."

cd gasless_infrastructure_program

# Backup del Anchor.toml original
cp Anchor.toml Anchor.toml.backup

# Crear nuevo Anchor.toml para devnet
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
EOF

log "✅ Anchor.toml configurado para devnet"

# 5. BUILD Y DEPLOY
log "🔨 Paso 5: Building programa..."

# Verificar que estamos en el directorio correcto
if [ ! -f "Anchor.toml" ]; then
    error "No estamos en el directorio del proyecto Anchor"
    exit 1
fi

# Build
if anchor build; then
    log "✅ Build exitoso"
else
    error "Build falló"
    exit 1
fi

# Deploy
log "🚀 Deploying programa..."

DEPLOY_OUTPUT=$(anchor deploy 2>&1)
echo "$DEPLOY_OUTPUT"

# Extraer Program ID del output
PROGRAM_ID=$(echo "$DEPLOY_OUTPUT" | grep -E "Program Id: [A-Za-z0-9]+" | head -1 | awk '{print $3}')

if [ -z "$PROGRAM_ID" ]; then
    # Intentar extraer de otra forma
    PROGRAM_ID=$(echo "$DEPLOY_OUTPUT" | grep -oE "[A-Za-z0-9]{32,}" | head -1)
fi

if [ -n "$PROGRAM_ID" ]; then
    log "✅ Programa deployado con ID: $PROGRAM_ID"
    
    # Actualizar Anchor.toml con el Program ID real
    sed -i "s/gasless_infrastructure = .*/gasless_infrastructure = \"$PROGRAM_ID\"/" Anchor.toml
    
else
    warn "No se pudo extraer el Program ID automáticamente"
    echo "Output del deploy:"
    echo "$DEPLOY_OUTPUT"
    echo ""
    read -p "Por favor ingresa el Program ID manualmente: " PROGRAM_ID
fi

cd ..

# 6. CREAR KEYPAIRS
log "🔑 Paso 6: Creando keypairs..."

mkdir -p keys

# Relayer keypair
if [ ! -f keys/relayer-keypair.json ]; then
    solana-keygen new --outfile keys/relayer-keypair.json --no-bip39-passphrase
fi

# Master treasury keypair
if [ ! -f keys/master-treasury-keypair.json ]; then
    solana-keygen new --outfile keys/master-treasury-keypair.json --no-bip39-passphrase
fi

RELAYER_PUBKEY=$(solana-keygen pubkey keys/relayer-keypair.json)
MASTER_TREASURY_PUBKEY=$(solana-keygen pubkey keys/master-treasury-keypair.json)

log "Relayer wallet: $RELAYER_PUBKEY"
log "Master Treasury: $MASTER_TREASURY_PUBKEY"

# Obtener SOL para las wallets
log "💰 Obteniendo SOL para relayer y master treasury..."

for wallet in "$RELAYER_PUBKEY" "$MASTER_TREASURY_PUBKEY"; do
    for i in {1..3}; do
        if solana airdrop 2 $wallet; then
            log "✅ Airdrop exitoso para $wallet"
            break
        else
            warn "Intento $i/3 de airdrop falló para $wallet"
            sleep 5
        fi
    done
done

# 7. CONFIGURAR ARCHIVOS .ENV
log "📄 Paso 7: Configurando archivos .env..."

# Backend
cd backend
npm install --silent
cat > .env << EOF
PORT=3000
NODE_ENV=development

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=$PROGRAM_ID
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# Database
MONGODB_URI=mongodb://localhost:27017/gasless_infrastructure
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=gasless_jwt_secret_$(openssl rand -hex 16)
API_KEY_SECRET=gasless_api_secret_$(openssl rand -hex 16)

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174
EOF
cd ..

# Relayer
cd relayer
npm install --silent

# Convertir keypairs a base58
RELAYER_PRIVATE_KEY=$(node -e "
const fs = require('fs');
const bs58 = require('bs58');
const keypair = JSON.parse(fs.readFileSync('../keys/relayer-keypair.json'));
console.log(bs58.encode(Uint8Array.from(keypair)));
")

MASTER_TREASURY_PRIVATE_KEY=$(node -e "
const fs = require('fs');
const bs58 = require('bs58');
const keypair = JSON.parse(fs.readFileSync('../keys/master-treasury-keypair.json'));
console.log(bs58.encode(Uint8Array.from(keypair)));
")

cat > .env << EOF
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=$PROGRAM_ID

# Keypairs
RELAYER_PRIVATE_KEY=$RELAYER_PRIVATE_KEY
MASTER_TREASURY_PRIVATE_KEY=$MASTER_TREASURY_PRIVATE_KEY

# API Configuration
API_URL=http://localhost:3000
RELAYER_API_KEY=relayer_$(openssl rand -hex 16)

# Processing Configuration
MAX_RETRIES=3
PROCESSING_INTERVAL=5
BATCH_SIZE=10
EOF
cd ..

# Dashboard
cd dashboard
npm install --silent
cat > .env << EOF
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SOLANA_NETWORK=devnet
REACT_APP_PROGRAM_ID=$PROGRAM_ID
EOF
cd ..

# Ejemplo NFT
cd examples/nft-claim
npm install --silent
cat > .env << EOF
REACT_APP_GASLESS_API_URL=http://localhost:3000
REACT_APP_GASLESS_SERVICE_ID=nft-claim-demo
REACT_APP_GASLESS_API_KEY=demo_api_key_123
REACT_APP_SOLANA_NETWORK=devnet
EOF
cd ../..

# 8. GUARDAR INFORMACIÓN
cat > deployment-info.txt << EOF
GASLESS INFRASTRUCTURE DEPLOYMENT INFO
=====================================

Program ID: $PROGRAM_ID
Admin Wallet: $ADMIN_PUBKEY
Relayer Wallet: $RELAYER_PUBKEY
Master Treasury: $MASTER_TREASURY_PUBKEY

Deployment Date: $(date)
Network: Devnet
RPC: https://api.devnet.solana.com

Services:
- Backend: http://localhost:3000
- Dashboard: http://localhost:5173
- NFT Example: http://localhost:5174

Balances:
- Admin: $(solana balance $ADMIN_PUBKEY 2>/dev/null || echo 'Error')
- Relayer: $(solana balance $RELAYER_PUBKEY 2>/dev/null || echo 'Error')
- Master Treasury: $(solana balance $MASTER_TREASURY_PUBKEY 2>/dev/null || echo 'Error')
EOF

echo ""
echo "🎉 SETUP CORREGIDO Y COMPLETADO"
echo "==============================="
echo ""
echo "📊 Información del sistema:"
echo "   Program ID: $PROGRAM_ID"
echo "   Admin Wallet: $ADMIN_PUBKEY"
echo "   Relayer Wallet: $RELAYER_PUBKEY"
echo "   Master Treasury: $MASTER_TREASURY_PUBKEY"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. Ejecuta: ./start-services.sh"
echo "   2. Ve a: http://localhost:5174"
echo "   3. ¡Prueba el sistema gasless!"
echo ""

log "✅ Setup completado exitosamente!"