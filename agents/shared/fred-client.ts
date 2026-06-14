import axios from 'axios';

const FRED_API_KEY = process.env.FRED_API_KEY;

export async function getMortgageRate(): Promise<number> {
  if (!FRED_API_KEY) {
    throw new Error('FRED_API_KEY is not set');
  }
  const response = await axios.get(
    `https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=${FRED_API_KEY}&sort_order=desc&limit=1&file_type=json`
  );
  return parseFloat(response.data.observations[0].value) / 100;
}
