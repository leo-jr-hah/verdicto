import axios from 'axios';

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY;
const RENTCAST_BASE = 'https://api.rentcast.io/v1';

export async function getPropertyData(address: string) {
  if (!RENTCAST_API_KEY) {
    throw new Error('RENTCAST_API_KEY is not set');
  }
  const response = await axios.get(
    `${RENTCAST_BASE}/properties?address=${encodeURIComponent(address)}`,
    { headers: { 'X-Api-Key': RENTCAST_API_KEY } }
  );
  return response.data;
}

export async function getComparableSales(city: string, radius: number = 5) {
  if (!RENTCAST_API_KEY) {
    throw new Error('RENTCAST_API_KEY is not set');
  }
  // Searching sale listings by city
  const response = await axios.get(
    `${RENTCAST_BASE}/listings/sale?city=${encodeURIComponent(city)}&status=Active&limit=10`,
    { headers: { 'X-Api-Key': RENTCAST_API_KEY } }
  );
  return response.data;
}
