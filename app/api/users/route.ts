import { NextResponse } from 'next/server';
import { readDB, writeDB, newId, appendLog } from '@/lib/db';
import type { User } from '@/lib/types';

// ── GET /api/users ───────────────────────────
export async function GET() {
  const db = readDB();
  // Never expose passwords in real apps – here we only have username
  return NextResponse.json({ data: db.users, total: db.users.length });
}

// ── POST /api/users ──────────────────────────
export async function POST(req: Request) {
  const body = await req.json() as Omit<User, 'id'>;
  const db = readDB();

  // Check unique username
  if (db.users.some(u => u.username === body.username)) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
  }

  const user: User = { id: newId.user(), lastLogin: '—', ...body };
  db.users.push(user);

  appendLog(db, 'Admin', `Tạo tài khoản ${user.name} (${user.role})`, 'config');

  writeDB(db);
  return NextResponse.json({ data: user }, { status: 201 });
}
