// Actualización del PermitProcessor para usar reembolso automático
export class PermitProcessor {
  // ... código anterior ...

  private async processPermit(permit: PendingPermit): Promise<void> {
    try {
      const user = new PublicKey(permit.userPublicKey);
      
      // Verificar que master treasury tenga fondos suficientes
      const masterTreasuryBalance = await this.relayerService.checkMasterTreasuryBalance();
      const estimatedCost = await this.relayerService.estimateGasCost(
        user,
        permit.serviceId,
        permit.nonce
      );

      if (masterTreasuryBalance * 1e9 < estimatedCost * 10) { // Buffer de 10x
        logger.warn(`⚠️  Master treasury balance too low: ${masterTreasuryBalance} SOL`);
        // Notificar al admin sobre balance bajo
        await this.notifyLowBalance(masterTreasuryBalance);
        return;
      }

      // Verificar balance del relayer (necesita algo para pagar inicialmente)
      const relayerBalance = await this.relayerService.getBalance();
      if (relayerBalance * 1e9 < estimatedCost * 2) {
        logger.warn(`⚠️  Relayer balance too low: ${relayerBalance} SOL`);
        return;
      }

      logger.info(`⚡ Processing permit ${permit.permitId} for user ${permit.userPublicKey}`);
      
      // Ejecutar transacción gasless CON reembolso automático
      const result = await this.relayerService.executeGaslessTransactionWithReimbursement(
        user,
        permit.serviceId,
        permit.nonce
      );

      if (result.reimbursed) {
        logger.info(`✅ Permit ${permit.permitId} executed and reimbursed successfully`);
        logger.info(`💰 Gas cost: ${result.gasCost} lamports`);
        logger.info(`🔗 Transaction: ${result.txSignature}`);
      } else {
        logger.warn(`⚠️  Permit ${permit.permitId} executed but reimbursement failed`);
      }

      // Remover de la cola y notificar éxito
      await this.permitQueue.removePermit(permit.permitId);
      await this.notifyPermitStatus(permit.permitId, 'executed', result.txSignature);
      
    } catch (error) {
      logger.error(`❌ Error processing permit ${permit.permitId}:`, error);
      
      // Manejar reintentos
      permit.retryCount++;
      if (permit.retryCount >= this.maxRetries) {
        await this.permitQueue.removePermit(permit.permitId);
        await this.notifyPermitStatus(permit.permitId, 'failed', undefined, error.message);
      } else {
        await this.permitQueue.updatePermit(permit.permitId, { retryCount: permit.retryCount });
      }
    }
  }

  private async notifyLowBalance(balance: number): Promise<void> {
    try {
      await axios.post(
        `${process.env.API_URL}/api/admin/alerts`,
        {
          type: 'low_master_treasury_balance',
          message: `Master treasury balance is low: ${balance} SOL`,
          severity: 'high',
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
      logger.error('Error notifying low balance:', error);
    }
  }
}