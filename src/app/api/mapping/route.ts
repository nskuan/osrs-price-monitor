// app/api/mapping/route.ts
import { NextResponse } from "next/server";
import { fetchMapping } from "@/lib/osrs";
import { memo } from "@/lib/cache";

export async function GET() {
  try {
    const data = await memo("mapping", 24 * 60 * 60 * 1000, fetchMapping);
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "mapping failed" },
      { status: 500 }
    );
  }
}
