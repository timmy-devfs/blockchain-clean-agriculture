"use client";

import React from "react";
import Image from "next/image";

interface QRDisplayProps {
  qrUrl: string;        // URL hoặc base64 PNG từ blockchain-service
  seasonId: string;
  size?: number;
}

export function QRDisplay({ qrUrl, seasonId, size = 200 }: QRDisplayProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `QR_season_${seasonId}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl border border-gray-200 p-3 bg-white shadow-sm">
        <Image src={qrUrl} alt={`QR vụ mùa ${seasonId}`} width={size} height={size} />
      </div>
      <button
        onClick={handleDownload}
        className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
      >
        Tải QR Code
      </button>
    </div>
  );
}