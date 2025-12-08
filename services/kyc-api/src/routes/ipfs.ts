/**
 * IPFS Routes - Image and Metadata Upload API
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ipfsService, PropertyMetadataInput } from '../services/ipfsService.js';
import { adminService } from '../services/adminService.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10, // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
});

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
const CreateMetadataSchema = z.object({
  name: z.string().min(1).max(50),
  symbol: z.string().min(1).max(10),
  description: z.string().min(1).max(2000),
  propertyType: z.string(),
  location: z.string(),
  propertyAddress: z.string(),
  totalValueUsd: z.number().min(0),
  valuePerToken: z.number().min(0),
  annualYieldPercent: z.number().min(0).max(100),
  totalSupply: z.number().min(1),
  images: z.array(z.string()).min(1), // IPFS URIs
  documents: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  yearBuilt: z.number().optional(),
  squareMeters: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  parkingSpaces: z.number().optional(),
});

// ============================================================================
// Public Routes
// ============================================================================

// GET /api/ipfs/status - Check IPFS service status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    configured: ipfsService.isConfigured(),
    service: 'Pinata',
  });
});

// GET /api/ipfs/gateway/:hash - Get gateway URL for IPFS hash
router.get('/gateway/:hash', (req: Request, res: Response) => {
  const { hash } = req.params;
  const ipfsUri = hash.startsWith('ipfs://') ? hash : `ipfs://${hash}`;
  const gatewayUrl = ipfsService.getGatewayUrl(ipfsUri);
  res.json({ ipfsUri, gatewayUrl });
});

// GET /api/ipfs/metadata/:hash - Fetch metadata from IPFS
router.get('/metadata/:hash', async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    const ipfsUri = hash.startsWith('ipfs://') ? hash : `ipfs://${hash}`;
    const metadata = await ipfsService.fetchMetadata(ipfsUri);

    if (!metadata) {
      return res.status(404).json({ error: 'Metadata not found' });
    }

    res.json({ metadata });
  } catch (error: any) {
    console.error('Fetch metadata error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch metadata' });
  }
});

// ============================================================================
// Protected Routes (admin only)
// ============================================================================

// Apply admin verification middleware to all routes below
router.use(verifyAdmin);

// POST /api/ipfs/upload/image - Upload single image
router.post('/upload/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!ipfsService.isConfigured()) {
      return res.status(503).json({ error: 'IPFS service not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await ipfsService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
});

// POST /api/ipfs/upload/images - Upload multiple images
router.post('/upload/images', upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    if (!ipfsService.isConfigured()) {
      return res.status(503).json({ error: 'IPFS service not configured' });
    }

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const results = await Promise.all(
      files.map((file) =>
        ipfsService.uploadFile(file.buffer, file.originalname, file.mimetype)
      )
    );

    res.json({
      success: true,
      count: results.length,
      uploads: results,
    });
  } catch (error: any) {
    console.error('Upload images error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload images' });
  }
});

// POST /api/ipfs/upload/document - Upload document (PDF)
router.post('/upload/document', upload.single('document'), async (req: Request, res: Response) => {
  try {
    if (!ipfsService.isConfigured()) {
      return res.status(503).json({ error: 'IPFS service not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF documents are allowed' });
    }

    const result = await ipfsService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload document' });
  }
});

// POST /api/ipfs/metadata - Create and upload property metadata
router.post('/metadata', async (req: Request, res: Response) => {
  try {
    if (!ipfsService.isConfigured()) {
      return res.status(503).json({ error: 'IPFS service not configured' });
    }

    const validationResult = CreateMetadataSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const input: PropertyMetadataInput = validationResult.data;
    const result = await ipfsService.createPropertyMetadata(input);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Create metadata error:', error);
    res.status(500).json({ error: error.message || 'Failed to create metadata' });
  }
});

// POST /api/ipfs/upload/json - Upload raw JSON
router.post('/upload/json', async (req: Request, res: Response) => {
  try {
    if (!ipfsService.isConfigured()) {
      return res.status(503).json({ error: 'IPFS service not configured' });
    }

    const { data, name } = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON data' });
    }

    const result = await ipfsService.uploadJson(data, name || 'data.json');

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Upload JSON error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload JSON' });
  }
});

// DELETE /api/ipfs/unpin/:hash - Unpin content from IPFS
router.delete('/unpin/:hash', async (req: Request, res: Response) => {
  try {
    if (!ipfsService.isConfigured()) {
      return res.status(503).json({ error: 'IPFS service not configured' });
    }

    const { hash } = req.params;
    const success = await ipfsService.unpin(hash);

    if (success) {
      res.json({ success: true, message: 'Content unpinned' });
    } else {
      res.status(500).json({ error: 'Failed to unpin content' });
    }
  } catch (error: any) {
    console.error('Unpin error:', error);
    res.status(500).json({ error: error.message || 'Failed to unpin content' });
  }
});

// GET /api/ipfs/pins - List pinned content
router.get('/pins', async (req: Request, res: Response) => {
  try {
    if (!ipfsService.isConfigured()) {
      return res.status(503).json({ error: 'IPFS service not configured' });
    }

    const { name, status } = req.query;
    const pins = await ipfsService.listPins({
      name: name as string,
      status: status as string,
    });

    res.json({ pins });
  } catch (error: any) {
    console.error('List pins error:', error);
    res.status(500).json({ error: error.message || 'Failed to list pins' });
  }
});

export default router;
