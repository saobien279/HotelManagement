import { NextResponse } from 'next/server';
import { readDB, writeDB, appendLog } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ── GET /api/logs ───────────────────────────
export async function GET(req: Request) {
  const db = await readDB();
  return NextResponse.json({ data: db.activityLog });
}

// ── POST /api/logs ──────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = await readDB();
    
    appendLog(db, body.user || 'Hệ thống', body.action, body.type || 'system');
    await writeDB(db);
    
    return NextResponse.json({ data: db.activityLog });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
