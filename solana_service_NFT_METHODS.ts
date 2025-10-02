// Agregar al SolanaService existente

// ✅ MÉTODO ESPECÍFICO PARA MINT NFT GASLESS
async mintNftGasless(
  relayer: Keypair,
  user: PublicKey,
  serviceId: string,
  nonce: BN,
  masterTreasury: Keypair
): Promise<{ txSignature: string; nftMint: PublicKey; userTokenAccount: PublicKey }> {
  try {
    const [protocolPDA] = this.getProtocolPDA();
    const [servicePDA] = this.getServiceProviderPDA(serviceId);
    const [userPermitPDA] = this.getUserPermitPDA(user, servicePDA, nonce);
    const [feeVaultPDA] = this.getFeeVaultPDA(servicePDA);

    // Generar nueva mint para el NFT
    const nftMint = Keypair.generate();
    
    // Calcular ATA del usuario para el NFT
    const userTokenAccount = await getAssociatedTokenAddress(
      nftMint.publicKey,
      user,
      false
    );

    const tx = await this.program.methods
      .mintNftGasless(user, serviceId, nonce)
      .accounts({
        relayer: relayer.publicKey,
        protocol: protocolPDA,
        service: servicePDA,
        userPermit: userPermitPDA,
        feeVault: feeVaultPDA,
        masterTreasury: masterTreasury.publicKey,
        nftMint: nftMint.publicKey,
        userNftAccount: userTokenAccount,
        userAuthority: user,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([relayer, nftMint, masterTreasury]) // ✅ MASTER TREASURY FIRMA
      .rpc();

    logger.info(`✅ NFT minted gaslessly: ${tx}`);
    logger.info(`🎨 NFT mint: ${nftMint.publicKey.toString()}`);
    logger.info(`👤 User token account: ${userTokenAccount.toString()}`);

    return {
      txSignature: tx,
      nftMint: nftMint.publicKey,
      userTokenAccount
    };
  } catch (error) {
    logger.error('❌ Error minting NFT gaslessly:', error);
    throw error;
  }
}

// ✅ MÉTODO PARA EJECUTAR CUALQUIER TRANSACCIÓN GASLESS
async executeGaslessTransactionWithMasterTreasury(
  relayer: Keypair,
  user: PublicKey,
  serviceId: string,
  nonce: BN,
  masterTreasury: Keypair,
  instructionType: 'nft_mint' | 'token_transfer' | 'generic' = 'generic'
): Promise<string> {
  try {
    // Según el tipo de instrucción, ejecutar la función específica
    switch (instructionType) {
      case 'nft_mint':
        const result = await this.mintNftGasless(relayer, user, serviceId, nonce, masterTreasury);
        return result.txSignature;
      
      case 'generic':
      default:
        // Ejecutar transacción gasless genérica
        const [protocolPDA] = this.getProtocolPDA();
        const [servicePDA] = this.getServiceProviderPDA(serviceId);
        const [userPermitPDA] = this.getUserPermitPDA(user, servicePDA, nonce);
        const [relayerConfigPDA] = this.getRelayerConfigPDA(relayer.publicKey);
        const [feeVaultPDA] = this.getFeeVaultPDA(servicePDA);

        const tx = await this.program.methods
          .executeGaslessTransaction(user, serviceId, nonce)
          .accounts({
            relayer: relayer.publicKey,
            protocol: protocolPDA,
            service: servicePDA,
            userPermit: userPermitPDA,
            relayerConfig: relayerConfigPDA,
            feeVault: feeVaultPDA,
            masterTreasury: masterTreasury.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([relayer, masterTreasury]) // ✅ MASTER TREASURY FIRMA
          .rpc();

        logger.info(`✅ Gasless transaction executed: ${tx}`);
        return tx;
    }
  } catch (error) {
    logger.error('❌ Error executing gasless transaction:', error);
    throw error;
  }
}