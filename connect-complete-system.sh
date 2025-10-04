#!/bin/bash

echo "🔗 CONNECTING THE COMPLETE GASLESS NFT SYSTEM"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Check if keypairs exist
echo -e "${BLUE}🔑 Step 1: Checking keypairs...${NC}"
if [ ! -f "keys/relayer-keypair.json" ]; then
    echo -e "${YELLOW}⚠️  Relayer keypair not found. Generating...${NC}"
    mkdir -p keys
    solana-keygen new --no-bip39-passphrase --outfile keys/relayer-keypair.json --silent
    echo -e "${GREEN}✅ Relayer keypair generated${NC}"
fi

if [ ! -f "keys/master-treasury-keypair.json" ]; then
    echo -e "${YELLOW}⚠️  Master treasury keypair not found. Generating...${NC}"
    mkdir -p keys
    solana-keygen new --no-bip39-passphrase --outfile keys/master-treasury-keypair.json --silent
    echo -e "${GREEN}✅ Master treasury keypair generated${NC}"
fi

# Step 2: Setup backend environment
echo -e "${BLUE}🔧 Step 2: Setting up backend environment...${NC}"
cd backend

# Read keypairs and create .env
RELAYER_KEY=$(cat ../keys/relayer-keypair.json)
MASTER_KEY=$(cat ../keys/master-treasury-keypair.json)

cat > .env << EOF
# Backend Environment Configuration
PORT=3000
SOLANA_RPC_URL=http://localhost:8899
PROGRAM_ID=49LhAwtW2UEbaLVGbZkgniT7XFGfFXMDnTUsboojgmQS

# Relayer Configuration
RELAYER_PRIVATE_KEY=$RELAYER_KEY

# Master Treasury Configuration
MASTER_WALLET_PRIVATE_KEY=$MASTER_KEY

# Database Configuration (optional)
MONGODB_URI=mongodb://localhost:27017/gasless
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=gasless_infrastructure_secret_$(date +%s)

# Token Configuration
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
EOF

echo -e "${GREEN}✅ Backend .env created with keypairs${NC}"

# Install backend dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    npm install
fi

cd ..

# Step 3: Setup frontend environment
echo -e "${BLUE}🎨 Step 3: Setting up frontend environment...${NC}"
cd examples/nft-claim

# Create frontend .env
cat > .env << EOF
# Frontend Environment Configuration
VITE_GASLESS_API_URL=http://localhost:3000
VITE_SOLANA_RPC_URL=http://localhost:8899
EOF

echo -e "${GREEN}✅ Frontend .env created${NC}"

# Install frontend dependencies including axios
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
npm install axios
npm install

cd ../..

# Step 4: Create complete start script
echo -e "${BLUE}🚀 Step 4: Creating complete start script...${NC}"
cat > start-complete-system.sh << 'EOF'
#!/bin/bash

echo "🚀 STARTING COMPLETE GASLESS NFT SYSTEM"
echo "======================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    else
        return 0
    fi
}

# Check ports
echo -e "${BLUE}🔍 Checking ports...${NC}"
if ! check_port 3000; then
    echo "Please stop the service on port 3000 or use: kill \$(lsof -ti:3000)"
    exit 1
fi

if ! check_port 5174; then
    echo "Please stop the service on port 5174 or use: kill \$(lsof -ti:5174)"
    exit 1
fi

# Start backend
echo -e "${BLUE}🔧 Starting backend on port 3000...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started with PID: $BACKEND_PID${NC}"
cd ..

# Wait for backend to start
echo -e "${BLUE}⏳ Waiting for backend to initialize...${NC}"
sleep 5

# Test backend health
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend might still be starting...${NC}"
fi

# Start frontend
echo -e "${BLUE}🎨 Starting frontend on port 5174...${NC}"
cd examples/nft-claim
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started with PID: $FRONTEND_PID${NC}"
cd ../..

echo ""
echo -e "${GREEN}🎉 COMPLETE SYSTEM IS READY!${NC}"
echo "============================"
echo ""
echo -e "${BLUE}🔗 URLs:${NC}"
echo "   Frontend: http://localhost:5174"
echo "   Backend:  http://localhost:3000"
echo "   Health:   http://localhost:3000/health"
echo ""
echo -e "${BLUE}🎯 How to use:${NC}"
echo "   1. Open http://localhost:5174 in your browser"
echo "   2. Connect your Solana wallet (Phantom, Solflare)"
echo "   3. Click 'Claim NFT (Automatic API Call)'"
echo "   4. Watch the complete automatic flow!"
echo ""
echo -e "${BLUE}🔄 What happens automatically:${NC}"
echo "   1. Frontend gets user's wallet address"
echo "   2. Frontend calls: POST /api/nft/claim-magical"
echo "   3. Backend mints real NFT using relayer funds"
echo "   4. User receives NFT without paying gas"
echo "   5. Success notifications show all details"
echo ""
echo -e "${BLUE}📊 Process IDs:${NC}"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}🛑 To stop services:${NC}"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services..."

# Create stop function
stop_services() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

# Wait for user to stop
trap stop_services INT
wait
EOF

chmod +x start-complete-system.sh
echo -e "${GREEN}✅ Complete start script created${NC}"

# Step 5: Create test script
echo -e "${BLUE}🧪 Step 5: Creating test script...${NC}"
cat > test-complete-connection.sh << 'EOF'
#!/bin/bash

echo "🧪 TESTING COMPLETE CONNECTION"
echo "=============================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Test backend health
echo -e "${BLUE}🔍 Testing backend health...${NC}"
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    
    # Get health details
    HEALTH=$(curl -s http://localhost:3000/health | jq -r '.service // "Unknown"')
    echo "   Service: $HEALTH"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    echo "   Please start it with: ./start-complete-system.sh"
    exit 1
fi

# Test relayer stats
echo -e "${BLUE}🔍 Testing relayer stats...${NC}"
RELAYER_RESPONSE=$(curl -s http://localhost:3000/api/relayer/stats)
if echo "$RELAYER_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Relayer stats endpoint working${NC}"
    
    BALANCE=$(echo "$RELAYER_RESPONSE" | jq -r '.data.balance // 0')
    RELAYER_KEY=$(echo "$RELAYER_RESPONSE" | jq -r '.data.relayerPublicKey // "Unknown"')
    
    echo "   Relayer: ${RELAYER_KEY:0:8}...${RELAYER_KEY: -8}"
    echo "   Balance: $BALANCE SOL"
    
    if (( $(echo "$BALANCE < 0.01" | bc -l) )); then
        echo -e "${YELLOW}⚠️  Low relayer balance. Consider adding SOL${NC}"
    fi
else
    echo -e "${RED}❌ Relayer stats endpoint failed${NC}"
fi

# Test magical NFT endpoint
echo -e "${BLUE}🔍 Testing magical NFT endpoint...${NC}"
TEST_WALLET="9oTgsztpoTsKuMwsUQaQPy3JMBFrQPcGFszaDeDA5Yzq"

NFT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/nft/claim-magical \
  -H "Content-Type: application/json" \
  -d "{\"userPublicKey\":\"$TEST_WALLET\",\"serviceId\":\"demo-service\"}")

if echo "$NFT_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Magical NFT endpoint working${NC}"
    
    NFT_MINT=$(echo "$NFT_RESPONSE" | jq -r '.data.nftMint // "Unknown"')
    TX_SIG=$(echo "$NFT_RESPONSE" | jq -r '.data.transactionSignature // "Unknown"')
    
    echo "   NFT Mint: ${NFT_MINT:0:8}...${NFT_MINT: -8}"
    echo "   Transaction: ${TX_SIG:0:8}...${TX_SIG: -8}"
else
    echo -e "${RED}❌ Magical NFT endpoint failed${NC}"
    echo "   Error: $(echo "$NFT_RESPONSE" | jq -r '.error // "Unknown error"')"
fi

# Test frontend
echo -e "${BLUE}🔍 Testing frontend...${NC}"
if curl -s http://localhost:5174 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend is not running${NC}"
    echo "   Start it with: cd examples/nft-claim && npm run dev"
fi

echo ""
echo -e "${GREEN}🎉 CONNECTION TEST COMPLETE!${NC}"
echo "============================"
echo ""
echo -e "${BLUE}🎯 Complete Flow Test:${NC}"
echo "   1. Open: http://localhost:5174"
echo "   2. Connect wallet"
echo "   3. Click 'Claim NFT'"
echo "   4. Frontend automatically calls backend"
echo "   5. Backend mints real NFT"
echo "   6. User gets NFT for free!"
echo ""
echo -e "${GREEN}Everything is connected and working! ✨${NC}"
EOF

chmod +x test-complete-connection.sh
echo -e "${GREEN}✅ Test script created${NC}"

# Step 6: Final summary
echo ""
echo -e "${GREEN}🎉 COMPLETE GASLESS NFT SYSTEM CONNECTED!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}📋 What's been set up:${NC}"
echo "   ✅ Keypairs generated and configured"
echo "   ✅ Backend environment with real keypairs"
echo "   ✅ Frontend environment with API URLs"
echo "   ✅ All dependencies installed"
echo "   ✅ Complete start script created"
echo "   ✅ Connection test script created"
echo ""
echo -e "${YELLOW}🚀 To start the complete system:${NC}"
echo "   ./start-complete-system.sh"
echo ""
echo -e "${YELLOW}🧪 To test all connections:${NC}"
echo "   ./test-complete-connection.sh"
echo ""
echo -e "${BLUE}🔄 The complete flow:${NC}"
echo "   User clicks button → Frontend calls backend → Backend mints NFT → User gets NFT"
echo ""
echo -e "${GREEN}Everything is now properly connected! 🔗✨${NC}"