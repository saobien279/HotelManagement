import { NextResponse } from 'next/server';
import { readDB, writeDB, appendLog } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// ── PATCH /api/services/:id ──────────────────
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const db = readDB();

  const idx = db.services.findIndex(s => s.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.services[idx] = { ...db.services[idx], ...body };

  if (body.status === 'billed') {
    appendLog(db, 'Lễ tân', `Tính tiền dịch vụ ${db.services[idx].name} – ${id}`, 'invoice');
  }

  writeDB(db);
  return NextResponse.json({ data: db.services[idx] });
}

// ── DELETE /api/services/:id ─────────────────
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const db = readDB();

  const idx = db.services.findIndex(s => s.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [removed] = db.services.splice(idx, 1);
  writeDB(db);

  return NextResponse.json({ data: removed });
}
