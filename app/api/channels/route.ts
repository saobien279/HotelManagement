import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const db = await readDB();
  return NextResponse.json({ data: db.channels || [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = await readDB();

  if (!body.id || !body.name) {
    return NextResponse.json({ error: 'Mã và tên kênh phân phối là bắt buộc' }, { status: 400 });
  }

  const exists = db.channels.some(c => c.id === body.id);
  if (exists) {
    return NextResponse.json({ error: 'Kênh phân phối này đã tồn tại' }, { status: 400 });
  }

  const newChannel = {
    id: body.id,
    name: body.name,
    enabled: body.enabled !== undefined ? body.enabled : true,
    commission: Number(body.commission) || 0,
    rateModifier: Number(body.rateModifier) || 1.0,
    allocatedRooms: Number(body.allocatedRooms) || 0,
    lastSync: new Date().toISOString(),
  };

  db.channels.push(newChannel);
  await writeDB(db);

  return NextResponse.json({ data: newChannel });
}
