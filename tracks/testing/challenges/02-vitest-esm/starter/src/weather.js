import { getJson } from './http.js';
import { retry } from './retry.js';

// The current temperature in a city, in whole degrees C. The weather API is
// flaky, so we give it 2 attempts.
export async function currentTemp(city) {
  const url = `https://weather.example.com/now?city=${encodeURIComponent(city)}`;
  const data = await retry(() => getJson(url), { attempts: 2 });
  return Math.round(data.tempC);
}
