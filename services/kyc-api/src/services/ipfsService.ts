/**
 * IPFS Service - Property Metadata and Image Storage
 *
 * Uses Pinata for IPFS pinning:
 * - Upload property images
 * - Create and pin metadata JSON
 * - Generate IPFS URIs for on-chain storage
 */

import { Readable } from 'stream';

// Pinata configuration
const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || '';
const PINATA_JWT = process.env.PINATA_JWT || '';
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

// Property metadata structure (follows NFT metadata standards)
export interface PropertyMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string; // Main image IPFS URI
  external_url?: string;
  attributes: PropertyAttribute[];
  properties: {
    files: PropertyFile[];
    category: string;
  };
}

export interface PropertyAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface PropertyFile {
  uri: string;
  type: string;
  cdn?: boolean;
}

export interface UploadResult {
  ipfsHash: string;
  ipfsUri: string;
  gatewayUrl: string;
  size?: number;
}

export interface PropertyMetadataInput {
  name: string;
  symbol: string;
  description: string;
  propertyType: string;
  location: string;
  propertyAddress: string;
  totalValueUsd: number;
  valuePerToken: number;
  annualYieldPercent: number;
  totalSupply: number;
  images: string[]; // Array of IPFS URIs for images
  documents?: string[]; // Array of IPFS URIs for documents
  amenities?: string[];
  yearBuilt?: number;
  squareMeters?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
}

// Pinata API response types
interface PinataUploadResponse {
  IpfsHash: string;
  PinSize?: number;
  Timestamp?: string;
}

interface PinataListResponse {
  rows: Array<{
    ipfs_pin_hash: string;
    size: number;
    date_pinned: string;
    metadata: {
      name: string;
      keyvalues: Record<string, string>;
    };
  }>;
}

class IpfsService {
  private baseUrl = 'https://api.pinata.cloud';

  /**
   * Check if Pinata is configured
   */
  isConfigured(): boolean {
    return !!(PINATA_JWT || (PINATA_API_KEY && PINATA_SECRET_KEY));
  }

  /**
   * Get authorization headers for Pinata API
   */
  private getHeaders(): Record<string, string> {
    if (PINATA_JWT) {
      return {
        Authorization: `Bearer ${PINATA_JWT}`,
      };
    }
    return {
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_KEY,
    };
  }

  /**
   * Upload a file to IPFS via Pinata
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new Error('IPFS service not configured. Set PINATA_JWT or PINATA_API_KEY/PINATA_SECRET_KEY');
    }

    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append('file', blob, fileName);

    // Pinata options
    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', pinataOptions);

    // Pinata metadata
    const pinataMetadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        type: 'property-image',
        uploadedAt: new Date().toISOString(),
      },
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload to IPFS: ${error}`);
    }

    const result = await response.json() as PinataUploadResponse;

    return {
      ipfsHash: result.IpfsHash,
      ipfsUri: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `${PINATA_GATEWAY}/${result.IpfsHash}`,
      size: result.PinSize,
    };
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadJson(data: object, name: string): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new Error('IPFS service not configured');
    }

    const response = await fetch(`${this.baseUrl}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataOptions: {
          cidVersion: 1,
        },
        pinataMetadata: {
          name: name,
          keyvalues: {
            type: 'property-metadata',
            uploadedAt: new Date().toISOString(),
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload JSON to IPFS: ${error}`);
    }

    const result = await response.json() as PinataUploadResponse;

    return {
      ipfsHash: result.IpfsHash,
      ipfsUri: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `${PINATA_GATEWAY}/${result.IpfsHash}`,
    };
  }

  /**
   * Create and upload property metadata
   */
  async createPropertyMetadata(input: PropertyMetadataInput): Promise<UploadResult> {
    // Build attributes array
    const attributes: PropertyAttribute[] = [
      { trait_type: 'Property Type', value: input.propertyType },
      { trait_type: 'Location', value: input.location },
      { trait_type: 'Total Value (USD)', value: input.totalValueUsd, display_type: 'number' },
      { trait_type: 'Value Per Token (USD)', value: input.valuePerToken, display_type: 'number' },
      { trait_type: 'Annual Yield', value: `${input.annualYieldPercent}%` },
      { trait_type: 'Total Supply', value: input.totalSupply, display_type: 'number' },
    ];

    // Add optional attributes
    if (input.yearBuilt) {
      attributes.push({ trait_type: 'Year Built', value: input.yearBuilt, display_type: 'number' });
    }
    if (input.squareMeters) {
      attributes.push({ trait_type: 'Area (m²)', value: input.squareMeters, display_type: 'number' });
    }
    if (input.bedrooms !== undefined) {
      attributes.push({ trait_type: 'Bedrooms', value: input.bedrooms, display_type: 'number' });
    }
    if (input.bathrooms !== undefined) {
      attributes.push({ trait_type: 'Bathrooms', value: input.bathrooms, display_type: 'number' });
    }
    if (input.parkingSpaces !== undefined) {
      attributes.push({ trait_type: 'Parking Spaces', value: input.parkingSpaces, display_type: 'number' });
    }
    if (input.amenities && input.amenities.length > 0) {
      attributes.push({ trait_type: 'Amenities', value: input.amenities.join(', ') });
    }

    // Build files array
    const files: PropertyFile[] = input.images.map((uri, index) => ({
      uri,
      type: 'image/jpeg',
      cdn: false,
    }));

    // Add documents if provided
    if (input.documents) {
      input.documents.forEach((uri) => {
        files.push({ uri, type: 'application/pdf', cdn: false });
      });
    }

    // Create metadata object
    const metadata: PropertyMetadata = {
      name: input.name,
      symbol: input.symbol,
      description: input.description,
      image: input.images[0] || '', // Main image is the first one
      external_url: `https://hubtoken.io/properties/${input.symbol.toLowerCase()}`,
      attributes,
      properties: {
        files,
        category: 'real-estate',
      },
    };

    // Upload to IPFS
    return this.uploadJson(metadata, `${input.symbol}-metadata.json`);
  }

  /**
   * Get gateway URL for an IPFS URI
   */
  getGatewayUrl(ipfsUri: string): string {
    if (ipfsUri.startsWith('ipfs://')) {
      const hash = ipfsUri.replace('ipfs://', '');
      return `${PINATA_GATEWAY}/${hash}`;
    }
    return ipfsUri;
  }

  /**
   * Fetch metadata from IPFS
   */
  async fetchMetadata(ipfsUri: string): Promise<PropertyMetadata | null> {
    try {
      const gatewayUrl = this.getGatewayUrl(ipfsUri);
      const response = await fetch(gatewayUrl);

      if (!response.ok) {
        console.error('Failed to fetch metadata:', response.statusText);
        return null;
      }

      return await response.json() as PropertyMetadata;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  }

  /**
   * Unpin a file from Pinata
   */
  async unpin(ipfsHash: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/pinning/unpin/${ipfsHash}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('Error unpinning:', error);
      return false;
    }
  }

  /**
   * List pinned files
   */
  async listPins(filters?: { name?: string; status?: string }): Promise<any[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const params = new URLSearchParams();
      if (filters?.name) params.append('metadata[name]', filters.name);
      if (filters?.status) params.append('status', filters.status);

      const response = await fetch(`${this.baseUrl}/data/pinList?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      const result = await response.json() as PinataListResponse;
      return result.rows || [];
    } catch (error) {
      console.error('Error listing pins:', error);
      return [];
    }
  }
}

export const ipfsService = new IpfsService();
