import { ThorClient } from '@vechain/sdk-network';
import { createLogger } from '../utils/logger';

const logger = createLogger('VeChainConfig');

export async function connectVeChain(): Promise<ThorClient> {
  const rpcUrl = process.env.VECHAIN_TESTNET_RPC || 'https://testnet.vechain.org';
  
  // Khởi tạo client
  const thorClient = ThorClient.at(rpcUrl);

  try {
    // Lấy best block (compressed - nhẹ hơn, đủ để test kết nối)
    const bestBlock = await thorClient.blocks.getBestBlockCompressed();

    if (bestBlock === null) {
      logger.warn('Best block is null - node may not be fully synced or RPC issue');
      // Không throw error ngay, vẫn return client (có thể retry sau)
      // Hoặc throw new Error('VeChain node returned null best block');
    } else {
      logger.info(`VeChain Testnet connected successfully`);
      logger.info(`Best block number: ${bestBlock.number}`);
      logger.info(`Best block ID: ${bestBlock.id}`);
      logger.info(`Best block timestamp: ${new Date(bestBlock.timestamp * 1000).toISOString()}`);
    }

    return thorClient;
  } catch (err: any) {
    logger.error('Failed to connect to VeChain Testnet', {
      message: err.message,
      stack: err.stack,
      rpcUrl,
    });
    throw new Error(`VeChain connection failed: ${err.message}`);
  }
}