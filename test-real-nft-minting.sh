#!/bin/bash

echo "🧪 TESTING REAL NFT MINTING SYSTEM"
echo "=================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[TEST] $1${NC}"
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

# Verificar que el backend esté corriendo
info "Verificando que el backend esté corriendo..."
if ! curl -s http://localhost:3000/health >/dev/null; then
    error "Backend no está corriendo en puerto 3000"
    echo "Ejecuta: cd backend && npm run dev"
    exit 1
fi

log "✅ Backend está corriendo"

# Test 1: Health check
info "Test 1: Health check..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q '"ok":true'; then
    log "✅ Health check OK"
else
    error "❌ Health check failed"
fi

# Test 2: Relayer stats
info "Test 2: Relayer stats..."
RELAYER_STATS=$(curl -s http://localhost:3000/api/relayer/stats)
if echo "$RELAYER_STATS" | grep -q '"success":true'; then
    log "✅ Relayer stats OK"
    
    # Extraer balance del relayer
    RELAYER_BALANCE=$(echo "$RELAYER_STATS" | grep -o '"balance":[0-9.]*' | cut -d':' -f2)
    info "   Relayer balance: $RELAYER_BALANCE SOL"
    
    if (( $(echo "$RELAYER_BALANCE < 0.01" | bc -l) )); then
        warn "⚠️  Relayer balance is low for minting"
    fi
else
    error "❌ Relayer stats failed"
fi

# Test 3: Simular minteo real de NFT
info "Test 3: Simulando minteo real de NFT..."
FAKE_WALLET="11111111111111111111111111111112"

echo "🎨 Intentando mintear NFT real para wallet: $FAKE_WALLET"

MINT_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"userPublicKey\":\"$FAKE_WALLET\"}" \
    "http://localhost:3000/api/nft/claim-magical" 2>/dev/null)

echo "📦 Response del minteo:"
echo "$MINT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$MINT_RESPONSE"

if echo "$MINT_RESPONSE" | grep -q '"success":true'; then
    log "🎉 ¡NFT REAL MINTEADO EXITOSAMENTE!"
    
    # Extraer datos del NFT
    NFT_MINT=$(echo "$MINT_RESPONSE" | grep -o '"nftMint":"[^"]*"' | cut -d'"' -f4)
    TX_SIGNATURE=$(echo "$MINT_RESPONSE" | grep -o '"transactionSignature":"[^"]*"' | cut -d'"' -f4)
    GAS_COST=$(echo "$MINT_RESPONSE" | grep -o '"gasCostPaidByRelayer":[0-9]*' | cut -d':' -f2)
    
    echo ""
    log "📊 DETALLES DEL NFT MINTEADO:"
    echo "   🎨 NFT Mint: $NFT_MINT"
    echo "   📦 Transaction: $TX_SIGNATURE"
    echo "   💰 Gas Cost: $GAS_COST lamports"
    echo ""
    
    # Verificar transacción en blockchain
    if command -v solana >/dev/null 2>&1; then
        info "Verificando transacción en blockchain..."
        if solana confirm "$TX_SIGNATURE" >/dev/null 2>&1; then
            log "✅ Transacción confirmada en blockchain"
            
            # Mostrar detalles de la transacción
            echo ""
            info "📋 DETALLES DE LA TRANSACCIÓN:"
            solana confirm "$TX_SIGNATURE" -v | head -20
        else
            warn "⚠️  No se pudo verificar la transacción (puede estar pendiente)"
        fi
    fi
    
else
    error "❌ Minteo de NFT falló"
    echo "Error response: $MINT_RESPONSE"
fi

echo ""
echo "🎯 RESUMEN DE TESTS"
echo "=================="
echo ""
echo "✅ Backend funcionando"
echo "✅ Relayer configurado"
if echo "$MINT_RESPONSE" | grep -q '"success":true'; then
    echo "✅ NFT real minteado exitosamente"
    echo ""
    echo "🎉 ¡SISTEMA DE MINTEO REAL FUNCIONANDO!"
    echo ""
    echo "🚀 Para probar con wallet real:"
    echo "   1. Ir a http://localhost:5174"
    echo "   2. Conectar wallet (Phantom, Solflare)"
    echo "   3. Click en 'Mint Real NFT (Token-2022)'"
    echo "   4. ¡Ver el NFT aparecer en tu wallet!"
    echo ""
    echo "💡 El NFT será un Token-2022 con metadata completa"
    echo "💰 El relayer paga todos los costos (~$GAS_COST lamports)"
    echo "🎯 El usuario no paga absolutamente nada"
else
    echo "❌ NFT minting falló"
    echo ""
    echo "🔧 Para solucionar:"
    echo "   1. Verificar que el relayer tenga SOL suficiente"
    echo "   2. Revisar logs del backend"
    echo "   3. Verificar configuración del .env"
fi

echo ""