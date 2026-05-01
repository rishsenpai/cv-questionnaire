'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

type ChartFrameProps = {
  children: ReactNode;
  className?: string;
};

const ChartContent = dynamic(
  async () =>
    Promise.resolve(function ClientChartContent({ children }: { children: ReactNode }) {
      return <>{children}</>;
    }),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-slate-50" aria-hidden="true" />,
  }
);

export function ChartFrame({ children, className = 'h-full w-full min-h-[220px]' }: ChartFrameProps) {
  return (
    <div className={className}>
      <ChartContent>{children}</ChartContent>
    </div>
  );
}
