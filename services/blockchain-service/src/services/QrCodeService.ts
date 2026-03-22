import QRCode from 'qrcode';
import { createHash } from 'crypto';
import { createLogger } from '../utils/logger';

const logger = createLogger('QRCodeService');

export interface QRData {
  seasonId:   string;
  farmId:     string;
  txHash:     string;
  exportDate: string;
}

export interface QRResult {
  qrCodeUrl:   string;
  imageBuffer: Buffer;
  qrHash:      string;
}

const BASE_URL = process.env.QR_BASE_URL ?? 'https://bicap.vn/trace';

/**
 * generate — Tạo QR Code PNG buffer
 * Acceptance Criteria: Content-Type=image/png, QR scan được
 */
export async function generateQRCode(data: QRData): Promise<QRResult> {
  const qrString = `${BASE_URL}/${data.seasonId}?farmId=${data.farmId}&txHash=${data.txHash}&v=1.0`;
  const qrHash   = createHash('sha256').update(qrString, 'utf8').digest('hex');

  logger.info(`Generating QR for season: ${data.seasonId}`);

  const imageBuffer = await QRCode.toBuffer(qrString, {
    type:                 'png',
    width:                512,  // 512px — đủ để camera điện thoại scan
    margin:               2,
    errorCorrectionLevel: 'M',
    color: { dark: '#1E3A5F', light: '#FFFFFF' },
  });

  logger.info(`QR generated — hash: ${qrHash.slice(0, 16)}...`);

  return {
    qrCodeUrl:   `${BASE_URL}/${data.seasonId}`,
    imageBuffer,
    qrHash,
  };
}

/**
 * generateBase64 — Tạo QR Code dạng base64
 */
export async function generateQRBase64(data: QRData): Promise<string> {
  const qrString = `${BASE_URL}/${data.seasonId}?farmId=${data.farmId}&txHash=${data.txHash}&v=1.0`;
  return QRCode.toDataURL(qrString, {
    width: 512, margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#1E3A5F', light: '#FFFFFF' },
  });
}