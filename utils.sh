#!/bin/bash

echo "🔧 GASLESS INFRASTRUCTURE - UTILIDADES"
echo "======================================"

show_help() {
    echo ""
    echo "📋 COMANDOS DISPONIBLES:"
    echo "======================="
    echo ""
    echo "🚀 Setup y Deployment:"
    echo "   ./setup-complete.sh     - Setup completo del sistema"
    echo "   ./start-services.sh     - Iniciar todos los servicios"
    echo "   ./stop-services.sh      - Detener todos los servicios"
    echo "   ./test-system.sh        - Ejecutar tests del sistema"
    echo ""
    echo "📊 Monitoreo:"
    echo "   ./utils.sh status       - Ver estado de servicios"
    echo "   ./utils.sh logs         - Ver logs en tiempo real"
    echo "   ./utils.sh balances     - Ver balances de wallets"
    echo "   ./utils.sh info         - Ver información del deployment"
    echo ""
    echo "🔧 Mantenimiento:"
    echo "   ./utils.sh restart      - Reiniciar todos los servicios"
    echo "   ./utils.sh clean        - Limpiar logs y archivos temporales"
    echo "   ./utils.sh reset        - Reset completo (cuidado!)"
    echo ""
    echo "💰 Solana:"
    echo "   ./utils.sh airdrop      - Obtener SOL para todas las wallets"
    echo "   ./utils.sh deploy       - Re-deploy del programa Solana"
    echo ""
    echo "🆘 Ayuda:"
    echo "   ./utils.sh help         - Mostrar esta ayuda"
    echo ""
}

show_status() {
    echo "📊 ESTADO DE SERVICIOS"
    echo "====================="
    echo ""
    
    # Verificar procesos
    check_process() {
        local name=$1
        local port=$2
        
        if [ -f "logs/$name.pid" ]; then
            local pid=$(cat logs/$name.pid)
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "✅ $name: Running (PID: $pid)"
                if [ "$port" != "none" ]; then
                    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
                        echo -e "   📡 Puerto $port: Activo"
                    else
                        echo -e "   ⚠️  Puerto $port: No responde"
                    fi
                fi
            else
                echo -e "❌ $name: Not running"
            fi
        else
            echo -e "❓ $name: PID file not found"
        fi
    }
    
    check_process "backend" "3000"
    check_process "relayer" "none"
    check_process "dashboard" "5173"
    check_process "nft-example" "5174"
    
    echo ""
    echo "🌐 URLs:"
    echo "   Dashboard: http://localhost:5173"
    echo "   NFT Example: http://localhost:5174"
    echo "   API: http://localhost:3000"
}

show_logs() {
    echo "📄 LOGS EN TIEMPO REAL"
    echo "====================="
    echo ""
    echo "Selecciona el servicio:"
    echo "1) Backend"
    echo "2) Relayer"
    echo "3) Dashboard"
    echo "4) NFT Example"
    echo "5) Todos"
    echo ""
    read -p "Opción (1-5): " choice
    
    case $choice in
        1) tail -f logs/backend.log ;;
        2) tail -f logs/relayer.log ;;
        3) tail -f logs/dashboard.log ;;
        4) tail -f logs/nft-example.log ;;
        5) tail -f logs/*.log ;;
        *) echo "Opción inválida" ;;
    esac
}

show_balances() {
    echo "💰 BALANCES DE WALLETS"
    echo "====================="
    echo ""
    
    if [ -f "deployment-info.txt" ]; then
        echo "Admin Wallet:"
        solana balance ~/.config/solana/id.json 2>/dev/null || echo "Error obteniendo balance"
        echo ""
        
        if [ -f "keys/relayer-keypair.json" ]; then
            echo "Relayer Wallet:"
            solana balance keys/relayer-keypair.json 2>/dev/null || echo "Error obteniendo balance"
            echo ""
        fi
        
        if [ -f "keys/master-treasury-keypair.json" ]; then
            echo "Master Treasury:"
            solana balance keys/master-treasury-keypair.json 2>/dev/null || echo "Error obteniendo balance"
            echo ""
        fi
    else
        echo "❌ deployment-info.txt no encontrado"
    fi
}

show_info() {
    echo "ℹ️  INFORMACIÓN DEL DEPLOYMENT"
    echo "============================="
    echo ""
    
    if [ -f "deployment-info.txt" ]; then
        cat deployment-info.txt
    else
        echo "❌ deployment-info.txt no encontrado"
        echo "🔧 Ejecuta ./setup-complete.sh primero"
    fi
}

restart_services() {
    echo "🔄 REINICIANDO SERVICIOS"
    echo "======================="
    echo ""
    
    ./stop-services.sh
    sleep 5
    ./start-services.sh
}

clean_system() {
    echo "🧹 LIMPIANDO SISTEMA"
    echo "==================="
    echo ""
    
    # Limpiar logs antiguos
    if [ -d "logs" ]; then
        echo "Limpiando logs antiguos..."
        find logs -name "*.log" -mtime +1 -delete 2>/dev/null || true
        find logs -name "*.pid" -delete 2>/dev/null || true
    fi
    
    # Limpiar archivos temporales
    echo "Limpiando archivos temporales..."
    rm -f session-info.txt test-results.txt
    
    # Limpiar node_modules cache
    echo "Limpiando cache de npm..."
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    
    echo "✅ Limpieza completada"
}

reset_system() {
    echo "⚠️  RESET COMPLETO DEL SISTEMA"
    echo "============================="
    echo ""
    echo "🚨 ADVERTENCIA: Esto eliminará:"
    echo "   - Todas las configuraciones"
    echo "   - Todas las keypairs"
    echo "   - Todos los logs"
    echo "   - Todos los archivos de deployment"
    echo ""
    read -p "¿Estás seguro? (escribe 'RESET' para confirmar): " confirm
    
    if [ "$confirm" = "RESET" ]; then
        echo "🔄 Ejecutando reset..."
        
        # Detener servicios
        ./stop-services.sh 2>/dev/null || true
        
        # Eliminar archivos
        rm -rf logs/
        rm -rf keys/
        rm -f deployment-info.txt session-info.txt test-results.txt
        rm -f initialize-protocol.js
        
        # Limpiar .env files
        rm -f backend/.env relayer/.env dashboard/.env examples/nft-claim/.env
        
        echo "✅ Reset completado"
        echo "🔧 Ejecuta ./setup-complete.sh para volver a configurar"
    else
        echo "❌ Reset cancelado"
    fi
}

airdrop_all() {
    echo "💰 OBTENIENDO SOL PARA TODAS LAS WALLETS"
    echo "======================================="
    echo ""
    
    # Admin
    echo "Admin wallet:"
    solana airdrop 2 ~/.config/solana/id.json || echo "Error en airdrop admin"
    
    # Relayer
    if [ -f "keys/relayer-keypair.json" ]; then
        echo "Relayer wallet:"
        solana airdrop 2 keys/relayer-keypair.json || echo "Error en airdrop relayer"
    fi
    
    # Master Treasury
    if [ -f "keys/master-treasury-keypair.json" ]; then
        echo "Master Treasury:"
        solana airdrop 5 keys/master-treasury-keypair.json || echo "Error en airdrop treasury"
    fi
    
    echo "✅ Airdrop completado"
}

redeploy_program() {
    echo "🔗 RE-DEPLOYING PROGRAMA SOLANA"
    echo "==============================="
    echo ""
    
    cd gasless_infrastructure_program
    
    echo "Building..."
    anchor build
    
    echo "Deploying..."
    anchor deploy
    
    cd ..
    
    echo "✅ Re-deploy completado"
    echo "⚠️  Actualiza el Program ID en los archivos .env"
}

# Main script
case "$1" in
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "balances")
        show_balances
        ;;
    "info")
        show_info
        ;;
    "restart")
        restart_services
        ;;
    "clean")
        clean_system
        ;;
    "reset")
        reset_system
        ;;
    "airdrop")
        airdrop_all
        ;;
    "deploy")
        redeploy_program
        ;;
    "help"|"")
        show_help
        ;;
    *)
        echo "❌ Comando desconocido: $1"
        show_help
        ;;
esac