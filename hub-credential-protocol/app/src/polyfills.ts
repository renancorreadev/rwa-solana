import { Buffer } from 'buffer';

// Make Buffer available globally for Solana packages
(window as any).Buffer = Buffer;
(window as any).global = window;
