# Gasless Infrastructure for Solana

Una infraestructura completa para transacciones gasless en Solana que permite a los usuarios interactuar con protocolos sin pagar fees de gas.

## 🚀 Características

- **Transacciones Gasless**: Los usuarios firman permisos off-chain sin costo
- **Relayer Automático**: Ejecuta transacciones automáticamente y se reembolsa
- **Multi-Servicio**: Múltiples proyectos pueden integrar la infraestructura
- **SDK Fácil de Usar**: Integración simple para desarrolladores
- **Dashboard Admin**: Panel de control completo para monitoreo
- **Escalable**: Diseñado para manejar alto volumen de transacciones

## 📁 Estructura del Proyecto

```
gasless-infrastructure/
├── programs/                    # Programa Solana (Anchor)
│   └── gasless-infrastructure/
├── backend/                     # API Backend (Node.js + TypeScript)
├── sdk/                        # SDK Frontend (TypeScript)
├── relayer/                    # Servicio Relayer (Node.js)
├── dashboard/                  # Dashboard Admin (React)
└── examples/                   # Ejemplos de integración
    └── nft-claim/
```

## 🛠 Instalación y Setup

### 1. Programa Solana

```bash
cd programs/gasless-infrastructure
anchor build
anchor deploy
```

### 2. Backend API

```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno
npm run dev
```

### 3. Relayer Service

```bash
cd relayer
npm install
cp .env.example .env
# Configurar RELAYER_PRIVATE_KEY y otras variables
npm run dev
```

### 4. Dashboard Admin

```bash
cd dashboard
npm install
npm run dev
```

### 5. SDK

```bash
cd sdk
npm install
npm run build
npm publish  # Para publicar en npm
```

## 🔧 Configuración

### Variables de Entorno

#### Backend (.env)
```env
PORT=3000
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=tu_program_id_aqui
MONGODB_URI=mongodb://localhost:27017/gasless
REDIS_URL=redis://localhost:6379
JWT_SECRET=tu_jwt_secret
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

#### Relayer (.env)
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=tu_program_id_aqui
RELAYER_PRIVATE_KEY=tu_relayer_private_key_base58
API_URL=http://localhost:3000
RELAYER_API_KEY=tu_relayer_api_key
```

## 📖 Uso del SDK

### Instalación

```bash
npm install @gasless-infra/sdk
```

### Ejemplo Básico

```typescript
import { GaslessSDK } from '@gasless-infra/sdk';
import { useWallet } from '@solana/wallet-adapter-react';

const gaslessSDK = new GaslessSDK({
  apiUrl: 'https://api.gasless-infra.com',
  serviceId: 'tu-servicio-id',
  apiKey: 'tu-api-key'
});

function MyComponent() {
  const wallet = useWallet();

  const handleGaslessTransaction = async () => {
    // Crear instrucción (ejemplo: mint NFT)
    const instruction = createMintInstruction(/* parámetros */);

    // Crear permit gasless
    const permit = await gaslessSDK.createPermit(
      wallet,
      instruction,
      {
        expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hora
        maxFee: 10_000_000 // 0.01 SOL máximo
      }
    );

    // Esperar ejecución
    const result = await gaslessSDK.waitForExecution(permit.permitId);
    
    if (result.status === 'executed') {
      console.log('¡Transacción ejecutada!', result.transactionSignature);
    }
  };

  return (
    <button onClick={handleGaslessTransaction}>
      Ejecutar Transacción Gasless
    </button>
  );
}
```

## 🔄 Flujo de Trabajo

1. **Usuario**: Firma un permiso off-chain (gratis)
2. **SDK**: Envía el permiso al backend
3. **Backend**: Valida y almacena el permiso
4. **Relayer**: Detecta nuevos permisos y los ejecuta
5. **Blockchain**: Transacción ejecutada, relayer reembolsado
6. **Usuario**: Recibe el resultado sin haber pagado gas

## 🏗 Arquitectura

### Componentes Principales

- **GaslessProtocol**: Configuración global del protocolo
- **ServiceProvider**: Servicios registrados que usan la infraestructura
- **UserPermit**: Permisos firmados por usuarios
- **RelayerConfig**: Configuración de relayers autorizados
- **FeeVault**: Gestión de fees y reembolsos

### Seguridad

- Verificación de firmas off-chain
- Nonces únicos para prevenir replay attacks
- Expiración de permisos
- Whitelist de programas permitidos por servicio
- Límites de fees máximos

## 📊 Monitoreo

El dashboard admin proporciona:

- Métricas en tiempo real
- Estado de relayers
- Análisis de permisos
- Gestión de servicios
- Configuración de fees

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Relayer tests
cd relayer && npm test

# SDK tests
cd sdk && npm test
```

## 🚀 Deployment

### Producción

1. Deploy del programa Solana en mainnet
2. Configurar RPC endpoints de producción
3. Setup de base de datos MongoDB
4. Configurar Redis para caching
5. Deploy del backend en servidor
6. Setup del relayer con alta disponibilidad
7. Deploy del dashboard

### Docker

```bash
# Build y run con Docker Compose
docker-compose up -d
```

## 💰 Monetización

- **Protocol Fees**: Fee base en cada transacción
- **Service Fees**: Cada servicio configura sus propios fees
- **Subscription Model**: Planes mensuales para servicios
- **Volume Discounts**: Descuentos por alto volumen

## 🤝 Contribuir

1. Fork el repositorio
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

- **Documentación**: [docs.gasless-infra.com](https://docs.gasless-infra.com)
- **Discord**: [discord.gg/gasless-infra](https://discord.gg/gasless-infra)
- **Email**: support@gasless-infra.com

## 🗺 Roadmap

- [ ] Soporte para más tipos de transacciones
- [ ] Integración con más wallets
- [ ] Optimizaciones de gas
- [ ] Métricas avanzadas
- [ ] API GraphQL
- [ ] Mobile SDK
- [ ] Cross-chain support

---

**¡Construyendo el futuro de las transacciones gasless en Solana! 🚀**# LatestV3
