// Display-only names for the countries this app actually deals with (its
// original home market, plus everywhere lib/i18n/locales.ts maps to a
// language) — an unmapped code just falls back to showing itself.
const COUNTRY_NAMES: Record<string, string> = {
  UZ: "O'zbekiston",
  RU: "Rossiya",
  KZ: "Qozog'iston",
  TJ: "Tojikiston",
  KG: "Qirg'iziston",
  US: "AQSH",
  GB: "Buyuk Britaniya",
  CA: "Kanada",
  AU: "Avstraliya",
  NZ: "Yangi Zelandiya",
  IE: "Irlandiya",
};

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}
