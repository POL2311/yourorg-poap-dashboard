#!/bin/bash

# Hacer todos los scripts ejecutables
chmod +x setup-complete.sh
chmod +x setup-environment.sh  
chmod +x deploy-program.sh
chmod +x start-services.sh
chmod +x stop-services.sh
chmod +x utils.sh
chmod +x test-system.sh

echo "✅ Todos los scripts son ahora ejecutables"

# Ejecutar setup completo
echo ""
echo "🚀 INICIANDO SETUP COMPLETO..."
echo "=============================="

./setup-complete.sh