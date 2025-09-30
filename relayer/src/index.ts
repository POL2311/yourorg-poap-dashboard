import dotenv from 'dotenv';
import { RelayerService } from './services/relayer.service';
import { PermitProcessor } from './services/permit-processor.service';
import { HealthMonitor } from './services/health-monitor.service';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';

dotenv.config();

class RelayerApp {
  private relayerService: RelayerService;
  private permitProcessor: PermitProcessor;
  private healthMonitor: HealthMonitor;

  constructor() {
    this.relayerService = new RelayerService();
    this.permitProcessor = new PermitProcessor(this.relayerService);
    this.healthMonitor = new HealthMonitor();
  }

  async start() {
    try {
      logger.info('🚀 Starting Gasless Relayer Service...');

      // Connect to databases
      await connectDatabase();
      await connectRedis();

      // Initialize services
      await this.relayerService.initialize();
      await this.permitProcessor.start();
      await this.healthMonitor.start();

      logger.info('✅ Gasless Relayer Service started successfully');
      logger.info(`📊 Relayer Public Key: ${this.relayerService.getPublicKey()}`);
      logger.info(`💰 Initial Balance: ${await this.relayerService.getBalance()} SOL`);

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Failed to start Relayer Service:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      try {
        await this.permitProcessor.stop();
        await this.healthMonitor.stop();
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Start the application
const app = new RelayerApp();
app.start();