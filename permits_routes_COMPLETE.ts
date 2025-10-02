// src/routes/permits.ts - ACTUALIZADO
import { Router } from 'express';
import { PermitController } from '../controllers/permit.controller';

const router = Router();
const permitController = new PermitController();

// ✅ RUTAS EXISTENTES
router.post('/create', permitController.createPermit);
router.get('/:permitId/status', permitController.getPermitStatus);
router.get('/user/:userPublicKey', permitController.getUserPermits);
router.post('/:permitId/execute', permitController.executePermit);
router.post('/validate-signature', permitController.validateSignature);
router.get('/analytics', permitController.getPermitAnalytics);

// ✅ NUEVAS RUTAS PARA NFT GASLESS
router.post('/mint-nft-gasless', permitController.mintNftGasless);
router.post('/claim-nft-simple', permitController.claimNftSimple);

// ✅ RUTA DE HEALTH CHECK ESPECÍFICA
router.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'permits',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /create - Create permit',
      'GET /:permitId/status - Get permit status', 
      'GET /user/:userPublicKey - Get user permits',
      'POST /:permitId/execute - Execute permit',
      'POST /validate-signature - Validate signature',
      'GET /analytics - Get analytics',
      'POST /mint-nft-gasless - Mint NFT gaslessly',
      'POST /claim-nft-simple - Simple NFT claim'
    ]
  });
});

export default router;