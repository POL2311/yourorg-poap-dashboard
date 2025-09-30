// Actualización del RelayerService para incluir reembolso automático
export class RelayerService {
  // ... código anterior ...

  // Ejecutar transacción gasless CON reembolso automático
  async executeGaslessTransactionWithReimbursement(
    user: PublicKey,
    serviceId: string,
    nonce: number
  ): Promise<{ txSignature: string; gasCost: number; reimbursed: boolean }> {
    try {
      const startBalance = await this.getBalance();
      
      // 1. Ejecutar la transacción gasless (relayer paga gas)
      const txSignature = await this.executeGaslessTransaction(user, serviceId, nonce);
      
      // 2. Calcular el costo real de gas
      const endBalance = await this.getBalance();
      const gasCost = Math.abs((startBalance - endBalance) * 1e9); // Convertir a lamports
      
      // 3. Solicitar reembolso inmediato desde master treasury
      const reimbursed = await this.requestReimbursement(serviceId, gasCost, txSignature);
      
      logger.info(`✅ Transaction executed: ${txSignature}`);
      logger.info(`💰 Gas cost: ${gasCost} lamports`);
      logger.info(`🔄 Reimbursed: ${reimbursed}`);
      
      return {
        txSignature,
        gasCost,
        reimbursed
      };
      
    } catch (error) {
      logger.error('❌ Error executing gasless transaction with reimbursement:', error);
      throw error;
    }
  }

  // Solicitar reembolso desde master treasury
  private async requestReimbursement(
    serviceId: string,
    gasCost: number,
    originalTxSignature: string
  ): Promise<boolean> {
    try {
      const [protocolPDA] = this.getProtocolPDA();
      const [servicePDA] = this.getServiceProviderPDA(serviceId);
      const [feeVaultPDA] = this.getFeeVaultPDA(servicePDA);
      
      // Obtener la master treasury keypair (debe estar configurada)
      const masterTreasuryKeypair = this.getMasterTreasuryKeypair();
      
      // Calcular fees
      const protocolInfo = await this.program.account.gaslessProtocol.fetch(protocolPDA);
      const serviceInfo = await this.program.account.serviceProvider.fetch(servicePDA);
      
      const protocolFee = Math.floor(gasCost * protocolInfo.protocolFeeBps / 10000);
      const serviceFee = Math.floor(gasCost * serviceInfo.serviceFeeBps / 10000);
      
      logger.info(`🔄 Requesting reimbursement: ${gasCost} lamports`);
      logger.info(`📊 Protocol fee: ${protocolFee} lamports`);
      logger.info(`🏢 Service fee: ${serviceFee} lamports`);
      
      // Ejecutar reembolso
      const reimburseTx = await this.program.methods
        .reimburseRelayer(
          new BN(gasCost),
          new BN(serviceFee),
          new BN(protocolFee)
        )
        .accounts({
          protocol: protocolPDA,
          service: servicePDA,
          feeVault: feeVaultPDA,
          masterTreasury: masterTreasuryKeypair.publicKey,
          relayer: this.keypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([masterTreasuryKeypair]) // Master treasury firma el reembolso
        .rpc();
      
      logger.info(`✅ Reimbursement successful: ${reimburseTx}`);
      
      // Notificar al backend sobre el reembolso
      await this.notifyReimbursement(originalTxSignature, reimburseTx, gasCost, serviceFee, protocolFee);
      
      return true;
      
    } catch (error) {
      logger.error('❌ Error requesting reimbursement:', error);
      return false;
    }
  }

  // Obtener master treasury keypair (configurado en env)
  private getMasterTreasuryKeypair(): Keypair {
    const masterTreasuryPrivateKey = process.env.MASTER_TREASURY_PRIVATE_KEY;
    if (!masterTreasuryPrivateKey) {
      throw new Error('MASTER_TREASURY_PRIVATE_KEY not configured');
    }
    return Keypair.fromSecretKey(bs58.decode(masterTreasuryPrivateKey));
  }

  // Notificar reembolso al backend
  private async notifyReimbursement(
    originalTx: string,
    reimburseTx: string,
    gasCost: number,
    serviceFee: number,
    protocolFee: number
  ): Promise<void> {
    try {
      await axios.post(
        `${process.env.API_URL}/api/relayer/reimbursement`,
        {
          originalTransaction: originalTx,
          reimbursementTransaction: reimburseTx,
          gasCost,
          serviceFee,
          protocolFee,
          relayerPublicKey: this.getPublicKey(),
          timestamp: new Date().toISOString()
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.RELAYER_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      logger.error('Error notifying reimbursement:', error);
    }
  }

  // Verificar balance de master treasury
  async checkMasterTreasuryBalance(): Promise<number> {
    try {
      const masterTreasuryKeypair = this.getMasterTreasuryKeypair();
      const balance = await this.connection.getBalance(masterTreasuryKeypair.publicKey);
      return balance / 1e9; // Convertir a SOL
    } catch (error) {
      logger.error('Error checking master treasury balance:', error);
      return 0;
    }
  }
}