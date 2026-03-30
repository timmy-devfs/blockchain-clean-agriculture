import { createHash } from 'crypto';

// SHA256 hash — dùng để tạo qrHash từ QR data string
export const sha256 = (input: string): string =>
  createHash('sha256').update(input, 'utf8').digest('hex');

export const getExplorerUrl = (txHash: string): string =>
  `https://explore-testnet.vechain.org/transactions/${txHash}`;