import { NextResponse } from 'next/server';
import { readDB, writeDB, appendLog } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const db = await readDB();

  const idx = db.channels.findIndex(c => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Kênh phân phối không tồn tại' }, { status: 404 });
  }

  const oldChannel = db.channels[idx];

  // Update properties
  const updatedChannel = {
    ...oldChannel,
    ...body,
    lastSync: new Date().toISOString()
  };

  db.channels[idx] = updatedChannel;

  // Determine action type and log accordingly
  const bodyKeys = Object.keys(body);
  const isSyncOnly = bodyKeys.length === 1 && bodyKeys[0] === 'lastSync';
  const isToggle = body.enabled !== undefined && body.enabled !== oldChannel.enabled;

  if (isToggle) {
    appendLog(db, 'Hệ thống', `${body.enabled ? 'Bật' : 'Tắt'} kênh phân phối ${updatedChannel.name}`, 'config');
  } else if (isSyncOnly) {
    appendLog(db, 'Hệ thống', `Đồng bộ dữ liệu kênh ${updatedChannel.name}`, 'config');
  } else {
    // Real config change (commission, rateModifier, allocatedRooms, etc.)
    const changes: string[] = [];
    if (body.commission !== undefined && body.commission !== oldChannel.commission) changes.push(`hoa hồng ${body.commission}%`);
    if (body.rateModifier !== undefined && body.rateModifier !== oldChannel.rateModifier) changes.push(`hệ số giá ${body.rateModifier}x`);
    if (body.allocatedRooms !== undefined && body.allocatedRooms !== oldChannel.allocatedRooms) changes.push(`phân bổ ${body.allocatedRooms} phòng`);
    const detail = changes.length > 0 ? `: ${changes.join(', ')}` : '';
    appendLog(db, 'Hệ thống', `Cập nhật cấu hình kênh ${updatedChannel.name}${detail}`, 'config');
  }

  await writeDB(db);
  return NextResponse.json({ data: updatedChannel });
}
