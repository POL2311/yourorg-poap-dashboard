# 🚀 GASLESS INFRASTRUCTURE - GUÍA DE DEPLOYMENT

## 📋 Scripts Disponibles

### 🔧 Setup Inicial
```bash
# Setup completo del sistema (solo ejecutar una vez)
chmod +x *.sh
./setup-complete.sh
```

### 🚀 Operaciones Diarias
```bash
# Iniciar todos los servicios
./start-services.sh

# Detener todos los servicios
./stop-services.sh

# Probar que todo funcione
./test-system.sh
```

### 🛠 Utilidades
```bash
# Ver estado de servicios
./utils.sh status

# Ver logs en tiempo real
./utils.sh logs

# Ver balances de wallets
./utils.sh balances

# Reiniciar servicios
./utils.sh restart

# Obtener SOL para todas las wallets
./utils.sh airdrop
```

## 🎯 Flujo de Deployment Completo

### 1. Setup Inicial (Solo una vez)
```bash
cd /mnt/d/program
chmod +x *.sh
./setup-complete.sh
```

**Esto hará:**
- ✅ Instalar todas las dependencias (Node.js, Rust, Solana, Anchor)
- ✅ Configurar Solana para devnet
- ✅ Crear keypairs para admin, relayer y master treasury
- ✅ Build y deploy del programa Solana
- ✅ Configurar backend, relayer, dashboard y ejemplo
- ✅ Crear todos los archivos .env necesarios
- ✅ Obtener SOL para todas las wallets

### 2. Iniciar Servicios
```bash
./start-services.sh
```

**Esto iniciará:**
- 🖥 Backend API (puerto 3000)
- ⚡ Relayer Service (background)
- 📱 Dashboard Admin (puerto 5173)
- 🎨 Ejemplo NFT (puerto 5174)

### 3. Probar el Sistema
```bash
./test-system.sh
```

**Esto verificará:**
- 📊 Que todos los servicios estén corriendo
- 🔗 Que las APIs respondan correctamente
- 💰 Que las wallets tengan balance
- 📄 Que no haya errores en los logs

### 4. Usar el Sistema
1. Ve a **http://localhost:5174** (Ejemplo NFT)
2. Conecta tu wallet (Phantom, Solflare, etc.)
3. Asegúrate de estar en **Devnet**
4. Haz click en **"Claim NFT"**
5. Firma el mensaje (gratis)
6. ¡Recibes un NFT sin pagar gas!

## 🔍 Monitoreo

### Ver Estado
```bash
./utils.sh status
```

### Ver Logs
```bash
./utils.sh logs
# Selecciona el servicio que quieres monitorear
```

### Ver Balances
```bash
./utils.sh balances
```

## 🆘 Solución de Problemas

### Si algo no funciona:
```bash
# 1. Ver logs para errores
./utils.sh logs

# 2. Reiniciar servicios
./utils.sh restart

# 3. Verificar balances
./utils.sh balances

# 4. Obtener más SOL si es necesario
./utils.sh airdrop

# 5. Ejecutar tests
./test-system.sh
```

### Reset Completo (último recurso):
```bash
./utils.sh reset
./setup-complete.sh
```

## 📁 Estructura de Archivos Generados

```
/mnt/d/program/
├── setup-complete.sh          # Setup inicial
├── start-services.sh          # Iniciar servicios
├── stop-services.sh           # Detener servicios
├── test-system.sh             # Tests del sistema
├── utils.sh                   # Utilidades
├── deployment-info.txt        # Info del deployment
├── keys/                      # Keypairs generadas
│   ├── relayer-keypair.json
│   └── master-treasury-keypair.json
├── logs/                      # Logs de servicios
│   ├── backend.log
│   ├── relayer.log
│   ├── dashboard.log
│   └── nft-example.log
└── [servicios con .env configurados]
```

## 🎉 ¡Listo para Usar!

Una vez completado el setup:

1. **Dashboard Admin**: http://localhost:5173
2. **Ejemplo NFT**: http://localhost:5174
3. **API Backend**: http://localhost:3000

**¡Tu infraestructura gasless está lista para que los usuarios reclamen NFTs sin pagar gas fees!**