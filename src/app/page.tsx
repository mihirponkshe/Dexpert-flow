import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dexpert Flow',
};

export default function Home() {
  return (
    <main className="flex items-center justify-center h-screen bg-gray-950 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Dexpert Flow</h1>
        <p className="text-gray-400 mb-4">Live 3D Global Cargo Tracker</p>
        <a
          href="/tracker"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors font-medium"
        >
          Open Tracker →
        </a>
      </div>
    </main>
  );
}
