import type { ReactNode } from 'react';
import '../shared/styles/agrichain.css';
import TransitionShell from './TransitionShell';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <TransitionShell>{children}</TransitionShell>
      </body>
    </html>
  );
}

