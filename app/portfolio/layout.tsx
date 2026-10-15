import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SEVARCHKY // Cyber-Brutalist 3D Portfolio (SV-07)',
  description:
    'Recursive 3D WebGL Portfolio, Autonomous Multi-Agent Cockpit Architecture, and High-Throughput Distributed Systems.',
  keywords: [
    'WebGL',
    'Three.js',
    'Next.js 16',
    'React 19',
    'Full-Stack Developer',
    'Autonomous AI Agents',
    'Distributed Systems'
  ]
};

export default function PortfolioLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-black text-white relative selection:bg-cyan-500 selection:text-black">{children}</div>;
}
