#!/bin/bash

echo "🔨 BUILDING Y DEPLOYING GASLESS INFRASTRUCTURE PROGRAM"
echo "====================================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[BUILD] $1${NC}"
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

# Verificar que estamos en el directorio correcto
if [ ! -f "gasless_infrastructure_program/Anchor.toml" ]; then
    error "No se encontró gasless_infrastructure_program/Anchor.toml. Ejecuta desde el directorio raíz del proyecto."
fi

# Verificar herramientas
if ! command -v anchor >/dev/null 2>&1; then
    error "Anchor CLI no está instalado. Ejecuta ./setup-environment.sh primero."
fi

if ! command -v solana >/dev/null 2>&1; then
    error "Solana CLI no está instalado. Ejecuta ./setup-environment.sh primero."
fi

# Verificar configuración de Solana
info "Verificando configuración de Solana..."
SOLANA_CONFIG=$(solana config get)
echo "$SOLANA_CONFIG"

# Verificar balance del admin
ADMIN_BALANCE=$(solana balance ~/.config/solana/id.json 2>/dev/null | cut -d' ' -f1)
if [ -z "$ADMIN_BALANCE" ] || (( $(echo "$ADMIN_BALANCE < 1" | bc -l) )); then
    warn "Balance del admin es bajo: $ADMIN_BALANCE SOL"
    info "Obteniendo más SOL..."
    solana airdrop 2 ~/.config/solana/id.json
fi

# Cambiar al directorio del programa
cd gasless_infrastructure_program

# Limpiar builds anteriores
info "Limpiando builds anteriores..."
anchor clean

# Verificar que el programa compile
info "Verificando compilación..."
if ! cargo check; then
    error "El programa no compila. Revisa los errores de Rust."
fi

# Build del programa
info "Building programa Anchor..."
if ! anchor build; then
    error "Anchor build falló. Revisa los errores."
fi

log "✅ Build exitoso"

# Verificar que el programa ID coincida
PROGRAM_ID_FROM_LIB=$(grep -r "declare_id!" programs/gasless_infrastructure/src/lib.rs | sed 's/.*declare_id!("\(.*\)").*/\1/')
PROGRAM_ID_FROM_ANCHOR=$(grep "gasless_infrastructure" Anchor.toml | sed 's/.*= "\(.*\)"/\1/')

info "Program ID en lib.rs: $PROGRAM_ID_FROM_LIB"
info "Program ID en Anchor.toml: $PROGRAM_ID_FROM_ANCHOR"

if [ "$PROGRAM_ID_FROM_LIB" != "$PROGRAM_ID_FROM_ANCHOR" ]; then
    warn "Los Program IDs no coinciden. Esto puede causar problemas."
fi

# Deploy del programa
info "Deploying programa a devnet..."
if ! anchor deploy; then
    error "Anchor deploy falló. Revisa los errores."
fi

log "✅ Deploy exitoso"

# Verificar que el programa esté deployado
info "Verificando programa deployado..."
DEPLOYED_PROGRAM=$(solana program show $PROGRAM_ID_FROM_ANCHOR 2>/dev/null)
if [ $? -eq 0 ]; then
    log "✅ Programa verificado en blockchain"
    echo "$DEPLOYED_PROGRAM"
else
    error "No se pudo verificar el programa en blockchain"
fi

# Generar IDL para el frontend
info "Generando IDL para frontend..."
if [ -f "target/idl/gasless_infrastructure.json" ]; then
    # Copiar IDL al backend
    mkdir -p ../backend/src/idl
    cp target/idl/gasless_infrastructure.json ../backend/src/idl/
    log "✅ IDL copiado al backend"
    
    # Copiar IDL al frontend si existe
    if [ -d "../dashboard/src" ]; then
        mkdir -p ../dashboard/src/idl
        cp target/idl/gasless_infrastructure.json ../dashboard/src/idl/
        log "✅ IDL copiado al dashboard"
    fi
    
    if [ -d "../examples/nft-claim/src" ]; then
        mkdir -p ../examples/nft-claim/src/idl
        cp target/idl/gasless_infrastructure.json ../examples/nft-claim/src/idl/
        log "✅ IDL copiado al ejemplo NFT"
    fi
else
    warn "IDL no encontrado en target/idl/"
fi

# Volver al directorio raíz
cd ..

# Actualizar deployment-info.txt
info "Actualizando información de deployment..."
cat > deployment-info.txt << EOF
GASLESS INFRASTRUCTURE DEPLOYMENT INFO
=====================================

Program ID: $PROGRAM_ID_FROM_ANCHOR
Admin Wallet: $(solana-keygen pubkey ~/.config/solana/id.json 2>/dev/null || echo 'Error')
Relayer Wallet: $(solana-keygen pubkey keys/relayer-keypair.json 2>/dev/null || echo 'Error')
Master Treasury: $(solana-keygen pubkey keys/master-treasury-keypair.json 2>/dev/null || echo 'Error')

Deployment Date: $(date)
Network: Devnet
RPC: https://api.devnet.solana.com

Program Status: DEPLOYED ✅
Build Date: $(date)
Anchor Version: $(anchor --version 2>/dev/null || echo 'Unknown')
Solana Version: $(solana --version 2>/dev/null || echo 'Unknown')

Services:
- Backend: http://localhost:3000
- Dashboard: http://localhost:5173
- NFT Example: http://localhost:5174

Next Steps:
1. Run: ./start-services.sh
2. Run: node initialize-protocol.js
3. Test at: http://localhost:5174

Balances:
- Admin: $(solana balance ~/.config/solana/id.json 2>/dev/null || echo 'Error')
- Relayer: $(solana balance keys/relayer-keypair.json 2>/dev/null || echo 'Error')
- Master Treasury: $(solana balance keys/master-treasury-keypair.json 2>/dev/null || echo 'Error')
EOF

echo ""
echo "🎉 PROGRAMA DEPLOYADO EXITOSAMENTE"
echo "=================================="
echo ""
echo "📋 Información del deployment:"
cat deployment-info.txt
echo ""
echo "🚀 Próximos pasos:"
echo "1. ./start-services.sh (iniciar servicios)"
echo "2. node initialize-protocol.js (inicializar protocolo)"
echo "3. Ir a http://localhost:5174 (probar ejemplo)"
echo ""
echo "🔍 Para verificar:"
echo "solana program show $PROGRAM_ID_FROM_ANCHOR"
echo ""