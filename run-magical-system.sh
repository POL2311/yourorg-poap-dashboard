#!/bin/bash

echo "🎯 CONFIGURANDO Y EJECUTANDO SISTEMA MÁGICO GASLESS"
echo "=================================================="

# Hacer todos los scripts ejecutables
chmod +x start-magical-demo.sh
chmod +x stop-services.sh
chmod +x test-magical-system.sh

echo "✅ Scripts configurados como ejecutables"

# Verificar Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js no está instalado"
    echo "🔧 Instalando Node.js..."
    
    # Intentar instalar Node.js
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - 2>/dev/null
    sudo apt-get install -y nodejs 2>/dev/null
    
    if ! command -v node >/dev/null 2>&1; then
        echo "❌ No se pudo instalar Node.js automáticamente"
        echo "📋 Instala manualmente:"
        echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        echo "   source ~/.bashrc"
        echo "   nvm install 18"
        exit 1
    fi
fi

echo "✅ Node.js $(node --version) disponible"

# Ejecutar el sistema mágico
echo ""
echo "🚀 INICIANDO SISTEMA MÁGICO..."
echo "=============================="

./start-magical-demo.sh