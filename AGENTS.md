# HotelOS – Toàn bộ bối cảnh dự án (Agent Context v5)

> Cập nhật lần cuối: 2026-05-23
> Trạng thái: **Production-ready** – Hoàn thành tất cả các Phase (1 đến 4). Đã tích hợp đầy đủ hệ thống Authentication, Notifications, Khách đoàn (Groups), Channel Manager (OTA) và Automation. Sẵn sàng migrate cloud DB.

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
│   ├── layout.tsx              # Root Provider tree setup (Session, Hotel, Notification, UI, AppShell)
│   ├── page.tsx                # Dashboard (stats cards, room grid, logs, charts)
│   ├── globals.css             # ~49KB – toàn bộ CSS Variables + component classes + @media print
│   ├── login/                  # Trang đăng nhập chuyên biệt
│   │   └── page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts # NextAuth Route Handler (Credentials Provider)
│   │   ├── rooms/route.ts      # GET (filter: floor, status, type)
│   │   ├── rooms/[id]/route.ts # PATCH (status)
│   │   ├── room-types/route.ts        # GET
│   │   ├── room-types/[id]/route.ts   # PATCH (basePrice, weekendPrice, peakMultiplier)
│   │   ├── reservations/route.ts       # GET (filter: status,source,q,roomId) | POST
│   │   ├── reservations/[id]/route.ts  # GET | PATCH | DELETE
│   │   ├── services/route.ts           # GET | POST
│   │   ├── services/[id]/route.ts      # PATCH (status:'billed')
│   │   ├── inventory/route.ts          # GET
│   │   ├── inventory/[id]/route.ts     # PATCH (adjustment: number, hỗ trợ cả +/-)
│   │   ├── users/route.ts              # GET | POST (unique username check)
│   │   ├── users/[id]/route.ts         # PATCH
│   │   ├── groups/route.ts             # GET | POST (Khách đoàn)
│   │   ├── groups/[id]/route.ts        # GET | PATCH | DELETE
│   │   ├── channels/route.ts           # GET | POST (OTA/Channel Manager)
│   │   ├── channels/[id]/route.ts      # PATCH
│   │   ├── messages/route.ts           # GET | POST (Nhật ký email/SMS & trigger thủ công)
│   │   ├── logs/route.ts               # GET (readonly)
│   │   └── stats/route.ts              # GET (computed KPIs)
│   ├── reservation/page.tsx    # Sơ đồ phòng visual + form đặt phòng + tính giá tự động
│   ├── frontdesk/page.tsx      # Quản lý Check-in/out, In hóa đơn & Quản lý Khách đoàn (Groups tab)
│   ├── housekeeping/page.tsx   # Quản lý trạng thái phòng nhanh
│   ├── pos/page.tsx            # POS dịch vụ (7 loại) & Nhập/Xuất kho hàng
│   ├── reports/page.tsx        # Báo cáo doanh thu, công suất, lọc Tháng/Quý/Năm linh hoạt
│   └── admin/page.tsx          # QL Users, Channel Manager, SMS/Email Automation, Config giá
├── components/
│   ├── layout/AppShell.tsx     # Sidebar (collapsible) + Topbar (Notif Bell + Ctrl+K Search)
│   └── ui/UIProvider.tsx       # Modal context + Toast context (3.8s auto-dismiss)
├── context/
│   ├── HotelContext.tsx        # Single Source of Truth – tất cả state + mutators
│   └── NotificationContext.tsx # Hệ thống thông báo thời gian thực (check-out, tồn kho, booking)
├── lib/
│   ├── auth.ts                 # NextAuth setup & Credentials verification (SHA-256)
│   ├── auth.config.ts          # Cấu hình NextAuth & Route Authorization
│   ├── messaging.ts            # Mô phỏng MessageQueue & SMS/Email Template Automation
│   ├── types.ts                # TypeScript interfaces (xem chi tiết bên dưới)
│   ├── utils.ts                # fmt, fmtDate, calcNights, TODAY, statusLabel, calcRoomPrice, ...
│   ├── db.ts                   # readDB() / writeDB() / appendLog() / newId
│   └── data.ts                 # Seed data toàn diện (rooms, bookings, channels, message logs)
├── middleware.ts               # Phân quyền Role-based routing protection
└── data/db.json                # ~49KB – runtime database (auto-seeded)
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

RoomType      { id, name, capacity, basePrice, weekendPrice, peakMultiplier }
Room          { id, floor, type, status, guest: string|null }
Reservation   { id, guestName, phone, roomId: string|null, roomType, checkIn, checkOut,
                adults, children, status, source, note, total }
Service       { id, bookingId, name, qty, unit, price, date, status }
InventoryItem { id, name, category, unit, stock, minStock, cost }
User          { id, name, username, role, status, lastLogin, password? }
ActivityLog   { id, time, date, user, action, type }
Guest         { id, name, cccd, passport?, phone, email, nationality, bookings, totalSpent }
HotelStats    { total, occupied, vacant, cleaning, reserved, maintenance, occupancy, todayRevenue, totalServiceRevenue, checkInToday, checkOutToday, lowStockItems }
Group         { id, name, contact, phone, checkIn, checkOut, totalGuests, reservationIds, status, note }
Channel       { id, name, enabled, commission, rateModifier, allocatedRooms, lastSync }
MessageLog    { id, bookingId, guestName, phone, email, type, status, channel, content, sentAt }
AppNotification { id, title, message, type, time, read }
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
| `updateRoomType(id, data)` | `PATCH /api/room-types/:id` | roomTypes |
| `addGroup(data)` | `POST /api/groups` | groups, reservations, rooms, stats |
| `updateGroupStatus(id, status)` | `PATCH /api/groups/:id` | groups, reservations, rooms, services, stats |
| `deleteGroup(id)` | `DELETE /api/groups/:id` | groups, reservations, rooms, stats |
| `updateChannel(id, data)` | `PATCH /api/channels/:id` | channels |
| `sendManualMessage(bookingId, type, customTemplate?)` | `POST /api/messages` | messages |
| `addActivityLog(user, action, type)` | `POST /api/logs` | activityLog |

### Side effects tự động trong API
- `POST /api/reservations`: nếu có `roomId` → tự set room `occupied`/`reserved`
- `PATCH /api/reservations/:id status=checkedin` → room `occupied`, appendLog
- `PATCH /api/reservations/:id status=checkedout` → room `cleaning`, auto-bill tất cả services của booking, appendLog
- `PATCH /api/reservations/:id status=cancelled` → room `vacant`, appendLog
- **Check-in/out Khách đoàn (Groups)**: Khi thực hiện thao tác check-in/out trên đoàn khách, trạng thái của tất cả reservations và rooms thuộc đoàn được tự động cập nhật đồng bộ.
- **SMS/Email Automation**: Khi các thao tác Đặt phòng, Check-in, Check-out hoàn tất, hệ thống tự động sinh và gửi tin nhắn tương ứng vào hàng đợi tin nhắn (`lib/messaging.ts`) và lưu lịch sử `MessageLog`.

---

## 🧩 UI Primitives (components/ui/UIProvider.tsx)

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
calcRoomPrice(checkIn, checkOut, roomType) // → tính giá phòng động (cuối tuần, mùa cao điểm)
statusLabel   // Record<status, tên tiếng Việt>
roomTypeLabel // { SGL:'Single', DBL:'Double', ... }
sourceLabel   // { direct:'Trực tiếp', booking:'Booking.com', ... }
statusBadgeClass(status) // → CSS class string
occColor(pct) // → CSS color string cho occupancy
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

## ✅ Tính năng đã hoàn thành (Completed Features)

### Phase 1 & 2: Core System (Hoàn thành)
- **Dashboard** (`/`): Stats cards, room grid status, activity log feed, revenue chart SVG
- **Reservation** (`/reservation`): Sơ đồ phòng visual, đặt phòng form với tính giá tự động (basePrice/weekendPrice/peakMultiplier), chọn phòng trống, source selector
- **Frontdesk** (`/frontdesk`): Check-in modal (CCCD, cọc, gán phòng), Check-out & thanh toán, Walk-in booking, bảng khách đang ở
- **Housekeeping** (`/housekeeping`): Grid phòng theo trạng thái, đổi trạng thái phòng nhanh
- **POS** (`/pos`): Tab dịch vụ (7 loại: Minibar/Giặt ủi/Nhà hàng/Spa/Tour/Sân bay/Thuê xe) + Tab kho hàng
- **Admin** (`/admin`): Quản lý users (thêm/sửa/khóa), cấu hình giá phòng theo loại, nhật ký hoạt động hệ thống

### Phase 3A: Admin Log Filter (Hoàn thành)
- Tìm kiếm nhật ký hoạt động (`logSearch`)
- Lọc theo loại hành động (`logType`) và khoảng thời gian (`logPeriod`)
- File: `app/admin/page.tsx`

### Phase 3B: Topbar Global Search – Command Palette (Hoàn thành)
- Kích hoạt qua icon Search trên Topbar hoặc phím tắt `Ctrl+K` / `Cmd+K`
- Tìm kiếm real-time: Phòng (theo ID), Đặt phòng (theo tên khách, ID, SĐT)
- Giao diện solid-surface (không bị text bleed), có `kbd` shortcut hints
- Hover animation: `translateX(4px)` cho từng kết quả
- File: `components/layout/AppShell.tsx`

### Phase 3C: Reports Period Filter + Dynamic Date (Hoàn thành)
- Bộ lọc thời gian `Tháng` / `Quý` / `Năm` trên trang Báo cáo
- Dữ liệu scale tự động: `periodMultiplier` (1x / 2.8x / 11.5x), `periodDays` (31 / 90 / 365)
- **Tất cả nhãn (labels)** trên các thẻ KPI tự động đổi tên theo bộ lọc (Ví dụ: "Doanh thu Tháng 5" → "Doanh thu Quý 2" → "Doanh thu Năm 2026")
- **Thời gian động**: Parse tháng/năm từ `TODAY` của hệ thống, không dùng mốc tĩnh. Quý được tính toán tự động: `Math.floor((curMonth - 1) / 3) + 1`
- Export CSV doanh thu hoạt động
- File: `app/reports/page.tsx`

### Phase 3D: POS Export/Import Kho (Hoàn thành)
- **Nhập kho**: Form modal riêng cho từng mặt hàng (`openImport`) + form chung (`openGeneralImport`)
- **Xuất kho**: Form modal riêng (`openExport`) + form chung (`openGeneralExport`)
- Xuất kho gọi `adjustInventory(id, -qty)` (truyền số âm để trừ tồn)
- Validation: Chặn xuất kho nếu số lượng > tồn kho hiện tại, hiển thị Toast cảnh báo
- **Thời gian động**: Ngày nhập/xuất hiển thị `fmtDate(TODAY)`, placeholder ghi chú gợi ý đúng tháng hiện hành
- Mỗi dòng hàng hóa có 2 nút: "Nhập" + "Xuất" song song
- File: `app/pos/page.tsx`

### Phase 3E: Print Invoice – In hóa đơn (Hoàn thành)
- Nút "🖨️ In hóa đơn" tại màn hình Tiền sảnh (tab Đang ở + tab Check-out)
- Modal hóa đơn hiển thị: header (🏨 HOTEL OS), ngày/giờ in thực tế (`fmtDate(TODAY) + toLocaleTimeString`), thông tin khách, itemized tiền phòng + dịch vụ, tổng cộng
- CSS `@media print` trong `globals.css`: ẩn Sidebar/Topbar/Tabs/nút bấm, hiển thị Modal nội dung trên nền trắng full-page
- Các class CSS in ấn đã được sửa đúng: `.modal-overlay` (thay vì `.modal-container`), `.modal-box` (thay vì `.modal-content`)
- File: `app/frontdesk/page.tsx`, `app/globals.css`

### Phase 4: Advanced Features (Hoàn thành)
- **4A. Notification System**: Hệ thống thông báo real-time qua `NotificationContext`, hiển thị icon chuông Topbar (đặt phòng mới, check-in, check-out đến hạn, hàng sắp hết tồn, cập nhật công việc buồng phòng). Có badge đếm số, dropdown panel, lưu trữ trạng thái đọc qua localStorage.
- **4B. Authentication**: Tích hợp NextAuth.js phân quyền theo Role (`admin`, `frontdesk`, `housekeeping`, `accountant`, `inventory`). Trang đăng nhập chuyên biệt, Middleware bảo vệ các routes.
- **4C. Khách đoàn (Groups)**: Giao diện quản lý khách đoàn, tự động phân phòng trống, thao tác check-in/out cho cả đoàn, tính năng gộp hóa đơn toàn bộ booking trong đoàn.
- **4D. Channel Manager (OTA)**: Giao diện quản lý các kênh (Booking, Agoda, Expedia, Airbnb, Direct), cấu hình Rate Parity, đồng bộ inventory.
- **4E. Email/SMS Automation**: Hệ thống MessageQueue mô phỏng, tự động trigger gửi email/SMS xác nhận khi Đặt phòng, Check-in, và Check-out. Hiển thị log tin nhắn tại trang Admin.

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
| Nhãn báo cáo hardcode "T3" | Không parse TODAY | Đã fix: parse `curMonth`/`curYear` từ `TODAY`, nhãn đổi tự động |
| CSS Print sai selector | `.modal-container` không tồn tại | Đã fix: dùng `.modal-overlay` + `.modal-box` |
| Placeholder kho "tháng 3" cứng | Không dùng curMonth | Đã fix: template literal `tháng ${curMonth}` |

---

## 📐 Quy tắc code bắt buộc

1. **Data flow**: Mọi mutation đi qua `useHotel()` mutators, không ghi state local trực tiếp.
2. **Date**: Dùng `TODAY` cho comparison. Parse input date với ISO format (`YYYY-MM-DD`). Mọi nhãn ngày tháng trên UI phải được parse **động** từ `TODAY`, tuyệt đối không hardcode tháng/năm.
3. **API response format**: `{ data: T, total?: number }` (GET) hoặc `{ data: T }` (POST/PATCH).
4. **Error response**: `{ error: string }` với HTTP status 4xx.
5. **Room.type vs Reservation.roomType**: Không nhầm lẫn!
6. **'use client'**: Tất cả component dùng hooks đều phải có directive này.
7. **No Tailwind**: Chỉ dùng CSS classes định nghĩa trong `globals.css`.
8. **Next.js App Router params**: `params` là `Promise<{id}>` → phải `await params`.
9. **UI/UX đồng nhất**: Mọi form/modal phải hiển thị ngày thực tế (`fmtDate(TODAY)`), placeholder gợi ý tháng hiện tại.
10. **Xuất kho**: Dùng `adjustInventory(id, -qty)` (số âm), luôn validate `qty <= stock` trước khi gọi API.

---

## 📝 Việc cần làm (Backlog)

### P0 – Deploy
- [ ] **Migrate DB sang Vercel KV**: Viết lại `lib/db.ts` dùng `@vercel/kv`
- [ ] **Convert API routes sang async**: Thêm `await` cho `readDB()`/`writeDB()`
- [ ] **Push GitHub → Deploy Vercel**: Setup env vars KV_* trên dashboard
- [ ] **Seed data check**: Đảm bảo KV được seed đúng lần đầu

### P1 – Cải tiến UI/UX & Nâng cấp (Tương lai)
- [ ] **Pagination**: Bảng reservations/services/logs khi data lớn
- [ ] **Cấu hình giá theo mùa nâng cao**: Admin page – UI chỉnh Peak/Off-peak pricing trực tiếp (API đã có, UI cần cải thiện)

### P2 – Báo cáo & Tối ưu hóa
- [ ] **Báo cáo nâng cao**: Thêm biểu đồ tương tác (recharts hoặc SVG), so sánh liên kỳ, drill-down theo loại phòng
- [ ] **Export PDF/Excel**: Xuất file báo cáo doanh thu chuyên nghiệp (hiện chỉ có CSV cơ bản)
- [ ] **Lịch sử xuất nhập kho**: Hiện chỉ điều chỉnh stock trực tiếp, chưa ghi log xuất nhập riêng
- [ ] **Đa ngôn ngữ (i18n)**: Hỗ trợ EN/VI toggle

### P3 – Polish
- [ ] **Framer Motion animations**: Đã import nhưng chưa dùng – thêm page transition, card hover animations
- [ ] **Dark mode toggle**: CSS Variables đã sẵn sàng (chỉ cần thêm `:root[data-theme="dark"]`)
- [ ] **Mobile responsive**: Đã có `@media` breakpoints cơ bản, cần polish cho tablet/phone

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
  └── SessionProvider      (next-auth/react) – auth layer
        └── HotelProvider        (context/HotelContext.tsx) – data layer
              └── NotificationProvider (context/NotificationContext.tsx) – notification layer
                    └── UIProvider     (components/ui/UIProvider.tsx) – modal + toast
                          └── AppShell (components/layout/AppShell.tsx) – sidebar + topbar + search
                                └── {children} – các page routes
```

**Import pattern cho pages:**
```typescript
import { useHotel } from '@/context/HotelContext';
import { useModal } from '@/components/ui/UIProvider';
import { useToast } from '@/components/ui/UIProvider';
import { useNotification } from '@/context/NotificationContext';
import { fmt, fmtDate, fmtShort, calcNights, TODAY, calcRoomPrice } from '@/lib/utils';
import type { Room, Reservation, RoomType, Group, Channel, MessageLog } from '@/lib/types';
```

---

## 📑 Lịch sử phiên làm việc liên quan

| Conversation ID | Chủ đề | Nội dung chính |
|---|---|---|
| `2c3be9d2` | Stabilizing HotelOS Cloud Persistence | Migrate sang Vercel KV, gặp issue filesystem read-only |
| `4f1d3c61` | Phase 3 Development & Testing | Phase 3A→3E: Admin Log Filter, Global Search, Reports Period Filter, POS Export/Import, Print Invoice |
