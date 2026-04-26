import express from 'express';
import dotenv   from 'dotenv';
import { createLogger }             from './utils/logger';
import { connectVeChain }           from './config/VeChainConfig';
import { initKafka, sendTestMessage, disconnectKafka } from './config/KafkaConfig';
import { initSmartContractService } from './services/SmartContractService';
import { deployContracts, getContractsStatus } from './controllers/ContractController';
import { traceRouter }              from './controllers/TraceController';

dotenv.config();

const logger = createLogger('BlockchainService');
const app    = express();
const PORT   = 8090;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'blockchain-service', timestamp: new Date().toISOString() });
});

app.get('/api/chain/contracts/status', getContractsStatus);
app.post('/api/chain/contracts/deploy', deployContracts);
app.use('/api/chain', traceRouter);

// ================================================================
// TEST ENDPOINTS — XÓA KHI KHÔNG CẦN TEST
// ================================================================

// GET /test-season-created — Đúng schema season-created.schema.json
app.get('/test-season-created', async (_req, res) => {
  const seasonId = `S${Date.now()}`;
  const event = {
    eventId:   crypto.randomUUID(),
    eventType: 'SEASON_CREATED',
    timestamp: new Date().toISOString(),
    version:   '1.0',
    payload: {
      seasonId,
      farmId:           'FARM01',
      farmName:         'Trang trại Tân Bình',
      cropType:         'Lúa ST25',
      startDate:        '2026-01-01',
      estimatedEndDate: '2026-04-30',
      area:             5.5,
      province:         'Tây Ninh',
      status:           'PREPARING',
      description:      'Vụ lúa mùa khô 2026, giống ST25 chất lượng cao',
    },
  };
  try {
    await sendTestMessage('bicap.season.created', event);
    return res.status(200).json({ status: 'ok', seasonId, event });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// GET /test-season-updated?seasonId=xxx — Đúng schema season-updated.schema.json
app.get('/test-season-updated', async (req, res) => {
  const seasonId = (req.query.seasonId as string) ?? 'S001';
  const event = {
    eventId:   crypto.randomUUID(),
    eventType: 'SEASON_UPDATED',
    timestamp: new Date().toISOString(),
    version:   '1.0',
    payload: {
      seasonId,
      farmId:    'FARM01',
      status:    'ACTIVE',
      note:      'Bón phân lần 1, cây phát triển tốt',
      imageUrls: [],
      updatedAt: new Date().toISOString(),
      updatedBy: 'user-farm-manager-01',
    },
  };
  try {
    await sendTestMessage('bicap.season.updated', event);
    return res.status(200).json({ status: 'ok', seasonId, event });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// GET /test-season-exported?seasonId=xxx — Đúng schema season-exported.schema.json
app.get('/test-season-exported', async (req, res) => {
  const seasonId = (req.query.seasonId as string) ?? 'S001';
  const event = {
    eventId:   crypto.randomUUID(),
    eventType: 'SEASON_EXPORTED',
    timestamp: new Date().toISOString(),
    version:   '1.0',
    payload: {
      seasonId,
      farmId:      'FARM01',
      cropType:    'Lúa ST25',
      exportedAt:  new Date().toISOString(),
      totalYield:  1500,
      unit:        'kg',
      certifiedBy: 'admin-user-01',
    },
  };
  try {
    await sendTestMessage('bicap.season.exported', event);
    return res.status(200).json({ status: 'ok', seasonId, event });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ================================================================
// KẾT THÚC TEST ENDPOINTS
// ================================================================

async function bootstrap() {
  try {
    const vechainOptional = (process.env.VECHAIN_OPTIONAL ?? 'true') === 'true';
    const kafkaOptional = (process.env.KAFKA_OPTIONAL ?? 'true') === 'true';
    let thorClient = null;

    try {
      thorClient = await connectVeChain();
      logger.info('VeChain Testnet connected successfully');
    } catch (vechainError) {
      if (!vechainOptional) {
        throw vechainError;
      }
      logger.warn('VeChain unavailable, starting in degraded mode');
    }

    if (thorClient) {
      initSmartContractService(
        thorClient,
        process.env.FARM_TRACE_CONTRACT_ADDRESS   ?? '',
        process.env.PRODUCT_CERT_CONTRACT_ADDRESS ?? ''
      );
    }

    try {
      await initKafka();
      logger.info('Kafka consumer group registered: blockchain-service');
    } catch (kafkaError) {
      if (!kafkaOptional) {
        throw kafkaError;
      }
      logger.warn('Kafka unavailable, starting in degraded mode');
    }

    app.listen(PORT, () => {
      logger.info(`Blockchain service running on port ${PORT}`);
      logger.info(`[TEST] GET  http://localhost:${PORT}/test-season-created`);
      logger.info(`[TEST] GET  http://localhost:${PORT}/test-season-updated?seasonId=xxx`);
      logger.info(`[TEST] GET  http://localhost:${PORT}/test-season-exported?seasonId=xxx`);
      logger.info(`Trace  : http://localhost:${PORT}/api/chain/trace/:seasonId`);
      logger.info(`QR     : http://localhost:${PORT}/api/chain/qr/:seasonId`);
    });
  } catch (err) {
    logger.error('Bootstrap failed', err);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => { await disconnectKafka(); process.exit(0); });
process.on('SIGINT',  async () => { await disconnectKafka(); process.exit(0); });

bootstrap();