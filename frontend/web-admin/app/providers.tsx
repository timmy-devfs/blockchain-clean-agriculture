"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@bicap/api-client";
import { AuthProvider } from "@bicap/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}