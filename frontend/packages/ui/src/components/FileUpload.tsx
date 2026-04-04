"use client";

import React, { useCallback, useState } from "react";

interface FileUploadProps {
  accept?: string;              // "image/*" | ".pdf" | "image/*,.pdf"
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  label?: string;
}

export function FileUpload({
  accept = "image/*,.pdf",
  maxSizeMB = 10,
  onFileSelect,
  label = "Kéo thả hoặc click để chọn file",
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File tối đa ${maxSizeMB}MB`);
        return;
      }
      onFileSelect(file);
      if (file.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview(null);
      }
    },
    [maxSizeMB, onFileSelect]
  );

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => document.getElementById("file-input")?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-green-400"
        }`}
      >
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-xs text-gray-400">Tối đa {maxSizeMB}MB</p>
        <input
          id="file-input"
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {preview && (
        <img src={preview} alt="Preview" className="h-32 w-auto rounded-lg object-cover" />
      )}
    </div>
  );
}