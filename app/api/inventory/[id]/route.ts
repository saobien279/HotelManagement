import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

// ── PATCH /api/inventory/:id ─────────────────
// Body: { stock?: number; adjustment?: number }  (adjustment = +/- delta)
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body: { stock?: number; adjustment?: number; minStock?: number } = await req.json();
  const db = readDB();

  const idx = db.inventory.findIndex(i => i.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const item = db.inventory[idx];

  if (typeof body.adjustment === 'number') {
    item.stock = Math.max(0, item.stock + body.adjustment);
  } else if (typeof body.stock === 'number') {
    item.stock = body.stock;
  }

  if (typeof body.minStock === 'number') item.minStock = body.minStock;

  db.inventory[idx] = item;
  writeDB(db);

  return NextResponse.json({ data: item });
}
