# HotelOS – Toàn bộ bối cảnh dự án (Agent Context v3)

> Cập nhật lần cuối: 2026-05-16  
> Trạng thái: **Production-ready (local)** → chuẩn bị deploy lên web + cloud DB

---

## 🚀 Công nghệ sử dụng

| Layer | Tech | Ghi chú |
|---|---|---|
| Frontend | Next.js `^16.2.3` (Turbopack) | App Router, `'use client'` tường minh |
| UI | React `19.2.4` + Vanilla CSS | Glassmorphism, CSS Variables, không dùng Tailwind |
| Icons | `lucide-react ^1.8.0` | |
| Animation | `framer-motion ^12.38.0` | Đã import, chưa dùng nhiều |
| Type system | TypeScript `^5` | Strict mode |
| DB (local) | `data/db.json` qua `fs` module | Chỉ chạy được server-side |
| DB (cloud) | **Chưa migrate** → plan dùng **Vercel KV (Redis)** hoặc **PlanetScale/Neon (PostgreSQL)** | |
| ORM devDep | `@prisma/client ^7.7.0` | Đã cài nhưng **chưa dùng** – sẵn sàng cho migration |
| Deploy target | **Vercel** (khuyến nghị) | |

---

## 📁 Cấu trúc file quan trọng

```
HotelManagement/
├── app/
│   ├── layout.tsx              # Root: HotelProvider > UIProvider > AppShell > children
│   ├── page.tsx                # Dashboard (10KB – stats cards, room grid, logs, charts)
│   ├── globals.css             # 44KB – toàn bộ CSS Variables + component classes
│   ├── api/
│   │   ├── rooms/route.ts      # GET (filter: floor, status, type)
│   │   ├── rooms/[id]/route.ts # PATCH (status)
│   │   ├── reservations/route.ts       # GET (filter: status,source,q,roomId) | POST
│   │   ├── reservations/[id]/route.ts  # GET | PATCH | DELETE
│   │   ├── services/route.ts           # GET | POST
│   │   ├── services/[id]/route.ts      # PATCH (status:'billed')
│   │   ├── inventory/route.ts          # GET
│   │   ├── inventory/[id]/route.ts     # PATCH (adjustment: number)
│   │   ├── users/route.ts              # GET | POST (unique username check)
│   │   ├── users/[id]/route.ts         # PATCH
│   │   ├── logs/route.ts               # GET (readonly)
│   │   └── stats/route.ts              # GET (computed KPIs)
│   ├── reservation/page.tsx    # 31KB – room map + booking form
│   ├── frontdesk/page.tsx      # 31KB – check-in/out + invoice
│   ├── housekeeping/page.tsx   # – quản lý trạng thái phòng
│   ├── pos/page.tsx            # 11KB – POS dịch vụ + nhập kho
│   ├── reports/page.tsx        # 38KB – báo cáo doanh thu, biểu đồ
│   └── admin/page.tsx          # 22KB – quản lý users, config
├── components/
│   ├── layout/AppShell.tsx     # Sidebar (collapsible) + Topbar + mobile overlay
│   └── ui/UIProvider.tsx       # Modal context + Toast context (3.8s auto-dismiss)
├── context/
│   └── HotelContext.tsx        # Single Source of Truth – tất cả state + mutators
├── lib/
│   ├── types.ts                # TypeScript interfaces (xem bảng bên dưới)
│   ├── utils.ts                # fmt, fmtDate, calcNights, TODAY, statusLabel, ...
│   ├── db.ts                   # readDB() / writeDB() / appendLog() / newId
│   └── data.ts                 # Seed data (18 rooms, 9 reservations, 5 services, 8 inventory, 6 users)
└── data/db.json                # ~49KB – runtime database (auto-seeded nếu không tồn tại)
```

---

## 🗂️ Type System (lib/types.ts)

### ⚠️ Lưu ý khác biệt quan trọng
- `Room.type: RoomTypeId` — property là **`type`**
- `Reservation.roomType: RoomTypeId` — property là **`roomType`** (khác nhau!)

### Interface map
```typescript
RoomTypeId = 'SGL' | 'DBL' | 'TWN' | 'DLX' | 'SUT' | 'FAM'
RoomStatus  = 'vacant' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved'
ReservationStatus = 'confirmed' | 'deposit' | 'checkedin' | 'checkedout' | 'pending' | 'cancelled'
ServiceStatus = 'billed' | 'pending'
UserRole = 'admin' | 'frontdesk' | 'housekeeping' | 'accountant' | 'inventory'

Room          { id, floor, type, status, guest: string|null }
Reservation   { id, guestName, phone, roomId: string|null, roomType, checkIn, checkOut,
                adults, children, status, source, note, total }
Service       { id, bookingId, name, qty, unit, price, date, status }
InventoryItem { id, name, category, unit, stock, minStock, cost }
User          { id, name, username, role, status, lastLogin }
ActivityLog   { id, time, date, user, action, type }
```

---

## 🔄 Data Flow

```
User Action (UI)
  → mutator trong useHotel()    (HotelContext.tsx)
    → fetch() gọi API Route     (app/api/...)
      → readDB() → mutate → writeDB()   (lib/db.ts → data/db.json)
        → refresh state (fetchRooms, fetchStats, ...)
```

### Mutators trong `useHotel()`
| Mutator | API call | Refresh sau |
|---|---|---|
| `updateRoomStatus(roomId, status)` | `PATCH /api/rooms/:id` | rooms, stats |
| `addReservation(data)` | `POST /api/reservations` | reservations, rooms, stats |
| `updateReservationStatus(id, status, extra?)` | `PATCH /api/reservations/:id` | reservations, rooms, services, stats |
| `addService(data)` | `POST /api/services` | services, stats |
| `billService(id)` | `PATCH /api/services/:id` | services, stats |
| `addUser(data)` | `POST /api/users` | users |
| `updateUser(id, data)` | `PATCH /api/users/:id` | users |
| `adjustInventory(id, adjustment)` | `PATCH /api/inventory/:id` | inventory |

### Side effects tự động trong API
- `POST /api/reservations`: nếu có `roomId` → tự set room `occupied`/`reserved`
- `PATCH /api/reservations/:id status=checkedin` → room `occupied`, appendLog
- `PATCH /api/reservations/:id status=checkedout` → room `cleaning`, auto-bill tất cả services của booking, appendLog
- `PATCH /api/reservations/:id status=cancelled` → room `vacant`, appendLog

---

## 🧩 UI Primitives (lib/UIProvider.tsx)

```typescript
// Modal
const { openModal, closeModal } = useModal();
openModal(title: string, body: ReactNode, buttons?: ModalButton[])
// buttons: [{ label, cls?, onClick }]

// Toast (auto-dismiss 3.8s)
const { toast } = useToast();
toast(message: string, type?: 'success'|'error'|'warn'|'info')
```

---

## 🛠️ Hằng số & Utilities (lib/utils.ts)

```typescript
TODAY         // YYYY-MM-DD, dùng en-CA locale để tránh lỗi timezone
fmt(n)        // "1.550.000 ₫" (vi-VN currency)
fmtShort(n)   // "1.55tr", "550K"
fmtDate(str)  // YYYY-MM-DD → "dd/MM/yyyy"
calcNights(checkIn, checkOut) // → số đêm (min 1)
statusLabel   // Record<status, tên tiếng Việt>
roomTypeLabel // { SGL:'Single', DBL:'Double', ... }
statusBadgeClass(status) // → CSS class string
calcADR(revenue, nights)
calcRevPAR(revenue, rooms, days)
```

---

## 💾 Persistence Layer (lib/db.ts)

```typescript
readDB(): DB   // đọc data/db.json, auto-seed nếu không có
writeDB(db)    // ghi lại toàn bộ
appendLog(db, user, action, type)  // thêm log, giữ tối đa 200 entries
newId.reservation() // 'BK' + Date.now().slice(-6)
newId.service()     // 'SV' + ...
newId.user()        // 'U'  + ...
newId.log()         // 'L'  + ...
```

**⚠️ Giới hạn**: `fs.readFileSync/writeFileSync` chỉ chạy được trên môi trường có filesystem (local/VPS).  
**Trên Vercel Serverless** → filesystem là read-only → **BẮT BUỘC migrate sang cloud DB**.

---

## 🌐 Kế hoạch Deploy lên Web + Cloud DB

### Vấn đề cốt lõi
Vercel Serverless Functions **không có persistent filesystem**. File `data/db.json` bị reset mỗi cold start. Đã gặp vấn đề này ở conversation `2c3be9d2` (Stabilizing HotelOS Cloud Persistence).

### Giải pháp khuyến nghị: **Vercel KV (Redis)**

#### Tại sao Vercel KV?
- Free tier: 256MB, 30,000 req/tháng
- Zero-config trên Vercel dashboard
- SDK `@vercel/kv` rất đơn giản
- Lưu JSON nguyên dạng → migration nhỏ gọn nhất

#### Migration plan (3 bước)

**Bước 1: Cài đặt & cấu hình**
```bash
npm install @vercel/kv
# Trên Vercel dashboard: Storage → Create KV Database → link project
# Tự động inject: KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN
```

**Bước 2: Thay thế `lib/db.ts`**
```typescript
// lib/db.ts (cloud version)
import { kv } from '@vercel/kv';

const DB_KEY = 'hotelOS:db';

export async function readDB(): Promise<DB> {
  const data = await kv.get<DB>(DB_KEY);
  if (!data) return seedDB();  // first run
  return data;
}

export async function writeDB(db: DB): Promise<void> {
  await kv.set(DB_KEY, db);
}
```
- Đổi tất cả API routes từ sync sang **async** (readDB/writeDB đã là async)
- API routes hiện tại đã dùng `async function` → chỉ cần thêm `await`

**Bước 3: Deploy**
```bash
git add . && git commit -m "feat: migrate to Vercel KV"
vercel --prod
```

### Giải pháp thay thế: **Neon (PostgreSQL serverless)**
- Dùng khi cần quan hệ thực sự, query phức tạp, báo cáo nâng cao
- Prisma đã có trong devDependencies → cần tạo `schema.prisma`
- Phức tạp hơn ~5x so với Vercel KV

### Giải pháp thay thế 2: **Railway + PlanetScale**
- Dùng khi muốn full SQL với MySQL
- Cần config CORS, connection string

---

## ⚠️ Vấn đề đã biết & cách xử lý

| Vấn đề | Nguyên nhân | Fix |
|---|---|---|
| Mất data sau deploy Vercel | `fs` trên Serverless | Migrate sang Vercel KV |
| Race condition khi concurrent writes | Single-file DB | KV atomic ops / Prisma transactions |
| `calcNights` sai trên Safari | Date parsing locale | Đã fix: dùng `en-CA` locale cho TODAY, parse ISO manually |
| `ActivityLog` import thiếu | Quên import type | Luôn import từ `@/lib/types` |
| UI treo khi action chậm | Thiếu loading state | Dùng `useState<boolean>` local trước `await mutator()` |

---

## 📐 Quy tắc code bắt buộc

1. **Data flow**: Mọi mutation đi qua `useHotel()` mutators, không ghi state local trực tiếp.
2. **Date**: Dùng `TODAY` cho comparison. Parse input date với ISO format (`YYYY-MM-DD`).
3. **API response format**: `{ data: T, total?: number }` (GET) hoặc `{ data: T }` (POST/PATCH).
4. **Error response**: `{ error: string }` với HTTP status 4xx.
5. **Room.type vs Reservation.roomType**: Không nhầm lẫn!
6. **'use client'**: Tất cả component dùng hooks đều phải có directive này.
7. **No Tailwind**: Chỉ dùng CSS classes định nghĩa trong `globals.css`.
8. **Next.js App Router params**: `params` là `Promise<{id}>` → phải `await params`.

---

## 📝 Việc cần làm (Backlog)

### P0 – Deploy
- [ ] **Migrate DB sang Vercel KV**: Viết lại `lib/db.ts` dùng `@vercel/kv`
- [ ] **Convert API routes sang async**: Thêm `await` cho `readDB()`/`writeDB()`
- [ ] **Push GitHub → Deploy Vercel**: Setup env vars KV_* trên dashboard
- [ ] **Seed data check**: Đảm bảo KV được seed đúng lần đầu

### P1 – Features
- [ ] **In hóa đơn**: Template HTML/CSS + `window.print()` tại Frontdesk
- [ ] **Báo cáo hoàn chỉnh**: `/reports` – biểu đồ doanh thu theo loại phòng và nguồn khách (dùng SVG native hoặc recharts)
- [ ] **Cấu hình giá theo mùa**: Admin page – Peak/Off-peak pricing per RoomType

### P2 – Improvements
- [ ] **Authentication**: Hiện tại không có login. Thêm NextAuth.js với role-based access.
- [ ] **Pagination**: Bảng reservations/services khi data lớn
- [ ] **Search global**: Topbar search button chưa có functionality
- [ ] **Export CSV/Excel**: Báo cáo doanh thu

---

## 🔑 Seed Data tóm tắt

- **18 phòng**: Floor 1-3, types SGL/DBL/TWN/DLX/SUT/FAM, giá 350K–1.5M/đêm
- **9 đặt phòng**: Mix checkedin/confirmed/deposit/pending/cancelled
- **5 dịch vụ**: Mix billed/pending
- **8 vật tư kho**: linens/amenity/beverage/supplies
- **6 users**: admin, frontdesk(×2), housekeeping, accountant, inventory
- **7 activity logs**: seed data

---

## 🏗️ Kiến trúc Provider tree

```
RootLayout (app/layout.tsx)
  └── HotelProvider        (context/HotelContext.tsx) – data layer
        └── UIProvider     (components/ui/UIProvider.tsx) – modal + toast
              └── AppShell (components/layout/AppShell.tsx) – sidebar + topbar
                    └── {children} – các page routes
```

**Import pattern cho pages:**
```typescript
import { useHotel } from '@/context/HotelContext';
import { useModal } from '@/components/ui/UIProvider';
import { useToast } from '@/components/ui/UIProvider';
import { fmt, fmtDate, calcNights, TODAY } from '@/lib/utils';
import type { Room, Reservation, ... } from '@/lib/types';
```
