import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { VeChainConfig } from './config/VeChainConfig';
import { KafkaConfig } from './config/KafkaConfig';

const app = express();
const PORT = parseInt(process.env.PORT ?? '8090', 10);

app.use(cors());
app.use(express.json());

// GET /health
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'blockchain-service',
  });
});

// Bootstrap
async function bootstrap(): Promise<void> {
  await VeChainConfig.getInstance().connect();

  const kafka = KafkaConfig.getInstance();
  await kafka.connect();
  //await kafka.startConsumers();

  app.listen(PORT, () => {
    console.log(`[blockchain-service] Server running on port ${PORT}`);
  });
}

process.on('SIGTERM', async () => { await KafkaConfig.getInstance().disconnect(); process.exit(0); });
process.on('SIGINT',  async () => { await KafkaConfig.getInstance().disconnect(); process.exit(0); });

bootstrap();

export default app;