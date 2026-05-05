import { Request, Response } from 'express';

export async function deployContracts(req: Request, res: Response) {
  const role = req.headers['x-user-role'];

  if (role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only ADMIN can deploy contracts' });
  }

  return res.json({
    message: 'Contracts already deployed via script. Use GET /status to see addresses',
  });
}

export async function getContractsStatus(_req: Request, res: Response) {
  // Đọc từ .env thay vì hardcode
  const farmAddress = process.env.FARM_TRACE_CONTRACT_ADDRESS   ?? '';
  const certAddress = process.env.PRODUCT_CERT_CONTRACT_ADDRESS ?? '';

  return res.json({
    farmTrace:            farmAddress,
    productCertification: certAddress,
    network:              process.env.VECHAIN_NETWORK ?? 'testnet',
    status:               farmAddress && certAddress ? 'deployed' : 'not_deployed',
  });
}