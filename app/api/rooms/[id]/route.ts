import { NextResponse } from 'next/server';
import { readDB, writeDB, appendLog } from '@/lib/db';
import type { RoomStatus } from '@/lib/types';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/rooms/:id ───────────────────────
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const db = readDB();
  const room = db.rooms.find(r => r.id === id);
  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: room });
}

// ── PATCH /api/rooms/:id ─────────────────────
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body: { status?: RoomStatus; guest?: string | null } = await req.json();
  const db = readDB();

  const idx = db.rooms.findIndex(r => r.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.rooms[idx] = { ...db.rooms[idx], ...body };

  if (body.status) {
    appendLog(db, 'Hệ thống', `Phòng ${id}: → ${body.status}`, 'housekeeping');
  }

  writeDB(db);
  return NextResponse.json({ data: db.rooms[idx] });
}
