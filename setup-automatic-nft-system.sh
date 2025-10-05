#!/bin/bash

echo "🚀 SETTING UP AUTOMATIC GASLESS NFT SYSTEM"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Setup frontend dependencies
echo -e "${BLUE}📦 Step 1: Installing frontend dependencies...${NC}"
cd examples/nft-claim
npm install axios
npm install
cd ../..
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# Step 2: Setup backend dependencies
echo -e "${BLUE}📦 Step 2: Checking backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..
echo -e "${GREEN}✅ Backend dependencies ready${NC}"
echo ""

# Step 3: Make scripts executable
echo -e "${BLUE}🔧 Step 3: Making scripts executable...${NC}"
chmod +x *.sh
chmod +x setup-automatic-nft-frontend.sh
chmod +x test-automatic-system.sh
echo -e "${GREEN}✅ Scripts are executable${NC}"
echo ""

# Step 4: Create start script for automatic system
echo -e "${BLUE}📝 Step 4: Creating automatic system start script...${NC}"
cat > start-automatic-nft-system.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Automatic Gasless NFT System..."
echo "==========================================="

# Start backend
echo "🔧 Starting backend on port 3000..."
cd backend
npm run dev &
BACKEND_PID=$!
echo "✅ Backend started with PID: $BACKEND_PID"
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend on port 5174..."
cd examples/nft-claim
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started with PID: $FRONTEND_PID"
cd ../..

echo ""
echo "🎉 AUTOMATIC SYSTEM IS READY!"
echo "============================="
echo ""
echo "🔗 URLs:"
echo "   Frontend: http://localhost:5174"
echo "   Backend:  http://localhost:3000"
echo ""
echo "🎯 How to use:"
echo "   1. Open http://localhost:5174 in your browser"
echo "   2. Connect your Solana wallet"
echo "   3. Click 'Claim NFT (Automatic API Call)'"
echo "   4. Watch the automatic magic happen!"
echo ""
echo "💡 The frontend will automatically call the backend API"
echo "   No manual curl commands needed!"
echo ""
echo "📊 Process IDs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🛑 To stop services:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for user to stop
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
EOF

chmod +x start-automatic-nft-system.sh
echo -e "${GREEN}✅ Automatic system start script created${NC}"
echo ""

# Step 5: Test the setup
echo -e "${BLUE}🧪 Step 5: Testing the setup...${NC}"
echo "Checking if all files are in place..."

if [ -f "examples/nft-claim/package.json" ]; then
    echo -e "${GREEN}✅ Frontend package.json exists${NC}"
else
    echo -e "${RED}❌ Frontend package.json missing${NC}"
fi

if [ -f "examples/nft-claim/.env" ]; then
    echo -e "${GREEN}✅ Frontend .env exists${NC}"
else
    echo -e "${RED}❌ Frontend .env missing${NC}"
fi

if [ -f "backend/package.json" ]; then
    echo -e "${GREEN}✅ Backend package.json exists${NC}"
else
    echo -e "${RED}❌ Backend package.json missing${NC}"
fi

echo ""
echo -e "${GREEN}🎉 AUTOMATIC GASLESS NFT SYSTEM SETUP COMPLETE!${NC}"
echo "================================================="
echo ""
echo -e "${YELLOW}🚀 To start the automatic system:${NC}"
echo "   ./start-automatic-nft-system.sh"
echo ""
echo -e "${YELLOW}🧪 To test the automatic system:${NC}"
echo "   ./test-automatic-system.sh"
echo ""
echo -e "${BLUE}🎯 What's different now:${NC}"
echo "   ✅ Frontend automatically calls backend API"
echo "   ✅ No manual curl commands needed"
echo "   ✅ One-click NFT minting experience"
echo "   ✅ Real-time feedback and notifications"
echo "   ✅ Automatic error handling"
echo ""
echo -e "${GREEN}Ready to experience the magic! ✨${NC}"