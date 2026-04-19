import axios                  from 'axios';
import { EachMessagePayload } from 'kafkajs';
import { createLogger }       from '../../utils/logger';
import { callCreateSeason }   from '../../services/SmartContractService';
import { retry }              from '../../utils/RetryUtil';

const logger           = createLogger('SeasonCreatedConsumer');
const FARM_SERVICE_URL = process.env.FARM_SERVICE_URL ?? 'http://localhost:8082';
const INTERNAL_KEY     = process.env.INTERNAL_API_KEY ?? '';

/**
 * Schema chuẩn: season-created.schema.json
 * {
 *   eventId, eventType: "SEASON_CREATED", timestamp, version: "1.0",
 *   payload: {
 *     seasonId, farmId, farmName, cropType, startDate,
 *     estimatedEndDate?, area?, province?, status: "PREPARING", description?
 *   }
 * }
 */
interface SeasonCreatedEvent {
  eventId:   string;
  eventType: 'SEASON_CREATED';
  timestamp: string;
  version:   string;
  payload: {
    seasonId:         string;
    farmId:           string;
    farmName:         string;
    cropType:         string;
    startDate:        string;
    estimatedEndDate?: string;
    area?:            number;
    province?:        string;
    status:           'PREPARING';
    description?:     string;
  };
}

export async function handleSeasonCreated(payload: EachMessagePayload): Promise<void> {
  const raw = payload.message.value?.toString() ?? '{}';

  let event: SeasonCreatedEvent;
  try {
    event = JSON.parse(raw) as SeasonCreatedEvent;
  } catch {
    logger.error('Invalid JSON message');
    return;
  }

  const { seasonId, farmId, farmName, cropType, startDate, estimatedEndDate, province, description } = event.payload;

  logger.info(`Processing SeasonCreated: seasonId=${seasonId}, farmId=${farmId}, cropType=${cropType}`);

  if (!process.env.FARM_TRACE_CONTRACT_ADDRESS) {
    logger.warn('FARM_TRACE_CONTRACT_ADDRESS not set — skipping blockchain write');
    return;
  }

  // Gộp thông tin vào initialData để lưu lên FarmTrace.sol
  // Contract chỉ có 1 field initialData (string) → serialize toàn bộ thông tin vào JSON
  const initialData = JSON.stringify({
    farmName,
    cropType,
    startDate,
    estimatedEndDate: estimatedEndDate ?? '',
    province:         province ?? '',
    description:      description ?? '',
  });

  // Retry 3 lần với backoff ✅
  const txHash = await retry(
    () => callCreateSeason(seasonId, farmId, initialData),
    { maxAttempts: 3, baseDelayMs: 1_000, label: `createSeason(${seasonId})` }
  );

  logger.info(`✅ createSeason confirmed — txHash: ${txHash}`);

  // Callback về farm-service
  try {
    await axios.put(
      `${FARM_SERVICE_URL}/api/farm/seasons/${seasonId}/blockchain`,
      { txHash, confirmedAt: new Date().toISOString() },
      { timeout: 5_000, headers: { 'X-Internal-Key': INTERNAL_KEY } }
    );
    logger.info(`Callback OK: txHash saved for ${seasonId}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`Callback failed: ${msg} — txHash: ${txHash}`);
  }
}