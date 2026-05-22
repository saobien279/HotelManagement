import { NextResponse } from 'next/server';
import { readDB, writeDB, newId, appendLog } from '@/lib/db';
import { calcRoomPrice } from '@/lib/utils';
import type { Group, Reservation } from '@/lib/types';

// Helper to check room availability
function isRoomAvailable(roomId: string, checkIn: string, checkOut: string, reservations: Reservation[]) {
  return !reservations.some(r => 
    r.roomId === roomId && 
    r.status !== 'cancelled' && 
    r.status !== 'checkedout' &&
    !(checkOut <= r.checkIn || checkIn >= r.checkOut)
  );
}

// ── GET /api/groups ────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const db = await readDB();

  let data = db.groups || [];

  const status = searchParams.get('status');
  if (status) {
    data = data.filter(g => g.status === status);
  }

  return NextResponse.json({ data, total: data.length });
}

// ── POST /api/groups ───────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, contact, phone, checkIn, checkOut, totalGuests, note, roomType, roomCount, roomIds: providedRoomIds } = body;

    if (!name || !contact || !phone || !checkIn || !checkOut || !roomType || !roomCount) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const db = await readDB();
    const typeDetails = db.roomTypes.find(rt => rt.id === roomType);
    if (!typeDetails) {
      return NextResponse.json({ error: 'Loại phòng không hợp lệ' }, { status: 400 });
    }

    // Determine rooms to assign
    let assignedRoomIds: string[] = [];
    if (providedRoomIds && providedRoomIds.length > 0) {
      assignedRoomIds = providedRoomIds;
    } else {
      // Find all rooms of this type
      const roomsOfType = db.rooms.filter(r => r.type === roomType);
      // Filter for availability
      const availableRooms = roomsOfType.filter(r => isRoomAvailable(r.id, checkIn, checkOut, db.reservations));

      if (availableRooms.length < roomCount) {
        return NextResponse.json({ error: `Không đủ phòng trống thuộc loại này (Chỉ còn ${availableRooms.length} phòng)` }, { status: 400 });
      }
      assignedRoomIds = availableRooms.slice(0, roomCount).map(r => r.id);
    }

    // Calculate room price
    const roomPrice = calcRoomPrice(checkIn, checkOut, typeDetails);

    // Create reservations
    const reservationIds: string[] = [];
    const createdReservations: Reservation[] = [];

    for (const roomId of assignedRoomIds) {
      const resId = newId.reservation();
      reservationIds.push(resId);

      const reservation: Reservation = {
        id: resId,
        guestName: `${name} (Đoàn)`,
        phone,
        roomId,
        roomType,
        checkIn,
        checkOut,
        adults: Math.max(1, Math.floor(totalGuests / roomCount)), // Distribute guests
        children: 0,
        status: 'confirmed',
        source: 'direct',
        note: `Đặt phòng theo đoàn: ${name}. ${note || ''}`,
        total: roomPrice,
      };

      createdReservations.push(reservation);
      db.reservations.unshift(reservation);

      // Auto update room status
      const rIdx = db.rooms.findIndex(r => r.id === roomId);
      if (rIdx !== -1) {
        db.rooms[rIdx].status = 'reserved';
      }
    }

    const newGroup: Group = {
      id: 'GR' + String(Date.now()).slice(-6),
      name,
      contact,
      phone,
      checkIn,
      checkOut,
      totalGuests: Number(totalGuests),
      reservationIds,
      status: 'confirmed',
      note: note || '',
    };

    if (!db.groups) db.groups = [];
    db.groups.unshift(newGroup);

    appendLog(db, 'Hệ thống', `Tạo đoàn mới ${newGroup.name} (${newGroup.id}) với ${roomCount} phòng`, 'booking');

    await writeDB(db);

    return NextResponse.json({ data: newGroup, reservations: createdReservations }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/groups] Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
