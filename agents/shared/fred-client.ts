import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const FRED_API_KEY = process.env.FRED_API_KEY;

export async function getMortgageRate(): Promise<number> {
  if (!FRED_API_KEY) {
    throw new Error('FRED_API_KEY is not set');
  }
  const response = await axios.get(
    `https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=${FRED_API_KEY}&sort_order=desc&limit=1&file_type=json`
  );
  const observations = response.data?.observations;
  if (!observations || observations.length === 0) {
    throw new Error('No mortgage rate data available from FRED');
  }
  const value = parseFloat(observations[0].value);
  if (isNaN(value)) {
    throw new Error(`Invalid mortgage rate value: ${observations[0].value}`);
  }
  return value / 100;
}
