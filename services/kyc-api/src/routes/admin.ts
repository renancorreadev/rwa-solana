/**
 * Admin Routes - Property Management API
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { adminService, CreatePropertyParams, MintTokensParams, DepositRevenueParams } from '../services/adminService.js';
import { config } from '../config.js';

const router = Router();

// Middleware to verify admin wallet
const verifyAdmin = (req: Request, res: Response, next: Function) => {
  const walletAddress = req.headers['x-wallet-address'] as string;

  if (!walletAddress) {
    return res.status(401).json({ error: 'Wallet address required' });
  }

  if (!adminService.isAdminWallet(walletAddress)) {
    return res.status(403).json({ error: 'Unauthorized - Admin access only' });
  }

  next();
};

// Validation schemas
const CreatePropertySchema = z.object({
  name: z.string().min(1).max(50),
  symbol: z.string().min(1).max(10),
  decimals: z.number().min(0).max(9).optional(),
  totalSupply: z.number().min(1),
  details: z.object({
    propertyType: z.string(),
    location: z.string(),
    totalValueUsd: z.number().min(0),
    valuePerToken: z.number().min(0),
    annualYieldPercent: z.number().min(0).max(100),
    propertyAddress: z.string(),
    metadataUri: z.string().max(500).optional(), // IPFS URI for metadata
  }),
});

const MintTokensSchema = z.object({
  propertyMint: z.string().min(32).max(44),
  investorWallet: z.string().min(32).max(44),
  amount: z.number().min(1),
});

const DepositRevenueSchema = z.object({
  propertyMint: z.string().min(32).max(44),
  epochNumber: z.number().min(1),
  amountSol: z.number().min(0),
});

// ============================================================================
// Public Routes (no auth required)
// ============================================================================

// GET /api/admin/config - Get admin configuration
router.get('/config', (req: Request, res: Response) => {
  res.json({
    adminWallet: config.admin.walletAddress,
    hubTokenProgramId: config.program.hubTokenProgramId.toString(),
    credentialProgramId: config.program.credentialProgramId.toString(),
    network: config.solana.network,
  });
});

// GET /api/admin/verify/:wallet - Check if wallet is admin
router.get('/verify/:wallet', (req: Request, res: Response) => {
  const { wallet } = req.params;
  const isAdmin = adminService.isAdminWallet(wallet);
  res.json({ isAdmin, wallet });
});

// ============================================================================
// Protected Routes (admin only)
// ============================================================================

// Apply admin verification middleware to all routes below
router.use(verifyAdmin);

// GET /api/admin/properties - Get all properties
router.get('/properties', async (req: Request, res: Response) => {
  try {
    const properties = await adminService.getProperties();
    res.json({ properties });
  } catch (error: any) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch properties' });
  }
});

// GET /api/admin/properties/:mint - Get property by mint
router.get('/properties/:mint', async (req: Request, res: Response) => {
  try {
    const { mint } = req.params;
    const property = await adminService.getProperty(mint);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ property });
  } catch (error: any) {
    console.error('Get property error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch property' });
  }
});

// POST /api/admin/properties - Create new property
router.post('/properties', async (req: Request, res: Response) => {
  try {
    const validationResult = CreatePropertySchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const params: CreatePropertyParams = validationResult.data;
    const result = await adminService.createProperty(params);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Create property error:', error);
    res.status(500).json({ error: error.message || 'Failed to create property' });
  }
});

// POST /api/admin/properties/:mint/toggle - Toggle property status
router.post('/properties/:mint/toggle', async (req: Request, res: Response) => {
  try {
    const { mint } = req.params;
    const result = await adminService.togglePropertyStatus(mint);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Toggle property status error:', error);
    res.status(500).json({ error: error.message || 'Failed to toggle property status' });
  }
});

// POST /api/admin/mint - Mint tokens to investor
router.post('/mint', async (req: Request, res: Response) => {
  try {
    const validationResult = MintTokensSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const params: MintTokensParams = validationResult.data;
    const result = await adminService.mintTokens(params);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Mint tokens error:', error);

    // Check for specific errors
    if (error.message?.includes('KYC') || error.message?.includes('credential')) {
      return res.status(400).json({ error: 'Investor does not have valid KYC credential' });
    }

    res.status(500).json({ error: error.message || 'Failed to mint tokens' });
  }
});

// POST /api/admin/revenue - Deposit revenue
router.post('/revenue', async (req: Request, res: Response) => {
  try {
    const validationResult = DepositRevenueSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const params: DepositRevenueParams = validationResult.data;
    const result = await adminService.depositRevenue(params);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Deposit revenue error:', error);
    res.status(500).json({ error: error.message || 'Failed to deposit revenue' });
  }
});

export default router;
