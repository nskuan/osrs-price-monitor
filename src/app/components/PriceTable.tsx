"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import Sparkline from "./Sparkline";

type MappingRow = { id: number; name: string; icon?: string | null };
type LatestRow = { high: number | null; low: number | null; highTime: number | null; lowTime: number | null };
type WindowRow = { avgHighPrice: number | null; avgLowPrice: number | null };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatGp(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "m";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

// Updated icon URL helper
function iconUrl(icon?: string | null) {
  if (!icon) return "";
  if (/^https?:\/\//i.test(icon)) return icon;

  // mapping.icon is typically "Some_Item.png?hash"
  // Ensure it’s under /images and safely URI-encoded (keeping query intact)
  const filename = icon.replace(/^\//, "");
  const path = filename.startsWith("images/") ? `/${filename}` : `/images/${filename}`;
  const full = `https://oldschool.runescape.wiki${path}`;
  return encodeURI(full);
}

export default function PriceTable() {
  const pollMs = Number(process.env.NEXT_PUBLIC_POLL_MS ?? 60000);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Mapping (names -> ids)
  const { data: mapData } = useSWR<{ data: MappingRow[] }>(
    "/api/mapping",
    fetcher,
    { revalidateOnFocus: false }
  );

  // Filter by query
  const filtered: MappingRow[] = useMemo(() => {
    const list = mapData?.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list.slice(0, 50);
    return list.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 50);
  }, [mapData, query]);

  // IDs to fetch
  const ids = (selectedIds.length ? selectedIds : filtered.map((r) => r.id)).join(",");

  // Prices
  const { data: priceData } = useSWR<{
    latest: Record<string, LatestRow>;
    window: Record<string, WindowRow>;
    ts: number;
    error?: string;
  }>(ids ? `/api/prices?win=1h&ids=${ids}` : null, fetcher, {
    refreshInterval: pollMs,
    revalidateOnFocus: true,
  });

  const rows = useMemo(() => {
    if (!priceData) return [];
    return filtered.map((m) => {
      const k = String(m.id);
      const L = priceData.latest?.[k];
      const W = priceData.window?.[k];
      const mid =
        L && (L.high != null || L.low != null)
          ? Math.round(((L.high ?? 0) + (L.low ?? 0)) / 2)
          : null;
      const avg =
        W && (W.avgHighPrice != null || W.avgLowPrice != null)
          ? Math.round(
              (((W.avgHighPrice ?? 0) + (W.avgLowPrice ?? 0)) / 2) || 0
            )
          : null;
      return {
        id: m.id,
        name: m.name,
        icon: m.icon,
        high: L?.high ?? null,
        low: L?.low ?? null,
        mid,
        avg,
      };
    });
  }, [priceData, filtered]);

  // Simple sparkline points
  const spark = (mid: number | null, avg: number | null) => {
    if (!mid || !avg) return [];
    const a = Math.max(1, Math.min(999999999, avg));
    const b = Math.max(1, Math.min(999999999, mid));
    return [a * 0.98, a * 1.02, a, b * 0.98, b * 1.01, b];
  };

  const updatedAt =
    priceData?.ts ? new Date(priceData.ts).toLocaleTimeString() : "—";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items (e.g., Shark, Abyssal whip)..."
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 8,
            outline: "none",
          }}
        />
        <div style={{ fontSize: 12, color: "#666" }}>
          Updated: <strong>{updatedAt}</strong> • Poll: {pollMs / 1000}s
        </div>
      </div>

      <div style={{ overflow: "auto", border: "1px solid #eee", borderRadius: 8 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontSize: 14,
          }}
        >
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={th}>Item</th>
              <th style={thRight}>Low</th>
              <th style={thRight}>High</th>
              <th style={thRight}>Mid</th>
              <th style={thRight}>1h Avg</th>
              <th style={th}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #f1f1f1" }}>
                <td style={td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {r.icon ? (
                      <img
                        src={iconUrl(r.icon)}
                        alt=""
                        width={24}
                        height={24}
                        referrerPolicy="no-referrer"
                        style={{ imageRendering: "pixelated" }}
                      />
                    ) : (
                      <div style={{ width: 24, height: 24 }} />
                    )}
                    <span>{r.name}</span>
                  </div>
                </td>
                <td style={tdRight}>{formatGp(r.low)}</td>
                <td style={tdRight}>{formatGp(r.high)}</td>
                <td style={tdRight}>{formatGp(r.mid)}</td>
                <td style={tdRight}>{formatGp(r.avg)}</td>
                <td style={td}>
                  <Sparkline points={spark(r.mid, r.avg)} />
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#777" }}>
                  {query ? "No matches." : "Loading…"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {priceData?.error && (
        <div style={{ color: "#a00", fontSize: 13 }}>
          Error: {priceData.error}
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 600,
  position: "sticky",
  top: 0,
  zIndex: 1,
  borderBottom: "1px solid #eee",
};
const thRight: React.CSSProperties = { ...th, textAlign: "right", width: 120 };
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "middle" };
const tdRight: React.CSSProperties = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };
