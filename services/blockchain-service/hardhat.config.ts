import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const privateKey = process.env.VECHAIN_PRIVATE_KEY;

// Chỉ thêm accounts khi có private key hợp lệ (64 hex chars = 32 bytes)
const accounts = privateKey && /^[0-9a-fA-F]{64}$/.test(privateKey)
  ? [`0x${privateKey}`]
  : [];

const config: HardhatUserConfig = {
  solidity: "0.8.20",

  networks: {
    vechain: {
      // Đọc cả 2 tên biến — tương thích với .env hiện tại
      url: process.env.VECHAIN_NODE_URL ?? "https://sync-testnet.vechain.org",
      accounts,
      chainId: 39,
    },
  },

  paths: {
    sources:   "./src/contracts",
    tests:     "./src",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};

export default config;