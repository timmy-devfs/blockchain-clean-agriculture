"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Props = {
  fileUrl: string;
  caption?: string;
};

export function LicensePdfPanel({ fileUrl, caption }: Props) {
  const [loadError, setLoadError] = useState(false);

  if (loadError) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Không thể tải file
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {caption ? <p className="text-xs text-gray-500">{caption}</p> : null}
      <div className="max-h-[480px] overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
        <Document file={fileUrl} onLoadError={() => setLoadError(true)}>
          <Page
            pageNumber={1}
            width={520}
            className="mx-auto bg-white shadow-sm"
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  );
}
