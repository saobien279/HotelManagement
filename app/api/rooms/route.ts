import { NextResponse } from 'next/server';
import { readDB, writeDB, appendLog } from '@/lib/db';

// ── GET /api/rooms ───────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const db = readDB();

  let data = db.rooms;
  const floor  = searchParams.get('floor');
  const status = searchParams.get('status');
  const type   = searchParams.get('type');

  if (floor)  data = data.filter(r => r.floor === Number(floor));
  if (status) data = data.filter(r => r.status === status);
  if (type)   data = data.filter(r => r.type === type);

  return NextResponse.json({ data, total: data.length });
}
