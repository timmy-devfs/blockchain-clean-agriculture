import { Router, Request, Response } from 'express';
import { createLogger }    from '../utils/logger';
import { getSeasonTrace }  from '../services/TraceabilityService';
import { generateQRCode, generateQRBase64 } from '../services/QRCodeService';

const router = Router();
const logger = createLogger('TraceController');

// GET /api/chain/trace/:seasonId
// Acceptance Criteria: đúng season data + history từ blockchain
router.get('/trace/:seasonId', async (req: Request, res: Response) => {
  const { seasonId } = req.params;
  if (!seasonId) return res.status(400).json({ error: 'seasonId is required' });

  try {
    const data = await getSeasonTrace(seasonId);
    return res.status(200).json({ code: 200, message: 'Success', data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`/trace error: ${msg}`);
    return res.status(500).json({ error: 'Trace failed', message: msg });
  }
});

// GET /api/chain/qr/:seasonId
// Acceptance Criteria: Content-Type=image/png, QR scan được
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

    // PNG binary — Content-Type=image/png ✅
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