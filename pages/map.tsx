import CH4Map from '../components/CH4Map';

export default function MapPage() {
  return (
    <main className="flex flex-col items-center justify-center w-full min-h-screen">
      <h1 className="text-4xl font-bold my-8">CH₄ Emissions Map</h1>
      <CH4Map />
    </main>
  );
}
