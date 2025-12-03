import { Router } from 'express';
import credentialRoutes from './credential.js';
import kycRoutes from './kyc.js';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';
import ipfsRoutes from './ipfs.js';

const router = Router();

router.use('/credentials', credentialRoutes);
router.use('/kyc', kycRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/ipfs', ipfsRoutes);

export default router;
