#!/bin/bash

echo "🔍 VERIFICANDO AMBIENTE ACTUAL"
echo "=============================="

# Verificar herramientas instaladas
echo "📋 Verificando herramientas..."

check_tool() {
    if command -v $1 >/dev/null 2>&1; then
        echo "✅ $1: $(which $1)"
        if [ "$1" = "node" ]; then
            echo "   Version: $(node --version)"
        elif [ "$1" = "npm" ]; then
            echo "   Version: $(npm --version)"
        elif [ "$1" = "rustc" ]; then
            echo "   Version: $(rustc --version)"
        elif [ "$1" = "solana" ]; then
            echo "   Version: $(solana --version)"
        elif [ "$1" = "anchor" ]; then
            echo "   Version: $(anchor --version)"
        fi
    else
        echo "❌ $1: No instalado"
        return 1
    fi
}

# Verificar herramientas básicas
check_tool "curl"
check_tool "git"
check_tool "node"
check_tool "npm"

echo ""
echo "🦀 Verificando herramientas Rust/Solana..."
check_tool "rustc"
check_tool "cargo"
check_tool "solana"
check_tool "anchor"

echo ""
echo "📁 Verificando estructura del proyecto..."

# Verificar directorios principales
dirs=("gasless_infrastructure_program" "backend" "relayer" "dashboard" "examples/nft-claim" "sdk" "keys")
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/"
    else
        echo "❌ $dir/ - No encontrado"
    fi
done

echo ""
echo "🔑 Verificando keypairs..."

# Verificar keypairs
if [ -f "keys/relayer-keypair.json" ]; then
    echo "✅ Relayer keypair existe"
else
    echo "❌ Relayer keypair no encontrado"
fi

if [ -f "keys/master-treasury-keypair.json" ]; then
    echo "✅ Master treasury keypair existe"
else
    echo "❌ Master treasury keypair no encontrado"
fi

if [ -f "$HOME/.config/solana/id.json" ]; then
    echo "✅ Admin keypair existe"
else
    echo "❌ Admin keypair no encontrado"
fi

echo ""
echo "⚙️  Verificando configuración Solana..."

if command -v solana >/dev/null 2>&1; then
    echo "📍 Configuración actual:"
    solana config get
    
    echo ""
    echo "💰 Balances:"
    if [ -f "$HOME/.config/solana/id.json" ]; then
        echo "Admin: $(solana balance ~/.config/solana/id.json 2>/dev/null || echo 'Error')"
    fi
    if [ -f "keys/relayer-keypair.json" ]; then
        echo "Relayer: $(solana balance keys/relayer-keypair.json 2>/dev/null || echo 'Error')"
    fi
    if [ -f "keys/master-treasury-keypair.json" ]; then
        echo "Master Treasury: $(solana balance keys/master-treasury-keypair.json 2>/dev/null || echo 'Error')"
    fi
fi

echo ""
echo "🔗 Verificando programa deployado..."

if [ -f "deployment-info.txt" ]; then
    echo "✅ deployment-info.txt existe"
    PROGRAM_ID=$(grep "Program ID:" deployment-info.txt | cut -d' ' -f3)
    if [ -n "$PROGRAM_ID" ]; then
        echo "📍 Program ID: $PROGRAM_ID"
        if command -v solana >/dev/null 2>&1; then
            if solana program show $PROGRAM_ID >/dev/null 2>&1; then
                echo "✅ Programa verificado en blockchain"
            else
                echo "❌ Programa no encontrado en blockchain"
            fi
        fi
    fi
else
    echo "❌ deployment-info.txt no encontrado"
fi

echo ""
echo "📦 Verificando dependencias Node.js..."

check_node_deps() {
    local dir=$1
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        if [ -d "$dir/node_modules" ]; then
            echo "✅ $dir: Dependencias instaladas"
        else
            echo "⚠️  $dir: Dependencias NO instaladas"
        fi
    else
        echo "❌ $dir: package.json no encontrado"
    fi
}

check_node_deps "backend"
check_node_deps "relayer"
check_node_deps "dashboard"
check_node_deps "examples/nft-claim"
check_node_deps "sdk"
check_node_deps "gasless_infrastructure_program"

echo ""
echo "🎯 RESUMEN DEL ESTADO"
echo "===================="

# Determinar qué necesitamos hacer
needs_rust=false
needs_solana=false
needs_anchor=false
needs_keypairs=false
needs_program_deploy=false
needs_node_deps=false

if ! command -v rustc >/dev/null 2>&1; then
    needs_rust=true
fi

if ! command -v solana >/dev/null 2>&1; then
    needs_solana=true
fi

if ! command -v anchor >/dev/null 2>&1; then
    needs_anchor=true
fi

if [ ! -f "keys/relayer-keypair.json" ] || [ ! -f "keys/master-treasury-keypair.json" ]; then
    needs_keypairs=true
fi

if [ ! -f "deployment-info.txt" ]; then
    needs_program_deploy=true
fi

if [ ! -d "backend/node_modules" ] || [ ! -d "relayer/node_modules" ]; then
    needs_node_deps=true
fi

echo "📋 Acciones necesarias:"

if [ "$needs_rust" = true ]; then
    echo "🦀 Instalar Rust"
fi

if [ "$needs_solana" = true ]; then
    echo "⛓️  Instalar Solana CLI"
fi

if [ "$needs_anchor" = true ]; then
    echo "⚓ Instalar Anchor"
fi

if [ "$needs_keypairs" = true ]; then
    echo "🔑 Generar keypairs"
fi

if [ "$needs_program_deploy" = true ]; then
    echo "🚀 Deploy programa Solana"
fi

if [ "$needs_node_deps" = true ]; then
    echo "📦 Instalar dependencias Node.js"
fi

if [ "$needs_rust" = false ] && [ "$needs_solana" = false ] && [ "$needs_anchor" = false ] && [ "$needs_keypairs" = false ] && [ "$needs_program_deploy" = false ] && [ "$needs_node_deps" = false ]; then
    echo "🎉 ¡Todo parece estar configurado!"
    echo ""
    echo "🚀 Puedes proceder con:"
    echo "   ./start-services.sh"
    echo "   ./test-system.sh"
else
    echo ""
    echo "🛠️  Ejecuta el setup completo:"
    echo "   ./setup-complete.sh"
fi

echo ""