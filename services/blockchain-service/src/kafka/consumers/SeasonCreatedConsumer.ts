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

export async function handleSeasonCreated(messagePayload: EachMessagePayload): Promise<void> {
  const raw = messagePayload.message.value?.toString() ?? '{}';

  let event: SeasonCreatedEvent;
  try {
    event = JSON.parse(raw) as SeasonCreatedEvent;
  } catch {
    logger.error('Invalid JSON message');
    return;
  }

  const eventPayload = event.payload;
  if (!eventPayload?.seasonId || !eventPayload?.farmId) {
    logger.warn('SeasonCreated: missing payload.seasonId or payload.farmId');
    return;
  }

  const { seasonId, farmId, farmName, cropType, startDate, estimatedEndDate, province, description } = eventPayload;

  logger.info(`Processing SeasonCreated: seasonId=${seasonId}, farmId=${farmId}, cropType=${cropType}`);

  let txHash: string;
  if (process.env.FARM_TRACE_CONTRACT_ADDRESS) {
    const initialData = JSON.stringify({
      farmName,
      cropType,
      startDate,
      estimatedEndDate: estimatedEndDate ?? '',
      province:         province ?? '',
      description:      description ?? '',
    });

    txHash = await retry(
      () => callCreateSeason(seasonId, farmId, initialData),
      { maxAttempts: 3, baseDelayMs: 1_000, label: `createSeason(${seasonId})` }
    );
    logger.info(`✅ createSeason on-chain — txHash: ${txHash}`);
  } else {
    txHash =
      process.env.BLOCKCHAIN_DEMO_TX_HASH?.trim() ||
      '0x0000000000000000000000000000000000000000000000000000000000b1cap';
    logger.warn(`FARM_TRACE_CONTRACT_ADDRESS not set — using demo txHash (no chain write): ${txHash}`);
  }

  if (!INTERNAL_KEY) {
    logger.warn('INTERNAL_API_KEY not set — skip farm callback');
    return;
  }

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