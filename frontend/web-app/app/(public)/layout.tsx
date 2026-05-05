import type { ReactNode } from "react";

// Các trang public tự render <PublicNav /> trong page.tsx của mình,
// nên layout chỉ cần truyền children và set background tổng.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#1a1a0e]">
      <main>{children}</main>
    </div>
  );
}
