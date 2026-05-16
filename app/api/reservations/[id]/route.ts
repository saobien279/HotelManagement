import { NextResponse } from 'next/server';
import { readDB, writeDB, appendLog } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/reservations/:id ────────────────
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const db = await readDB();
  const item = db.reservations.find(r => r.id === id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: item });
}

// ── PATCH /api/reservations/:id ──────────────
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const db = await readDB();

  const idx = db.reservations.findIndex(r => r.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const old = db.reservations[idx];
  const updated = { ...old, ...body };
  db.reservations[idx] = updated;

  // Auto-update room status when reservation status changes
  const targetRoomId = body.roomId || old.roomId;
  if (body.status && targetRoomId) {
    const roomIdx = db.rooms.findIndex(r => r.id === targetRoomId);
    if (roomIdx !== -1) {
      if (body.status === 'checkedin')  {
        db.rooms[roomIdx].status = 'occupied';
        db.rooms[roomIdx].guest  = updated.guestName;
        appendLog(db, 'Lễ tân', `Check-in ${updated.guestName} – Phòng ${targetRoomId}`, 'checkin');
      }
      else if (body.status === 'checkedout') {
        db.rooms[roomIdx].status = 'cleaning';
        db.rooms[roomIdx].guest  = null;

        // Auto-bill all associated services
        db.services.forEach(s => {
          if (s.bookingId === id) s.status = 'billed';
        });

        appendLog(db, 'Lễ tân', `Check-out ${updated.guestName} – Phòng ${targetRoomId}`, 'invoice');
      }
      else if (body.status === 'cancelled')  {
        db.rooms[roomIdx].status = 'vacant';
        db.rooms[roomIdx].guest  = null;
        appendLog(db, 'Lễ tân', `Hủy đặt phòng ${id} – ${updated.guestName}`, 'cancel');
      }
    }
  }

  await writeDB(db);
  return NextResponse.json({ data: updated });
}

// ── DELETE /api/reservations/:id ─────────────
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const db = await readDB();

  const idx = db.reservations.findIndex(r => r.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [removed] = db.reservations.splice(idx, 1);
  appendLog(db, 'Admin', `Xóa đặt phòng ${id}`, 'cancel');
  await writeDB(db);

  return NextResponse.json({ data: removed });
}
