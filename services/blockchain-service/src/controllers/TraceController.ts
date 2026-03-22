import { Router, Request, Response } from 'express';
import { createLogger }    from '../utils/logger';
import { getSeasonTrace }  from '../services/TraceabilityService';
import { generateQRCode, generateQRBase64 } from '../services/QRCodeService';

const router = Router();
const logger = createLogger('TraceController');

// Chuyển BigInt → string khi JSON.stringify
// VeChain/ethers trả về BigInt cho uint256, Express không serialize được
function replacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value;
}

router.get('/trace/:seasonId', async (req: Request, res: Response) => {
  const { seasonId } = req.params;
  if (!seasonId) return res.status(400).json({ error: 'seasonId is required' });

  try {
    const data = await getSeasonTrace(seasonId);
    // Dùng replacer để handle BigInt trong response
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ code: 200, message: 'Success', data }, replacer));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`/trace error: ${msg}`);
    return res.status(500).json({ error: 'Trace failed', message: msg });
  }
});

router.get('/qr/:seasonId', async (req: Request, res: Response) => {
  const { seasonId }                                     = req.params;
  const { farmId = '', txHash = '', format = 'png' } = req.query as Record<string, string>;

  if (!seasonId) return res.status(400).json({ error: 'seasonId is required' });

  const qrData = {
    seasonId,
    farmId,
    txHash:     txHash || `0x${'0'.repeat(64)}`,
    exportDate: new Date().toISOString().split('T')[0],
  };

  try {
    if (format === 'base64') {
      const base64 = await generateQRBase64(qrData);
      return res.status(200).json({ code: 200, data: { seasonId, base64Image: base64 } });
    }

    const result = await generateQRCode(qrData);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qr-${seasonId}.png"`);
    res.setHeader('X-QR-Hash', result.qrHash);
    return res.status(200).send(result.imageBuffer);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`/qr error: ${msg}`);
    return res.status(500).json({ error: 'QR generation failed', message: msg });
  }
});

export { router as traceRouter };