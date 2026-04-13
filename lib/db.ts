// ============================================================
//  HotelOS – JSON File Persistence Layer  (Server-side only)
//  Thay thế dễ dàng bằng PostgreSQL/MySQL sau này
// ============================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import {
  initialRooms, initialReservations, initialServices,
  initialInventory, initialUsers, activityLog,
  roomTypes, guests, revenueMonthly, revenueBySource,
} from '@/lib/data';
import type {
  Room, Reservation, Service, InventoryItem, User, ActivityLog,
} from '@/lib/types';

/* ─── DB file path ─────────────────────────── */
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH  = path.join(DATA_DIR, 'db.json');

/* ─── DB Schema ────────────────────────────── */
interface DB {
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
export function readDB(): DB {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  if (!existsSync(DB_PATH)) {
    return seedDB();
  }

  try {
    const raw = readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as DB;
  } catch {
    return seedDB();
  }
}

/* ─── Write DB ──────────────────────────────── */
export function writeDB(db: DB): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

/* ─── Seed with initial data ────────────────── */
function seedDB(): DB {
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
  writeDB(db);
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
