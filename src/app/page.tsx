import { loadBestAvailableRainData, loadHydroEvents } from '@/lib/data/csv-loader';
import { computeHistoricalStats } from '@/lib/data/historical-stats';
import { HomeClient } from './home-client';

// Load CSV data server-side at request time
export default async function HomePage() {
  let csvEvents: ReturnType<typeof loadHydroEvents> = [];
  let historicalStats: ReturnType<typeof computeHistoricalStats> | null = null;
  let rainfallSource: 'conagua_csv' | 'open_meteo' | null = null;

  try {
    csvEvents = loadHydroEvents();
  } catch (e) {
    console.error('Failed to load CSV events:', e);
  }

  try {
    const rainData = await loadBestAvailableRainData();
    if (rainData.records.length > 0) {
      historicalStats = computeHistoricalStats(rainData.records);
      rainfallSource = rainData.source;
    }
  } catch (e) {
    console.error('Failed to load historical rain data:', e);
  }

  return (
    <HomeClient
      csvEvents={csvEvents}
      historicalStats={historicalStats}
      rainfallSource={rainfallSource}
    />
  );
}
