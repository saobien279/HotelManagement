// ============================================
//  HotelOS – TypeScript Types
// ============================================

export type RoomStatus = 'vacant' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
export type RoomTypeId = 'SGL' | 'DBL' | 'TWN' | 'DLX' | 'SUT' | 'FAM';
export type ReservationStatus = 'confirmed' | 'deposit' | 'checkedin' | 'checkedout' | 'pending' | 'cancelled';
export type ServiceStatus = 'billed' | 'pending';
export type UserRole = 'admin' | 'frontdesk' | 'housekeeping' | 'accountant' | 'inventory';
export type UserStatus = 'active' | 'inactive';
export type ToastType = 'success' | 'error' | 'warn' | 'info';

export interface RoomType {
  id: RoomTypeId;
  name: string;
  capacity: number;
  basePrice: number;
  weekendPrice: number;
  peakMultiplier: number;
}

export interface Room {
  id: string;
  floor: number;
  type: RoomTypeId;
  status: RoomStatus;
  guest: string | null;
}

export interface Reservation {
  id: string;
  guestName: string;
  phone: string;
  email?: string;
  roomId: string | null;
  roomType: RoomTypeId;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  status: ReservationStatus;
  source: 'direct' | 'booking' | 'agoda';
  note: string;
  total: number;
}

export interface Guest {
  id: string;
  name: string;
  cccd: string | null;
  passport?: string;
  phone: string;
  email: string;
  nationality: string;
  bookings: number;
  totalSpent: number;
}

export interface Service {
  id: string;
  bookingId: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  date: string;
  status: ServiceStatus;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'linens' | 'amenity' | 'beverage' | 'supplies';
  unit: string;
  stock: number;
  minStock: number;
  cost: number;
}

export interface ActivityLog {
  id: string;
  time: string;
  date: string;
  user: string;
  action: string;
  type: 'checkin' | 'booking' | 'housekeeping' | 'cancel' | 'invoice' | 'config' | 'system';
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
  password?: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
  occupancy: number;
}

export interface RevenueBySource {
  source: string;
  percent: number;
  amount: number;
}

export interface HotelStats {
  total: number;
  occupied: number;
  vacant: number;
  cleaning: number;
  reserved: number;
  maintenance: number;
  occupancy: number;
  todayRevenue: number;
}

export interface Group {
  id: string;          // 'GR' + timestamp
  name: string;        // Tên đoàn/công ty
  contact: string;     // Người liên hệ
  phone: string;
  checkIn: string;
  checkOut: string;
  totalGuests: number;
  reservationIds: string[];  // Link đến các Reservation
  status: 'pending' | 'confirmed' | 'checkedin' | 'checkedout' | 'cancelled';
  note: string;
}

export interface Channel {
  id: string;           // 'booking' | 'agoda' | 'expedia' | 'airbnb' | 'direct'
  name: string;
  enabled: boolean;
  commission: number;   // % hoa hồng (VD: Booking = 15%)
  rateModifier: number; // Hệ số giá (1.0 = giá gốc, 1.15 = +15%)
  allocatedRooms: number; // Số phòng phân bổ
  lastSync: string;     // ISO date
}

export interface MessageLog {
  id: string;           // 'MSG' + timestamp/random
  bookingId: string;
  guestName: string;
  phone: string;
  email: string;
  type: 'booking_confirm' | 'checkin_remind' | 'checkout_thanks' | 'promo';
  status: 'sent' | 'failed' | 'pending';
  channel: 'email' | 'sms' | 'email+sms';
  content: string;
  sentAt: string;       // ISO date
}


