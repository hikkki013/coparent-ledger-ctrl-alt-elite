import { ReceiptError } from './errors.ts';

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

export interface ValidReceiptType {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
}

/** A signature/type gate, not a decoder or malware scanner. Filenames are never trusted. */
export function validateReceiptBytes(bytes: Uint8Array, mimeType: string): ValidReceiptType {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_RECEIPT_BYTES) throw new ReceiptError('UPLOAD_INVALID');
  const startsWith = (signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  if (mimeType === 'image/jpeg' && startsWith([0xff, 0xd8, 0xff])) return { mimeType, extension: 'jpg' };
  if (mimeType === 'image/png' && startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mimeType, extension: 'png' };
  if (mimeType === 'image/webp' && bytes.byteLength >= 12 && startsWith([0x52, 0x49, 0x46, 0x46]) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return { mimeType, extension: 'webp' };
  throw new ReceiptError('UPLOAD_INVALID');
}
