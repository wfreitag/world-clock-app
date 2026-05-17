import { cityMapping } from "city-timezones";

export type CityEntry = {
  /** Stable identifier — IANA tz + city + province. */
  id: string;
  /** Just the city name. */
  city: string;
  /** Human-readable label, e.g. "Santa Rosa, California, US". */
  label: string;
  /** Region/state line for the dropdown subtitle, e.g. "California, US". */
  region: string;
  /** IANA timezone identifier. */
  tz: string;
};

/** Compact ISO-2 country aliases for display. Falls back to ISO2 itself. */
const COUNTRY_DISPLAY: Record<string, string> = {
  "United States of America": "US",
  "United Kingdom": "UK",
  "Russian Federation": "Russia",
};

function makeEntry(m: typeof cityMapping[number]): CityEntry {
  const country = COUNTRY_DISPLAY[m.country] ?? m.country;
  const region = m.province ? `${m.province}, ${country}` : country;
  return {
    id: `${m.timezone}|${m.city}|${m.province ?? ""}|${m.iso2}`,
    city: m.city,
    region,
    label: `${m.city}, ${region}`,
    tz: m.timezone,
  };
}

// Pre-build the full list once. ~7300 entries — small enough to keep in memory.
const ALL_ENTRIES: CityEntry[] = cityMapping
  .filter((m) => !!m.timezone) // skip rows without a tz
  .map(makeEntry);

// Pre-compute a parallel array of lowercased haystack strings for fast search.
const HAYSTACKS: string[] = ALL_ENTRIES.map((e) =>
  `${e.city} ${e.region}`.toLowerCase(),
);

// Population map for ranking ties. Keyed by entry id.
const POPS: Map<string, number> = new Map(
  cityMapping.map((m) => [
    `${m.timezone}|${m.city}|${m.province ?? ""}|${m.iso2}`,
    m.pop ?? 0,
  ]),
);

/**
 * Search cities by partial name match. Prefers prefix matches on the city
 * name, then substring matches; ties are broken by population descending.
 */
export function searchCities(query: string, limit = 8): CityEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  type Hit = { entry: CityEntry; score: number; pop: number };
  const hits: Hit[] = [];

  for (let i = 0; i < ALL_ENTRIES.length; i++) {
    const entry = ALL_ENTRIES[i];
    const cityLc = entry.city.toLowerCase();
    let score: number;
    if (cityLc === q) score = 0;
    else if (cityLc.startsWith(q)) score = 1;
    else if (HAYSTACKS[i].includes(q)) score = 2;
    else continue;

    hits.push({ entry, score, pop: POPS.get(entry.id) ?? 0 });
  }

  hits.sort((a, b) => a.score - b.score || b.pop - a.pop);
  return hits.slice(0, limit).map((h) => h.entry);
}

/**
 * Build a CityEntry for the user's local timezone. The "city" field is just a
 * label — the actual time is derived from the system clock without applying a
 * timezone, so this entry's tz is intentionally empty.
 */
export function localEntry(): CityEntry {
  let label = "Local Time";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      // Use the IANA city portion as a friendlier label, e.g.
      // "America/Los_Angeles" -> "Los Angeles".
      const last = tz.split("/").pop() ?? tz;
      label = last.replace(/_/g, " ");
    }
  } catch {
    // Fall back to the default label.
  }
  return {
    id: "local",
    city: label,
    region: "Local",
    label,
    tz: "", // empty tz = system local time
  };
}
