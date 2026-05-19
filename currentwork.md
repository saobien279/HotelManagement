# HotelOS – Phase 4: Advanced Features – Kế hoạch triển khai

> Ngày lập: 2026-05-19  
> Trạng thái: **Planning** – Chờ duyệt trước khi code

---

## 📋 Tổng quan Phase 4

Phase 4 tập trung vào **5 tính năng nâng cao** giúp HotelOS chuyển từ hệ thống demo sang sản phẩm thực tế:

| # | Feature | Complexity | Ước tính | Phụ thuộc |
|---|---------|-----------|----------|-----------|
| 4A | **Notification System** | Medium | ~2h | Không |
| 4B | **Authentication (NextAuth.js)** | High | ~4h | Không |
| 4C | **Khách đoàn (Groups)** | Medium | ~3h | 4B (optional) |
| 4D | **Channel Manager Integration** | High | ~3h | 4B |
| 4E | **Email/SMS Automation** | High | ~2h | 4B, 4C |

> **Khuyến nghị thứ tự triển khai:** 4A → 4B → 4C → 4D → 4E  
> Lý do: 4A độc lập và nhanh nhất. 4B là nền tảng cho phân quyền. 4C-4E phụ thuộc 4B.

---

## 🔔 Phase 4A: Notification System (Real-time Bell Icon)

### Mục tiêu
Thêm hệ thống thông báo real-time với icon chuông trên Topbar, hiển thị danh sách các sự kiện quan trọng.

### Kiến trúc

```
ActivityLog (đã có) → NotificationContext (mới) → Bell Icon dropdown
                                                    ├── Check-in mới
                                                    ├── Đặt phòng mới
                                                    ├── Hàng sắp hết tồn
                                                    └── Check-out đến hạn
```

### Các file cần tạo/sửa

#### [NEW] `context/NotificationContext.tsx`
- State: `notifications: Notification[]`, `unreadCount: number`
- Tự động sinh notification từ `activityLog` changes (polling mỗi 15s hoặc so sánh snapshot)
- Interface mới:
```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'checkin' | 'booking' | 'inventory' | 'checkout' | 'system';
  time: string;
  read: boolean;
}
```

#### [MODIFY] `components/layout/AppShell.tsx`
- Thêm Bell icon cạnh Search icon trên Topbar (vị trí: sau ngày giờ, trước avatar)
- Badge đỏ hiển thị `unreadCount` khi > 0
- Click mở dropdown panel (giống Command Palette nhưng cho notifications)
- Mỗi notification item có: icon theo type, tiêu đề, thời gian, nút "Đánh dấu đã đọc"
- Nút "Đánh dấu tất cả đã đọc" ở footer dropdown

#### [MODIFY] `app/layout.tsx`
- Wrap thêm `NotificationProvider` vào Provider tree (sau `HotelProvider`, trước `UIProvider`)

#### [MODIFY] `app/globals.css`
- Thêm styles: `.notification-dropdown`, `.notification-item`, `.notification-badge`, `.notification-dot`

### Nguồn dữ liệu Notification (auto-generate)
| Sự kiện | Trigger | Message mẫu |
|---------|---------|--------------|
| Đặt phòng mới | `addReservation()` thành công | "Đặt phòng mới: Nguyễn Văn A - P.201" |
| Check-in | `updateReservationStatus(_, 'checkedin')` | "Check-in: Trần Thị B - Phòng 102" |
| Check-out đến hạn | `TODAY >= reservation.checkOut` | "Nhắc nhở: P.301 cần check-out hôm nay" |
| Hàng sắp hết | `inventory.stock <= inventory.minStock` | "⚠️ Khăn tắm còn 5 cái (tối thiểu: 20)" |

### Lưu ý UI/UX
- Dropdown phải dùng solid background (`var(--bg-surface)`) giống Command Palette
- Animation: slideDown khi mở, fadeOut khi đóng
- Nhấn bên ngoài → đóng dropdown (giống modal overlay)

---

## 🔐 Phase 4B: Authentication (NextAuth.js)

### Mục tiêu
Thêm hệ thống đăng nhập/đăng xuất với phân quyền theo role (`UserRole`).

### Kiến trúc

```
Login Page (/) 
  → NextAuth Credentials Provider 
    → Check username/password trong DB (users collection)
      → Session JWT chứa { id, name, role }
        → Middleware kiểm tra role trên mỗi route
```

### Cài đặt
```bash
npm install next-auth@beta
```
> Dùng NextAuth v5 (beta) cho Next.js App Router compatibility.

### Các file cần tạo/sửa

#### [NEW] `app/api/auth/[...nextauth]/route.ts`
- CredentialsProvider: nhận `username` + `password`
- So sánh với `db.users` (hiện chưa có trường password → cần thêm)
- Trả về session: `{ id, name, role, username }`

#### [NEW] `lib/auth.ts`
- `authOptions` config cho NextAuth
- `getServerSession()` helper cho API routes
- Hàm hash password đơn giản (bcrypt hoặc crypto.subtle)

#### [NEW] `app/login/page.tsx`
- Form login: username + password
- UI premium: centered card, gradient background, logo HOTEL OS
- Hiển thị lỗi nếu sai thông tin
- Redirect → Dashboard sau khi đăng nhập thành công

#### [NEW] `middleware.ts` (root)
- Kiểm tra session trên mọi route (trừ `/login`, `/api/auth`)
- Redirect → `/login` nếu chưa đăng nhập
- Kiểm tra role-based access:

| Route | Roles được phép |
|-------|----------------|
| `/admin` | `admin` |
| `/reports` | `admin`, `accountant` |
| `/pos` | `admin`, `frontdesk`, `inventory` |
| `/housekeeping` | `admin`, `housekeeping` |
| `/frontdesk`, `/reservation` | `admin`, `frontdesk` |
| `/` (Dashboard) | Tất cả |

#### [MODIFY] `lib/types.ts`
- Thêm field `password: string` vào interface `User`

#### [MODIFY] `lib/data.ts`
- Thêm `password` cho seed users (hash sẵn)

#### [MODIFY] `components/layout/AppShell.tsx`
- Hiển thị tên user + role từ session (thay vì hardcode "Admin")
- Thêm nút "Đăng xuất" vào menu dropdown góc dưới Sidebar
- Ẩn sidebar items theo role (ví dụ: Housekeeping chỉ thấy Dashboard + Buồng phòng)

#### [MODIFY] `context/HotelContext.tsx`
- Gắn `user` từ session vào context để các page biết ai đang đăng nhập
- `appendLog()` tự động dùng tên user thực thay vì hardcode

### Lưu ý quan trọng
- Seed data cần có 6 users với password mặc định (ví dụ: `hotel123`)
- Session expiry: 24h (configurable)
- Trang `/login` KHÔNG dùng AppShell (layout riêng, không có Sidebar)

---

## 👥 Phase 4C: Khách đoàn (Groups)

### Mục tiêu
Biến tab "Khách đoàn" tại Frontdesk từ placeholder thành tính năng thực sự hoạt động.

### Kiến trúc Data

#### [MODIFY] `lib/types.ts` – Thêm interface mới
```typescript
interface Group {
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
```

#### [MODIFY] `lib/db.ts` – DB schema
- Thêm `groups: Group[]` vào interface `DB`

#### [NEW] `app/api/groups/route.ts`
- `GET`: Lấy danh sách groups (filter: status)
- `POST`: Tạo group mới + tự động tạo N reservations cho N phòng

#### [NEW] `app/api/groups/[id]/route.ts`
- `PATCH`: Cập nhật status (check-in cả đoàn, check-out cả đoàn)
- `DELETE`: Hủy đoàn

#### [MODIFY] `context/HotelContext.tsx`
- Thêm state `groups`, fetcher `fetchGroups()`
- Thêm mutators: `addGroup()`, `updateGroupStatus()`, `deleteGroup()`

#### [MODIFY] `app/frontdesk/page.tsx` – Tab "Khách đoàn"
- Thay placeholder bằng UI thực:
  - Form tạo đoàn mới: Tên đoàn, liên hệ, SĐT, ngày CI/CO, số phòng, loại phòng
  - Tự động phân phòng trống theo loại
  - Danh sách đoàn hiện tại (card layout)
  - Nút "Check-in cả đoàn" → gọi `updateGroupStatus(id, 'checkedin')` → loop update từng reservation
  - Nút "Gộp hóa đơn" → modal tổng hợp tiền phòng + dịch vụ của tất cả phòng trong đoàn
  - Nút "Check-out cả đoàn" → tương tự check-in

### Lưu ý
- Khi tạo đoàn, hệ thống tự động tạo N `Reservation` liên kết qua `reservationIds`
- Check-in/out cả đoàn = loop gọi `updateReservationStatus()` cho từng reservation
- Gộp hóa đơn = sum tất cả `reservation.total` + `services` của mọi booking trong đoàn

---

## 🌐 Phase 4D: Channel Manager Integration (OTA Simulation)

### Mục tiêu
Tích hợp giao diện quản lý kênh phân phối (OTA) tại trang Admin.

### Thực tế & Giới hạn
> ⚠️ API thực từ Booking.com / Agoda yêu cầu **hợp đồng đối tác** và **API keys riêng**.  
> Trong phạm vi dự án này, chúng ta sẽ tạo **Channel Manager Simulation** – mô phỏng flow thực tế.

### Kiến trúc

```
Admin → Tab "Kênh phân phối"
  ├── Bảng kênh: Booking.com, Agoda, Expedia, Airbnb, Direct
  ├── Toggle bật/tắt kênh
  ├── Cấu hình Rate Parity (giá đồng bộ / giá riêng)
  ├── Inventory sync: Số phòng tung ra mỗi kênh
  └── Biểu đồ nguồn khách (đã có sẵn data từ Reports)
```

### Các file cần tạo/sửa

#### [MODIFY] `lib/types.ts`
```typescript
interface Channel {
  id: string;           // 'booking' | 'agoda' | 'expedia' | 'airbnb' | 'direct'
  name: string;
  enabled: boolean;
  commission: number;   // % hoa hồng (VD: Booking = 15%)
  rateModifier: number; // Hệ số giá (1.0 = giá gốc, 1.15 = +15%)
  allocatedRooms: number; // Số phòng phân bổ
  lastSync: string;     // ISO date
}
```

#### [MODIFY] `lib/db.ts` – Thêm `channels: Channel[]` vào DB

#### [NEW] `app/api/channels/route.ts` – GET | POST

#### [NEW] `app/api/channels/[id]/route.ts` – PATCH (toggle, config)

#### [MODIFY] `app/admin/page.tsx`
- Thêm tab "Kênh phân phối" (`activeTab === 'channel'`)
- UI: Grid cards cho mỗi OTA (logo, tên, trạng thái, hoa hồng, nút toggle)
- Modal cấu hình chi tiết từng kênh

---

## 📧 Phase 4E: Email/SMS Automation

### Mục tiêu
Tự động gửi xác nhận qua email/SMS khi có sự kiện quan trọng.

### Thực tế & Giới hạn
> ⚠️ Gửi email/SMS thực cần **SMTP server** hoặc dịch vụ bên thứ 3 (SendGrid, Twilio).  
> Trong phạm vi demo, chúng ta sẽ tạo **Email/SMS Queue Simulation** – log lại thông điệp đã "gửi" vào bảng + toast thông báo.

### Kiến trúc

```
Sự kiện (Check-in/Booking/Checkout)
  → Auto-trigger template
    → Render nội dung (tên khách, phòng, ngày, giá)
      → Push vào MessageQueue (hiển thị trên Admin)
        → Toast: "📧 Đã gửi xác nhận cho Nguyễn Văn A"
```

### Template messages

| Sự kiện | Kênh | Nội dung mẫu |
|---------|------|-------------|
| Đặt phòng | Email | "Xin chào {name}, đặt phòng {roomType} từ {checkIn} đến {checkOut} đã được xác nhận. Mã: {bookingId}" |
| Check-in | SMS | "Chào mừng {name} đến HOTEL OS! Phòng {roomId}, WiFi: HotelOS_Guest" |
| Check-out | Email | "Cảm ơn {name}! Tổng thanh toán: {total}. Hẹn gặp lại!" |
| Nhắc check-out | SMS | "Nhắc nhở: Check-out phòng {roomId} vào {checkOut}. Xin cảm ơn!" |

### Các file cần tạo/sửa

#### [MODIFY] `lib/types.ts`
```typescript
interface MessageLog {
  id: string;
  type: 'email' | 'sms';
  to: string;           // email hoặc SĐT
  subject: string;
  body: string;
  status: 'sent' | 'failed' | 'queued';
  createdAt: string;
  relatedBookingId: string;
}
```

#### [MODIFY] `lib/db.ts` – Thêm `messages: MessageLog[]`

#### [NEW] `lib/messaging.ts`
- `sendConfirmationEmail(reservation)` → push vào DB + toast
- `sendCheckInSMS(reservation)` → push vào DB + toast
- `sendCheckOutEmail(reservation, total)` → push vào DB + toast

#### [MODIFY] `app/api/reservations/[id]/route.ts`
- Sau khi PATCH status → tự động trigger message tương ứng

#### [MODIFY] `app/admin/page.tsx`
- Thêm tab "Tin nhắn" hiển thị bảng `MessageLog` với filter status
- Badge count tin nhắn lỗi (status === 'failed')

---

## 🔧 Quy tắc chung cho Phase 4

1. **Ngày tháng**: Tất cả nhãn, placeholder phải parse **động** từ `TODAY` – tuyệt đối không hardcode.
2. **UI/UX đồng nhất**: Mọi modal/form mới phải theo chuẩn Glassmorphism hiện tại, dùng CSS classes từ `globals.css`.
3. **Toast & Loading**: Mọi action async phải có Toast feedback và loading state.
4. **Data flow**: Mọi mutation qua `useHotel()` mutators → API → DB → refresh.
5. **TypeScript strict**: Không dùng `any`, định nghĩa interface đầy đủ cho mọi entity mới.

---

## ✅ Checklist tổng hợp

### Phase 4A: Notification System
- [ ] Tạo `NotificationContext.tsx`
- [ ] Tích hợp Bell icon + dropdown vào `AppShell.tsx`
- [ ] Auto-generate notifications từ events
- [ ] CSS styles cho notification dropdown
- [ ] Viết file kiểm thử `phase4a_bug_check_manifest.md`

### Phase 4B: Authentication
- [ ] Cài `next-auth@beta`
- [ ] Tạo `lib/auth.ts` + `app/api/auth/[...nextauth]/route.ts`
- [ ] Tạo `app/login/page.tsx` (UI premium)
- [ ] Tạo `middleware.ts` (role-based routing)
- [ ] Thêm `password` vào User type + seed data
- [ ] Cập nhật `AppShell.tsx` (user info + logout + sidebar filter)
- [ ] Viết file kiểm thử `phase4b_bug_check_manifest.md`

### Phase 4C: Khách đoàn
- [ ] Thêm `Group` interface + DB schema
- [ ] Tạo API routes `groups/` và `groups/[id]/`
- [ ] Thêm mutators vào `HotelContext.tsx`
- [ ] Thay thế placeholder UI tại `frontdesk/page.tsx`
- [ ] Viết file kiểm thử `phase4c_bug_check_manifest.md`

### Phase 4D: Channel Manager
- [ ] Thêm `Channel` interface + DB schema + seed data
- [ ] Tạo API routes `channels/` và `channels/[id]/`
- [ ] Tạo UI tab "Kênh phân phối" tại `admin/page.tsx`
- [ ] Viết file kiểm thử `phase4d_bug_check_manifest.md`

### Phase 4E: Email/SMS Automation
- [ ] Thêm `MessageLog` interface + DB schema
- [ ] Tạo `lib/messaging.ts` (template engine)
- [ ] Hook vào API reservation PATCH
- [ ] Tạo UI tab "Tin nhắn" tại `admin/page.tsx`
- [ ] Viết file kiểm thử `phase4e_bug_check_manifest.md`
