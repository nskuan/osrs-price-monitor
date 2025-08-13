// lib/osrs.ts
export const OSRS_API_BASE =
  process.env.OSRS_API_BASE ?? "https://prices.runescape.wiki/api/v1";
const UA =
  process.env.OSRS_USER_AGENT ??
  "osrs-price-monitor/0.1 (no-contact-provided)";

export const headers = {
  "User-Agent": UA,
  Accept: "application/json",
};

export type LatestPrice = {
  high: number | null;
  highTime: number | null;
  low: number | null;
  lowTime: number | null;
};

export type LatestResponse = {
  data: Record<string, LatestPrice>; // key is item ID (string)
};

export type WindowRow = {
  avgHighPrice: number | null;
  avgLowPrice: number | null;
  highPriceVolume: number | null;
  lowPriceVolume: number | null;
};
export type WindowResponse = { data: Record<string, WindowRow> };

export type MappingRow = {
  id: number;
  name: string;
  examine?: string;
  members?: boolean;
  limit?: number | null;
  value?: number | null;
  icon?: string | null; // usually a relative path from wiki
};

export async function fetchLatest() {
  const r = await fetch(`${OSRS_API_BASE}/osrs/latest`, {
    headers,
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`latest: ${r.status}`);
  return (await r.json()) as LatestResponse;
}

export async function fetchWindow(win: "5m" | "1h" | "24h") {
  const path = win === "24h" ? "24h" : win;
  const r = await fetch(`${OSRS_API_BASE}/osrs/${path}`, {
    headers,
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return (await r.json()) as WindowResponse;
}

export async function fetchMapping() {
  const r = await fetch(`${OSRS_API_BASE}/osrs/mapping`, {
    headers,
    cache: "force-cache",
    next: { revalidate: 86400 }, // refresh daily
  });
  if (!r.ok) throw new Error(`mapping: ${r.status}`);
  return (await r.json()) as MappingRow[];
}
