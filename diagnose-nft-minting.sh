#!/bin/bash

echo "🔍 DIAGNOSTICANDO PROBLEMA DE MINTEO NFT"
echo "======================================="

# Verificar dependencias del backend
echo "📦 Verificando dependencias instaladas..."
cd backend

echo ""
echo "🔍 Dependencias de Solana:"
npm list @solana/web3.js 2>/dev/null || echo "❌ @solana/web3.js NO INSTALADO"
npm list @solana/spl-token 2>/dev/null || echo "❌ @solana/spl-token NO INSTALADO"
npm list @solana/spl-token-metadata 2>/dev/null || echo "❌ @solana/spl-token-metadata NO INSTALADO"

echo ""
echo "🔍 Otras dependencias:"
npm list bs58 2>/dev/null || echo "❌ bs58 NO INSTALADO"
npm list express 2>/dev/null || echo "❌ express NO INSTALADO"

echo ""
echo "📁 Verificando archivos del backend:"
[ -f "src/services/nft-mint.service.ts" ] && echo "✅ nft-mint.service.ts existe" || echo "❌ nft-mint.service.ts NO EXISTE"
[ -f "src/controllers/nft-claim.controller.ts" ] && echo "✅ nft-claim.controller.ts existe" || echo "❌ nft-claim.controller.ts NO EXISTE"

echo ""
echo "⚙️ Verificando configuración:"
[ -f ".env" ] && echo "✅ .env existe" || echo "❌ .env NO EXISTE"

if [ -f ".env" ]; then
    echo ""
    echo "🔑 Variables de entorno configuradas:"
    grep -E "^(SOLANA_RPC_URL|RELAYER_PRIVATE_KEY|PORT)" .env | sed 's/RELAYER_PRIVATE_KEY=.*/RELAYER_PRIVATE_KEY=[CONFIGURADO]/'
fi

cd ..

echo ""
echo "🧪 Probando endpoint específico con curl detallado..."
curl -v -X POST -H "Content-Type: application/json" \
    -d '{"userPublicKey":"11111111111111111111111111111112"}' \
    "http://localhost:3000/api/nft/claim-magical" 2>&1 | head -30