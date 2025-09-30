#!/bin/bash

echo "🚀 GASLESS INFRASTRUCTURE - SETUP COMPLETO"
echo "=========================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "gasless_infrastructure_program/Anchor.toml" ]; then
    error "No se encuentra el proyecto Anchor. Asegúrate de estar en el directorio correcto."
    exit 1
fi

log "Iniciando setup completo del sistema gasless..."

# 1. INSTALAR DEPENDENCIAS
log "📦 Paso 1: Instalando dependencias del sistema..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verificar Rust
if ! command -v rustc &> /dev/null; then
    log "Instalando Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
fi

# Verificar Solana CLI
if ! command -v solana &> /dev/null; then
    log "Instalando Solana CLI..."
    sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
    export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"
    echo 'export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
fi

# Verificar Anchor
if ! command -v anchor &> /dev/null; then
    log "Instalando Anchor..."
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
fi

# 2. CONFIGURAR SOLANA
log "🔧 Paso 2: Configurando Solana..."

# Configurar para devnet
solana config set --url https://api.devnet.solana.com

# Crear keypair si no existe
if [ ! -f ~/.config/solana/id.json ]; then
    log "Creando keypair de admin..."
    solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase
fi

# Obtener SOL
log "💰 Obteniendo SOL para admin..."
solana airdrop 2 || warn "No se pudo obtener SOL automáticamente"

# 3. INSTALAR BASES DE DATOS
log "💾 Paso 3: Instalando bases de datos..."

# MongoDB
if ! command -v mongod &> /dev/null; then
    log "Instalando MongoDB..."
    sudo apt update
    sudo apt install -y mongodb
fi

# Redis
if ! command -v redis-server &> /dev/null; then
    log "Instalando Redis..."
    sudo apt install -y redis-server
fi

# Iniciar servicios
sudo systemctl start mongodb || warn "No se pudo iniciar MongoDB"
sudo systemctl start redis-server || warn "No se pudo iniciar Redis"

# 4. BUILD Y DEPLOY DEL PROGRAMA
log "🔗 Paso 4: Building y deploying programa Solana..."

cd gasless_infrastructure_program

# Build
log "Building programa..."
anchor build

# Deploy
log "Deploying programa..."
DEPLOY_OUTPUT=$(anchor deploy 2>&1)
echo "$DEPLOY_OUTPUT"

# Extraer Program ID
PROGRAM_ID=$(echo "$DEPLOY_OUTPUT" | grep -o 'Program Id: [A-Za-z0-9]*' | cut -d' ' -f3)

if [ -z "$PROGRAM_ID" ]; then
    error "No se pudo obtener el Program ID del deploy"
    exit 1
fi

log "✅ Programa deployado con ID: $PROGRAM_ID"

cd ..

# 5. CREAR KEYPAIRS PARA RELAYER
log "🔑 Paso 5: Creando keypairs para relayer..."

mkdir -p keys

# Relayer keypair
if [ ! -f keys/relayer-keypair.json ]; then
    solana-keygen new --outfile keys/relayer-keypair.json --no-bip39-passphrase
fi

# Master treasury keypair
if [ ! -f keys/master-treasury-keypair.json ]; then
    solana-keygen new --outfile keys/master-treasury-keypair.json --no-bip39-passphrase
fi

# Obtener claves públicas
ADMIN_PUBKEY=$(solana-keygen pubkey ~/.config/solana/id.json)
RELAYER_PUBKEY=$(solana-keygen pubkey keys/relayer-keypair.json)
MASTER_TREASURY_PUBKEY=$(solana-keygen pubkey keys/master-treasury-keypair.json)

# Obtener SOL para las wallets
log "💰 Obteniendo SOL para relayer y master treasury..."
solana airdrop 2 $RELAYER_PUBKEY || warn "No se pudo obtener SOL para relayer"
solana airdrop 5 $MASTER_TREASURY_PUBKEY || warn "No se pudo obtener SOL para master treasury"

# 6. CONFIGURAR BACKEND
log "🖥 Paso 6: Configurando backend..."

cd backend

# Instalar dependencias
npm install

# Crear .env
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

# Build
npm run build

cd ..

# 7. CONFIGURAR RELAYER
log "⚡ Paso 7: Configurando relayer..."

cd relayer

# Instalar dependencias
npm install

# Convertir keypairs a base58 para el .env
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

# Crear .env
cat > .env << EOF
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=$PROGRAM_ID

# Keypairs (MANTENER SEGURAS)
RELAYER_PRIVATE_KEY=$RELAYER_PRIVATE_KEY
MASTER_TREASURY_PRIVATE_KEY=$MASTER_TREASURY_PRIVATE_KEY

# API Configuration
API_URL=http://localhost:3000
RELAYER_API_KEY=relayer_$(openssl rand -hex 16)

# Processing Configuration
MAX_RETRIES=3
PROCESSING_INTERVAL=5
BATCH_SIZE=10

# Balance Monitoring
MIN_RELAYER_BALANCE=0.1
MIN_MASTER_TREASURY_BALANCE=1
LOW_BALANCE_ALERT_THRESHOLD=0.5
EOF

cd ..

# 8. CONFIGURAR DASHBOARD
log "📱 Paso 8: Configurando dashboard..."

cd dashboard

# Instalar dependencias
npm install

# Crear .env
cat > .env << EOF
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SOLANA_NETWORK=devnet
REACT_APP_PROGRAM_ID=$PROGRAM_ID
EOF

cd ..

# 9. CONFIGURAR EJEMPLO NFT
log "🎨 Paso 9: Configurando ejemplo NFT..."

cd examples/nft-claim

# Instalar dependencias
npm install

# Crear .env
cat > .env << EOF
REACT_APP_GASLESS_API_URL=http://localhost:3000
REACT_APP_GASLESS_SERVICE_ID=nft-claim-demo
REACT_APP_GASLESS_API_KEY=demo_api_key_123
REACT_APP_SOLANA_NETWORK=devnet
EOF

cd ../..

# 10. CREAR SCRIPT DE INICIALIZACIÓN DEL PROTOCOLO
log "🔧 Paso 10: Creando script de inicialización..."

cat > initialize-protocol.js << EOF
const { Connection, PublicKey, Keypair, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet, BN } = require('@coral-xyz/anchor');
const fs = require('fs');

async function initializeProtocol() {
    try {
        console.log('🚀 Inicializando protocolo gasless...');
        
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        const programId = new PublicKey('$PROGRAM_ID');
        
        // Cargar keypairs
        const adminKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync(process.env.HOME + '/.config/solana/id.json')))
        );
        
        const masterTreasuryKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync('./keys/master-treasury-keypair.json')))
        );
        
        const relayerKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync('./keys/relayer-keypair.json')))
        );
        
        console.log('👤 Admin:', adminKeypair.publicKey.toString());
        console.log('💰 Master Treasury:', masterTreasuryKeypair.publicKey.toString());
        console.log('⚡ Relayer:', relayerKeypair.publicKey.toString());
        
        // Aquí irían las llamadas al programa para inicializar
        // Por ahora solo mostramos la información
        
        console.log('✅ Configuración lista para inicializar protocolo');
        console.log('📝 Ejecuta las transacciones de inicialización manualmente o implementa aquí');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

initializeProtocol();
EOF

# 11. RESUMEN FINAL
log "✅ SETUP COMPLETO!"

echo ""
echo "🎉 GASLESS INFRASTRUCTURE CONFIGURADO EXITOSAMENTE"
echo "=================================================="
echo ""
echo "📊 Información del sistema:"
echo "   Program ID: $PROGRAM_ID"
echo "   Admin Wallet: $ADMIN_PUBKEY"
echo "   Relayer Wallet: $RELAYER_PUBKEY"
echo "   Master Treasury: $MASTER_TREASURY_PUBKEY"
echo ""
echo "💰 Balances:"
echo "   Admin: $(solana balance $ADMIN_PUBKEY 2>/dev/null || echo 'Error obteniendo balance')"
echo "   Relayer: $(solana balance $RELAYER_PUBKEY 2>/dev/null || echo 'Error obteniendo balance')"
echo "   Master Treasury: $(solana balance $MASTER_TREASURY_PUBKEY 2>/dev/null || echo 'Error obteniendo balance')"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. Ejecuta: ./start-services.sh (para iniciar todos los servicios)"
echo "   2. Ejecuta: node initialize-protocol.js (para inicializar el protocolo)"
echo "   3. Ve a http://localhost:5174 para probar el ejemplo NFT"
echo ""
echo "📁 Archivos importantes creados:"
echo "   - keys/relayer-keypair.json"
echo "   - keys/master-treasury-keypair.json"
echo "   - backend/.env"
echo "   - relayer/.env"
echo "   - dashboard/.env"
echo "   - examples/nft-claim/.env"
echo "   - initialize-protocol.js"
echo ""

# Guardar información en archivo
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

Next Steps:
1. Run: ./start-services.sh
2. Run: node initialize-protocol.js
3. Test at: http://localhost:5174
EOF

log "📄 Información guardada en deployment-info.txt"
log "🎯 Setup completo! Ejecuta ./start-services.sh para iniciar todos los servicios."