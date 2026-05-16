// ============================================================
//  HotelOS – Redis Persistence Layer  (Cloud-ready)
//  Uses node-redis with REDIS_URL from Vercel Redis
// ============================================================

import { createClient } from 'redis';
import {
  initialRooms, initialReservations, initialServices,
  initialInventory, initialUsers, activityLog,
} from '@/lib/data';
import type {
  Room, Reservation, Service, InventoryItem, User, ActivityLog,
} from '@/lib/types';

/* ─── Redis client singleton ─────────────────── */
let client: ReturnType<typeof createClient> | null = null;

async function getRedis() {
  if (client && client.isOpen) return client;

  const url = process.env.REDIS_URL;
  if (!url) throw new Error('Missing REDIS_URL environment variable');

  // Vercel Redis uses rediss:// (TLS) – auto-detect
  const useTls = url.startsWith('rediss://');
  client = createClient({
    url,
    socket: useTls ? { tls: true } : undefined,
  });
  client.on('error', (err) => console.error('[Redis]', err));
  await client.connect();
  return client;
}

/* ─── DB Key in Redis ───────────────────────── */
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
    const redis = await getRedis();
    const raw = await redis.get(DB_KEY);
    if (raw) return JSON.parse(raw) as DB;
    return await seedDB();
  } catch (err) {
    console.error('[readDB] Error:', err);
    return await seedDB();
  }
}

/* ─── Write DB ──────────────────────────────── */
export async function writeDB(db: DB): Promise<void> {
  const redis = await getRedis();
  await redis.set(DB_KEY, JSON.stringify(db));
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
  try {
    await writeDB(db);
  } catch (err) {
    console.error('[seedDB] Failed to write seed data:', err);
  }
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
