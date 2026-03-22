import axios                  from 'axios';
import { EachMessagePayload } from 'kafkajs';
import { createLogger }       from '../../utils/logger';
import { callUpdateSeason }   from '../../services/SmartContractService';
import { retry }              from '../../utils/RetryUtil';

const logger           = createLogger('SeasonUpdatedConsumer');
const FARM_SERVICE_URL = process.env.FARM_SERVICE_URL ?? 'http://localhost:8082';
const INTERNAL_KEY     = process.env.INTERNAL_API_KEY ?? '';

interface SeasonUpdatedEvent {
  eventId:     string;
  seasonId:    string;
  updateData?: string;
  timestamp:   string;
}

/**
 * SeasonUpdatedConsumer
 * Nhận event → FarmTrace.updateSeason() → callback txHash
 * Acceptance Criteria: history[] tăng thêm 1
 */
export async function handleSeasonUpdated(payload: EachMessagePayload): Promise<void> {
  const raw = payload.message.value?.toString() ?? '{}';

  let event: SeasonUpdatedEvent;
  try {
    event = JSON.parse(raw) as SeasonUpdatedEvent;
  } catch {
    logger.error('Invalid JSON message');
    return;
  }

  const { seasonId, updateData = '' } = event;
  logger.info(`Processing SeasonUpdated: seasonId=${seasonId}`);

  if (!process.env.FARM_TRACE_CONTRACT_ADDRESS ||
      process.env.FARM_TRACE_CONTRACT_ADDRESS === '0xYourFarmTraceAddress') {
    logger.warn('FARM_TRACE_CONTRACT_ADDRESS not set — skipping');
    return;
  }

  // Retry 3 lần với backoff ✅
  const txHash = await retry(
    () => callUpdateSeason(seasonId, updateData),
    { maxAttempts: 3, baseDelayMs: 1_000, label: `updateSeason(${seasonId})` }
  );

  logger.info(`✅ updateSeason confirmed — txHash: ${txHash} (history[]+1)`);

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