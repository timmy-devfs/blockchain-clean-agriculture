import axios                   from 'axios';
import { EachMessagePayload }  from 'kafkajs';
import { createLogger }        from '../../utils/logger';
import { callCertifyExport }   from '../../services/SmartContractService';
import { generateQRCode }      from '../../services/QrCodeService';
import { retry }               from '../../utils/RetryUtil';

const logger           = createLogger('SeasonExportedConsumer');
const FARM_SERVICE_URL = process.env.FARM_SERVICE_URL ?? 'http://localhost:8082';
const INTERNAL_KEY     = process.env.INTERNAL_API_KEY ?? '';

/**
 * Schema chuẩn: season-exported.schema.json
 * {
 *   eventId, eventType: "SEASON_EXPORTED", timestamp, version: "1.0",
 *   payload: {
 *     seasonId, farmId, cropType, exportedAt, totalYield, unit?, certifiedBy?
 *   }
 * }
 */
interface SeasonExportedEvent {
  eventId:   string;
  eventType: 'SEASON_EXPORTED';
  timestamp: string;
  version:   string;
  payload: {
    seasonId:    string;
    farmId:      string;
    cropType:    string;
    exportedAt:  string;
    totalYield:  number;
    unit?:       string;
    certifiedBy?: string;
  };
}

export async function handleSeasonExported(payload: EachMessagePayload): Promise<void> {
  const raw = payload.message.value?.toString() ?? '{}';

  let event: SeasonExportedEvent;
  try {
    event = JSON.parse(raw) as SeasonExportedEvent;
  } catch {
    logger.error('Invalid JSON message');
    return;
  }

  const { seasonId, farmId, cropType, exportedAt, totalYield, unit = 'kg', certifiedBy } = event.payload;
  const exportDate = exportedAt.split('T')[0]; // ISO date string → date only

  logger.info(`Processing SeasonExported: seasonId=${seasonId}, cropType=${cropType}, yield=${totalYield}${unit}`);

  // 1. Tạo QR Code PNG ✅
  const MY_IP = process.env.MY_IP || '127.0.0.1';
  const PORT = process.env.PORT || '8090';
  const qrUrl = `http://${MY_IP}:${PORT}/api/chain/trace/${seasonId}`;
  
  const qrResult = await generateQRCode(qrUrl);
  logger.info(`QR Code generated: ${qrResult.qrCodeUrl}`);

  // 2. certifyExport trên blockchain
  // certData = JSON chứa đầy đủ thông tin xuất xưởng
  let certTxHash = '';
  const certAddr = process.env.PRODUCT_CERT_CONTRACT_ADDRESS ?? '';
  if (certAddr) {
    const certData = JSON.stringify({
      qrHash:      qrResult.qrHash,
      cropType,
      exportedAt,
      totalYield,
      unit,
      certifiedBy: certifiedBy ?? '',
    });

    certTxHash = await retry(
      () => callCertifyExport(seasonId, certData),
      { maxAttempts: 3, baseDelayMs: 1_000, label: `certifyExport(${seasonId})` }
    );
    logger.info(`✅ certifyExport confirmed — txHash: ${certTxHash}`);
  }

  // 3. Callback về farm-service với qrCodeUrl ✅
  try {
    await axios.put(
      `${FARM_SERVICE_URL}/api/farm/seasons/${seasonId}/qr`,
      {
        qrCodeUrl:           qrResult.qrCodeUrl,
        qrHash:              qrResult.qrHash,
        certificationTxHash: certTxHash,
        confirmedAt:         new Date().toISOString(),
      },
      { timeout: 5_000, headers: { 'X-Internal-Key': INTERNAL_KEY } }
    );
    logger.info(`Callback OK: qrCodeUrl=${qrResult.qrCodeUrl}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`Callback failed: ${msg}`);
  }
}