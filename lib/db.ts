// ============================================================
//  HotelOS – Redis Persistence Layer  (Cloud-ready)
//  Uses node-redis with REDIS_URL from Vercel Redis
// ============================================================

import { createClient } from 'redis';
import {
  initialRoomTypes, initialRooms, initialReservations, initialServices,
  initialInventory, initialUsers, activityLog,
} from '@/lib/data';
import type {
  RoomType, Room, Reservation, Service, InventoryItem, User, ActivityLog,
} from '@/lib/types';

/* ─── In-memory fallback (for local dev without Redis) ── */
let memoryDB: DB | null = null;

/* ─── Redis client singleton ─────────────────── */
let client: ReturnType<typeof createClient> | null = null;

async function getRedis() {
  if (client && client.isOpen) return client;

  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn('[Redis] Missing REDIS_URL. Using in-memory fallback.');
    return null; // Signals memory fallback
  }

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
  roomTypes:    RoomType[];
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
    if (!redis) {
      if (!memoryDB) memoryDB = await getSeedData();
      return memoryDB;
    }
    const raw = await redis.get(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DB>;
      const seed = await getSeedData();
      return { ...seed, ...parsed } as DB;
    }
    return await seedDB();
  } catch (err) {
    console.error('[readDB] Error:', err);
    if (!memoryDB) memoryDB = await getSeedData();
    return memoryDB;
  }
}

/* ─── Write DB ──────────────────────────────── */
export async function writeDB(db: DB): Promise<void> {
  try {
    const redis = await getRedis();
    if (!redis) {
      memoryDB = db;
      return;
    }
    await redis.set(DB_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('[writeDB] Error:', err);
    memoryDB = db;
  }
}

async function getSeedData(): Promise<DB> {
  return {
    roomTypes:    initialRoomTypes,
    rooms:        initialRooms,
    reservations: initialReservations,
    services:     initialServices,
    inventory:    initialInventory,
    users:        initialUsers,
    activityLog:  activityLog,
    _version:     1,
    _seeded:      true,
  };
}

/* ─── Seed with initial data ────────────────── */
async function seedDB(): Promise<DB> {
  const db = await getSeedData();
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
