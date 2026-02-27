import { loadHydroEvents, loadHistoricalRainData } from '@/lib/data/csv-loader';
import { computeHistoricalStats } from '@/lib/data/historical-stats';
import { HomeClient } from './home-client';

// Load CSV data server-side at request time
export default function HomePage() {
  let csvEvents: ReturnType<typeof loadHydroEvents> = [];
  let historicalStats: ReturnType<typeof computeHistoricalStats> | null = null;

  try {
    csvEvents = loadHydroEvents();
  } catch (e) {
    console.error('Failed to load CSV events:', e);
  }

  try {
    const rainData = loadHistoricalRainData();
    historicalStats = computeHistoricalStats(rainData);
  } catch (e) {
    console.error('Failed to load historical rain data:', e);
  }

  return <HomeClient csvEvents={csvEvents} historicalStats={historicalStats} />;
}
