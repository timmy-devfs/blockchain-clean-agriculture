import axios                  from 'axios';
import { EachMessagePayload } from 'kafkajs';
import { createLogger }       from '../../utils/logger';
import { callCreateSeason }   from '../../services/SmartContractService';
import { retry }              from '../../utils/RetryUtil';

const logger          = createLogger('SeasonCreatedConsumer');
const FARM_SERVICE_URL = process.env.FARM_SERVICE_URL ?? 'http://localhost:8082';
const INTERNAL_KEY    = process.env.INTERNAL_API_KEY  ?? '';

interface SeasonCreatedEvent {
  eventId:      string;
  seasonId:     string;
  farmId:       string;
  initialData?: string;
  timestamp:    string;
}

/**
 * SeasonCreatedConsumer
 * Nhận event → FarmTrace.createSeason() → callback txHash về farm-service
 * Acceptance Criteria: txHash không null sau confirm
 */
export async function handleSeasonCreated(payload: EachMessagePayload): Promise<void> {
  const raw = payload.message.value?.toString() ?? '{}';

  let event: SeasonCreatedEvent;
  try {
    event = JSON.parse(raw) as SeasonCreatedEvent;
  } catch {
    logger.error('Invalid JSON message');
    return;
  }

  const { seasonId, farmId, initialData = '' } = event;
  logger.info(`Processing SeasonCreated: seasonId=${seasonId}, farmId=${farmId}`);

  if (!process.env.FARM_TRACE_CONTRACT_ADDRESS ||
      process.env.FARM_TRACE_CONTRACT_ADDRESS === '0xYourFarmTraceAddress') {
    logger.warn('FARM_TRACE_CONTRACT_ADDRESS not set — skipping blockchain write');
    return;
  }

  // Retry 3 lần với backoff nếu VeChain timeout ✅
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