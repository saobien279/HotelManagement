import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

// ── GET /api/stats ───────────────────────────
// Returns real-time dashboard KPIs computed from DB
export async function GET() {
  const db = readDB();

  const rooms        = db.rooms;
  const reservations = db.reservations;
  const services     = db.services;

  const total       = rooms.length;
  const occupied    = rooms.filter(r => r.status === 'occupied').length;
  const vacant      = rooms.filter(r => r.status === 'vacant').length;
  const cleaning    = rooms.filter(r => r.status === 'cleaning').length;
  const reserved    = rooms.filter(r => r.status === 'reserved').length;
  const maintenance = rooms.filter(r => r.status === 'maintenance').length;
  const occupancy   = Math.round((occupied / total) * 100);

  const todayRevenue = reservations
    .filter(r => r.status === 'checkedin' || r.status === 'checkedout')
    .reduce((s, r) => s + r.total, 0);

  const totalServiceRevenue = services
    .filter(s => s.status === 'billed')
    .reduce((s, svc) => s + svc.price * svc.qty, 0);

  const checkInToday  = reservations.filter(r =>
    (r.status === 'confirmed' || r.status === 'deposit') && r.checkIn <= '2026-03-14'
  ).length;

  const checkOutToday = reservations.filter(r =>
    r.status === 'checkedin' && r.checkOut <= '2026-03-14'
  ).length;

  const lowStockItems = db.inventory.filter(i => i.stock <= i.minStock).length;

  return NextResponse.json({
    data: {
      total, occupied, vacant, cleaning, reserved, maintenance,
      occupancy, todayRevenue, totalServiceRevenue,
      checkInToday, checkOutToday, lowStockItems,
    }
  });
}
