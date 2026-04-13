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
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

/** Nights between two date strings */
export const calcNights = (checkIn: string, checkOut: string): number =>
  Math.max(1, Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000
  ));

/** Today's date string YYYY-MM-DD (demo: 2026-03-14) */
export const TODAY = '2026-03-14';

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
