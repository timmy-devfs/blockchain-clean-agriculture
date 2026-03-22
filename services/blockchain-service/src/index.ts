import express from 'express';
import dotenv from 'dotenv';
import { createLogger }             from './utils/logger';
import { connectVeChain }           from './config/VeChainConfig';
import { initKafka }                from './config/KafkaConfig';
import { initSmartContractService } from './services/SmartContractService';
import { deployContracts, getContractsStatus } from './controllers/ContractController'; // BICAP-020
//import { traceRouter }              from './controllers/TraceController';               // BICAP-021

dotenv.config();
const logger = createLogger('BlockchainService');
const app    = express();
const PORT   = 8090;

app.use(express.json());

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:    'ok',
    service:   'blockchain-service',
    timestamp: new Date().toISOString(),
  });
});

// ── BICAP-020: Contract endpoints ─────────────────────────────
// GET  /api/chain/contracts/status  → địa chỉ 2 contracts
// POST /api/chain/contracts/deploy  → deploy (ADMIN only → 403 nếu không phải ADMIN)
app.get('/api/chain/contracts/status', getContractsStatus);
app.post('/api/chain/contracts/deploy', deployContracts);

// ── BICAP-021: Trace + QR endpoints ──────────────────────────
//app.use('/api/chain', traceRouter);

// ── Bootstrap ─────────────────────────────────────────────────
async function bootstrap() {
  try {
    // Kết nối VeChain
    const thorClient = await connectVeChain();
    logger.info('VeChain Testnet connected successfully');
    console.log("");

    // Khởi tạo SmartContractService với địa chỉ từ .env
    initSmartContractService(
      thorClient,
      process.env.FARM_TRACE_CONTRACT_ADDRESS    ?? '0xYourFarmTraceAddress',
      process.env.PRODUCT_CERT_CONTRACT_ADDRESS  ?? '0xYourProductCertAddress'
    );

    // Khởi tạo Kafka consumers
    await initKafka();
    logger.info('Kafka consumer group registered: blockchain-service');
    console.log("");

    app.listen(PORT, () => {
      logger.info(`Blockchain service running on port ${PORT}`);
      logger.info(`Status  : http://localhost:${PORT}/api/chain/contracts/status`);
      logger.info(`Trace   : http://localhost:${PORT}/api/chain/trace/:seasonId`);
      logger.info(`QR Code : http://localhost:${PORT}/api/chain/qr/:seasonId`);
    });
  } catch (err) {
    logger.error('Bootstrap failed', err);
    process.exit(1);
  }
}

bootstrap();