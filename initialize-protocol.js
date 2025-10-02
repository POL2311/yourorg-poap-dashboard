#!/usr/bin/env node

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet, BN } = require('@coral-xyz/anchor');
const fs = require('fs');
const path = require('path');

console.log('🚀 INICIALIZANDO PROTOCOLO GASLESS INFRASTRUCTURE');
console.log('=================================================');

async function initializeProtocol() {
    try {
        // Configuración
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        const programId = new PublicKey('55NZkybMneNX4a1C9dDTtWUq1iv3NRprpgMxRSjRoUSX');
        
        // Cargar keypairs
        console.log('📁 Cargando keypairs...');
        
        const adminKeypairPath = path.join(process.env.HOME, '.config/solana/id.json');
        const masterTreasuryKeypairPath = './keys/master-treasury-keypair.json';
        const relayerKeypairPath = './keys/relayer-keypair.json';
        
        if (!fs.existsSync(adminKeypairPath)) {
            throw new Error(`Admin keypair no encontrado en: ${adminKeypairPath}`);
        }
        if (!fs.existsSync(masterTreasuryKeypairPath)) {
            throw new Error(`Master treasury keypair no encontrado en: ${masterTreasuryKeypairPath}`);
        }
        if (!fs.existsSync(relayerKeypairPath)) {
            throw new Error(`Relayer keypair no encontrado en: ${relayerKeypairPath}`);
        }
        
        const adminKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync(adminKeypairPath, 'utf8')))
        );
        const masterTreasuryKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync(masterTreasuryKeypairPath, 'utf8')))
        );
        const relayerKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync(relayerKeypairPath, 'utf8')))
        );
        
        console.log(`✅ Admin: ${adminKeypair.publicKey.toString()}`);
        console.log(`✅ Master Treasury: ${masterTreasuryKeypair.publicKey.toString()}`);
        console.log(`✅ Relayer: ${relayerKeypair.publicKey.toString()}`);
        
        // Verificar balances
        console.log('\n💰 Verificando balances...');
        const adminBalance = await connection.getBalance(adminKeypair.publicKey);
        const treasuryBalance = await connection.getBalance(masterTreasuryKeypair.publicKey);
        const relayerBalance = await connection.getBalance(relayerKeypair.publicKey);
        
        console.log(`Admin: ${adminBalance / 1e9} SOL`);
        console.log(`Master Treasury: ${treasuryBalance / 1e9} SOL`);
        console.log(`Relayer: ${relayerBalance / 1e9} SOL`);
        
        if (adminBalance < 0.1 * 1e9) {
            throw new Error('Admin balance too low (need at least 0.1 SOL)');
        }
        if (treasuryBalance < 1 * 1e9) {
            console.log('⚠️  Master Treasury balance is low, requesting airdrop...');
            await connection.requestAirdrop(masterTreasuryKeypair.publicKey, 2 * 1e9);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Configurar provider y programa
        const wallet = new Wallet(adminKeypair);
        const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
        
        // Cargar IDL
        const idlPath = './gasless_infrastructure_program/target/idl/gasless_infrastructure.json';
        if (!fs.existsSync(idlPath)) {
            throw new Error(`IDL no encontrado en: ${idlPath}`);
        }
        
        const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
        const program = new Program(idl, programId, provider);
        
        console.log('✅ Programa cargado');
        
        // Calcular PDAs
        const [protocolPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('gasless_protocol')],
            programId
        );
        
        console.log(`📍 Protocol PDA: ${protocolPDA.toString()}`);
        
        // Verificar si el protocolo ya está inicializado
        try {
            const protocolAccount = await program.account.gaslessProtocol.fetch(protocolPDA);
            console.log('✅ Protocolo ya está inicializado');
            console.log(`   Admin: ${protocolAccount.admin.toString()}`);
            console.log(`   Master Treasury: ${protocolAccount.masterTreasury.toString()}`);
            console.log(`   Protocol Fee: ${protocolAccount.protocolFeeBps} bps`);
            console.log(`   Total Services: ${protocolAccount.totalServices}`);
            console.log(`   Total Transactions: ${protocolAccount.totalTransactions}`);
            console.log(`   Is Active: ${protocolAccount.isActive}`);
        } catch (error) {
            // Protocolo no inicializado, proceder con inicialización
            console.log('🔄 Inicializando protocolo...');
            
            const protocolFeeBps = 100; // 1% protocol fee
            
            const tx = await program.methods
                .initializeProtocol(masterTreasuryKeypair.publicKey, protocolFeeBps)
                .accounts({
                    protocol: protocolPDA,
                    admin: adminKeypair.publicKey,
                    systemProgram: require('@solana/web3.js').SystemProgram.programId,
                })
                .signers([adminKeypair])
                .rpc();
            
            console.log(`✅ Protocolo inicializado: ${tx}`);
            
            // Verificar inicialización
            const protocolAccount = await program.account.gaslessProtocol.fetch(protocolPDA);
            console.log('📊 Estado del protocolo:');
            console.log(`   Admin: ${protocolAccount.admin.toString()}`);
            console.log(`   Master Treasury: ${protocolAccount.masterTreasury.toString()}`);
            console.log(`   Protocol Fee: ${protocolAccount.protocolFeeBps} bps`);
            console.log(`   Is Active: ${protocolAccount.isActive}`);
        }
        
        // Autorizar relayer
        console.log('\n🔐 Autorizando relayer...');
        
        const [relayerConfigPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('relayer'), relayerKeypair.publicKey.toBuffer()],
            programId
        );
        
        try {
            const relayerConfig = await program.account.relayerConfig.fetch(relayerConfigPDA);
            console.log('✅ Relayer ya está autorizado');
            console.log(`   Relayer: ${relayerConfig.relayer.toString()}`);
            console.log(`   Is Authorized: ${relayerConfig.isAuthorized}`);
        } catch (error) {
            console.log('🔄 Autorizando relayer...');
            
            const tx = await program.methods
                .authorizeRelayer(relayerKeypair.publicKey)
                .accounts({
                    protocol: protocolPDA,
                    relayerConfig: relayerConfigPDA,
                    admin: adminKeypair.publicKey,
                    systemProgram: require('@solana/web3.js').SystemProgram.programId,
                })
                .signers([adminKeypair])
                .rpc();
            
            console.log(`✅ Relayer autorizado: ${tx}`);
        }
        
        // Registrar servicio de ejemplo
        console.log('\n🏢 Registrando servicio de ejemplo...');
        
        const serviceId = 'nft-claim-example';
        const [servicePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('service'), Buffer.from(serviceId)],
            programId
        );
        
        try {
            const serviceAccount = await program.account.serviceProvider.fetch(servicePDA);
            console.log('✅ Servicio ya está registrado');
            console.log(`   Service ID: ${serviceId}`);
            console.log(`   Owner: ${serviceAccount.owner.toString()}`);
            console.log(`   Is Active: ${serviceAccount.isActive}`);
        } catch (error) {
            console.log('🔄 Registrando servicio...');
            
            const [feeVaultPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from('fee_vault'), servicePDA.toBuffer()],
                programId
            );
            
            const serviceFeeBps = 50; // 0.5% service fee
            const maxTransactionAmount = new BN(100_000_000); // 0.1 SOL max
            const allowedPrograms = [programId]; // Allow self-calls
            
            const tx = await program.methods
                .registerService(
                    adminKeypair.publicKey, // fee collector
                    serviceId,
                    serviceFeeBps,
                    maxTransactionAmount,
                    allowedPrograms
                )
                .accounts({
                    protocol: protocolPDA,
                    service: servicePDA,
                    feeVault: feeVaultPDA,
                    owner: adminKeypair.publicKey,
                    systemProgram: require('@solana/web3.js').SystemProgram.programId,
                })
                .signers([adminKeypair])
                .rpc();
            
            console.log(`✅ Servicio registrado: ${tx}`);
        }
        
        console.log('\n🎉 INICIALIZACIÓN COMPLETADA');
        console.log('============================');
        console.log('');
        console.log('📋 Resumen:');
        console.log(`   Protocol PDA: ${protocolPDA.toString()}`);
        console.log(`   Service PDA: ${servicePDA.toString()}`);
        console.log(`   Relayer Config PDA: ${relayerConfigPDA.toString()}`);
        console.log('');
        console.log('🚀 Próximos pasos:');
        console.log('   1. ./start-services.sh');
        console.log('   2. Ir a http://localhost:5174');
        console.log('   3. Probar claim de NFT gasless');
        console.log('');
        
        // Guardar información importante
        const initInfo = {
            protocolPDA: protocolPDA.toString(),
            servicePDA: servicePDA.toString(),
            relayerConfigPDA: relayerConfigPDA.toString(),
            serviceId,
            adminPublicKey: adminKeypair.publicKey.toString(),
            masterTreasuryPublicKey: masterTreasuryKeypair.publicKey.toString(),
            relayerPublicKey: relayerKeypair.publicKey.toString(),
            initializationDate: new Date().toISOString()
        };
        
        fs.writeFileSync('protocol-init-info.json', JSON.stringify(initInfo, null, 2));
        console.log('💾 Información guardada en protocol-init-info.json');
        
    } catch (error) {
        console.error('❌ Error inicializando protocolo:', error);
        process.exit(1);
    }
}

// Ejecutar inicialización
initializeProtocol();