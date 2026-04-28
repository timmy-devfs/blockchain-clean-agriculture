"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConfirmDialog, Toast } from "@bicap/ui";
import { getFarmDetail, approveFarm, rejectFarm } from "@/lib/api";
import { RejectModal } from "@/components/admin/farms/RejectModal";
import { useParams, useRouter } from "next/navigation";

export default function FarmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [showApprove, setShowApprove] = useState(false);
  const [showReject,  setShowReject]  = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data: farm, isLoading } = useQuery({
    queryKey: ["farm-detail", id],
    queryFn: () => getFarmDetail(id),
  });

  const approveMut = useMutation({
    mutationFn: () => approveFarm(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-farms"] });
      setToast({ msg: "Đã phê duyệt thành công", type: "success" });
      setTimeout(() => router.push("/admin/farms"), 1500);
    },
  });

  const rejectMut = useMutation({
    mutationFn: (reason: string) => rejectFarm(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-farms"] });
      setToast({ msg: "Đã từ chối", type: "success" });
      setTimeout(() => router.push("/admin/farms"), 1500);
    },
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-400">Đang tải...</div>;
  }
  if (!farm) return <div className="text-red-500">Không tìm thấy farm</div>;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900">
          ← Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{farm.farmName}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Thông tin farm */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-semibold text-gray-800">Thông tin trang trại</h2>
          {[
            ["Tỉnh/Thành", farm.province],
            ["Địa chỉ", farm.address],
            ["Diện tích", `${farm.totalArea} ha`],
            ["Ngày đăng ký", new Date(farm.createdAt).toLocaleDateString("vi-VN")],
            ["Trạng thái", farm.isApproved ? "Đã duyệt" : (farm.rejectReason ? "Từ chối" : "Chờ duyệt")],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-900">{value}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        {!farm.isApproved && !farm.rejectReason && (
          <div className="flex flex-col justify-center gap-4 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800">Hành động</h2>
            <button
              onClick={() => setShowApprove(true)}
              className="w-full rounded-xl bg-green-500 py-3 text-sm font-semibold text-white hover:bg-green-600"
            >
              ✓ Phê duyệt trang trại
            </button>
            <button
              onClick={() => setShowReject(true)}
              className="w-full rounded-xl bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-600"
            >
              ✕ Từ chối đăng ký
            </button>
          </div>
        )}
      </div>

      {/* PDF Viewer — giấy phép kinh doanh */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="mb-4 font-semibold text-gray-800">Giấy phép kinh doanh</h2>
        {(() => {
          const license = farm.businessLicense;
          if (!license) {
            return <p className="text-sm text-gray-500">Chưa có thông tin giấy phép.</p>;
          }

          return (
            <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã giấy phép</span>
                <span className="font-medium text-gray-900">{license.licenseNumber ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nơi cấp</span>
                <span className="font-medium text-gray-900">{license.issuedBy ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày cấp</span>
                <span className="font-medium text-gray-900">
                  {license.issuedAt ? new Date(license.issuedAt).toLocaleDateString("vi-VN") : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hết hạn</span>
                <span className="font-medium text-gray-900">
                  {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString("vi-VN") : "—"}
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modals */}
      <ConfirmDialog
        isOpen={showApprove}
        title="Phê duyệt trang trại"
        message={`Xác nhận phê duyệt "${farm.farmName}"?`}
        confirmLabel="Phê duyệt"
        onConfirm={() => approveMut.mutate()}
        onCancel={() => setShowApprove(false)}
      />
      {showReject && (
        <RejectModal
          farmName={farm.farmName}
          isLoading={rejectMut.isPending}
          onConfirm={(reason) => rejectMut.mutate(reason)}
          onCancel={() => setShowReject(false)}
        />
      )}
    </div>
  );
}
