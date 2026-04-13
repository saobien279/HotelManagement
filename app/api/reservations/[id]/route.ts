import { NextResponse } from 'next/server';
import { readDB, writeDB, appendLog } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/reservations/:id ────────────────
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const db = readDB();
  const item = db.reservations.find(r => r.id === id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: item });
}

// ── PATCH /api/reservations/:id ──────────────
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const db = readDB();

  const idx = db.reservations.findIndex(r => r.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const old = db.reservations[idx];
  const updated = { ...old, ...body };
  db.reservations[idx] = updated;

  // Auto-update room status when reservation status changes
  if (body.status && old.roomId) {
    const roomIdx = db.rooms.findIndex(r => r.id === old.roomId);
    if (roomIdx !== -1) {
      if (body.status === 'checkedin')  {
        db.rooms[roomIdx].status = 'occupied';
        db.rooms[roomIdx].guest  = old.guestName;
        appendLog(db, 'Lễ tân', `Check-in ${old.guestName} – Phòng ${old.roomId}`, 'checkin');
      }
      if (body.status === 'checkedout') {
        db.rooms[roomIdx].status = 'cleaning';
        db.rooms[roomIdx].guest  = null;
        appendLog(db, 'Lễ tân', `Check-out ${old.guestName} – Phòng ${old.roomId}`, 'invoice');
      }
      if (body.status === 'cancelled')  {
        db.rooms[roomIdx].status = 'vacant';
        db.rooms[roomIdx].guest  = null;
        appendLog(db, 'Lễ tân', `Hủy đặt phòng ${id} – ${old.guestName}`, 'cancel');
      }
    }
  }

  writeDB(db);
  return NextResponse.json({ data: updated });
}

// ── DELETE /api/reservations/:id ─────────────
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const db = readDB();

  const idx = db.reservations.findIndex(r => r.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [removed] = db.reservations.splice(idx, 1);
  appendLog(db, 'Admin', `Xóa đặt phòng ${id}`, 'cancel');
  writeDB(db);

  return NextResponse.json({ data: removed });
}
