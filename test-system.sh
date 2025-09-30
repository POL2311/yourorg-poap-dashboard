#!/bin/bash

echo "🧪 TESTING GASLESS INFRASTRUCTURE"
echo "================================="

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

# Verificar que jq esté instalado para parsing JSON
if ! command -v jq &> /dev/null; then
    warn "jq no está instalado, instalando..."
    sudo apt-get update && sudo apt-get install -y jq
fi

# Función para test HTTP
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    info "Testing $name..."
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/test_response "$url" 2>/dev/null)
    local status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        log "✅ $name: OK (Status: $status_code)"
        return 0
    else
        error "❌ $name: FAIL (Status: $status_code, Expected: $expected_status)"
        return 1
    fi
}

# Función para test con timeout
test_with_timeout() {
    local name=$1
    local command=$2
    local timeout=$3
    
    info "Testing $name (timeout: ${timeout}s)..."
    
    if timeout $timeout bash -c "$command" >/dev/null 2>&1; then
        log "✅ $name: OK"
        return 0
    else
        error "❌ $name: FAIL (timeout or error)"
        return 1
    fi
}

# Contador de tests
TOTAL_TESTS=0
PASSED_TESTS=0

run_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if "$@"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
}

echo ""
echo "🔍 VERIFICANDO SERVICIOS BASE"
echo "============================"

# Test 1: MongoDB
run_test test_with_timeout "MongoDB Connection" "mongosh --eval 'db.runCommand({ping: 1})' --quiet" 10

# Test 2: Redis
run_test test_with_timeout "Redis Connection" "redis-cli ping" 5

echo ""
echo "🌐 VERIFICANDO SERVICIOS WEB"
echo "============================"

# Test 3: Backend Health
run_test test_endpoint "Backend Health" "http://localhost:3000/health" "200"

# Test 4: Dashboard
run_test test_endpoint "Dashboard" "http://localhost:5173" "200"

# Test 5: NFT Example
run_test test_endpoint "NFT Example" "http://localhost:5174" "200"

echo ""
echo "🔗 VERIFICANDO API ENDPOINTS"
echo "============================"

# Test 6: API Routes
if curl -s http://localhost:3000/health > /dev/null; then
    
    # Test API endpoints específicos
    run_test test_endpoint "API - Health Check" "http://localhost:3000/health" "200"
    
    # Test que requieren autenticación (deberían devolver 401 o 403)
    info "Testing protected endpoints..."
    
    local auth_response=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:3000/api/services" 2>/dev/null)
    if [ "${auth_response: -3}" = "401" ] || [ "${auth_response: -3}" = "403" ]; then
        log "✅ API Authentication: OK (Protected endpoints return ${auth_response: -3})"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        error "❌ API Authentication: FAIL (Expected 401/403, got ${auth_response: -3})"
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
else
    error "❌ Backend no está respondiendo, saltando tests de API"
fi

echo ""
echo "💰 VERIFICANDO BALANCES SOLANA"
echo "=============================="

if [ -f "deployment-info.txt" ]; then
    source <(grep -E "^(Admin|Relayer|Master)" deployment-info.txt | sed 's/: /=/g' | sed 's/ /_/g')
    
    # Test 7: Admin Balance
    info "Checking Admin balance..."
    ADMIN_BALANCE=$(solana balance ~/.config/solana/id.json 2>/dev/null | cut -d' ' -f1)
    if [ -n "$ADMIN_BALANCE" ] && (( $(echo "$ADMIN_BALANCE > 0" | bc -l) )); then
        log "✅ Admin Balance: $ADMIN_BALANCE SOL"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        error "❌ Admin Balance: Insufficient or error"
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Test 8: Relayer Balance
    info "Checking Relayer balance..."
    if [ -f "keys/relayer-keypair.json" ]; then
        RELAYER_BALANCE=$(solana balance keys/relayer-keypair.json 2>/dev/null | cut -d' ' -f1)
        if [ -n "$RELAYER_BALANCE" ] && (( $(echo "$RELAYER_BALANCE > 0" | bc -l) )); then
            log "✅ Relayer Balance: $RELAYER_BALANCE SOL"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            error "❌ Relayer Balance: Insufficient or error"
        fi
    else
        error "❌ Relayer keypair not found"
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Test 9: Master Treasury Balance
    info "Checking Master Treasury balance..."
    if [ -f "keys/master-treasury-keypair.json" ]; then
        TREASURY_BALANCE=$(solana balance keys/master-treasury-keypair.json 2>/dev/null | cut -d' ' -f1)
        if [ -n "$TREASURY_BALANCE" ] && (( $(echo "$TREASURY_BALANCE > 0" | bc -l) )); then
            log "✅ Master Treasury Balance: $TREASURY_BALANCE SOL"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            error "❌ Master Treasury Balance: Insufficient or error"
        fi
    else
        error "❌ Master Treasury keypair not found"
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
else
    warn "deployment-info.txt not found, skipping balance checks"
fi

echo ""
echo "📊 VERIFICANDO LOGS"
echo "=================="

# Test 10: Log Files
info "Checking log files..."
LOG_ISSUES=0

check_log() {
    local service=$1
    local logfile="logs/$service.log"
    
    if [ -f "$logfile" ]; then
        local errors=$(grep -i "error\|fail\|exception" "$logfile" | wc -l)
        if [ "$errors" -gt 0 ]; then
            warn "$service: $errors errors found in logs"
            LOG_ISSUES=$((LOG_ISSUES + 1))
        else
            log "✅ $service: No errors in logs"
        fi
    else
        warn "$service: Log file not found"
        LOG_ISSUES=$((LOG_ISSUES + 1))
    fi
}

check_log "backend"
check_log "relayer"
check_log "dashboard"
check_log "nft-example"

if [ "$LOG_ISSUES" -eq 0 ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🎯 RESULTADOS FINALES"
echo "===================="

echo ""
echo "📈 Tests ejecutados: $TOTAL_TESTS"
echo "✅ Tests pasados: $PASSED_TESTS"
echo "❌ Tests fallidos: $((TOTAL_TESTS - PASSED_TESTS))"

PASS_RATE=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)
echo "📊 Tasa de éxito: $PASS_RATE%"

echo ""
if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    echo -e "${GREEN}🎉 TODOS LOS TESTS PASARON - SISTEMA LISTO${NC}"
    echo ""
    echo "🚀 Para probar el sistema completo:"
    echo "   1. Ve a http://localhost:5174"
    echo "   2. Conecta tu wallet (Phantom, Solflare, etc.)"
    echo "   3. Asegúrate de estar en Devnet"
    echo "   4. Haz click en 'Claim NFT'"
    echo "   5. Firma el mensaje (gratis)"
    echo "   6. ¡Deberías recibir un NFT sin pagar gas!"
    
elif [ "$PASS_RATE" -ge 80 ]; then
    echo -e "${YELLOW}⚠️  SISTEMA MAYORMENTE FUNCIONAL${NC}"
    echo "Algunos tests fallaron pero el sistema debería funcionar básicamente."
    
else
    echo -e "${RED}❌ SISTEMA CON PROBLEMAS SIGNIFICATIVOS${NC}"
    echo "Muchos tests fallaron. Revisa los logs y configuración."
fi

echo ""
echo "📄 Para más detalles:"
echo "   - Logs: tail -f logs/[service].log"
echo "   - Configuración: cat deployment-info.txt"
echo "   - Reiniciar: ./stop-services.sh && ./start-services.sh"

# Guardar resultados del test
cat > test-results.txt << EOF
GASLESS INFRASTRUCTURE TEST RESULTS
===================================

Date: $(date)
Total Tests: $TOTAL_TESTS
Passed Tests: $PASSED_TESTS
Failed Tests: $((TOTAL_TESTS - PASSED_TESTS))
Pass Rate: $PASS_RATE%

Status: $(if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then echo "ALL TESTS PASSED"; elif [ "$PASS_RATE" -ge 80 ]; then echo "MOSTLY FUNCTIONAL"; else echo "SIGNIFICANT ISSUES"; fi)

Next Steps:
$(if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then echo "- System ready for testing at http://localhost:5174"; else echo "- Check logs for errors: tail -f logs/[service].log"; fi)
EOF

log "📄 Resultados guardados en test-results.txt"