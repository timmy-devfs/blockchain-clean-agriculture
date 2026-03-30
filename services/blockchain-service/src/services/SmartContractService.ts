import { ThorClient } from '@vechain/sdk-network';
import { ethers }     from 'ethers';
import { secp256k1, Transaction, address } from 'thor-devkit';
import { createLogger } from '../utils/logger';
import axios from 'axios';

const logger = createLogger('SmartContractService');

let thorClient:          ThorClient;
let farmTraceAddress:    string = '';
let productCertAddress:  string = '';

const NODE_URL    = process.env.VECHAIN_TESTNET_URL ?? 'https://sync-testnet.vechain.org';
const PRIVATE_KEY = process.env.VECHAIN_PRIVATE_KEY ?? '';

export function initSmartContractService(client: ThorClient, farmAddr: string, certAddr: string) {
  thorClient          = client;
  farmTraceAddress    = farmAddr;
  productCertAddress  = certAddr;
  logger.info(`Smart contracts initialized → FarmTrace: ${farmAddr} | Cert: ${certAddr}`);
}

export function getFarmTraceAddress():   string { return farmTraceAddress; }
export function getProductCertAddress(): string { return productCertAddress; }

// ── Core: gửi transaction lên VeChainThor ────────────────────

async function sendTransaction(contractAddress: string, data: string): Promise<string> {
  const privKey  = Buffer.from(PRIVATE_KEY, 'hex');
  const pubKey   = secp256k1.derivePublicKey(privKey);
  const from     = address.fromPublicKey(pubKey);

  // Lấy chainTag từ genesis block
  const genesisRes = await axios.get(`${NODE_URL}/blocks/0`);
  const chainTag   = parseInt((genesisRes.data.id as string).slice(-2), 16);

  // Lấy blockRef từ best block
  const bestRes  = await axios.get(`${NODE_URL}/blocks/best`);
  const blockRef = (bestRes.data.id as string).slice(0, 18);

  // Estimate gas
  let gas = 80_000;
  try {
    const estRes = await axios.post(`${NODE_URL}/accounts/*`, {
      clauses: [{ to: contractAddress, value: '0x0', data }],
      caller: from,
    });
    gas = Math.ceil((estRes.data[0]?.gasUsed as number ?? 50_000) * 1.5);
  } catch { /* dùng gas mặc định */ }

  const txBody = {
    chainTag,
    blockRef,
    expiration:   32,
    clauses:      [{ to: contractAddress, value: '0x0', data }],
    gasPriceCoef: 128,
    gas,
    dependsOn:    null,
    nonce:        Math.floor(Math.random() * 0xFFFFFFFF),
  };

  const tx     = new Transaction(txBody);
  tx.signature = secp256k1.sign(tx.signingHash(), privKey);
  const rawTx  = `0x${tx.encode().toString('hex')}`;

  const res  = await axios.post(`${NODE_URL}/transactions`, { raw: rawTx });
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

// ── FarmTrace functions ──────────────────────────────────────

// createSeason → Acceptance Criteria: txHash không null sau confirm
export async function callCreateSeason(
  seasonId: string, farmId: string, initialData: string
): Promise<string> {
  const abi   = ['function createSeason(string,string,string)'];
  const iface = new ethers.Interface(abi);
  const data  = iface.encodeFunctionData('createSeason', [seasonId, farmId, initialData]);

  logger.info(`Calling createSeason for ${seasonId}`);
  const txId = await sendTransaction(farmTraceAddress, data);
  await waitForConfirm(txId);
  logger.info(`createSeason confirmed — txHash: ${txId}`);
  return txId; // txHash không null ✅
}

// updateSeason → Acceptance Criteria: history[] tăng thêm 1
export async function callUpdateSeason(
  seasonId: string, updateData: string
): Promise<string> {
  const abi   = ['function updateSeason(string,string)'];
  const iface = new ethers.Interface(abi);
  const data  = iface.encodeFunctionData('updateSeason', [seasonId, updateData]);

  logger.info(`Calling updateSeason for ${seasonId}`);
  const txId = await sendTransaction(farmTraceAddress, data);
  await waitForConfirm(txId);
  logger.info(`updateSeason confirmed — txHash: ${txId} (history[]+1)`);
  return txId;
}

// certifyExport → Acceptance Criteria: QR Code PNG tạo, farm-service nhận callback
export async function callCertifyExport(
  seasonId: string, farmId: string, qrHash: string, exportDate: string
): Promise<string> {
  const abi   = ['function certifyExport(string,string,string,string)'];
  const iface = new ethers.Interface(abi);
  const data  = iface.encodeFunctionData('certifyExport', [seasonId, farmId, qrHash, exportDate]);

  logger.info(`Calling certifyExport for ${seasonId}`);
  const txId = await sendTransaction(productCertAddress, data);
  await waitForConfirm(txId);
  logger.info(`certifyExport confirmed — txHash: ${txId}`);
  return txId;
}

// getSeason — đọc view function (không tốn gas)
export async function callGetSeason(seasonId: string): Promise<unknown> {
  const abi    = ['function getSeason(string) view returns (string,string,string,uint256,(string,uint256)[])'];
  const iface  = new ethers.Interface(abi);
  const data   = iface.encodeFunctionData('getSeason', [seasonId]);
  const from   = address.fromPublicKey(secp256k1.derivePublicKey(Buffer.from(PRIVATE_KEY, 'hex')));

  const res = await axios.post(`${NODE_URL}/accounts/*`, {
    clauses: [{ to: farmTraceAddress, value: '0x0', data }],
    caller: from,
  });

  const output = res.data[0]?.data as string;
  if (!output || output === '0x') return null;
  return iface.decodeFunctionResult('getSeason', output);
}

// verifyCertification — đọc view function
export async function callVerifyCertification(seasonId: string): Promise<unknown> {
  const abi   = ['function verifyCertification(string) view returns (bool,string,string,uint256)'];
  const iface = new ethers.Interface(abi);
  const data  = iface.encodeFunctionData('verifyCertification', [seasonId]);
  const from  = address.fromPublicKey(secp256k1.derivePublicKey(Buffer.from(PRIVATE_KEY, 'hex')));

  const res = await axios.post(`${NODE_URL}/accounts/*`, {
    clauses: [{ to: productCertAddress, value: '0x0', data }],
    caller: from,
  });

  const output = res.data[0]?.data as string;
  if (!output || output === '0x') return null;
  return iface.decodeFunctionResult('verifyCertification', output);
}