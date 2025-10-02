#!/bin/bash

echo "🔧 INSTALANDO DEPENDENCIAS PARA MINTEO NFT"
echo "=========================================="

cd backend

echo "📦 Instalando dependencias críticas..."

# Instalar dependencias específicas para Token-2022
npm install @solana/spl-token@^0.4.1
npm install @solana/spl-token-metadata@^0.1.2
npm install @solana/web3.js@^1.87.6
npm install bs58@^5.0.0

echo ""
echo "✅ Dependencias instaladas"

echo ""
echo "📋 Verificando instalación..."
npm list @solana/spl-token
npm list @solana/spl-token-metadata
npm list @solana/web3.js
npm list bs58

cd ..

echo ""
echo "🔄 Reinicia el backend con: cd backend && npm run dev"