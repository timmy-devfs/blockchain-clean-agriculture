"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@bicap/auth";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Toast,
} from "@bicap/ui";
import {
  createRetailerOrder,
  getAxiosErrorMessage,
  getListings,
  tryRetailPaymentCallback,
  type MarketplaceListingProduct,
} from "@/lib/api";

function formatCurrency(n: number) {
  return `${n.toLocaleString("vi-VN")} ₫`;
}

function OrderModal({
  listing,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  listing: MarketplaceListingProduct;
  onClose: () => void;
  onSubmit: (quantity: number, address: string) => void;
  isSubmitting: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");

  const maxQty = Math.max(1, listing.quantity);
  const unitTotal = useMemo(
    () => quantity * listing.unitPrice,
    [quantity, listing.unitPrice]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900">Đặt hàng</h2>
        <p className="mt-1 text-sm text-gray-500">{listing.title}</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Số lượng (kg)</label>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isNaN(n)) return;
                setQuantity(Math.min(maxQty, Math.max(1, n)));
              }}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">Tối đa: {maxQty} kg</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Địa chỉ giao hàng</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Số nhà, đường, phường, tỉnh/TP…"
            />
          </div>
          <div className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
            Tổng tạm tính: <strong>{formatCurrency(unitTotal)}</strong>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={() => onSubmit(quantity, address.trim())}
            disabled={isSubmitting || !address.trim()}
          >
            {isSubmitting ? "Đang gửi…" : "Xác nhận đặt hàng"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RetailerMarketplacePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<MarketplaceListingProduct | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings"],
    queryFn: () => getListings({ size: 60 }),
  });

  const placeOrder = useMutation({
    mutationFn: async ({ listing, quantity, address }: {
      listing: MarketplaceListingProduct;
      quantity: number;
      address: string;
    }) => {
      if (!user?.id) {
        throw new Error("Chưa đăng nhập");
      }
      const totalAmount = quantity * listing.unitPrice;
      const { order } = await createRetailerOrder({
        retailerId: user.id,
        farmId: listing.farmId,
        listingId: listing.id,
        productName: listing.title,
        quantity,
        unit: "kg",
        totalAmount,
        depositAmount: totalAmount,
        deliveryAddress: address,
        gateway: "VNPAY",
      });
      const orderId = String(order.id ?? order._id ?? "");
      const status = String(order.status ?? "");
      if (status === "PENDING_PAYMENT" && orderId) {
        try {
          await tryRetailPaymentCallback(orderId);
        } catch {
          // payment-service / callback có thể chưa cấu hình — bỏ qua
        }
      }
      return { orderId, status };
    },
    onSuccess: () => {
      setToast({
        msg: "Đặt hàng thành công! Đơn hàng đang được xử lý.",
        type: "success",
      });
      setSelected(null);
      void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (e: unknown) => {
      setToast({
        msg: getAxiosErrorMessage(e, "Không tạo được đơn hàng"),
        type: "error",
      });
    },
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-white px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Chợ nông sản</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sản phẩm từ trại đã duyệt — đặt hàng trực tiếp qua hệ thống BICAP
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl border border-gray-100 bg-gray-100"
              />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center text-gray-500">
            <p className="text-4xl">🌾</p>
            <p className="mt-2 font-medium">Chưa có sản phẩm trên sàn</p>
            <p className="mt-1 text-sm">Hãy thử lại sau khi nông trại đăng bán.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden border-gray-200/80 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {item.season.cropType || "Mùa vụ"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{item.farm.name}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Giá / kg</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(item.unitPrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Còn lại</span>
                    <span>{item.quantity} kg</span>
                  </div>
                  {item.description ? (
                    <p className="line-clamp-2 text-xs text-gray-500">{item.description}</p>
                  ) : null}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    className="w-full"
                    onClick={() => setSelected(item)}
                    disabled={item.quantity <= 0}
                  >
                    Đặt hàng
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <OrderModal
          listing={selected}
          isSubmitting={placeOrder.isPending}
          onClose={() => !placeOrder.isPending && setSelected(null)}
          onSubmit={(quantity, address) => {
            placeOrder.mutate({ listing: selected, quantity, address });
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
