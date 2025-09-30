const { Connection, PublicKey, Keypair, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet, BN } = require('@coral-xyz/anchor');
const fs = require('fs');

async function initializeProtocol() {
    try {
        console.log('🚀 Inicializando protocolo gasless...');
        
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        const programId = new PublicKey('7QNe37UmuXqs84dbWQQ5ezs2PmREWg9QM98DbFTQEGi9');
        
        // Cargar keypairs
        const adminKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync(process.env.HOME + '/.config/solana/id.json')))
        );
        
        const masterTreasuryKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync('./keys/master-treasury-keypair.json')))
        );
        
        const relayerKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync('./keys/relayer-keypair.json')))
        );
        
        console.log('👤 Admin:', adminKeypair.publicKey.toString());
        console.log('💰 Master Treasury:', masterTreasuryKeypair.publicKey.toString());
        console.log('⚡ Relayer:', relayerKeypair.publicKey.toString());
        
        // Aquí irían las llamadas al programa para inicializar
        // Por ahora solo mostramos la información
        
        console.log('✅ Configuración lista para inicializar protocolo');
        console.log('📝 Ejecuta las transacciones de inicialización manualmente o implementa aquí');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

initializeProtocol();
