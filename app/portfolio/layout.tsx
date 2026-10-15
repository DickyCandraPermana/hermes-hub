import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FROERYBELL // Surreal Organic Dreamscape (3D Interactive)',
  description:
    'Ethereal 3D WebGL Dreamscape, Amorphous Fluid Shaders, Multi-Agent Architecture, and High-Throughput Distributed Systems.',
  keywords: [
    'WebGL',
    'Three.js',
    'Next.js 16',
    'React 19',
    'Organic 3D',
    'Creative Developer',
    'Distributed Systems'
  ]
};

export default function PortfolioLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#080612] text-zinc-100 relative selection:bg-purple-300 selection:text-zinc-950 font-sans">
      {children}
    </div>
  );
}
