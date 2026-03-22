import { createLogger } from '../utils/logger';
import axios from 'axios';
import { ethers } from 'ethers';

const logger = createLogger('TraceabilityService');

const NODE_URL     = process.env.VECHAIN_TESTNET_URL
  ?? process.env.VECHAIN_TESTNET_RPC
  ?? 'https://sync-testnet.vechain.org';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface TraceResult {
  seasonId:   string;
  verified:   boolean;
  seasonInfo: {
    seasonId:    string;
    farmId:      string;
    initialData: string;
    createdAt:   string;
    status:      string;
  };
  timeline: Array<{ data: string; timestamp: string }>;
  certification: { verified: boolean; certData?: string };
  explorerUrl: string;
}

export async function getSeasonTrace(seasonId: string): Promise<TraceResult> {
  logger.info(`getSeasonTrace: ${seasonId}`);

  const farmAddr = process.env.FARM_TRACE_CONTRACT_ADDRESS ?? '';
  if (!farmAddr) return _buildStub(seasonId, 'Contract not deployed');

  try {
    // Dùng mapping public thay vì getSeason()
    // FarmTrace.sol có: mapping(string => SeasonRecord) public seasons;
    // Khi mapping public → Solidity tự tạo getter: seasons(string key) → SeasonRecord
    const abi = [
      {
        name: 'seasons',
        type: 'function',
        inputs: [{ name: '', type: 'string' }],
        outputs: [
          { name: 'seasonId',    type: 'string'  },
          { name: 'farmId',      type: 'string'  },
          { name: 'initialData', type: 'string'  },
          { name: 'createdAt',   type: 'uint256' },
          // updateHistory KHÔNG được trả về bởi auto-getter của mapping
          // (Solidity không trả về dynamic array trong mapping getter)
        ],
        stateMutability: 'view',
      },
    ];

    const iface = new ethers.Interface(abi);
    const data  = iface.encodeFunctionData('seasons', [seasonId]);

    const res = await axios.post(`${NODE_URL}/accounts/*`, {
      clauses: [{ to: farmAddr, value: '0x0', data }],
      caller:  ZERO_ADDRESS,
    });

    const output = res.data[0]?.data as string;
    logger.info(`Raw output from blockchain: ${output?.slice(0, 100)}...`);

    if (!output || output === '0x') {
      return _buildStub(seasonId, 'No data returned');
    }

    const decoded = iface.decodeFunctionResult('seasons', output);
    logger.info(`Decoded: ${JSON.stringify(decoded, (_k, v) => typeof v === "bigint" ? v.toString() : v)}`);

    const sid         = String(decoded[0] ?? '');
    const farmId      = String(decoded[1] ?? '');
    const initialData = String(decoded[2] ?? '');
    const createdAt   = Number(decoded[3] ?? 0);

    if (!sid) {
      return _buildStub(seasonId, `Season ${seasonId} not found on blockchain`);
    }

    // Đọc updateHistory riêng qua getSeason()
    const timeline = await _getUpdateHistory(seasonId, farmAddr);

    // Đọc certification
    let cert = { verified: false, certData: '' };
    const certAddr = process.env.PRODUCT_CERT_CONTRACT_ADDRESS ?? '';
    if (certAddr) {
      try {
        const certAbi = [{
          name: 'verifyCertification',
          type: 'function',
          inputs: [{ name: '_seasonId', type: 'string' }],
          outputs: [
            { name: '', type: 'bool'   },
            { name: '', type: 'string' },
          ],
          stateMutability: 'view',
        }];
        const certIface = new ethers.Interface(certAbi);
        const certData  = certIface.encodeFunctionData('verifyCertification', [seasonId]);
        const certRes   = await axios.post(`${NODE_URL}/accounts/*`, {
          clauses: [{ to: certAddr, value: '0x0', data: certData }],
          caller:  ZERO_ADDRESS,
        });
        const certOutput = certRes.data[0]?.data as string;
        if (certOutput && certOutput !== '0x') {
          const certDecoded = certIface.decodeFunctionResult('verifyCertification', certOutput);
          cert = { verified: Boolean(certDecoded[0]), certData: String(certDecoded[1] ?? '') };
        }
      } catch { /* no cert */ }
    }

    return {
      seasonId,
      verified: true,
      seasonInfo: {
        seasonId:    sid,
        farmId,
        initialData,
        createdAt:   createdAt > 0 ? new Date(createdAt * 1000).toISOString() : '',
        status:      cert.verified ? 'EXPORTED' : (timeline.length > 0 ? 'ACTIVE' : 'PREPARING'),
      },
      timeline,
      certification: { verified: cert.verified, certData: cert.certData || undefined },
      explorerUrl: 'https://explore-testnet.vechain.org',
    };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`getSeasonTrace failed: ${msg}`);
    throw new Error(`Truy xuất nguồn gốc thất bại: ${msg}`);
  }
}

async function _getUpdateHistory(seasonId: string, farmAddr: string): Promise<Array<{ data: string; timestamp: string }>> {
  try {
    // Gọi getSeason() để lấy updateHistory
    const abi = [{
      name: 'getSeason',
      type: 'function',
      inputs: [{ name: '_seasonId', type: 'string' }],
      outputs: [{
        name: '',
        type: 'tuple',
        components: [
          { name: 'seasonId',    type: 'string'  },
          { name: 'farmId',      type: 'string'  },
          { name: 'initialData', type: 'string'  },
          { name: 'createdAt',   type: 'uint256' },
          { name: 'updateHistory', type: 'tuple[]', components: [
            { name: 'data',      type: 'string'  },
            { name: 'timestamp', type: 'uint256' },
          ]},
        ],
      }],
      stateMutability: 'view',
    }];

    const iface  = new ethers.Interface(abi);
    const data   = iface.encodeFunctionData('getSeason', [seasonId]);
    const res    = await axios.post(`${NODE_URL}/accounts/*`, {
      clauses: [{ to: farmAddr, value: '0x0', data }],
      caller:  ZERO_ADDRESS,
    });

    const output = res.data[0]?.data as string;
    if (!output || output === '0x') return [];

    const decoded = iface.decodeFunctionResult('getSeason', output);
    // decoded[0] là tuple, updateHistory là field index 4
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record  = decoded[0] as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const history = Array.isArray(record?.updateHistory) ? record.updateHistory as any[]
      : Array.isArray(record?.[4]) ? record[4] as any[] : [];

    return history.map((entry: {data?: string; timestamp?: bigint} | [string, bigint]) => {
      const d = Array.isArray(entry) ? entry[0] : entry.data ?? '';
      const t = Array.isArray(entry) ? entry[1] : entry.timestamp ?? 0n;
      return { data: String(d), timestamp: new Date(Number(t) * 1000).toISOString() };
    });
  } catch {
    return []; // Nếu lỗi thì trả history rỗng, không crash
  }
}

function _buildStub(seasonId: string, reason: string): TraceResult {
  logger.warn(`Stub for ${seasonId}: ${reason}`);
  return {
    seasonId,
    verified:   false,
    seasonInfo: { seasonId, farmId: '', initialData: `[${reason}]`, createdAt: '', status: 'NOT_FOUND' },
    timeline:      [],
    certification: { verified: false },
    explorerUrl:   'https://explore-testnet.vechain.org',
  };
}