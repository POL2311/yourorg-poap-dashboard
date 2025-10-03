#!/bin/bash

echo "🔧 CONFIGURANDO BACKEND PARA MINTEO REAL DE NFT"
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
if [ ! -d "backend" ]; then
    error "Directorio backend no encontrado. Ejecuta desde el directorio raíz del proyecto."
    exit 1
fi

# Crear estructura de directorios
info "Creando estructura de directorios..."
mkdir -p backend/src/controllers
mkdir -p backend/src/services
mkdir -p backend/src/utils

# Copiar archivos desde los archivos generados
info "Copiando archivos del servicio NFT..."

# Crear nft-mint.service.ts
cat > backend/src/services/nft-mint.service.ts << 'EOF'
// Aquí va el contenido del archivo backend-nft-mint-service.ts
// (Copia el contenido completo del archivo generado anteriormente)
EOF

# Crear nft-claim.controller.ts
cat > backend/src/controllers/nft-claim.controller.ts << 'EOF'
// Aquí va el contenido del archivo backend-nft-claim-controller.ts
// (Copia el contenido completo del archivo generado anteriormente)
EOF

# Actualizar package.json
info "Actualizando package.json..."
cp backend-package-json.json backend/package.json

# Crear .env si no existe
if [ ! -f "backend/.env" ]; then
    info "Creando archivo .env..."
    cp backend-env-template.env backend/.env
    warn "⚠️  IMPORTANTE: Edita backend/.env y configura RELAYER_PRIVATE_KEY"
fi

# Instalar dependencias
info "Instalando dependencias..."
cd backend
npm install

# Verificar instalación de dependencias críticas
info "Verificando dependencias críticas..."
if npm list @solana/spl-token >/dev/null 2>&1; then
    log "✅ @solana/spl-token instalado"
else
    warn "Instalando @solana/spl-token..."
    npm install @solana/spl-token@^0.4.1
fi

if npm list @solana/spl-token-metadata >/dev/null 2>&1; then
    log "✅ @solana/spl-token-metadata instalado"
else
    warn "Instalando @solana/spl-token-metadata..."
    npm install @solana/spl-token-metadata@^0.1.2
fi

cd ..

# Obtener relayer public key
info "Obteniendo información del relayer..."
RELAYER_PUBKEY="2AuGUVanx4mLgUU6AogVq2e1KDNbY1T8E5ocheBY4Nmr"

# Verificar balance del relayer
if command -v solana >/dev/null 2>&1; then
    RELAYER_BALANCE=$(solana balance $RELAYER_PUBKEY 2>/dev/null | cut -d' ' -f1)
    info "Balance del relayer: $RELAYER_BALANCE SOL"
    
    if (( $(echo "$RELAYER_BALANCE < 0.1" | bc -l) )); then
        warn "⚠️  Relayer necesita más SOL para mintear NFTs"
        info "Ejecutando airdrop..."
        solana airdrop 1 $RELAYER_PUBKEY
        
        # Verificar nuevo balance
        sleep 2
        NEW_BALANCE=$(solana balance $RELAYER_PUBKEY 2>/dev/null | cut -d' ' -f1)
        log "✅ Nuevo balance del relayer: $NEW_BALANCE SOL"
    fi
else
    warn "⚠️  Solana CLI no disponible, no se puede verificar balance"
fi

echo ""
log "🎉 CONFIGURACIÓN COMPLETADA"
echo "=========================="
echo ""
echo "📋 Próximos pasos:"
echo "   1. Editar backend/.env y configurar RELAYER_PRIVATE_KEY"
echo "   2. cd backend && npm run dev"
echo "   3. Probar endpoint: POST http://localhost:3000/api/nft/claim-magical"
echo ""
echo "🔑 Para obtener tu RELAYER_PRIVATE_KEY:"
echo "   solana-keygen pubkey ~/.config/solana/id.json"
echo "   cat ~/.config/solana/id.json"
echo ""
echo "💡 El relayer necesita al menos 0.1 SOL para mintear NFTs"
echo ""