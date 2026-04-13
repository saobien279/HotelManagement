'use client';

import React, {
  createContext, useContext, useState, useCallback,
  useEffect, ReactNode,
} from 'react';
import {
  roomTypes, guests, activityLog as staticLog,
  revenueMonthly, revenueBySource,
} from '@/lib/data';
import type {
  Room, Reservation, Service, User, InventoryItem,
  RoomStatus, ReservationStatus,
} from '@/lib/types';

/* ─── Re-export static / analytics data ──────── */
export { roomTypes, guests, revenueMonthly, revenueBySource };
export { staticLog as activityLog };
export { initialInventory as inventory } from '@/lib/data';

/* ─── API helpers ─────────────────────────────── */
async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'API error');
  }
  const json = await res.json();
  return json.data as T;
}

/* ─── Stats (computed server-side) ───────────── */
export interface HotelStats {
  total: number; occupied: number; vacant: number;
  cleaning: number; reserved: number; maintenance: number;
  occupancy: number; todayRevenue: number;
  totalServiceRevenue: number;
  checkInToday: number; checkOutToday: number;
  lowStockItems: number;
}

/* ─── Context value ───────────────────────────── */
interface HotelContextValue {
  rooms: Room[];
  reservations: Reservation[];
  services: Service[];
  users: User[];
  inventory: InventoryItem[];
  stats: HotelStats | null;
  loading: boolean;
  // Mutators – all async, call API → refresh state
  updateRoomStatus: (roomId: string, status: RoomStatus) => Promise<void>;
  addReservation: (data: Omit<Reservation, 'id'>) => Promise<void>;
  updateReservationStatus: (id: string, status: ReservationStatus) => Promise<void>;
  addService: (data: Omit<Service, 'id'>) => Promise<void>;
  billService: (id: string) => Promise<void>;
  addUser: (data: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  adjustInventory: (id: string, adjustment: number) => Promise<void>;
  // re-fetch helpers
  refreshAll: () => Promise<void>;
  getStats: () => HotelStats;   // legacy sync helper
}

const HotelContext = createContext<HotelContextValue | null>(null);

export function HotelProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<HotelStats | null>(null);
  const [loading, setLoading] = useState(true);

  /* ─── Initial load ──────────────────────────── */
  const fetchRooms = useCallback(async () => setRooms(await api<Room[]>('/api/rooms')), []);
  const fetchReservations = useCallback(async () => setReservations(await api<Reservation[]>('/api/reservations')), []);
  const fetchServices = useCallback(async () => setServices(await api<Service[]>('/api/services')), []);
  const fetchUsers = useCallback(async () => setUsers(await api<User[]>('/api/users')), []);
  const fetchInventory = useCallback(async () => setInventory(await api<InventoryItem[]>('/api/inventory')), []);
  const fetchStats = useCallback(async () => setStats(await api<HotelStats>('/api/stats')), []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchRooms(), fetchReservations(), fetchServices(),
      fetchUsers(), fetchInventory(), fetchStats(),
    ]);
  }, [fetchRooms, fetchReservations, fetchServices, fetchUsers, fetchInventory, fetchStats]);

  useEffect(() => {
    refreshAll().finally(() => setLoading(false));
  }, [refreshAll]);

  /* ─── Mutators ──────────────────────────────── */
  const updateRoomStatus = useCallback(async (roomId: string, status: RoomStatus) => {
    await api(`/api/rooms/${roomId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await Promise.all([fetchRooms(), fetchStats()]);
  }, [fetchRooms, fetchStats]);

  const addReservation = useCallback(async (data: Omit<Reservation, 'id'>) => {
    await api('/api/reservations', { method: 'POST', body: JSON.stringify(data) });
    await Promise.all([fetchReservations(), fetchStats()]);
  }, [fetchReservations, fetchStats]);

  const updateReservationStatus = useCallback(async (id: string, status: ReservationStatus) => {
    await api(`/api/reservations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await Promise.all([fetchReservations(), fetchRooms(), fetchStats()]);
  }, [fetchReservations, fetchRooms, fetchStats]);

  const addService = useCallback(async (data: Omit<Service, 'id'>) => {
    await api('/api/services', { method: 'POST', body: JSON.stringify(data) });
    await Promise.all([fetchServices(), fetchStats()]);
  }, [fetchServices, fetchStats]);

  const billService = useCallback(async (id: string) => {
    await api(`/api/services/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'billed' }) });
    await Promise.all([fetchServices(), fetchStats()]);
  }, [fetchServices, fetchStats]);

  const addUser = useCallback(async (data: Omit<User, 'id'>) => {
    await api('/api/users', { method: 'POST', body: JSON.stringify(data) });
    await fetchUsers();
  }, [fetchUsers]);

  const updateUser = useCallback(async (id: string, data: Partial<User>) => {
    await api(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    await fetchUsers();
  }, [fetchUsers]);

  const adjustInventory = useCallback(async (id: string, adjustment: number) => {
    await api(`/api/inventory/${id}`, { method: 'PATCH', body: JSON.stringify({ adjustment }) });
    await fetchInventory();
  }, [fetchInventory]);

  /* ─── Legacy sync helper (still used in some pages) ── */
  const getStats = useCallback((): HotelStats => {
    if (stats) return stats;
    const total = rooms.length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    return {
      total, occupied,
      vacant: rooms.filter(r => r.status === 'vacant').length,
      cleaning: rooms.filter(r => r.status === 'cleaning').length,
      reserved: rooms.filter(r => r.status === 'reserved').length,
      maintenance: rooms.filter(r => r.status === 'maintenance').length,
      occupancy: total > 0 ? Math.round((occupied / total) * 100) : 0,
      todayRevenue: reservations.filter(r => r.status === 'checkedin').reduce((s, r) => s + r.total, 0),
      totalServiceRevenue: services.filter(s => s.status === 'billed').reduce((s, svc) => s + svc.price * svc.qty, 0),
      checkInToday: 0,
      checkOutToday: 0,
      lowStockItems: inventory.filter(i => i.stock <= i.minStock).length,
    };
  }, [stats, rooms, reservations, services, inventory]);

  return (
    <HotelContext.Provider value={{
      rooms, reservations, services, users, inventory, stats, loading,
      updateRoomStatus, addReservation, updateReservationStatus,
      addService, billService, addUser, updateUser, adjustInventory,
      refreshAll, getStats,
    }}>
      {children}
    </HotelContext.Provider>
  );
}

export function useHotel() {
  const ctx = useContext(HotelContext);
  if (!ctx) throw new Error('useHotel must be used inside HotelProvider');
  return ctx;
}
