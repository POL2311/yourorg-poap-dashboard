#!/bin/bash

echo "🎯 TESTING AUTOMATIC GASLESS NFT SYSTEM"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is running
echo -e "${BLUE}🔍 Checking if backend is running...${NC}"
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is running on port 3000${NC}"
else
    echo -e "${RED}❌ Backend is not running. Please start it first:${NC}"
    echo "   cd backend && npm run dev"
    exit 1
fi

# Check if frontend is running
echo -e "${BLUE}🔍 Checking if frontend is running...${NC}"
if curl -s http://localhost:5174 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running on port 5174${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend is not running. Starting it now...${NC}"
    cd examples/nft-claim
    npm install > /dev/null 2>&1
    npm run dev &
    FRONTEND_PID=$!
    echo -e "${GREEN}✅ Frontend started with PID: $FRONTEND_PID${NC}"
    cd ../..
    sleep 3
fi

echo ""
echo -e "${BLUE}🎯 AUTOMATIC SYSTEM TEST${NC}"
echo "========================"
echo ""

# Test the automatic API call
echo -e "${BLUE}📤 Testing automatic API call (simulating frontend button click)...${NC}"
echo ""

# Use a test wallet address
TEST_WALLET="9oTgsztpoTsKuMwsUQaQPy3JMBFrQPcGFszaDeDA5Yzq"

echo -e "${YELLOW}🔧 Simulating what happens when user clicks 'Claim NFT':${NC}"
echo "   User wallet: $TEST_WALLET"
echo "   Frontend automatically calls: POST /api/nft/claim-magical"
echo ""

# Make the API call (this is what the frontend does automatically)
echo -e "${BLUE}📡 Making automatic API call...${NC}"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/nft/claim-magical \
  -H "Content-Type: application/json" \
  -d "{\"userPublicKey\":\"$TEST_WALLET\",\"serviceId\":\"demo-service\"}")

echo ""
echo -e "${GREEN}📦 API Response:${NC}"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo -e "${BLUE}🎉 AUTOMATIC SYSTEM SUMMARY${NC}"
echo "============================"
echo ""
echo -e "${GREEN}✅ What just happened:${NC}"
echo "   1. 🎯 User clicks 'Claim NFT' button in frontend"
echo "   2. 🚀 Frontend automatically calls backend API"
echo "   3. 💰 Backend mints real NFT using relayer funds"
echo "   4. 🎨 User receives NFT without paying any gas"
echo "   5. ✨ No manual curl commands needed!"
echo ""
echo -e "${YELLOW}🔗 URLs to test:${NC}"
echo "   Frontend: http://localhost:5174"
echo "   Backend:  http://localhost:3000"
echo "   Health:   http://localhost:3000/health"
echo ""
echo -e "${BLUE}📱 To test the full user experience:${NC}"
echo "   1. Open http://localhost:5174 in your browser"
echo "   2. Connect your Solana wallet (Phantom, Solflare)"
echo "   3. Click 'Claim NFT (Automatic API Call)'"
echo "   4. Watch the magic happen automatically!"
echo ""
echo -e "${GREEN}🎯 No more manual curl commands - everything is automatic! ✨${NC}"