import axios                   from 'axios';
import { EachMessagePayload }  from 'kafkajs';
import { createLogger }        from '../../utils/logger';
import { callCertifyExport }   from '../../services/SmartContractService';
import { generateQRCode }      from '../../services/QRCodeService';
import { retry }               from '../../utils/RetryUtil';

const logger           = createLogger('SeasonExportedConsumer');
const FARM_SERVICE_URL = process.env.FARM_SERVICE_URL ?? 'http://localhost:8082';
const INTERNAL_KEY     = process.env.INTERNAL_API_KEY ?? '';

interface SeasonExportedEvent {
  eventId:       string;
  seasonId:      string;
  farmId?:       string;
  exportDate?:   string;
  seasonTxHash?: string;
  timestamp:     string;
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

  const { seasonId, farmId = '', exportDate = new Date().toISOString().split('T')[0], seasonTxHash = '' } = event;
  logger.info(`Processing SeasonExported: seasonId=${seasonId}`);

  // 1. Tạo QR Code PNG ✅
  const qrResult = await generateQRCode({
    seasonId, farmId,
    txHash:     seasonTxHash,
    exportDate,
  });
  logger.info(`QR Code generated: ${qrResult.qrCodeUrl}`);

  // 2. certifyExport — chỉ 2 params theo ProductCertification.sol thật
  // certData = JSON chứa qrHash + exportDate
  let certTxHash = '';
  const certAddr = process.env.PRODUCT_CERT_CONTRACT_ADDRESS ?? '';
  if (certAddr && certAddr !== '0xYourProductCertAddress') {
    const certData = JSON.stringify({
      qrHash: qrResult.qrHash,
      exportDate,
      farmId,
    });

    certTxHash = await retry(
      () => callCertifyExport(seasonId, certData), // 2 params ✅
      { maxAttempts: 3, baseDelayMs: 1_000, label: `certifyExport(${seasonId})` }
    );
    logger.info(`certifyExport confirmed — txHash: ${certTxHash}`);
  }

  // 3. Callback về farm-service ✅
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