import { NextResponse } from 'next/server';
import { readDB, writeDB, appendLog } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/inventory ───────────────────────
export async function GET() {
  const db = readDB();
  return NextResponse.json({ data: db.inventory, total: db.inventory.length });
}
