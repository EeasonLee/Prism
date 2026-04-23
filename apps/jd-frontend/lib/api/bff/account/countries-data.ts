import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const JSON_PATH = join(__dirname, 'countries.json');

interface CountryEntry {
  id: string;
  name: string;
  regions: Array<{ id: string; code: string; name: string }>;
}

let cache: Record<string, CountryEntry> | null = null;

export function getCountriesData(): Record<string, CountryEntry> {
  if (cache) return cache;
  try {
    const raw = readFileSync(JSON_PATH, 'utf-8');
    cache = JSON.parse(raw) as Record<string, CountryEntry>;
    return cache;
  } catch {
    return {};
  }
}

export function getCountryRegions(
  countryCode: string
): Array<{ id: string; code: string; name: string }> {
  const data = getCountriesData();
  return data[countryCode]?.regions ?? [];
}

export function getCountriesList(): Array<{ id: string; full_name_english: string }> {
  const data = getCountriesData();
  return Object.values(data).map(c => ({
    id: c.id,
    full_name_english: c.name,
  }));
}

export function updateCountriesData(data: Record<string, CountryEntry>): void {
  writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');
  cache = data;
}
