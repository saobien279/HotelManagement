// ============================================================
//  HotelOS – Vercel KV Persistence Layer  (Cloud-ready)
//  Replaces the old fs-based db.json approach
// ============================================================

import { kv } from '@vercel/kv';
import {
  initialRooms, initialReservations, initialServices,
  initialInventory, initialUsers, activityLog,
} from '@/lib/data';
import type {
  Room, Reservation, Service, InventoryItem, User, ActivityLog,
} from '@/lib/types';

/* ─── DB Key in KV ──────────────────────────── */
const DB_KEY = 'hotelOS:db';

/* ─── DB Schema ────────────────────────────── */
export interface DB {
  rooms:        Room[];
  reservations: Reservation[];
  services:     Service[];
  inventory:    InventoryItem[];
  users:        User[];
  activityLog:  ActivityLog[];
  _version:     number;
  _seeded:      boolean;
}

/* ─── Read DB ───────────────────────────────── */
export async function readDB(): Promise<DB> {
  try {
    const data = await kv.get<DB>(DB_KEY);
    if (data) return data;
    return await seedDB();
  } catch {
    return await seedDB();
  }
}

/* ─── Write DB ──────────────────────────────── */
export async function writeDB(db: DB): Promise<void> {
  await kv.set(DB_KEY, db);
}

/* ─── Seed with initial data ────────────────── */
async function seedDB(): Promise<DB> {
  const db: DB = {
    rooms:        initialRooms,
    reservations: initialReservations,
    services:     initialServices,
    inventory:    initialInventory,
    users:        initialUsers,
    activityLog:  activityLog,
    _version:     1,
    _seeded:      true,
  };
  await writeDB(db);
  return db;
}

/* ─── ID generators ─────────────────────────── */
export const newId = {
  reservation: () => 'BK' + String(Date.now()).slice(-6),
  service:     () => 'SV' + String(Date.now()).slice(-6),
  user:        () => 'U'  + String(Date.now()).slice(-6),
  log:         () => 'L'  + String(Date.now()).slice(-6),
};

/* ─── Log helper ────────────────────────────── */
export function appendLog(
  db: DB,
  user: string,
  action: string,
  type: ActivityLog['type'],
) {
  db.activityLog.unshift({
    id:   newId.log(),
    time: new Date().toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' }),
    date: new Date().toISOString().slice(0, 10),
    user,
    action,
    type,
  });
  // Keep only last 200 logs
  if (db.activityLog.length > 200) db.activityLog.length = 200;
}
