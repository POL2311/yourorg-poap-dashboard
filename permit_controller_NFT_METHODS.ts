// Agregar al PermitController existente

// ✅ NUEVO ENDPOINT ESPECÍFICO PARA NFT MINTING
mintNftGasless = async (req: Request, res: Response) => {
  try {
    const {
      userPublicKey,
      serviceId,
      nftMetadata = {
        name: "Gasless NFT",
        symbol: "GNFT",
        description: "NFT minted without gas fees!"
      }
    } = req.body;

    const user = new PublicKey(userPublicKey);

    // Generar nonce automáticamente
    const nonce = await this.permitService.generateNonce(user.toString(), serviceId);

    // Crear instrucción dummy para NFT mint (el programa manejará la lógica real)
    const instructionData = Buffer.from(JSON.stringify({
      type: 'nft_mint',
      metadata: nftMetadata
    }));

    // Configuración del permit
    const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hora
    const maxFee = 50_000_000; // 0.05 SOL máximo

    // Obtener keypairs necesarios
    const relayerKeypair = this.relayerService.getRelayerKeypair();
    const masterTreasuryKeypair = this.relayerService.getMasterTreasuryKeypair();

    // Ejecutar mint NFT directamente (sin permit previo para simplificar)
    const result = await this.solanaService.mintNftGasless(
      relayerKeypair,
      user,
      serviceId,
      new BN(nonce),
      masterTreasuryKeypair
    );

    // Crear registro en base de datos
    const permit = await this.permitService.createPermit({
      userPublicKey: user.toString(),
      serviceId,
      nonce,
      instructionData: instructionData.toString('base64'),
      targetProgram: this.solanaService.programId.toString(),
      expiry,
      maxFee,
      signature: '', // No necesario para ejecución directa
      status: 'executed',
      transactionSignature: result.txSignature,
      executedAt: new Date()
    });

    logger.info(`🎉 NFT minted gaslessly for user: ${userPublicKey}`);
    logger.info(`🎨 NFT mint: ${result.nftMint.toString()}`);
    logger.info(`📦 Transaction: ${result.txSignature}`);

    res.status(201).json({
      success: true,
      data: {
        permitId: permit.id,
        nonce,
        transactionSignature: result.txSignature,
        nftMint: result.nftMint.toString(),
        userTokenAccount: result.userTokenAccount.toString(),
        status: 'executed',
        message: '🎉 NFT minted successfully without gas fees!'
      }
    });

  } catch (error) {
    logger.error('❌ Error minting NFT gaslessly:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to mint NFT gaslessly'
      });
    }
  }
};

// ✅ ENDPOINT SIMPLIFICADO PARA EL EJEMPLO
claimNftSimple = async (req: Request, res: Response) => {
  try {
    const { userPublicKey } = req.body;
    
    if (!userPublicKey) {
      throw new ApiError(400, 'userPublicKey is required');
    }

    // Usar servicio por defecto para el ejemplo
    const serviceId = process.env.DEFAULT_SERVICE_ID || 'nft-claim-example';

    // Llamar al método de mint
    const result = await this.mintNftGasless({
      body: {
        userPublicKey,
        serviceId,
        nftMetadata: {
          name: "Free Gasless NFT",
          symbol: "FGNFT", 
          description: "Congratulations! You claimed this NFT without paying any gas fees!"
        }
      }
    } as Request, res);

    return result;

  } catch (error) {
    logger.error('❌ Error in simple NFT claim:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim NFT'
    });
  }
};