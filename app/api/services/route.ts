import { NextResponse } from 'next/server';
import { readDB, writeDB, newId, appendLog } from '@/lib/db';
import type { Service } from '@/lib/types';

// ── GET /api/services ────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const db = readDB();

  let data = db.services;
  const bookingId = searchParams.get('bookingId');
  const status    = searchParams.get('status');

  if (bookingId) data = data.filter(s => s.bookingId === bookingId);
  if (status)    data = data.filter(s => s.status === status);

  return NextResponse.json({ data, total: data.length });
}

// ── POST /api/services ───────────────────────
export async function POST(req: Request) {
  const body = await req.json() as Omit<Service, 'id'>;
  const db = readDB();

  const service: Service = { id: newId.service(), ...body };
  db.services.push(service);

  appendLog(db, 'Lễ tân', `Thêm dịch vụ ${service.name} vào ${service.bookingId}`, 'invoice');

  writeDB(db);
  return NextResponse.json({ data: service }, { status: 201 });
}
