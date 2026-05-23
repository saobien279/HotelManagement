import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { sendAutomationMessage } from '@/lib/messaging';

export const dynamic = 'force-dynamic';

// ── GET /api/messages ──────────────────────────
export async function GET(req: Request) {
  const db = await readDB();
  return NextResponse.json({ data: db.messages || [] });
}

// ── POST /api/messages (Simulate Manual Send) ────
export async function POST(req: Request) {
  const body = await req.json();
  const db = await readDB();

  const { bookingId, type, customTemplate } = body;

  if (!bookingId || !type) {
    return NextResponse.json({ error: 'Mã đặt phòng và loại tin nhắn là bắt buộc' }, { status: 400 });
  }

  const booking = db.reservations.find(r => r.id === bookingId);
  if (!booking) {
    return NextResponse.json({ error: 'Không tìm thấy đặt phòng này' }, { status: 404 });
  }

  try {
    const newMessage = sendAutomationMessage(db, booking, type, customTemplate);
    await writeDB(db);
    return NextResponse.json({ data: newMessage }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
