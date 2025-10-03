#!/bin/bash

echo "🔧 CONFIGURANDO RELAYER PARA MINTEO REAL DE NFT"
echo "=============================================="

# Colores
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

# Verificar que estamos en el directorio correcto
if [ ! -f "backend/package.json" ]; then
    error "Ejecuta desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar solana CLI
if ! command -v solana >/dev/null 2>&1; then
    error "Solana CLI no está instalado"
    exit 1
fi

# Verificar configuración de Solana
info "Verificando configuración de Solana..."
solana config get

# Obtener relayer public key desde el backend
RELAYER_PUBKEY="2AuGUVanx4mLgUU6AogVq2e1KDNbY1T8E5ocheBY4Nmr"
info "Relayer Public Key: $RELAYER_PUBKEY"

# Verificar balance actual
CURRENT_BALANCE=$(solana balance $RELAYER_PUBKEY 2>/dev/null | cut -d' ' -f1)
info "Balance actual del relayer: $CURRENT_BALANCE SOL"

# Calcular SOL necesario para minteo
REQUIRED_SOL=1.0
if (( $(echo "$CURRENT_BALANCE < $REQUIRED_SOL" | bc -l) )); then
    NEEDED_SOL=$(echo "$REQUIRED_SOL - $CURRENT_BALANCE" | bc -l)
    warn "Relayer necesita más SOL para mintear NFTs"
    info "Solicitando airdrop de $NEEDED_SOL SOL..."
    
    # Hacer airdrop
    solana airdrop $NEEDED_SOL $RELAYER_PUBKEY
    
    # Verificar nuevo balance
    sleep 2
    NEW_BALANCE=$(solana balance $RELAYER_PUBKEY 2>/dev/null | cut -d' ' -f1)
    log "✅ Nuevo balance del relayer: $NEW_BALANCE SOL"
else
    log "✅ Relayer tiene suficiente SOL: $CURRENT_BALANCE SOL"
fi

# Instalar dependencias del backend
info "Instalando dependencias del backend..."
cd backend
npm install

# Verificar que las dependencias críticas estén instaladas
if npm list @solana/spl-token >/dev/null 2>&1; then
    log "✅ @solana/spl-token instalado"
else
    info "Instalando @solana/spl-token..."
    npm install @solana/spl-token@^0.4.1
fi

if npm list @solana/spl-token-metadata >/dev/null 2>&1; then
    log "✅ @solana/spl-token-metadata instalado"
else
    info "Instalando @solana/spl-token-metadata..."
    npm install @solana/spl-token-metadata@^0.1.2
fi

cd ..

# Verificar configuración del .env
info "Verificando configuración del backend..."
if [ -f "backend/.env" ]; then
    if grep -q "RELAYER_PRIVATE_KEY" backend/.env; then
        log "✅ RELAYER_PRIVATE_KEY configurado en .env"
    else
        warn "⚠️  RELAYER_PRIVATE_KEY no encontrado en .env"
        echo "Agrega tu relayer private key al archivo backend/.env"
    fi
    
    if grep -q "SOLANA_RPC_URL" backend/.env; then
        log "✅ SOLANA_RPC_URL configurado en .env"
    else
        warn "⚠️  SOLANA_RPC_URL no encontrado en .env"
    fi
else
    warn "⚠️  Archivo backend/.env no encontrado"
fi

# Instalar dependencias del frontend
info "Instalando dependencias del frontend..."
cd examples/nft-claim
npm install
cd ../..

echo ""
log "🎉 CONFIGURACIÓN COMPLETADA"
echo "=========================="
echo ""
echo "📋 Resumen:"
echo "   ✅ Relayer balance: $(solana balance $RELAYER_PUBKEY 2>/dev/null || echo 'Error')"
echo "   ✅ Backend dependencies instaladas"
echo "   ✅ Frontend dependencies instaladas"
echo ""
echo "🚀 Para probar el minteo real:"
echo "   1. cd backend && npm run dev"
echo "   2. cd examples/nft-claim && npm run dev"
echo "   3. Ir a http://localhost:5174"
echo "   4. Conectar wallet y hacer click en 'Mint Real NFT'"
echo ""
echo "🎯 Endpoints disponibles:"
echo "   POST http://localhost:3000/api/nft/claim-magical"
echo "   GET http://localhost:3000/api/relayer/stats"
echo ""
echo "💡 El relayer pagará todos los costos de minteo (~0.01-0.02 SOL por NFT)"
echo ""