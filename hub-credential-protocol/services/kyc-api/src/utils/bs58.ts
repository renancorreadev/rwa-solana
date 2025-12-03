// Simple bs58 implementation for Node.js
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP: { [key: string]: number } = {};

for (let i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP[ALPHABET[i]] = i;
}

export function encode(buffer: Uint8Array): string {
  if (buffer.length === 0) return '';

  const digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let result = '';
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    result += ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += ALPHABET[digits[i]];
  }

  return result;
}

export function decode(str: string): Uint8Array {
  if (str.length === 0) return new Uint8Array(0);

  const bytes = [0];
  for (let i = 0; i < str.length; i++) {
    const value = ALPHABET_MAP[str[i]];
    if (value === undefined) {
      throw new Error(`Invalid base58 character: ${str[i]}`);
    }
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  for (let i = 0; i < str.length && str[i] === ALPHABET[0]; i++) {
    bytes.push(0);
  }

  return new Uint8Array(bytes.reverse());
}

export default { encode, decode };
