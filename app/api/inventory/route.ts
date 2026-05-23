import { NextResponse } from 'next/server';
import { readDB, writeDB, appendLog } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

// ── GET /api/inventory ───────────────────────
export async function GET(req: Request) {
  const db = await readDB();
  return NextResponse.json({ data: db.inventory, total: db.inventory.length });
}
