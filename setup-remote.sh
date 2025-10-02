#!/bin/bash

echo "🚀 CONFIGURACIÓN MÍNIMA PARA AMBIENTE REMOTO"
echo "============================================"

# Crear directorios necesarios
echo "📁 Creando estructura de directorios..."
mkdir -p keys
mkdir -p logs

# Generar keypairs si no existen (usando openssl como alternativa)
echo "🔑 Generando keypairs..."

generate_keypair() {
    local filename=$1
    local name=$2
    
    if [ ! -f "$filename" ]; then
        echo "🔄 Generando $name keypair..."
        
        # Generar 64 bytes aleatorios (32 para private key + 32 para public key)
        openssl rand -hex 32 > /tmp/private_key_hex
        
        # Convertir a formato JSON que Solana espera (array de 64 números)
        python3 -c "
import json
import binascii

# Leer la clave privada en hex
with open('/tmp/private_key_hex', 'r') as f:
    private_hex = f.read().strip()

# Convertir a bytes
private_bytes = binascii.unhexlify(private_hex)

# Generar 32 bytes adicionales para completar los 64 bytes que Solana espera
import os
additional_bytes = os.urandom(32)

# Combinar para crear el array de 64 bytes
full_keypair = list(private_bytes + additional_bytes)

# Guardar en formato JSON
with open('$filename', 'w') as f:
    json.dump(full_keypair, f)

print('✅ Keypair generado: $filename')
"
        rm -f /tmp/private_key_hex
    else
        echo "✅ $name keypair ya existe"
    fi
}

# Verificar si tenemos Python3
if command -v python3 >/dev/null 2>&1; then
    generate_keypair "keys/relayer-keypair.json" "Relayer"
    generate_keypair "keys/master-treasury-keypair.json" "Master Treasury"
    
    # Para admin, usar el directorio estándar de Solana
    mkdir -p ~/.config/solana
    generate_keypair "$HOME/.config/solana/id.json" "Admin"
else
    echo "⚠️  Python3 no disponible, creando keypairs dummy..."
    
    # Crear keypairs dummy con formato válido
    cat > keys/relayer-keypair.json << 'EOF'
[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]
EOF

    cat > keys/master-treasury-keypair.json << 'EOF'
[64,63,62,61,60,59,58,57,56,55,54,53,52,51,50,49,48,47,46,45,44,43,42,41,40,39,38,37,36,35,34,33,32,31,30,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1]
EOF

    mkdir -p ~/.config/solana
    cat > ~/.config/solana/id.json << 'EOF'
[100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163]
EOF
fi

echo "✅ Keypairs generados"

# Crear deployment-info.txt con información básica
echo "📄 Creando información de deployment..."

cat > deployment-info.txt << EOF
GASLESS INFRASTRUCTURE DEPLOYMENT INFO
=====================================

Program ID: 55NZkybMneNX4a1C9dDTtWUq1iv3NRprpgMxRSjRoUSX
Admin Wallet: [Generado localmente]
Relayer Wallet: [Generado localmente]
Master Treasury: [Generado localmente]

Deployment Date: $(date)
Network: Devnet (Simulado)
RPC: https://api.devnet.solana.com

Services:
- Backend: http://localhost:3000
- Dashboard: http://localhost:5173
- NFT Example: http://localhost:5174

Status: CONFIGURED FOR REMOTE ENVIRONMENT

Next Steps:
1. Transferir archivos a ambiente local
2. Ejecutar setup completo en local
3. Deploy real del programa
EOF

# Crear archivos .env básicos
echo "⚙️  Creando archivos de configuración..."

# Backend .env
if [ -d "backend" ]; then
    cat > backend/.env << EOF
# Gasless Infrastructure Backend Configuration
PORT=3000
NODE_ENV=development

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=55NZkybMneNX4a1C9dDTtWUq1iv3NRprpgMxRSjRoUSX

# Database (optional)
MONGODB_URI=mongodb://localhost:27017/gasless
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=gasless_infrastructure_jwt_secret_$(date +%s)

# Services
DEFAULT_SERVICE_ID=nft-claim-example
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
EOF
    echo "✅ Backend .env creado"
fi

# Relayer .env
if [ -d "relayer" ]; then
    cat > relayer/.env << EOF
# Gasless Infrastructure Relayer Configuration
NODE_ENV=development

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=55NZkybMneNX4a1C9dDTtWUq1iv3NRprpgMxRSjRoUSX

# API Configuration
API_URL=http://localhost:3000
RELAYER_API_KEY=relayer_api_key_$(date +%s)

# Processing Configuration
PERMIT_POLL_INTERVAL=2000
MAX_RETRIES=3
BATCH_SIZE=10
EOF
    echo "✅ Relayer .env creado"
fi

# Dashboard .env
if [ -d "dashboard" ]; then
    cat > dashboard/.env << EOF
# Gasless Infrastructure Dashboard Configuration
VITE_API_URL=http://localhost:3000
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_PROGRAM_ID=55NZkybMneNX4a1C9dDTtWUq1iv3NRprpgMxRSjRoUSX
VITE_NETWORK=devnet
EOF
    echo "✅ Dashboard .env creado"
fi

# NFT Example .env
if [ -d "examples/nft-claim" ]; then
    cat > examples/nft-claim/.env << EOF
# NFT Claim Example Configuration
VITE_GASLESS_API_URL=http://localhost:3000
VITE_GASLESS_SERVICE_ID=nft-claim-example
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_PROGRAM_ID=55NZkybMneNX4a1C9dDTtWUq1iv3NRprpgMxRSjRoUSX
VITE_NETWORK=devnet
EOF
    echo "✅ NFT Example .env creado"
fi

# Crear scripts de gestión básicos
echo "📜 Creando scripts de gestión..."

# Script para instalar dependencias
cat > install-dependencies.sh << 'EOF'
#!/bin/bash

echo "📦 INSTALANDO DEPENDENCIAS NODE.JS"
echo "=================================="

install_deps() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        echo "🔄 Instalando dependencias de $name..."
        cd "$dir"
        npm install
        cd ..
        echo "✅ $name dependencies instaladas"
    else
        echo "⚠️  $dir no encontrado o sin package.json"
    fi
}

install_deps "backend" "Backend"
install_deps "relayer" "Relayer"
install_deps "dashboard" "Dashboard"
install_deps "examples/nft-claim" "NFT Example"
install_deps "sdk" "SDK"
install_deps "gasless_infrastructure_program" "Anchor Program"

echo ""
echo "✅ TODAS LAS DEPENDENCIAS INSTALADAS"
EOF

# Script para verificar estado
cat > check-status.sh << 'EOF'
#!/bin/bash

echo "📊 ESTADO DEL PROYECTO GASLESS INFRASTRUCTURE"
echo "============================================="

echo ""
echo "📁 Estructura de archivos:"
[ -d "gasless_infrastructure_program" ] && echo "✅ gasless_infrastructure_program/" || echo "❌ gasless_infrastructure_program/"
[ -d "backend" ] && echo "✅ backend/" || echo "❌ backend/"
[ -d "relayer" ] && echo "✅ relayer/" || echo "❌ relayer/"
[ -d "dashboard" ] && echo "✅ dashboard/" || echo "❌ dashboard/"
[ -d "examples/nft-claim" ] && echo "✅ examples/nft-claim/" || echo "❌ examples/nft-claim/"
[ -d "sdk" ] && echo "✅ sdk/" || echo "❌ sdk/"
[ -d "keys" ] && echo "✅ keys/" || echo "❌ keys/"

echo ""
echo "🔑 Keypairs:"
[ -f "keys/relayer-keypair.json" ] && echo "✅ Relayer keypair" || echo "❌ Relayer keypair"
[ -f "keys/master-treasury-keypair.json" ] && echo "✅ Master treasury keypair" || echo "❌ Master treasury keypair"
[ -f "$HOME/.config/solana/id.json" ] && echo "✅ Admin keypair" || echo "❌ Admin keypair"

echo ""
echo "⚙️  Archivos de configuración:"
[ -f "backend/.env" ] && echo "✅ Backend .env" || echo "❌ Backend .env"
[ -f "relayer/.env" ] && echo "✅ Relayer .env" || echo "❌ Relayer .env"
[ -f "dashboard/.env" ] && echo "✅ Dashboard .env" || echo "❌ Dashboard .env"
[ -f "examples/nft-claim/.env" ] && echo "✅ NFT Example .env" || echo "❌ NFT Example .env"

echo ""
echo "📦 Dependencias Node.js:"
[ -d "backend/node_modules" ] && echo "✅ Backend dependencies" || echo "❌ Backend dependencies"
[ -d "relayer/node_modules" ] && echo "✅ Relayer dependencies" || echo "❌ Relayer dependencies"
[ -d "dashboard/node_modules" ] && echo "✅ Dashboard dependencies" || echo "❌ Dashboard dependencies"
[ -d "examples/nft-claim/node_modules" ] && echo "✅ NFT Example dependencies" || echo "❌ NFT Example dependencies"

echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. ./install-dependencies.sh (si no están instaladas)"
echo "2. Transferir proyecto a ambiente local con Solana"
echo "3. Ejecutar setup completo en local"
echo "4. Deploy del programa Solana"
echo "5. Inicializar protocolo"
echo "6. Probar sistema completo"
EOF

# Hacer scripts ejecutables
chmod +x install-dependencies.sh
chmod +x check-status.sh

echo ""
echo "🎉 CONFIGURACIÓN BÁSICA COMPLETADA"
echo "=================================="
echo ""
echo "📋 Lo que se ha configurado:"
echo "   ✅ Estructura de directorios"
echo "   ✅ Keypairs generados (para desarrollo)"
echo "   ✅ Archivos .env configurados"
echo "   ✅ Scripts de gestión creados"
echo "   ✅ Información de deployment"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. ./install-dependencies.sh"
echo "   2. ./check-status.sh"
echo "   3. Transferir a ambiente local para deployment real"
echo ""
echo "⚠️  NOTA: Este es un setup básico para ambiente remoto."
echo "   Para deployment real necesitas un ambiente con Solana CLI."
echo ""