// app/api/prices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchLatest, fetchWindow } from "@/lib/osrs";
import { memo } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids"); // "4151,11840"
  const win = (url.searchParams.get("win") ?? "1h") as "5m" | "1h" | "24h";

  try {
    // Short cache: upstream updates roughly every ~5m; we poll client faster
    const [latest, window] = await Promise.all([
      memo("latest", 30_000, fetchLatest),
      memo(`win:${win}`, 30_000, () => fetchWindow(win)),
    ]);

    const ids = idsParam
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const pick = (obj: Record<string, any>) =>
      ids
        ? Object.fromEntries(
            ids.map((id) => [id, obj[id]]).filter(([, v]) => v !== undefined)
          )
        : obj;

    return NextResponse.json({
      latest: pick(latest.data),
      window: pick(window.data),
      ts: Date.now(),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "prices failed" },
      { status: 500 }
    );
  }
}
