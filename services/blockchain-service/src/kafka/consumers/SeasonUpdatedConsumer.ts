import axios                  from 'axios';
import { EachMessagePayload } from 'kafkajs';
import { createLogger }       from '../../utils/logger';
import { callUpdateSeason }   from '../../services/SmartContractService';
import { retry }              from '../../utils/RetryUtil';

const logger           = createLogger('SeasonUpdatedConsumer');
const FARM_SERVICE_URL = process.env.FARM_SERVICE_URL ?? 'http://localhost:8082';
const INTERNAL_KEY     = process.env.INTERNAL_API_KEY ?? '';

/**
 * Schema chuẩn: season-updated.schema.json
 * {
 *   eventId, eventType: "SEASON_UPDATED", timestamp, version: "1.0",
 *   payload: {
 *     seasonId, farmId, status, note?, imageUrls?, updatedAt, updatedBy
 *   }
 * }
 */
interface SeasonUpdatedEvent {
  eventId:   string;
  eventType: 'SEASON_UPDATED';
  timestamp: string;
  version:   string;
  payload: {
    seasonId:   string;
    farmId:     string;
    status:     'PREPARING' | 'ACTIVE' | 'HARVESTED';
    note?:      string;
    imageUrls?: string[];
    updatedAt:  string;
    updatedBy:  string;
  };
}

export async function handleSeasonUpdated(payload: EachMessagePayload): Promise<void> {
  const raw = payload.message.value?.toString() ?? '{}';

  let event: SeasonUpdatedEvent;
  try {
    event = JSON.parse(raw) as SeasonUpdatedEvent;
  } catch {
    logger.error('Invalid JSON message');
    return;
  }

  const { seasonId, farmId, status, note, imageUrls, updatedAt, updatedBy } = event.payload;

  logger.info(`Processing SeasonUpdated: seasonId=${seasonId}, status=${status}, updatedBy=${updatedBy}`);

  if (!process.env.FARM_TRACE_CONTRACT_ADDRESS) {
    logger.warn('FARM_TRACE_CONTRACT_ADDRESS not set — skipping');
    return;
  }

  // Gộp thông tin cập nhật vào updateData (FarmTrace.updateSeason chỉ nhận 1 string)
  const updateData = JSON.stringify({
    status,
    note:      note ?? '',
    imageUrls: imageUrls ?? [],
    updatedAt,
    updatedBy,
  });

  // Retry 3 lần với backoff ✅ (history[] tăng thêm 1)
  const txHash = await retry(
    () => callUpdateSeason(seasonId, updateData),
    { maxAttempts: 3, baseDelayMs: 1_000, label: `updateSeason(${seasonId})` }
  );

  logger.info(`✅ updateSeason confirmed — txHash: ${txHash} (history[]+1)`);

  // Callback về farm-service
  try {
    await axios.put(
      `${FARM_SERVICE_URL}/api/farm/seasons/${seasonId}/blockchain`,
      { txHash, confirmedAt: new Date().toISOString() },
      { timeout: 5_000, headers: { 'X-Internal-Key': INTERNAL_KEY } }
    );
    logger.info(`Callback OK: txHash saved`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`Callback failed: ${msg}`);
  }
}