import { NextResponse } from 'next/server';
import { readDB, writeDB, newId, appendLog } from '@/lib/db';
import type { Reservation } from '@/lib/types';

// ── GET /api/reservations ────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const db = readDB();

  let data = db.reservations;

  // Filters
  const status = searchParams.get('status');
  const source = searchParams.get('source');
  const q      = searchParams.get('q');
  const roomId = searchParams.get('roomId');

  if (status) data = data.filter(r => r.status === status);
  if (source) data = data.filter(r => r.source === source);
  if (roomId) data = data.filter(r => r.roomId === roomId);
  if (q)      data = data.filter(r =>
    r.guestName.toLowerCase().includes(q.toLowerCase()) ||
    r.id.toLowerCase().includes(q.toLowerCase()) ||
    r.phone?.includes(q)
  );

  return NextResponse.json({ data, total: data.length });
}

// ── POST /api/reservations ───────────────────
export async function POST(req: Request) {
  const body = await req.json() as Omit<Reservation, 'id'>;
  const db = readDB();

  const reservation: Reservation = { id: newId.reservation(), ...body };
  db.reservations.unshift(reservation);

  appendLog(db, 'Hệ thống', `Tạo đặt phòng mới ${reservation.id} – ${reservation.guestName}`, 'booking');

  writeDB(db);
  return NextResponse.json({ data: reservation }, { status: 201 });
}
