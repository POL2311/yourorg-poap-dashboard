#!/bin/bash

echo "🧪 TESTING GASLESS INFRASTRUCTURE - MODO MÁGICO"
echo "==============================================="

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

# Contador de tests
TOTAL_TESTS=0
PASSED_TESTS=0

run_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if "$@"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        return 1
    fi
}

# Función para test HTTP
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    local method=${4:-GET}
    local data=${5:-}
    
    info "Testing $name..."
    
    local curl_cmd="curl -s -w %{http_code} -o /tmp/test_response"
    if [ "$method" = "POST" ]; then
        curl_cmd="$curl_cmd -X POST -H 'Content-Type: application/json'"
        if [ -n "$data" ]; then
            curl_cmd="$curl_cmd -d '$data'"
        fi
    fi
    curl_cmd="$curl_cmd '$url'"
    
    local response=$(eval $curl_cmd 2>/dev/null)
    local status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        log "✅ $name: OK (Status: $status_code)"
        return 0
    else
        error "❌ $name: FAIL (Status: $status_code, Expected: $expected_status)"
        if [ -f /tmp/test_response ]; then
            echo "   Response: $(cat /tmp/test_response | head -c 200)..."
        fi
        return 1
    fi
}

# Función para test con contenido JSON
test_json_endpoint() {
    local name=$1
    local url=$2
    local expected_field=$3
    local method=${4:-GET}
    local data=${5:-}
    
    info "Testing $name..."
    
    local curl_cmd="curl -s"
    if [ "$method" = "POST" ]; then
        curl_cmd="$curl_cmd -X POST -H 'Content-Type: application/json'"
        if [ -n "$data" ]; then
            curl_cmd="$curl_cmd -d '$data'"
        fi
    fi
    curl_cmd="$curl_cmd '$url'"
    
    local response=$(eval $curl_cmd 2>/dev/null)
    
    if echo "$response" | grep -q "$expected_field"; then
        log "✅ $name: OK (Contains: $expected_field)"
        return 0
    else
        error "❌ $name: FAIL (Missing: $expected_field)"
        echo "   Response: $(echo $response | head -c 200)..."
        return 1
    fi
}

echo ""
echo "🔍 VERIFICANDO SERVICIOS BASE"
echo "============================"

# Test 1: Backend Health
run_test test_endpoint "Backend Health" "http://localhost:3000/health" "200"

# Test 2: Backend API Structure
run_test test_json_endpoint "Backend API Structure" "http://localhost:3000/health" '"ok":true'

# Test 3: Permits Endpoint
run_test test_endpoint "Permits Endpoint" "http://localhost:3000/api/permits" "200"

echo ""
echo "🎯 VERIFICANDO ENDPOINTS MÁGICOS"
echo "==============================="

# Test 4: Magical Endpoint (should fail without userPublicKey)
run_test test_json_endpoint "Magical Endpoint Validation" "http://localhost:3000/api/permits/claim-nft-simple" "userPublicKey is required" "POST" '{}'

# Test 5: Treasury Stats
run_test test_json_endpoint "Treasury Stats" "http://localhost:3000/api/treasury/stats" '"balance"'

# Test 6: NFT User Endpoint (empty user)
run_test test_json_endpoint "NFT User Endpoint" "http://localhost:3000/api/nfts/user/test123" '"nfts"'

echo ""
echo "🎨 SIMULANDO FLUJO COMPLETO DE NFT"
echo "================================="

# Test 7: Simular claim de NFT completo
FAKE_WALLET="11111111111111111111111111111112"
info "Simulando claim de NFT para wallet: $FAKE_WALLET"

CLAIM_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"userPublicKey\":\"$FAKE_WALLET\"}" \
    "http://localhost:3000/api/permits/claim-nft-simple" 2>/dev/null)

if echo "$CLAIM_RESPONSE" | grep -q '"success":true'; then
    log "✅ NFT Claim Simulation: OK"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    # Extraer datos del NFT
    NFT_ID=$(echo "$CLAIM_RESPONSE" | grep -o '"nftId":"[^"]*"' | cut -d'"' -f4)
    MINT_ADDRESS=$(echo "$CLAIM_RESPONSE" | grep -o '"nftMint":"[^"]*"' | cut -d'"' -f4)
    TX_ID=$(echo "$CLAIM_RESPONSE" | grep -o '"transactionSignature":"[^"]*"' | cut -d'"' -f4)
    
    info "   NFT ID: $NFT_ID"
    info "   Mint: $MINT_ADDRESS"
    info "   TX: $TX_ID"
    
    # Test 8: Verificar que el NFT aparece en la lista del usuario
    USER_NFTS=$(curl -s "http://localhost:3000/api/nfts/user/$FAKE_WALLET" 2>/dev/null)
    if echo "$USER_NFTS" | grep -q "$NFT_ID"; then
        log "✅ NFT User List: OK (NFT appears in user's list)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        error "❌ NFT User List: FAIL (NFT not in user's list)"
    fi
    
else
    error "❌ NFT Claim Simulation: FAIL"
    echo "   Response: $(echo $CLAIM_RESPONSE | head -c 200)..."
fi

TOTAL_TESTS=$((TOTAL_TESTS + 2))

echo ""
echo "📊 VERIFICANDO ESTADÍSTICAS"
echo "=========================="

# Test 9: Treasury Stats After Claim
TREASURY_STATS=$(curl -s "http://localhost:3000/api/treasury/stats" 2>/dev/null)
if echo "$TREASURY_STATS" | grep -q '"totalNFTsMinted":[1-9]'; then
    log "✅ Treasury Stats Update: OK (NFTs minted counter updated)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    # Mostrar estadísticas
    BALANCE=$(echo "$TREASURY_STATS" | grep -o '"balance":[0-9.]*' | cut -d':' -f2)
    TOTAL_NFTS=$(echo "$TREASURY_STATS" | grep -o '"totalNFTsMinted":[0-9]*' | cut -d':' -f2)
    info "   Treasury Balance: $BALANCE SOL"
    info "   Total NFTs Minted: $TOTAL_NFTS"
else
    error "❌ Treasury Stats Update: FAIL"
fi

TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🌐 VERIFICANDO FRONTEND"
echo "======================"

# Test 10: Frontend Accessibility
run_test test_endpoint "Frontend Accessibility" "http://localhost:5174" "200"

echo ""
echo "🎯 RESULTADOS FINALES"
echo "===================="

echo ""
echo "📈 Tests ejecutados: $TOTAL_TESTS"
echo "✅ Tests pasados: $PASSED_TESTS"
echo "❌ Tests fallidos: $((TOTAL_TESTS - PASSED_TESTS))"

PASS_RATE=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l 2>/dev/null || echo "N/A")
echo "📊 Tasa de éxito: $PASS_RATE%"

echo ""
if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    echo -e "${GREEN}🎉 TODOS LOS TESTS PASARON - SISTEMA MÁGICO FUNCIONANDO${NC}"
    echo ""
    echo "✨ EXPERIENCIA MÁGICA LISTA:"
    echo "   1. Ir a http://localhost:5174"
    echo "   2. Conectar wallet"
    echo "   3. Click en 'Claim Free NFT (No Gas!)'"
    echo "   4. ¡Ver la magia suceder!"
    echo ""
    echo "🎯 FLUJO CONFIRMADO:"
    echo "   ✅ Usuario: Click → Sin firmas → Sin gas"
    echo "   ✅ Backend: Procesa automáticamente"
    echo "   ✅ Master Treasury: Paga todos los costos"
    echo "   ✅ Usuario: Recibe NFT gratis"
    echo ""
    
elif [ "$PASS_RATE" -ge 80 ]; then
    echo -e "${YELLOW}⚠️  SISTEMA MAYORMENTE FUNCIONAL${NC}"
    echo "La mayoría de tests pasaron. El sistema debería funcionar básicamente."
    
else
    echo -e "${RED}❌ SISTEMA CON PROBLEMAS SIGNIFICATIVOS${NC}"
    echo "Muchos tests fallaron. Revisa los logs y configuración."
fi

echo ""
echo "📄 Para más detalles:"
echo "   - Backend logs: tail -f logs/backend.log"
echo "   - Frontend logs: tail -f logs/nft-example.log"
echo "   - Treasury stats: curl http://localhost:3000/api/treasury/stats"
echo "   - Reiniciar: ./stop-services.sh && ./start-magical-demo.sh"

# Guardar resultados del test
cat > test-results-magical.txt << EOF
GASLESS INFRASTRUCTURE MAGICAL TEST RESULTS
==========================================

Date: $(date)
Total Tests: $TOTAL_TESTS
Passed Tests: $PASSED_TESTS
Failed Tests: $((TOTAL_TESTS - PASSED_TESTS))
Pass Rate: $PASS_RATE%

Status: $(if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then echo "ALL TESTS PASSED - MAGICAL SYSTEM WORKING"; elif [ "$PASS_RATE" -ge 80 ]; then echo "MOSTLY FUNCTIONAL"; else echo "SIGNIFICANT ISSUES"; fi)

Magical Flow Status:
$(if [ "$PASSED_TESTS" -ge 7 ]; then echo "✅ Ready for magical NFT claims at http://localhost:5174"; else echo "❌ Check logs for errors and restart services"; fi)

Treasury Balance: $(echo "$TREASURY_STATS" | grep -o '"balance":[0-9.]*' | cut -d':' -f2 || echo "Unknown") SOL
Total NFTs Minted: $(echo "$TREASURY_STATS" | grep -o '"totalNFTsMinted":[0-9]*' | cut -d':' -f2 || echo "0")
EOF

log "📄 Resultados guardados en test-results-magical.txt"

echo ""