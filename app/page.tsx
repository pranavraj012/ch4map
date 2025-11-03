'use client';

import dynamic from 'next/dynamic';

// Import CH4Map dynamically with no SSR to avoid window/document issues
const CH4Map = dynamic(() => import('@/components/CH4Map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-lg">
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black py-8 px-4">
      <main className="container mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50 mb-4">
            CH4 Emissions Map
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Visualizing methane emissions data across India using GeoTIFF raster imagery
          </p>
        </div>
        
        <CH4Map />
        
        <div className="mt-8 p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-black dark:text-zinc-50">
            Legend
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-green-500 opacity-50 rounded"></div>
              <span className="text-zinc-700 dark:text-zinc-300">Low CH4 (&lt; 1800 ppb)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-yellow-500 opacity-50 rounded"></div>
              <span className="text-zinc-700 dark:text-zinc-300">Medium CH4 (1800-1900 ppb)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-red-500 opacity-50 rounded"></div>
              <span className="text-zinc-700 dark:text-zinc-300">High CH4 (&gt; 1900 ppb)</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
