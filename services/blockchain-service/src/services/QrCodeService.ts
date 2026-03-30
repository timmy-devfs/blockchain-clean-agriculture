import QRCode from 'qrcode';
import { createHash } from 'crypto';
import { createLogger } from '../utils/logger';

const logger = createLogger('QRCodeService');

export interface QRResult {
  qrCodeUrl:   string;
  imageBuffer: Buffer;
  qrHash:      string;
}

/**
 * generate — Tạo QR Code PNG buffer
 * Dùng chuỗi URL để điện thoại nhận diện được link
 */
export async function generateQRCode(url: string): Promise<QRResult> {
  const qrHash = createHash('sha256').update(url, 'utf8').digest('hex');

  logger.info(`Generating QR for URL: ${url}`);

  const imageBuffer = await QRCode.toBuffer(url, {
    type: 'png',
    width: 512,
    margin: 4,               // Tăng lên 4 để tạo viền trắng, giúp quét được trên nền tối
    errorCorrectionLevel: 'H'  // Mức độ sửa lỗi cao nhất
    // Đã gỡ bỏ phần color để dùng Đen/Trắng mặc định
  });

  return {
    qrCodeUrl: url,
    imageBuffer,
    qrHash,
  };
}

/**
 * generateBase64 — Tạo QR Code dạng base64
 */
export async function generateQRBase64(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 512,
    margin: 4,
    errorCorrectionLevel: 'H',
  });
}