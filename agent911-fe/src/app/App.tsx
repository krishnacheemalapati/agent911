import React from 'react';
// ...existing code...
// This file is now a pass-through for Next.js. You can add global providers or layout here if needed.
export default function App({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
