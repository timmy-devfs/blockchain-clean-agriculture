import { Router, Request, Response } from 'express';
import { createLogger } from '../utils/logger';
import { getSeasonTrace } from '../services/TraceabilityService';
import { generateQRCode, generateQRBase64 } from '../services/QrCodeService';

const router = Router();
const logger = createLogger('TraceController');

// Xử lý BigInt cho JSON response
function replacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value;
}

// Endpoint trả về dữ liệu Blockchain
router.get('/trace/:seasonId', async (req: Request, res: Response) => {
  const { seasonId } = req.params;
  try {
    const data = await getSeasonTrace(seasonId);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ code: 200, data }, replacer));
  } catch (err) {
    logger.error(`/trace error: ${err}`);
    return res.status(500).json({ error: 'Trace failed' });
  }
});

// Endpoint trả về mã QR
router.get('/qr/:seasonId', async (req: Request, res: Response) => {
  const { seasonId } = req.params;
  const { format = 'png' } = req.query as Record<string, string>;

  if (!seasonId) return res.status(400).json({ error: 'seasonId is required' });

  // Lấy cấu hình từ .env
  const MY_IP = process.env.MY_IP || '127.0.0.1';
  const PORT = process.env.PORT || '8090';
  
  // TẠO URL TRUY XUẤT (Nội dung mã QR)
  const qrUrl = `http://${MY_IP}:${PORT}/api/chain/trace/${seasonId}`;

  try {
    if (format === 'base64') {
      const base64 = await generateQRBase64(qrUrl);
      return res.status(200).json({ code: 200, data: { seasonId, base64Image: base64 } });
    }

    // Gọi Service với tham số là chuỗi URL
    const result = await generateQRCode(qrUrl);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('X-QR-Target-URL', qrUrl);
    
    return res.status(200).send(result.imageBuffer);

  } catch (err) {
    logger.error(`/qr error: ${err}`);
    return res.status(500).json({ error: 'QR generation failed' });
  }
});

export { router as traceRouter };