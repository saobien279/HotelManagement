// ============================================
//  HotelOS – Utility Functions
// ============================================

/** Format full: 1.550.000 ₫ */
export const fmt = (n: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

/** Format short: 1.55tr, 550K */
export const fmtShort = (n: number): string => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' tỷ';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'tr';
  if (n >= 1_000)         return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString('vi-VN');
};

/** Format: dd/MM/yyyy */
export const fmtDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  // Handle both YYYY-MM-DD and YYYY/MM/DD
  const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
};

/** Nights between two date strings */
export const calcNights = (checkIn: string, checkOut: string): number => {
  if (!checkIn || !checkOut) return 1;
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
  // Ensure we compare start of day to start of day
  d1.setHours(0,0,0,0);
  d2.setHours(0,0,0,0);
  const diff = d2.getTime() - d1.getTime();
  return Math.max(1, Math.round(diff / 86_400_000));
};

/** Today's date string YYYY-MM-DD */
export const TODAY = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export const statusLabel: Record<string, string> = {
  vacant:      'Phòng trống',
  occupied:    'Đang có khách',
  cleaning:    'Đang dọn',
  maintenance: 'Bảo trì',
  reserved:    'Đã đặt',
  confirmed:   'Đã xác nhận',
  deposit:     'Đã đặt cọc',
  pending:     'Chờ xác nhận',
  cancelled:   'Đã hủy',
  checkedin:   'Đang ở',
  checkedout:  'Đã trả phòng',
  billed:      'Đã tính tiền',
  active:      'Hoạt động',
  inactive:    'Tạm khóa',
};

export const roomTypeLabel: Record<string, string> = {
  SGL: 'Single',
  DBL: 'Double',
  TWN: 'Twin',
  DLX: 'Deluxe',
  SUT: 'Suite',
  FAM: 'Family',
};

export const sourceLabel: Record<string, string> = {
  direct:  'Trực tiếp',
  booking: 'Booking.com',
  agoda:   'Agoda',
  expedia: 'Expedia',
  airbnb:  'Airbnb',
  other:   'Khác',
};

export const sourceCls: Record<string, string> = {
  direct:  'source-direct',
  booking: 'source-booking',
  agoda:   'source-agoda',
  expedia: 'source-expedia',
  airbnb:  'source-airbnb',
};

export const logColor: Record<string, string> = {
  checkin:      '#059669',
  booking:      '#4F46E5',
  housekeeping: '#D97706',
  cancel:       '#DC2626',
  invoice:      '#2563EB',
  config:       '#7C3AED',
  system:       '#6B7280',
};

export const statusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    vacant:      'badge-vacant',
    occupied:    'badge-occupied',
    cleaning:    'badge-cleaning',
    maintenance: 'badge-maintenance',
    reserved:    'badge-reserved',
    confirmed:   'badge-confirmed',
    pending:     'badge-pending',
    cancelled:   'badge-cancelled',
    deposit:     'badge-deposit',
    checkedin:   'badge-checkedin',
    checkedout:  'badge-checkedout',
  };
  return map[status] ?? 'badge-muted';
};

/** Color for occupancy rates */
export const occColor = (pct: number): string =>
  pct >= 80 ? 'var(--color-success)' : pct >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';

/** ADR – Average Daily Rate */
export const calcADR = (totalRevenue: number, roomNightsSold: number): number =>
  roomNightsSold > 0 ? Math.round(totalRevenue / roomNightsSold) : 0;

/** RevPAR – Revenue per Available Room */
export const calcRevPAR = (totalRevenue: number, totalRooms: number, days: number): number =>
  totalRooms > 0 && days > 0 ? Math.round(totalRevenue / (totalRooms * days)) : 0;

/** Calculate dynamic room price based on dates and multipliers */
export const calcRoomPrice = (checkIn: string, checkOut: string, roomType: { basePrice: number, weekendPrice: number, peakMultiplier: number }): number => {
  if (!checkIn || !checkOut) return roomType.basePrice;
  
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return roomType.basePrice;

  let total = 0;
  let curr = new Date(d1);

  while (curr < d2) {
    const day = curr.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat
    const month = curr.getMonth(); // 0-11
    
    let price = (day === 5 || day === 6 || day === 0) ? roomType.weekendPrice : roomType.basePrice;
    
    // Seasonal multiplier (June, July, August as Peak)
    if (month >= 5 && month <= 7) {
      price *= roomType.peakMultiplier;
    }
    
    total += price;
    curr.setDate(curr.getDate() + 1);
  }

  return Math.max(roomType.basePrice, Math.round(total));
};
