import type { DB } from './db';
import type { Reservation, MessageLog } from './types';
import { newId, appendLog } from './db';

// ─── Default Templates ──────────────────────────────────────────
export const MESSAGE_TEMPLATES = {
  booking_confirm: 'Kính chào quý khách [TÊN_KHÁCH], HotelOS xác nhận đặt phòng [MÃ_ĐẶT_PHÒNG] thành công. Thời gian lưu trú: [CHECK_IN] → [CHECK_OUT]. Rất hân hạnh được phục vụ quý khách!',
  checkin_remind: 'Kính chào quý khách [TÊN_KHÁCH], chúc quý khách một ngày tốt lành. HotelOS xin nhắc quý khách về lịch check-in ngày mai ([CHECK_IN]). Hẹn gặp quý khách!',
  checkout_thanks: 'Kính chào quý khách [TÊN_KHÁCH], chân thành cảm ơn quý khách đã tin tưởng và chọn lưu trú tại HotelOS. Chúc quý khách thượng lộ bình an!',
  promo: 'Kính chào quý khách [TÊN_KHÁCH], HotelOS gửi tặng quý khách mã giảm giá 15% cho lần đặt phòng tiếp theo: DONGHANH15. Ưu đãi áp dụng đến cuối tháng.',
};

// ─── Channels for template ─────────────────────────────────────
export const TEMPLATE_CHANNELS: Record<keyof typeof MESSAGE_TEMPLATES, MessageLog['channel']> = {
  booking_confirm: 'email+sms',
  checkin_remind: 'email',
  checkout_thanks: 'email',
  promo: 'email',
};

// ─── Template Engine ────────────────────────────────────────────
export function compileMessage(template: string, booking: Reservation): string {
  return template
    .replace(/\[TÊN_KHÁCH\]/g, booking.guestName)
    .replace(/\[MÃ_ĐẶT_PHÒNG\]/g, booking.id)
    .replace(/\[CHECK_IN\]/g, booking.checkIn)
    .replace(/\[CHECK_OUT\]/g, booking.checkOut);
}

// ─── Send Automation Message Helper ─────────────────────────────
export function sendAutomationMessage(
  db: DB,
  booking: Reservation,
  type: MessageLog['type'],
  customTemplate?: string
): MessageLog {
  const template = customTemplate || MESSAGE_TEMPLATES[type];
  const content = compileMessage(template, booking);
  const channel = TEMPLATE_CHANNELS[type];

  // Use real guest email if available, otherwise mock it
  const email = booking.email || `${booking.guestName.toLowerCase().replace(/\s+/g, '')}@example.com`;

  const newMessage: MessageLog = {
    id: newId.message(),
    bookingId: booking.id,
    guestName: booking.guestName,
    phone: booking.phone || '0900000000',
    email: email,
    type,
    status: 'sent', // Simulating successful delivery
    channel,
    content,
    sentAt: new Date().toISOString(),
  };

  if (!db.messages) db.messages = [];
  db.messages.unshift(newMessage);

  // System logging
  const typeLabels = {
    booking_confirm: 'Xác nhận đặt phòng',
    checkin_remind: 'Nhắc nhở check-in',
    checkout_thanks: 'Cảm ơn check-out',
    promo: 'Khuyến mãi',
  };
  
  appendLog(
    db, 
    'Hệ thống', 
    `Tự động gửi tin nhắn ${typeLabels[type]} cho khách hàng ${booking.guestName}`, 
    'system'
  );

  return newMessage;
}
