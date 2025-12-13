// Polyfills for Solana/Web3 libraries
import { Buffer } from 'buffer';

// Make Buffer globally available
window.Buffer = Buffer;
(globalThis as any).Buffer = Buffer;

// Make global available
window.global = window.globalThis;

export {};
