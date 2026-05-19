# HotelOS – Phase 4A: Kiểm thử Notification System

Bản hướng dẫn kiểm thử (Bug Check Manifest) cho tính năng Notification System (Phase 4A) nhằm đảm bảo hệ thống thông báo hoạt động chính xác, real-time và không gây rò rỉ bộ nhớ (memory leak).

---

## 1. Kiểm tra Giao diện (UI)

- [ ] **Hiển thị Bell Icon**: Icon chuông hiển thị ở góc phải Topbar.
- [ ] **Badge Số lượng**: Khi có thông báo chưa đọc, huy hiệu (badge) màu đỏ với số lượng chính xác xuất hiện trên icon chuông. Nếu trên 9, hiển thị "9+".
- [ ] **Dropdown Panel**: Nhấp vào icon chuông để mở Dropdown. Dropdown có kích thước chuẩn, nền solid, có đổ bóng (shadow) và hiển thị list thông báo có thanh cuộn mượt mà.
- [ ] **Style Từng Loại**: Các loại thông báo (Check-in, Check-out, Inventory, Booking) có icon và màu sắc riêng biệt để dễ nhận dạng.
- [ ] **Trạng thái Đọc/Chưa đọc**: Thông báo chưa đọc có nền nổi bật (màu xanh nhạt). Thông báo đã đọc có nền trắng bình thường.

## 2. Kiểm tra Logic Dữ liệu (State & Context)

- [ ] **Check-out hôm nay**: Chuyển đến màn hình Đặt phòng, tạo một đơn đặt phòng có ngày đi (Check-out) là `Hôm nay` (cùng ngày với `TODAY`). Kiểm tra chuông có hiện nhắc nhở Check-out không.
- [ ] **Hàng sắp hết (Low Inventory)**: Chuyển đến phần Dịch vụ & Kho, thay đổi số tồn của một mặt hàng xuống dưới mức `Tối thiểu` (Min Stock). Kiểm tra xem có sinh ra thông báo cảnh báo hết tồn kho không.
- [ ] **Log Hoạt động (Activity Log)**: Thực hiện Check-in một phòng (tại Tiền sảnh). Hệ thống sinh log, thông báo "Check-in mới" lập tức được cập nhật trên chuông (Real-time).
- [ ] **Đánh dấu Đã đọc (Mark as Read)**: 
  - Click vào một thông báo cụ thể -> thông báo đó mất màu nền (chuyển sang đã đọc), số lượng trên badge giảm đi 1.
  - Click vào nút "Đánh dấu đã đọc tất cả" -> toàn bộ thông báo mất màu nền, badge số lượng biến mất.
- [ ] **Lưu trữ (Persistence)**: Đánh dấu vài thông báo là đã đọc. Tải lại trang (F5). Kiểm tra xem trạng thái "đã đọc" có được giữ nguyên không (Nhờ cơ chế lưu vào `localStorage`).

## 3. Kiểm tra Tính toàn vẹn (Edge Cases)

- [ ] **Không có thông báo**: Khi tất cả thông báo trống (hoặc khi mới bắt đầu triển khai), dropdown hiển thị dòng chữ "Không có thông báo nào" một cách thân thiện, không bị lỗi UI.
- [ ] **Hiệu suất Render**: Đảm bảo mở/đóng chuông nhiều lần không gây giật lag (re-render toàn bộ ứng dụng). Context Notification chỉ re-render những thành phần liên quan.
- [ ] **Close khi click ra ngoài**: (Mở rộng tùy chọn) Kiểm tra xem khi mở Dropdown chuông, nếu bấm vào màn hình chính nó có nên đóng lại không (Hiện tại Dropdown toggle qua state, có thể cần test việc nó có che các component quan trọng bên dưới không).
- [ ] **Responsiveness**: Trên màn hình Mobile (chiều rộng nhỏ), dropdown không bị tràn ra khỏi lề màn hình.

---
> **Lưu ý cho Developer**: Nếu tất cả các mục trên đều PASS ✅, tính năng Phase 4A sẵn sàng để push lên Production!
