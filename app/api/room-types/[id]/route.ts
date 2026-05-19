import { NextResponse } from 'next/server';
import { readDB, writeDB, appendLog } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const db = await readDB();

  const idx = db.roomTypes.findIndex((rt: any) => rt.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const old = db.roomTypes[idx];
  const updated = { ...old, ...body };
  db.roomTypes[idx] = updated;

  appendLog(db, 'Admin', `Cập nhật giá loại phòng ${id}: Cơ bản ${updated.basePrice}đ, Cuối tuần ${updated.weekendPrice}đ`, 'config');

  await writeDB(db);

  return NextResponse.json({ data: updated });
}
