import { ThorClient } from '@vechain/sdk-network';
import { ethers }     from 'ethers';
import { secp256k1, Transaction, address } from 'thor-devkit';
import { createLogger } from '../utils/logger';
import axios from 'axios';

const logger = createLogger('SmartContractService');

let thorClient:         ThorClient;
let farmTraceAddress:   string = '';
let productCertAddress: string = '';

const NODE_URL     = process.env.VECHAIN_TESTNET_URL
  ?? process.env.VECHAIN_TESTNET_RPC
  ?? 'https://sync-testnet.vechain.org';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// ABI đầy đủ dạng JSON — tránh lỗi parse ABI string phức tạp
const FARM_TRACE_ABI = [
  {
    name: 'createSeason',
    type: 'function',
    inputs: [
      { name: '_seasonId',    type: 'string' },
      { name: '_farmId',      type: 'string' },
      { name: '_initialData', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'updateSeason',
    type: 'function',
    inputs: [
      { name: '_seasonId', type: 'string' },
      { name: '_data',     type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getSeason',
    type: 'function',
    inputs: [{ name: '_seasonId', type: 'string' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'seasonId',      type: 'string' },
          { name: 'farmId',        type: 'string' },
          { name: 'initialData',   type: 'string' },
          { name: 'createdAt',     type: 'uint256' },
          {
            name: 'updateHistory',
            type: 'tuple[]',
            components: [
              { name: 'data',      type: 'string' },
              { name: 'timestamp', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
];

const PRODUCT_CERT_ABI = [
  {
    name: 'certifyExport',
    type: 'function',
    inputs: [
      { name: '_seasonId', type: 'string' },
      { name: '_certData', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'verifyCertification',
    type: 'function',
    inputs: [{ name: '_seasonId', type: 'string' }],
    outputs: [
      { name: '',         type: 'bool'   },
      { name: 'certData', type: 'string' },
    ],
    stateMutability: 'view',
  },
];

export function initSmartContractService(client: ThorClient, farmAddr: string, certAddr: string) {
  thorClient         = client;
  farmTraceAddress   = farmAddr;
  productCertAddress = certAddr;
  logger.info(`Smart contracts initialized → FarmTrace: ${farmAddr} | Cert: ${certAddr}`);
}

export function getFarmTraceAddress():   string { return farmTraceAddress; }
export function getProductCertAddress(): string { return productCertAddress; }

function getPrivateKey(): string {
  return process.env.VECHAIN_PRIVATE_KEY ?? '';
}

function getDeployerAddress(): string {
  const pk = getPrivateKey();
  if (!pk || !/^[0-9a-fA-F]{64}$/.test(pk)) return ZERO_ADDRESS;
  try {
    return address.fromPublicKey(secp256k1.derivePublicKey(Buffer.from(pk, 'hex')));
  } catch { return ZERO_ADDRESS; }
}

// ── Core: write transaction ───────────────────────────────────

async function sendTransaction(contractAddress: string, data: string): Promise<string> {
  const pk = getPrivateKey();
  if (!pk || !/^[0-9a-fA-F]{64}$/.test(pk)) {
    throw new Error(`VECHAIN_PRIVATE_KEY invalid (got ${pk.length} chars, need 64)`);
  }

  const privKey = Buffer.from(pk, 'hex');
  const from    = getDeployerAddress();

  const genesisRes = await axios.get(`${NODE_URL}/blocks/0`);
  const chainTag   = parseInt((genesisRes.data.id as string).slice(-2), 16);
  const bestRes    = await axios.get(`${NODE_URL}/blocks/best`);
  const blockRef   = (bestRes.data.id as string).slice(0, 18);

  let gas = 80_000;
  try {
    const est = await axios.post(`${NODE_URL}/accounts/*`, {
      clauses: [{ to: contractAddress, value: '0x0', data }],
      caller: from,
    });
    gas = Math.ceil((est.data[0]?.gasUsed as number ?? 50_000) * 1.5);
  } catch { /* dùng gas mặc định */ }

  const txBody = {
    chainTag, blockRef, expiration: 32,
    clauses:      [{ to: contractAddress, value: '0x0', data }],
    gasPriceCoef: 128, gas, dependsOn: null,
    nonce:        Math.floor(Math.random() * 0xFFFFFFFF),
  };

  const tx     = new Transaction(txBody);
  tx.signature = secp256k1.sign(tx.signingHash(), privKey);
  const rawTx  = `0x${tx.encode().toString('hex')}`;

  const res = await axios.post(`${NODE_URL}/transactions`, { raw: rawTx });
  return res.data.id as string;
}

async function waitForConfirm(txId: string): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3_000));
    try {
      const res = await axios.get(`${NODE_URL}/transactions/${txId}/receipt`);
      if (res.data?.meta) {
        logger.info(`Transaction confirmed: ${txId} at block #${res.data.meta.blockNumber}`);
        return;
      }
    } catch { /* keep polling */ }
  }
  throw new Error(`Transaction ${txId} not confirmed after 60s`);
}

// ── Core: read view function ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readContract(abi: any[], contractAddress: string, functionName: string, params: unknown[]): Promise<unknown> {
  const iface = new ethers.Interface(abi);
  const data  = iface.encodeFunctionData(functionName, params);

  const res = await axios.post(`${NODE_URL}/accounts/*`, {
    clauses: [{ to: contractAddress, value: '0x0', data }],
    caller:  ZERO_ADDRESS,
  });

  const output = res.data[0]?.data as string;
  if (!output || output === '0x') return null;

  try {
    const decoded = iface.decodeFunctionResult(functionName, output);
    return decoded;
  } catch (err) {
    logger.warn(`Decode failed for ${functionName}: ${(err as Error).message}`);
    return null;
  }
}

// ── FarmTrace functions ───────────────────────────────────────

export async function callCreateSeason(seasonId: string, farmId: string, initialData: string): Promise<string> {
  const iface = new ethers.Interface(FARM_TRACE_ABI);
  const data  = iface.encodeFunctionData('createSeason', [seasonId, farmId, initialData]);
  logger.info(`Calling createSeason for ${seasonId}`);
  const txId = await sendTransaction(farmTraceAddress, data);
  await waitForConfirm(txId);
  logger.info(`createSeason confirmed — txHash: ${txId}`);
  return txId;
}

export async function callUpdateSeason(seasonId: string, updateData: string): Promise<string> {
  const iface = new ethers.Interface(FARM_TRACE_ABI);
  const data  = iface.encodeFunctionData('updateSeason', [seasonId, updateData]);
  logger.info(`Calling updateSeason for ${seasonId}`);
  const txId = await sendTransaction(farmTraceAddress, data);
  await waitForConfirm(txId);
  logger.info(`updateSeason confirmed — txHash: ${txId} (history[]+1)`);
  return txId;
}

export async function callGetSeason(seasonId: string): Promise<unknown> {
  return readContract(FARM_TRACE_ABI, farmTraceAddress, 'getSeason', [seasonId]);
}

// ── ProductCertification functions ───────────────────────────

export async function callCertifyExport(seasonId: string, certData: string): Promise<string> {
  const iface = new ethers.Interface(PRODUCT_CERT_ABI);
  const data  = iface.encodeFunctionData('certifyExport', [seasonId, certData]);
  logger.info(`Calling certifyExport for ${seasonId}`);
  const txId = await sendTransaction(productCertAddress, data);
  await waitForConfirm(txId);
  logger.info(`certifyExport confirmed — txHash: ${txId}`);
  return txId;
}

export async function callVerifyCertification(seasonId: string): Promise<unknown> {
  return readContract(PRODUCT_CERT_ABI, productCertAddress, 'verifyCertification', [seasonId]);
}