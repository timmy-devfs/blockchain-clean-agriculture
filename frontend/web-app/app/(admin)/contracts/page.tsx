"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Toast } from "@bicap/ui";
import { getContractsStatus, deployContracts, type DeployResult } from "@/lib/api";

const EXPLORER = "https://explore.vechain.org/transactions";

export default function ContractsPage() {
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ["contracts-status"],
    queryFn: getContractsStatus,
  });

  const deployMut = useMutation({
    mutationFn: deployContracts,
    onSuccess: (result) => {
      setDeployResult(result);
      setToast({ msg: "Deploy thành công!", type: "success" });
      refetch();
    },
    onError: () => setToast({ msg: "Deploy thất bại", type: "error" }),
  });

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Smart Contracts</h1>
        <p className="text-sm text-gray-500">Quản lý hợp đồng thông minh trên VeChainThor</p>
      </div>

      {/* Trạng thái contracts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          {
            name: "FarmTrace.sol",
            desc: "Lưu lịch sử vụ mùa bất biến",
            address: status?.farmTraceAddress,
          },
          {
            name: "ProductCertification.sol",
            desc: "Chứng nhận xuất xưởng",
            address: status?.productCertAddress,
          },
        ].map((c) => (
          <div key={c.name} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">{c.name}</h2>
                <p className="mt-1 text-xs text-gray-500">{c.desc}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.address ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                {c.address ? "Deployed" : "Chưa deploy"}
              </span>
            </div>
            {c.address && (
              <div className="mt-4">
                <p className="text-xs text-gray-500">Contract Address</p>
                <code className="mt-1 block truncate rounded bg-gray-50 px-2 py-1 text-xs font-mono text-gray-700">
                  {c.address}
                </code>
              </div>
            )}
            {status?.lastDeployedAt && (
              <p className="mt-2 text-xs text-gray-400">
                Deploy lần cuối: {new Date(status.lastDeployedAt).toLocaleString("vi-VN")}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Deploy button */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800">Triển khai Smart Contract</h2>
        <p className="mt-1 text-sm text-gray-500">
          Deploy sẽ ghi 2 contracts lên VeChainThor testnet và cập nhật địa chỉ mới.
        </p>
        <button
          onClick={() => deployMut.mutate()}
          disabled={deployMut.isPending}
          className="mt-4 rounded-xl bg-green-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
        >
          {deployMut.isPending ? "Đang deploy..." : "🚀 Deploy Contracts"}
        </button>
      </div>

      {/* Kết quả deploy */}
      {deployResult && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 space-y-3">
          <h3 className="font-semibold text-green-800">✅ Deploy thành công</h3>
          <div>
            <p className="text-xs text-green-600">Transaction Hash</p>
            <code className="block truncate text-xs font-mono text-green-800">
              {deployResult.txHash}
            </code>
          </div>
          <a
            href={`${EXPLORER}/${deployResult.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
          >
            Xem trên VeChain Explorer ↗
          </a>
        </div>
      )}
    </div>
  );
}
