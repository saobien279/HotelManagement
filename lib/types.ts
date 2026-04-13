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
