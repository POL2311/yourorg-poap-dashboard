#!/bin/bash

echo "🔧 Setting up automatic NFT claim frontend..."

# Navigate to the NFT example directory
cd examples/nft-claim

# Install missing axios dependency
echo "📦 Installing axios dependency..."
npm install axios

# Install all dependencies
echo "📦 Installing all dependencies..."
npm install

echo "✅ Frontend setup complete!"
echo ""
echo "🚀 To start the automatic NFT claim app:"
echo "   cd examples/nft-claim"
echo "   npm run dev"
echo ""
echo "🎯 The app will automatically call the backend API when you click 'Claim NFT'"
echo "   No manual curl commands needed!"
echo ""
echo "📱 Visit: http://localhost:5174"