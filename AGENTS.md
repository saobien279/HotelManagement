<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# HotelOS – Toàn bộ bối cảnh dự án

Hệ thống quản lý khách sạn hiện đại được xây dựng trên nền tảng Next.js (Turbopack), tập trung vào hiệu năng và giao diện Glassmorphism.

## 🚀 Công nghệ sử dụng
- **Frontend**: Next.js 15+, React 19 (Client Components), TypeScript.
- **Styling**: Vanilla CSS (CSS Variables, Flexbox, Grid). Không dùng Tailwind.
- **State**: React Context API (`HotelContext.tsx`) đóng vai trò là "Single Source of Truth".
- **Backend**: API Route Handlers đọc/ghi trực tiếp vào file `db.json` (đóng vai trò database giả lập).

## 📁 Cấu trúc quan trọng
- `/context/HotelContext.tsx`: Quản lý toàn bộ state động (rooms, reservations, inventory, logs). Các hàm mutator (`updateRoomStatus`, `billService`, ...) đều là async và thực hiện gọi API trước khi làm tươi (refresh) state.
- `/lib/utils.ts`: Chứa hằng số `TODAY` (chuẩn hóa `YYYY-MM-DD`) và các hàm format tiền tệ, tính số đêm (`calcNights`).
- `/lib/types.ts`: Định nghĩa Interface. **Cực kỳ quan trọng**: Đối tượng `Room` dùng thuộc tính `type`, trong khi `Reservation` dùng `roomType`.
- `/app/api/`: Các endpoint chính:
  - `/api/rooms`: Quản lý trạng thái phòng.
  - `/api/reservations`: Luồng đặt phòng, check-in/out.
  - `/api/services`: POS (Minibar, Spa, Tour...).
  - `/api/inventory`: Quản lý kho vật tư.
  - `/api/logs`: Nhật ký thao tác hệ thống.

## 🛠️ Trạng thái vận hành hiện tại
Hệ thống đã hoàn tất giai đoạn sửa lỗi vận hành cốt lõi (Vòng 2):
1.  **Luồng Check-in/out**: 
    - Đã hỗ trợ gán phòng động khi Check-in.
    - Check-out tập trung tại Tiền sảnh để tính tổng hóa đơn (Tiền phòng + Tiền dịch vụ).
2.  **POS & Kho**: 
    - Nút "Tính tiền" dịch vụ đã hoạt động (cập nhật trạng thái `billed`).
    - Chức năng nhập kho đã cập nhật số lượng tồn thực tế qua `adjustInventory`.
3.  **Xử lý Ngày tháng**: 
    - Đã chuẩn hóa định dạng quốc tế để tránh lỗi tính toán sai số đêm trên các trình duyệt khác nhau.
4.  **Type Safety & UI**:
    - Đã sửa các lỗi import thiếu `ActivityLog`.
    - Thêm trạng thái `loading` cho các nút bấm Admin để tránh treo UI.

## ⚠️ Lưu ý cho Agent sau
- **Data Flow**: Mọi thao tác thay đổi dữ liệu phải gọi mutator trong `useHotel()`. Tránh ghi đè state cục bộ mà không qua API.
- **Date format**: Luôn sử dụng `TODAY` cho các so sánh. Khi tạo ngày mới từ input, hãy đảm bảo parse đúng chuẩn ISO.
- **Component UI**: 
  - `openModal(title, content, actions)`: Để mở các form.
  - `toast(message, type)`: Để thông báo thành công/lỗi.
- **Performance**: Ứng dụng dùng Turbopack, nên ưu tiên giữ file nhỏ gọn và tách biệt logic.

## 📝 Việc cần làm tiếp theo (Pending)
- [ ] **In hóa đơn**: Xây dựng template hóa đơn HTML/CSS và tích hợp lệnh `window.print()`.
- [ ] **Báo cáo**: Hoàn thiện trang `/reports` với biểu đồ doanh thu theo loại phòng và nguồn khách.
- [ ] **Cấu hình giá**: Thêm giao diện quản lý giá theo mùa (Peak season/Off-peak) trong Admin.
