import { ThorClient } from '@vechain/sdk-network';

export class VeChainConfig {
  private static _instance: VeChainConfig;
  private _client: ThorClient | null = null;
  private _connected = false;

  readonly nodeUrl = process.env.VECHAIN_NODE_URL ?? 'https://testnet.veblocks.net';
  readonly network = process.env.VECHAIN_NETWORK  ?? 'testnet';
  readonly privateKey = process.env.VECHAIN_PRIVATE_KEY ?? '';

  private constructor() {}

  static getInstance(): VeChainConfig {
    if (!VeChainConfig._instance) {
      VeChainConfig._instance = new VeChainConfig();
    }
    return VeChainConfig._instance;
  }

  async connect(): Promise<void> {
    if (this._connected) return;

    try {
      this._client = ThorClient.at(this.nodeUrl);

      // Verify kết nối bằng cách đọc block mới nhất
      const best = await this._client.blocks.getBestBlockCompressed();
      if (!best) throw new Error('Cannot fetch best block');

      this._connected = true;
      console.log(`[VeChainConfig] VeChain connected — block #${best.number} (${this.network})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[VeChainConfig] Connection failed: ${msg}`);
    }
  }

  getClient(): ThorClient {
    if (!this._client) throw new Error('ThorClient not initialized');
    return this._client;
  }

  isConnected(): boolean { return this._connected; }
  isReadOnly():  boolean { return !this.privateKey; }
}