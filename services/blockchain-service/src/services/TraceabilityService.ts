import { createLogger } from '../utils/logger';
import { callGetSeason, callVerifyCertification } from './SmartContractService';
import { getExplorerUrl } from '../utils/HashUtil';

const logger = createLogger('TraceabilityService');

export interface TraceResult {
  seasonId:   string;
  verified:   boolean;
  seasonInfo: {
    seasonId:    string;
    farmId:      string;
    initialData: string;
    createdAt:   number;
    status:      string;
  };
  timeline: Array<{
    data:       string;
    timestamp:  number;
    explorerUrl?: string;
  }>;
  certification: {
    verified:    boolean;
    qrHash?:     string;
    exportDate?: string;
    certifiedAt?: number;
  };
  explorerUrl: string;
}

/**
 * getSeasonTrace — Truy xuất nguồn gốc đầy đủ từ blockchain
 * Acceptance Criteria: đúng season data + history từ blockchain
 */
export async function getSeasonTrace(seasonId: string): Promise<TraceResult> {
  logger.info(`getSeasonTrace: ${seasonId}`);

  const farmTraceAddress = process.env.FARM_TRACE_CONTRACT_ADDRESS ?? '';

  if (!farmTraceAddress || farmTraceAddress === '0xYourFarmTraceAddress') {
    logger.warn('Contract not deployed — returning stub data');
    return _buildStub(seasonId);
  }

  try {
    // Đọc SeasonRecord từ FarmTrace.sol
    const seasonData = await callGetSeason(seasonId) as unknown[] | null;

    if (!seasonData) throw new Error(`Season ${seasonId} not found on blockchain`);

    const [sid, farmId, initialData, createdAt, updateHistory] = seasonData as [
      string, string, string, bigint, Array<[string, bigint]>
    ];

    // Đọc certification từ ProductCertification.sol
    const certData = await callVerifyCertification(seasonId) as [boolean, string, string, bigint] | null;

    const timeline = (updateHistory ?? []).map(([data, timestamp]) => ({
      data:       data,
      timestamp:  Number(timestamp),
      explorerUrl: getExplorerUrl(''),
    }));

    return {
      seasonId,
      verified: true,
      seasonInfo: {
        seasonId:    sid || seasonId,
        farmId:      String(farmId),
        initialData: String(initialData),
        createdAt:   Number(createdAt),
        status:      certData?.[0] ? 'EXPORTED' : 'ACTIVE',
      },
      timeline,
      certification: {
        verified:    certData?.[0] ?? false,
        qrHash:      certData?.[1] || undefined,
        exportDate:  certData?.[2] || undefined,
        certifiedAt: certData?.[3] ? Number(certData[3]) : undefined,
      },
      explorerUrl: 'https://explore-testnet.vechain.org',
    };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`getSeasonTrace failed: ${msg}`);
    throw new Error(`Truy xuất nguồn gốc thất bại: ${msg}`);
  }
}

function _buildStub(seasonId: string): TraceResult {
  return {
    seasonId,
    verified: false,
    seasonInfo: {
      seasonId,
      farmId:      'stub-farm',
      initialData: '[DEV] Stub data — contract not deployed',
      createdAt:   Math.floor(Date.now() / 1000),
      status:      'ACTIVE',
    },
    timeline:      [{ data: '[STUB] No blockchain data', timestamp: Math.floor(Date.now() / 1000) }],
    certification: { verified: false },
    explorerUrl:   'https://explore-testnet.vechain.org',
  };
}