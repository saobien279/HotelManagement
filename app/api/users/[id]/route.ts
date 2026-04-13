import { NextResponse } from 'next/server';
import { readDB, writeDB, appendLog } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// ── PATCH /api/users/:id ─────────────────────
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const db = readDB();

  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.users[idx] = { ...db.users[idx], ...body };
  appendLog(db, 'Admin', `Cập nhật tài khoản ${db.users[idx].name}`, 'config');

  writeDB(db);
  return NextResponse.json({ data: db.users[idx] });
}

// ── DELETE /api/users/:id ────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const db = readDB();

  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Prevent deleting the last admin
  const user = db.users[idx];
  if (user.role === 'admin' && db.users.filter(u => u.role === 'admin').length <= 1) {
    return NextResponse.json({ error: 'Cannot delete the only admin' }, { status: 403 });
  }

  db.users.splice(idx, 1);
  appendLog(db, 'Admin', `Xóa tài khoản ${user.name}`, 'config');
  writeDB(db);

  return NextResponse.json({ data: user });
}
