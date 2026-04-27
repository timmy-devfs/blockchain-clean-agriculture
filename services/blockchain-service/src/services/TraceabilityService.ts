import { createLogger } from '../utils/logger';
import axios from 'axios';
import { ethers } from 'ethers';

const logger = createLogger('TraceabilityService');

const NODE_URL     = process.env.VECHAIN_TESTNET_URL
  ?? process.env.VECHAIN_TESTNET_RPC
  ?? 'https://sync-testnet.vechain.org';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Convert BigInt → number/string an toàn
const toNum = (v: unknown): number => Number(v ?? 0);
const toStr = (v: unknown): string => String(v ?? '');

// Parse initialData JSON — SeasonCreatedConsumer ghi JSON vào đây
interface InitialDataJSON {
  farmName?:        string;
  cropType?:        string;
  startDate?:       string;
  estimatedEndDate?: string;
  province?:        string;
  description?:     string;
}

function parseInitialData(raw: string): InitialDataJSON {
  try {
    return JSON.parse(raw) as InitialDataJSON;
  } catch {
    // Fallback: trả về raw string trong cropType (data cũ trước khi sửa schema)
    return { cropType: raw };
  }
}

// Parse updateData JSON — SeasonUpdatedConsumer ghi JSON vào đây
interface UpdateDataJSON {
  status?:     string;
  note?:       string;
  imageUrls?:  string[];
  updatedAt?:  string;
  updatedBy?:  string;
}

function parseUpdateData(raw: string): UpdateDataJSON {
  try {
    return JSON.parse(raw) as UpdateDataJSON;
  } catch {
    return { note: raw };
  }
}

export interface TraceResult {
  seasonId:  string;
  verified:  boolean;
  farmInfo: {
    farmId:   string;
    farmName: string;
    province: string;
  };
  seasonInfo: {
    seasonId:         string;
    cropType:         string;
    startDate:        string;
    estimatedEndDate: string;
    description:      string;
    createdAt:        string;
    status:           string;
  };
  timeline: Array<{
    status:     string;
    note:       string;
    imageUrls:  string[];
    updatedAt:  string;
    updatedBy:  string;
    timestamp:  string;
  }>;
  certification: {
    verified:    boolean;
    cropType?:   string;
    exportedAt?: string;
    totalYield?: number;
    unit?:       string;
    qrHash?:     string;
  };
  explorerUrl: string;
}

export async function getSeasonTrace(seasonId: string): Promise<TraceResult> {
  logger.info(`getSeasonTrace: ${seasonId}`);

  const farmAddr = process.env.FARM_TRACE_CONTRACT_ADDRESS ?? '';
  if (!farmAddr) return _buildStub(seasonId, 'Contract not deployed');

  try {
    // Dùng mapping getter seasons(key) để đọc basic fields
    const mappingAbi = [{
      name: 'seasons',
      type: 'function',
      inputs:  [{ name: '', type: 'string' }],
      outputs: [
        { name: 'seasonId',    type: 'string'  },
        { name: 'farmId',      type: 'string'  },
        { name: 'initialData', type: 'string'  },
        { name: 'createdAt',   type: 'uint256' },
      ],
      stateMutability: 'view',
    }];

    const iface  = new ethers.Interface(mappingAbi);
    const data   = iface.encodeFunctionData('seasons', [seasonId]);
    const res    = await axios.post(`${NODE_URL}/accounts/*`, {
      clauses: [{ to: farmAddr, value: '0x0', data }],
      caller:  ZERO_ADDRESS,
    });

    const output = res.data[0]?.data as string;
    if (!output || output === '0x') return _buildStub(seasonId, 'No data returned');

    const decoded = iface.decodeFunctionResult('seasons', output);
    logger.info(`Decoded: ${JSON.stringify(decoded, (_k, v) => typeof v === 'bigint' ? v.toString() : v)}`);

    const sid         = toStr(decoded[0]);
    const farmId      = toStr(decoded[1]);
    const initialDataRaw = toStr(decoded[2]);
    const createdAt   = toNum(decoded[3]); // BigInt → number

    if (!sid || sid.trim() === '') {
      return _buildStub(seasonId, `Season ${seasonId} not found on blockchain`);
    }

    // Parse initialData JSON (ghi bởi SeasonCreatedConsumer)
    const info = parseInitialData(initialDataRaw);

    // Lấy updateHistory
    const timeline = await _getUpdateHistory(seasonId, farmAddr);

    // Xác định status từ timeline entry cuối cùng
    const lastStatus = timeline.length > 0
      ? timeline[timeline.length - 1].status
      : 'PREPARING';

    // Đọc certification
    let cert = { verified: false, cropType: '', exportedAt: '', totalYield: 0, unit: 'kg', qrHash: '' };
    const certAddr = process.env.PRODUCT_CERT_CONTRACT_ADDRESS ?? '';
    if (certAddr) {
      try {
        const certAbi = [{
          name: 'verifyCertification',
          type: 'function',
          inputs:  [{ name: '_seasonId', type: 'string' }],
          outputs: [{ name: '', type: 'bool' }, { name: '', type: 'string' }],
          stateMutability: 'view',
        }];
        const certIface  = new ethers.Interface(certAbi);
        const certData   = certIface.encodeFunctionData('verifyCertification', [seasonId]);
        const certRes    = await axios.post(`${NODE_URL}/accounts/*`, {
          clauses: [{ to: certAddr, value: '0x0', data: certData }],
          caller:  ZERO_ADDRESS,
        });
        const certOutput = certRes.data[0]?.data as string;
        if (certOutput && certOutput !== '0x') {
          const c = certIface.decodeFunctionResult('verifyCertification', certOutput);
          if (Boolean(c[0])) {
            // Parse certData JSON (ghi bởi SeasonExportedConsumer)
            try {
              const certJSON = JSON.parse(toStr(c[1])) as {
                qrHash?: string; cropType?: string; exportedAt?: string;
                totalYield?: number; unit?: string;
              };
              cert = {
                verified:    true,
                cropType:    certJSON.cropType    ?? '',
                exportedAt:  certJSON.exportedAt  ?? '',
                totalYield:  certJSON.totalYield  ?? 0,
                unit:        certJSON.unit         ?? 'kg',
                qrHash:      certJSON.qrHash       ?? '',
              };
            } catch {
              cert.verified = true;
            }
          }
        }
      } catch { /* no cert yet */ }
    }

    const finalStatus = cert.verified ? 'EXPORTED' : lastStatus;

    return {
      seasonId,
      verified: true,
      farmInfo: {
        farmId,
        farmName: info.farmName  ?? farmId,
        province: info.province  ?? '',
      },
      seasonInfo: {
        seasonId:         sid,
        cropType:         info.cropType         ?? '',
        startDate:        info.startDate         ?? '',
        estimatedEndDate: info.estimatedEndDate  ?? '',
        description:      info.description       ?? '',
        createdAt:        createdAt > 0 ? new Date(createdAt * 1000).toISOString() : '',
        status:           finalStatus,
      },
      timeline,
      certification: {
        verified:   cert.verified,
        cropType:   cert.cropType   || undefined,
        exportedAt: cert.exportedAt || undefined,
        totalYield: cert.totalYield || undefined,
        unit:       cert.unit       || undefined,
        qrHash:     cert.qrHash     || undefined,
      },
      explorerUrl: 'https://explore.vechain.org/fr',
    };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`getSeasonTrace failed: ${msg}`);
    throw new Error(`Truy xuất nguồn gốc thất bại: ${msg}`);
  }
}

async function _getUpdateHistory(seasonId: string, farmAddr: string): Promise<TraceResult['timeline']> {
  try {
    const abi = [{
      name: 'getSeason',
      type: 'function',
      inputs:  [{ name: '_seasonId', type: 'string' }],
      outputs: [{
        name: '', type: 'tuple',
        components: [
          { name: 'seasonId',      type: 'string'  },
          { name: 'farmId',        type: 'string'  },
          { name: 'initialData',   type: 'string'  },
          { name: 'createdAt',     type: 'uint256' },
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

    const decoded  = iface.decodeFunctionResult('getSeason', output);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record   = decoded[0] as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const history: any[] = Array.isArray(record?.updateHistory) ? record.updateHistory
      : Array.isArray(record?.[4]) ? record[4] : [];

    return history.map(entry => {
      const rawData  = toStr(Array.isArray(entry) ? entry[0] : entry?.data);
      const rawTime  = toNum(Array.isArray(entry) ? entry[1] : entry?.timestamp);
      // Parse updateData JSON (ghi bởi SeasonUpdatedConsumer)
      const upd = parseUpdateData(rawData);
      return {
        status:    upd.status    ?? 'ACTIVE',
        note:      upd.note      ?? rawData,
        imageUrls: upd.imageUrls ?? [],
        updatedAt: upd.updatedAt ?? '',
        updatedBy: upd.updatedBy ?? '',
        timestamp: new Date(rawTime * 1000).toISOString(),
      };
    });
  } catch {
    return [];
  }
}

function _buildStub(seasonId: string, reason: string): TraceResult {
  logger.warn(`Stub for ${seasonId}: ${reason}`);
  return {
    seasonId,
    verified:   false,
    farmInfo:   { farmId: '', farmName: '', province: '' },
    seasonInfo: { seasonId, cropType: '', startDate: '', estimatedEndDate: '', description: `[${reason}]`, createdAt: '', status: 'NOT_FOUND' },
    timeline:      [],
    certification: { verified: false },
    explorerUrl:   'https://explore.vechain.org/fr',
  };
}