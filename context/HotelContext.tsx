'use client';

import React, {
  createContext, useContext, useState, useCallback,
  useEffect, ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import {
  guests, activityLog as staticLog,
  revenueMonthly, revenueBySource,
} from '@/lib/data';
import type {
  RoomType, Room, Reservation, Service, User, InventoryItem,
  RoomStatus, ReservationStatus, ActivityLog, Group, Channel, MessageLog,
} from '@/lib/types';

/* ─── Re-export static / analytics data ──────── */
export { guests, revenueMonthly, revenueBySource };
export { initialInventory } from '@/lib/data';

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
  roomTypes: RoomType[];
  rooms: Room[];
  reservations: Reservation[];
  services: Service[];
  users: User[];
  inventory: InventoryItem[];
  activityLog: ActivityLog[];
  groups: Group[];
  channels: Channel[];
  messages: MessageLog[];
  stats: HotelStats | null;
  loading: boolean;
  // Mutators – all async, call API → refresh state
  updateRoomStatus: (roomId: string, status: RoomStatus) => Promise<void>;
  addReservation: (data: Omit<Reservation, 'id'>) => Promise<void>;
  updateReservationStatus: (id: string, status: ReservationStatus, extra?: any) => Promise<void>;
  addService: (data: Omit<Service, 'id'>) => Promise<void>;
  billService: (id: string) => Promise<void>;
  addUser: (data: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  adjustInventory: (id: string, adjustment: number) => Promise<void>;
  updateRoomType: (id: string, data: Partial<RoomType>) => Promise<void>;
  addGroup: (data: any) => Promise<void>;
  updateGroupStatus: (id: string, status: Group['status']) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  updateChannel: (id: string, data: Partial<Channel>) => Promise<void>;
  sendManualMessage: (bookingId: string, type: MessageLog['type'], customTemplate?: string) => Promise<void>;
  // re-fetch helpers
  refreshAll: () => Promise<void>;
  getStats: () => HotelStats;   // legacy sync helper
}

const HotelContext = createContext<HotelContextValue | null>(null);

export function HotelProvider({ children }: { children: ReactNode }) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [stats, setStats] = useState<HotelStats | null>(null);
  const [loading, setLoading] = useState(true);

  /* ─── Initial load ──────────────────────────── */
  const fetchRoomTypes = useCallback(async () => setRoomTypes(await api<RoomType[]>('/api/room-types')), []);
  const fetchRooms = useCallback(async () => setRooms(await api<Room[]>('/api/rooms')), []);
  const fetchReservations = useCallback(async () => setReservations(await api<Reservation[]>('/api/reservations')), []);
  const fetchServices = useCallback(async () => setServices(await api<Service[]>('/api/services')), []);
  const fetchUsers = useCallback(async () => setUsers(await api<User[]>('/api/users')), []);
  const fetchInventory = useCallback(async () => setInventory(await api<InventoryItem[]>('/api/inventory')), []);
  const fetchActivityLog = useCallback(async () => setActivityLog(await api<ActivityLog[]>('/api/logs')), []);
  const fetchGroups = useCallback(async () => setGroups(await api<Group[]>('/api/groups')), []);
  const fetchChannels = useCallback(async () => setChannels(await api<Channel[]>('/api/channels')), []);
  const fetchMessages = useCallback(async () => setMessages(await api<MessageLog[]>('/api/messages')), []);
  const fetchStats = useCallback(async () => setStats(await api<HotelStats>('/api/stats')), []);

  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([
        fetchRoomTypes(), fetchRooms(), fetchReservations(), fetchServices(),
        fetchUsers(), fetchInventory(), fetchActivityLog(), fetchGroups(), fetchStats(),
        fetchChannels(), fetchMessages(),
      ]);
    } catch (e: any) {
      if (e.message === 'Unauthorized') {
        // Quietly absorb Unauthorized errors when not logged in
        return;
      }
      console.error("refreshAll error:", e);
    }
  }, [fetchRoomTypes, fetchRooms, fetchReservations, fetchServices, fetchUsers, fetchInventory, fetchActivityLog, fetchGroups, fetchStats, fetchChannels, fetchMessages]);

  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      setLoading(true);
      refreshAll().finally(() => setLoading(false));
    } else if (status === 'unauthenticated') {
      setRoomTypes([]);
      setRooms([]);
      setReservations([]);
      setServices([]);
      setUsers([]);
      setInventory([]);
      setActivityLog([]);
      setGroups([]);
      setChannels([]);
      setMessages([]);
      setStats(null);
      setLoading(false);
    } else if (status === 'loading') {
      setLoading(true);
    }
  }, [status, refreshAll]);

  /* ─── Mutators ──────────────────────────────── */
  const updateRoomStatus = useCallback(async (roomId: string, status: RoomStatus) => {
    await api(`/api/rooms/${roomId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await Promise.all([fetchRooms(), fetchStats(), fetchActivityLog()]);
  }, [fetchRooms, fetchStats, fetchActivityLog]);

  const addReservation = useCallback(async (data: Omit<Reservation, 'id'>) => {
    await api('/api/reservations', { method: 'POST', body: JSON.stringify(data) });
    await Promise.all([fetchReservations(), fetchRooms(), fetchStats(), fetchActivityLog()]);
  }, [fetchReservations, fetchRooms, fetchStats, fetchActivityLog]);

  const updateReservationStatus = useCallback(async (id: string, status: ReservationStatus, extra?: any) => {
    await api(`/api/reservations/${id}`, { method: 'PATCH', body: JSON.stringify({ status, ...extra }) });
    await Promise.all([fetchReservations(), fetchRooms(), fetchServices(), fetchStats(), fetchActivityLog()]);
  }, [fetchReservations, fetchRooms, fetchServices, fetchStats, fetchActivityLog]);

  const addService = useCallback(async (data: Omit<Service, 'id'>) => {
    await api('/api/services', { method: 'POST', body: JSON.stringify(data) });
    await Promise.all([fetchServices(), fetchStats(), fetchActivityLog()]);
  }, [fetchServices, fetchStats, fetchActivityLog]);

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
    await Promise.all([fetchInventory(), fetchActivityLog(), fetchStats()]);
  }, [fetchInventory, fetchActivityLog, fetchStats]);

  const updateRoomType = useCallback(async (id: string, data: Partial<RoomType>) => {
    await api(`/api/room-types/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    await Promise.all([fetchRoomTypes(), fetchActivityLog()]);
  }, [fetchRoomTypes, fetchActivityLog]);

  const addGroup = useCallback(async (data: any) => {
    await api('/api/groups', { method: 'POST', body: JSON.stringify(data) });
    await Promise.all([fetchGroups(), fetchReservations(), fetchRooms(), fetchStats(), fetchActivityLog()]);
  }, [fetchGroups, fetchReservations, fetchRooms, fetchStats, fetchActivityLog]);

  const updateGroupStatus = useCallback(async (id: string, status: Group['status']) => {
    await api(`/api/groups/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await Promise.all([fetchGroups(), fetchReservations(), fetchRooms(), fetchServices(), fetchStats(), fetchActivityLog()]);
  }, [fetchGroups, fetchReservations, fetchRooms, fetchServices, fetchStats, fetchActivityLog]);

  const deleteGroup = useCallback(async (id: string) => {
    await api(`/api/groups/${id}`, { method: 'DELETE' });
    await Promise.all([fetchGroups(), fetchReservations(), fetchRooms(), fetchStats(), fetchActivityLog()]);
  }, [fetchGroups, fetchReservations, fetchRooms, fetchStats, fetchActivityLog]);

  const updateChannel = useCallback(async (id: string, data: Partial<Channel>) => {
    await api(`/api/channels/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    await Promise.all([fetchChannels(), fetchActivityLog()]);
  }, [fetchChannels, fetchActivityLog]);

  const sendManualMessage = useCallback(async (bookingId: string, type: MessageLog['type'], customTemplate?: string) => {
    await api('/api/messages', { method: 'POST', body: JSON.stringify({ bookingId, type, customTemplate }) });
    await Promise.all([fetchMessages(), fetchActivityLog()]);
  }, [fetchMessages, fetchActivityLog]);

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
      roomTypes, rooms, reservations, services, users, inventory, activityLog, groups, channels, messages, stats, loading,
      updateRoomStatus, addReservation, updateReservationStatus,
      addService, billService, addUser, updateUser, adjustInventory, updateRoomType,
      addGroup, updateGroupStatus, deleteGroup, updateChannel, sendManualMessage,
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
