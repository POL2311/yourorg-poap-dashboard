#!/bin/bash

echo "🔧 FIXING RELAYER BALANCE AND NFT MINTING"

# Cargar variables de entorno
if [ -f .env ]; then
    source .env
fi

# Verificar que tenemos la clave del relayer
if [ -z "$RELAYER_PRIVATE_KEY" ]; then
    echo "❌ RELAYER_PRIVATE_KEY not found in .env"
    exit 1
fi

# Extraer la clave pública del relayer
RELAYER_PUBKEY=$(node -e "
const keypair = require('@solana/web3.js').Keypair.fromSecretKey(new Uint8Array(JSON.parse('$RELAYER_PRIVATE_KEY')));
console.log(keypair.publicKey.toString());
")

echo "⚡ Relayer: $RELAYER_PUBKEY"

# Verificar balance actual
echo "💰 Checking current balance..."
CURRENT_BALANCE=$(solana balance $RELAYER_PUBKEY --url $SOLANA_RPC_URL 2>/dev/null | grep -o '[0-9.]*' | head -1)
echo "💰 Current balance: $CURRENT_BALANCE SOL"

# Si el balance es menor a 1 SOL, hacer airdrop
if (( $(echo "$CURRENT_BALANCE < 1" | bc -l) )); then
    echo "💸 Balance too low, requesting airdrop..."
    
    # Hacer airdrop de 2 SOL
    solana airdrop 2 $RELAYER_PUBKEY --url $SOLANA_RPC_URL
    
    # Esperar un poco
    sleep 3
    
    # Verificar nuevo balance
    NEW_BALANCE=$(solana balance $RELAYER_PUBKEY --url $SOLANA_RPC_URL 2>/dev/null | grep -o '[0-9.]*' | head -1)
    echo "💰 New balance: $NEW_BALANCE SOL"
else
    echo "✅ Balance is sufficient"
fi

echo "🎯 Relayer ready for NFT minting!"