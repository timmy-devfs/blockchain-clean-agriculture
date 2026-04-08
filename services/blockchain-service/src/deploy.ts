import 'dotenv/config';
import { secp256k1, Transaction, address } from 'thor-devkit';
import * as fs   from 'fs';
import * as path from 'path';
import axios     from 'axios';

/**
 * deploy.ts — Deploy Smart Contracts lên VeChainThor
 *
 * Dùng thor-devkit để ký transaction theo chuẩn VeChain
 * Không dùng ethers.JsonRpcProvider hay hardhat network
 * vì VeChain dùng Thor REST API riêng
 */

const NODE_URL    = process.env.VECHAIN_TESTNET_URL
  ?? process.env.VECHAIN_TESTNET_RPC
  ?? 'https://sync-testnet.vechain.org';
const PRIVATE_KEY = process.env.VECHAIN_PRIVATE_KEY ?? '';

// ── Helpers ────────────────────────────────────────────────────

function loadArtifact(contractName: string): { bytecode: string } {
  const artifactPath = path.join(
    __dirname, '../artifacts/src/contracts',
    `${contractName}.sol/${contractName}.json`
  );
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found: ${artifactPath}\nRun: npm run compile`);
  }
  const raw = JSON.parse(fs.readFileSync(artifactPath, 'utf-8')) as { bytecode: string };
  return { bytecode: raw.bytecode };
}

async function getChainTag(): Promise<number> {
  const res = await axios.get(`${NODE_URL}/blocks/0`);
  const id  = res.data.id as string;
  return parseInt(id.slice(-2), 16);
}

async function getBestBlock(): Promise<{ id: string; number: number }> {
  const res = await axios.get(`${NODE_URL}/blocks/best`);
  return res.data as { id: string; number: number };
}

async function estimateGas(bytecode: string, from: string): Promise<number> {
  try {
    const res = await axios.post(`${NODE_URL}/accounts/*`, {
      clauses: [{ to: null, value: '0x0', data: bytecode }],
      caller:  from,
    });
    const used = res.data[0]?.gasUsed as number ?? 300_000;
    return Math.ceil(used * 1.5);
  } catch {
    return 500_000;
  }
}

async function sendTransaction(bytecode: string, privateKeyHex: string): Promise<string> {
  const privKey = Buffer.from(privateKeyHex, 'hex');
  const pubKey  = secp256k1.derivePublicKey(privKey);
  const from    = address.fromPublicKey(pubKey);

  const chainTag  = await getChainTag();
  const bestBlock = await getBestBlock();
  const blockRef  = bestBlock.id.slice(0, 18); // first 8 bytes
  const gas       = await estimateGas(bytecode, from);

  console.log(`   From      : ${from}`);
  console.log(`   Gas       : ${gas}`);
  console.log(`   ChainTag  : ${chainTag}`);

  const txBody = {
    chainTag,
    blockRef,
    expiration:   32,
    clauses:      [{ to: null, value: '0x0', data: bytecode }],
    gasPriceCoef: 128,
    gas,
    dependsOn:    null,
    nonce:        Math.floor(Math.random() * 0xFFFFFFFF),
  };

  const tx        = new Transaction(txBody);
  const sigHash   = tx.signingHash();
  tx.signature    = secp256k1.sign(sigHash, privKey);
  const rawTx     = `0x${tx.encode().toString('hex')}`;

  const res = await axios.post(`${NODE_URL}/transactions`, { raw: rawTx });
  const txId = res.data.id as string;
  return txId;
}

async function waitForReceipt(txId: string): Promise<string> {
  console.log(`   Waiting for confirmation...`);
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const res = await axios.get(`${NODE_URL}/transactions/${txId}/receipt`);
      if (res.data && res.data.outputs) {
        const contractAddress = res.data.outputs[0]?.contractAddress as string;
        return contractAddress;
      }
    } catch { /* keep polling */ }
  }
  throw new Error(`Transaction ${txId} not confirmed after 60s`);
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  console.log('\n================================================');
  console.log('  BICAP — Deploy Smart Contracts to VeChainThor');
  console.log(`  Node: ${NODE_URL}`);
  console.log('================================================\n');

  if (!PRIVATE_KEY || !/^[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
    console.error('❌ VECHAIN_PRIVATE_KEY invalid — must be 64 hex chars');
    process.exit(1);
  }

  const privKey = Buffer.from(PRIVATE_KEY, 'hex');
  const pubKey  = secp256k1.derivePublicKey(privKey);
  const deployer = address.fromPublicKey(pubKey);
  console.log(`Deployer: ${deployer}\n`);

  async function deployContract(contractName: string): Promise<{ address: string; txHash: string }> {
    const { bytecode } = loadArtifact(contractName);
    console.log(`📦 Deploying ${contractName}...`);

    const txId            = await sendTransaction(bytecode, PRIVATE_KEY);
    const contractAddress = await waitForReceipt(txId);

    console.log(`✅ ${contractName} deployed!`);
    console.log(`   Address : ${contractAddress}`);
    console.log(`   TxHash  : ${txId}`);
    console.log(`   Explorer: https://explore-testnet.vechain.org/${txId}\n`);

    return { address: contractAddress, txHash: txId };
  }

  const farmTrace   = await deployContract('FarmTrace');
  const productCert = await deployContract('ProductCertification');

  // Lưu vào deployed-contracts.json
  const output = {
    network:    'testnet',
    deployedAt: new Date().toISOString(),
    deployer,
    contracts: {
      FarmTrace:            { address: farmTrace.address,   txHash: farmTrace.txHash },
      ProductCertification: { address: productCert.address, txHash: productCert.txHash },
    },
  };
  fs.writeFileSync(
    path.join(__dirname, '../deployed-contracts.json'),
    JSON.stringify(output, null, 2)
  );

  console.log('================================================');
  console.log('  DEPLOYMENT SUMMARY');
  console.log('================================================');
  console.log(`  FarmTrace            : ${farmTrace.address}`);
  console.log(`  ProductCertification : ${productCert.address}`);
}

main().catch(err => {
  console.error('❌ Deploy failed:', err.message);
  process.exit(1);
});