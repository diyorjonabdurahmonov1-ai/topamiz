// Approximate city-center coordinates for the fixed city list in lib/data.ts.
// Used as a fallback for the map view when a listing has no precise
// location (the poster skipped "use my location" when posting).
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Toshkent: { lat: 41.2995, lng: 69.2401 },
  Samarqand: { lat: 39.627, lng: 66.975 },
  Buxoro: { lat: 39.7747, lng: 64.4286 },
  Andijon: { lat: 40.7821, lng: 72.3442 },
  "Farg'ona": { lat: 40.3894, lng: 71.7864 },
  Namangan: { lat: 40.9983, lng: 71.6726 },
  Nukus: { lat: 42.4531, lng: 59.6103 },
  Qarshi: { lat: 38.8606, lng: 65.7897 },
};

const DEFAULT_COORDINATE = CITY_COORDINATES.Toshkent;

// Deterministic pseudo-random offset (~ up to 1.5km) so listings from the
// same city don't all stack on a single map marker, without needing a
// separate "seed" column — derived from the listing id itself.
function jitter(seed: number): number {
  const pseudoRandom = Math.sin(seed * 12.9898) * 43758.5453;
  return (pseudoRandom - Math.floor(pseudoRandom)) * 2 - 1;
}

export function coordinatesForCity(city: string, jitterSeed: number): { lat: number; lng: number } {
  const base = CITY_COORDINATES[city] ?? DEFAULT_COORDINATE;
  const jitterDegrees = 0.012; // ~1.3km at these latitudes
  return {
    lat: base.lat + jitter(jitterSeed) * jitterDegrees,
    lng: base.lng + jitter(jitterSeed + 1) * jitterDegrees,
  };
}
