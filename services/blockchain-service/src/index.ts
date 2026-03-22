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

// Dùng timestamp làm seasonId để tránh trùng mỗi lần test
app.get('/test-season-created', async (_req, res) => {
  const seasonId = `S${Date.now()}`; // VD: S1742630583000 — unique mỗi lần
  const payload  = {
    eventId:     'test-001',
    seasonId,
    farmId:      'FARM01',
    initialData: 'Lua Jasmine - Tay Ninh',
    timestamp:   new Date().toISOString(),
  };
  try {
    await sendTestMessage('bicap.season.created', payload);
    return res.status(200).json({
      status:   'ok',
      message:  'SeasonCreated message sent',
      seasonId, // Trả về seasonId để dùng cho test tiếp theo
      payload,
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// POST /test-season-created với seasonId tùy chọn
app.post('/test-season-created', async (req, res) => {
  const { seasonId = `S${Date.now()}`, farmId = 'FARM01', initialData = 'Lua Jasmine' } =
    req.body as { seasonId?: string; farmId?: string; initialData?: string };
  const payload = { eventId: 'test-001', seasonId, farmId, initialData, timestamp: new Date().toISOString() };
  try {
    await sendTestMessage('bicap.season.created', payload);
    return res.status(200).json({ status: 'ok', seasonId, payload });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/test-season-updated', async (req, res) => {
  const seasonId = (req.query.seasonId as string) ?? 'S001';
  const payload  = {
    eventId:    'test-002',
    seasonId,
    updateData: 'Bon phan lan 1 - 2024-02-01',
    timestamp:  new Date().toISOString(),
  };
  try {
    await sendTestMessage('bicap.season.updated', payload);
    return res.status(200).json({ status: 'ok', payload });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/test-season-exported', async (req, res) => {
  const seasonId = (req.query.seasonId as string) ?? 'S001';
  const payload  = {
    eventId:      'test-003',
    seasonId,
    farmId:       'FARM01',
    exportDate:   new Date().toISOString().split('T')[0],
    seasonTxHash: '0x' + '0'.repeat(64),
    timestamp:    new Date().toISOString(),
  };
  try {
    await sendTestMessage('bicap.season.exported', payload);
    return res.status(200).json({ status: 'ok', payload });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ================================================================
// KẾT THÚC TEST ENDPOINTS
// ================================================================

async function bootstrap() {
  try {
    const thorClient = await connectVeChain();
    logger.info('VeChain Testnet connected successfully');

    initSmartContractService(
      thorClient,
      process.env.FARM_TRACE_CONTRACT_ADDRESS   ?? '',
      process.env.PRODUCT_CERT_CONTRACT_ADDRESS ?? ''
    );

    await initKafka();
    logger.info('Kafka consumer group registered: blockchain-service');

    app.listen(PORT, () => {
      logger.info(`Blockchain service running on port ${PORT}`);
      logger.info(`[TEST] GET  http://localhost:${PORT}/test-season-created`);
      logger.info(`[TEST] POST http://localhost:${PORT}/test-season-created  body: {seasonId, farmId}`);
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