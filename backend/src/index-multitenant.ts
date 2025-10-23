// src/index-multitenant.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { AuthController } from './controllers/auth.controller';
import { CampaignController } from './controllers/campaign.controller';
import { MultiTenantNFTController } from './controllers/multi-tenant-nft.controller';
import { NFTClaimController } from './controllers/nft-claim.controller';
import { SystemController } from './controllers/system.controller';
import { AnalyticsController } from './controllers/analytics.controller';

import { authenticate, authenticateApiKey, authenticateUser } from './middleware/auth.middleware';
import userRoutes from './routes/user.routes';

const app = express();

/* ===== GLOBAL MIDDLEWARE ===== */
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

/* ===== RATE LIMITING ===== */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
});

/* ===== CONTROLLERS ===== */
let multiTenantNFTController: MultiTenantNFTController;
let legacyNFTController: NFTClaimController;
let analyticsController: AnalyticsController;

try {
  multiTenantNFTController = new MultiTenantNFTController();
  legacyNFTController = new NFTClaimController();
  analyticsController = new AnalyticsController();
  console.log('✅ Controllers initialized');
} catch (error) {
  console.error('❌ Error initializing controllers:', error);
  process.exit(1);
}

/* ===== SYSTEM ROUTES ===== */
app.get('/health', SystemController.healthCheck);
app.get('/api/system/stats', SystemController.getSystemStats);
app.get('/api/system/migration-status', SystemController.getMigrationStatus);
app.get('/api/system/test-db', SystemController.testDatabaseOperations);

/* ===== AUTH (Users & Organizers) ===== */
app.post('/api/auth/register', authLimiter, AuthController.register);
app.post('/api/auth/login', authLimiter, AuthController.login);
app.get('/api/auth/profile', authenticate, AuthController.getProfile); // devuelve USER u ORGANIZER según token

/* API Keys (solo ORGANIZER) */
app.post('/api/auth/api-keys', authenticate, AuthController.createApiKey);
app.get('/api/auth/api-keys', authenticate, AuthController.listApiKeys);
app.delete('/api/auth/api-keys/:keyId', authenticate, AuthController.deactivateApiKey);

/* ===== USER ROUTES (NORMAL USERS) ===== */
app.use('/api/user', userRoutes);

/* ===== CAMPAIGNS (ORGANIZER) ===== */
app.post('/api/campaigns', authenticate, CampaignController.createCampaign);
app.get('/api/campaigns', authenticate, CampaignController.listCampaigns);
app.get('/api/campaigns/:campaignId', authenticate, CampaignController.getCampaign);
app.put('/api/campaigns/:campaignId', authenticate, CampaignController.updateCampaign);
app.delete('/api/campaigns/:campaignId', authenticate, CampaignController.deleteCampaign);
app.get('/api/campaigns/:campaignId/analytics', authenticate, CampaignController.getCampaignAnalytics);
app.get('/api/campaigns/:campaignId/claims', authenticate, CampaignController.getCampaignClaims);

/* ===== ANALYTICS (ORGANIZER) ===== */
app.get('/api/analytics/dashboard', authenticate, (req, res) => analyticsController.getDashboardStats(req, res));
app.get('/api/analytics/claims/daily', authenticate, (req, res) => analyticsController.getDailyClaims(req, res));
app.get('/api/analytics/trend/monthly', authenticate, (req, res) => analyticsController.getMonthlyTrend(req, res));
app.get('/api/analytics/recent-activity', authenticate, (req, res) => analyticsController.getRecentActivity(req, res));

/* ===== PUBLIC CLAIMING ===== */
app.post('/api/poap/claim', multiTenantNFTController.claimPOAP);
app.get('/api/campaigns/:campaignId/public', multiTenantNFTController.getPublicCampaign);
app.get('/api/poap/user/:userPublicKey', multiTenantNFTController.getUserPOAPs);
app.get('/api/poap/user/:userPublicKey/stats', multiTenantNFTController.getUserClaimStats);
app.get('/api/public/campaigns', CampaignController.listPublicCampaigns)

/* ===== AUTHENTICATED USER (dashboard usuario) ===== */
app.get('/api/user/claim-stats', authenticateUser, multiTenantNFTController.getUserClaimStatsAuth);

/* ===== RELAYER ===== */
app.get('/api/relayer/stats', multiTenantNFTController.getRelayerStats);

/* ===== LEGACY ===== */
app.post('/api/nft/claim-magical', legacyNFTController.claimNFTMagical);
app.post('/api/nft/claim-with-signature', legacyNFTController.claimNFTWithSignature);
app.get('/api/nft/user/:userPublicKey', legacyNFTController.getUserNFTs);

/* ===== DOCS ===== */
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Multi-Tenant Gasless infrastructure API',
    version: '2.1.0',
    description: 'SaaS platform for gasless POAP minting on Solana with secret code validation',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    authentication: {
      jwt: {
        description: 'For organizer and user dashboard operations',
        header: 'Authorization: Bearer <token>',
        endpoints: ['/auth/*', '/user/*', '/campaigns/*'],
      },
      apiKey: {
        description: 'For POAP claiming operations (optional)',
        header: 'Authorization: ApiKey <key>',
        endpoints: ['/poap/claim'],
      },
    },
    features: {
      secretCodeValidation: { description: 'Campaigns can require secret codes for claiming' },
      gaslessMinting: { description: 'Relayer pays transaction costs', network: 'Solana Devnet' },
      multiTenant: { description: 'Multiple organizers with data isolation' },
    },
  });
});

/* ===== ERROR HANDLER ===== */
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ success: false, error: 'Internal server error', timestamp: new Date().toISOString() });
});

/* ===== 404 ===== */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/docs',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/profile',
    ],
  });
});

/* ===== START ===== */
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log('🚀 MULTI-TENANT Gasless infrastructure STARTED');
  console.log(`📍 URL: http://localhost:${PORT}`);
});
