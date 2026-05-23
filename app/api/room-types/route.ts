import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const db = await readDB();
  return NextResponse.json({ data: db.roomTypes });
}
