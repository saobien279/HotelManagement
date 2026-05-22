import { NextResponse } from 'next/server';
import { readDB, writeDB, appendLog } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/groups/:id ────────────────
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const db = await readDB();
  const group = db.groups?.find(g => g.id === id);
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: group });
}

// ── PATCH /api/groups/:id ──────────────
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const db = await readDB();

  const idx = db.groups?.findIndex(g => g.id === id);
  if (idx === -1 || idx === undefined || !db.groups) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const old = db.groups[idx];
  const updated = { ...old, ...body };
  db.groups[idx] = updated;

  // Handle cascade status updates to associated reservations and room states
  if (body.status && body.status !== old.status) {
    const resIds = old.reservationIds || [];
    
    db.reservations = db.reservations.map(res => {
      if (resIds.includes(res.id)) {
        const updatedRes = { ...res, status: body.status };
        
        // Update room status
        if (res.roomId) {
          const roomIdx = db.rooms.findIndex(r => r.id === res.roomId);
          if (roomIdx !== -1) {
            if (body.status === 'checkedin') {
              db.rooms[roomIdx].status = 'occupied';
              db.rooms[roomIdx].guest = res.guestName;
              appendLog(db, 'Lễ tân', `Check-in ${res.guestName} – Phòng ${res.roomId} (Đoàn ${old.name})`, 'checkin');
            } else if (body.status === 'checkedout') {
              db.rooms[roomIdx].status = 'cleaning';
              db.rooms[roomIdx].guest = null;
              
              // Auto-bill services
              db.services.forEach(s => {
                if (s.bookingId === res.id) s.status = 'billed';
              });
              appendLog(db, 'Lễ tân', `Check-out ${res.guestName} – Phòng ${res.roomId} (Đoàn ${old.name})`, 'invoice');
            } else if (body.status === 'cancelled') {
              db.rooms[roomIdx].status = 'vacant';
              db.rooms[roomIdx].guest = null;
              appendLog(db, 'Lễ tân', `Hủy phòng ${res.id} – Phòng ${res.roomId} (Đoàn ${old.name})`, 'cancel');
            }
          }
        }
        return updatedRes;
      }
      return res;
    });

    appendLog(db, 'Lễ tân', `Cập nhật trạng thái đoàn ${old.name} (${id}) thành: ${body.status}`, 'system');
  }

  await writeDB(db);
  return NextResponse.json({ data: updated });
}

// ── DELETE /api/groups/:id ─────────────
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const db = await readDB();

  const idx = db.groups?.findIndex(g => g.id === id);
  if (idx === -1 || idx === undefined || !db.groups) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const group = db.groups[idx];
  
  // Set group to cancelled
  group.status = 'cancelled';
  
  // Cancel all associated reservations
  const resIds = group.reservationIds || [];
  db.reservations = db.reservations.map(res => {
    if (resIds.includes(res.id)) {
      if (res.roomId) {
        const roomIdx = db.rooms.findIndex(r => r.id === res.roomId);
        if (roomIdx !== -1) {
          db.rooms[roomIdx].status = 'vacant';
          db.rooms[roomIdx].guest = null;
        }
      }
      return { ...res, status: 'cancelled' };
    }
    return res;
  });

  appendLog(db, 'Lễ tân', `Hủy đoàn ${group.name} (${id}) và giải phóng phòng`, 'cancel');
  await writeDB(db);

  return NextResponse.json({ data: group });
}
