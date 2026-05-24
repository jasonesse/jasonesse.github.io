import type { CityDeck } from "../types";

export async function loadCity(city: string): Promise<CityDeck> {
  const res = await fetch(`/${city.toLowerCase()}.json`);
  if (!res.ok) {
    throw new Error(`Failed to load city data for "${city}"`);
  }
  return res.json() as Promise<CityDeck>;
}
