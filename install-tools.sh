#!/bin/bash

echo "🔧 INSTALANDO HERRAMIENTAS BÁSICAS"
echo "=================================="

# Verificar si tenemos Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "📦 Instalando Node.js..."
    
    # Intentar instalar Node.js usando diferentes métodos
    if command -v apt-get >/dev/null 2>&1; then
        # Ubuntu/Debian
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    elif command -v brew >/dev/null 2>&1; then
        # macOS
        brew install node
    else
        # Método manual
        echo "⚠️  Instalando Node.js manualmente..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 18
        nvm use 18
    fi
else
    echo "✅ Node.js ya está instalado: $(node --version)"
fi

# Verificar si tenemos Rust
if ! command -v rustc >/dev/null 2>&1; then
    echo "🦀 Instalando Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
else
    echo "✅ Rust ya está instalado: $(rustc --version)"
fi

# Verificar si tenemos Solana CLI
if ! command -v solana >/dev/null 2>&1; then
    echo "⛓️  Instalando Solana CLI..."
    sh -c "$(curl -sSfL https://release.solana.com/v1.18.18/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    
    # Agregar al PATH permanentemente
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
else
    echo "✅ Solana CLI ya está instalado: $(solana --version)"
fi

# Verificar si tenemos Anchor
if ! command -v anchor >/dev/null 2>&1; then
    echo "⚓ Instalando Anchor..."
    
    # Asegurar que tenemos npm
    if command -v npm >/dev/null 2>&1; then
        npm install -g @coral-xyz/anchor-cli
    else
        echo "❌ npm no disponible, no se puede instalar Anchor"
    fi
else
    echo "✅ Anchor ya está instalado: $(anchor --version)"
fi

echo ""
echo "🔄 Recargando configuración del shell..."
source ~/.bashrc 2>/dev/null || true
source ~/.cargo/env 2>/dev/null || true

echo ""
echo "✅ INSTALACIÓN DE HERRAMIENTAS COMPLETADA"
echo ""
echo "📋 Verificando instalaciones:"
echo "Node.js: $(command -v node && node --version || echo 'No instalado')"
echo "npm: $(command -v npm && npm --version || echo 'No instalado')"
echo "Rust: $(command -v rustc && rustc --version || echo 'No instalado')"
echo "Solana: $(command -v solana && solana --version || echo 'No instalado')"
echo "Anchor: $(command -v anchor && anchor --version || echo 'No instalado')"

echo ""
echo "🚀 Próximo paso: ./setup-complete.sh"