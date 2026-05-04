"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@bicap/api-client";
import { AuthProvider } from "@bicap/auth";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient as any}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
