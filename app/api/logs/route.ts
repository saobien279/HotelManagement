import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

// ── GET /api/logs ───────────────────────────
// Returns the activity log from the DB
export async function GET() {
  const db = await readDB();
  return NextResponse.json({ data: db.activityLog });
}
