# Kế hoạch Kiểm thử Phase 4E – Email/SMS Automation (Auth Check Manifest)

> Ngày tạo: **2026-05-21**  
> Trạng thái: **Sẵn sàng để kiểm thử**  
> Tính năng: **Email/SMS Automation (Tự động hóa tin nhắn)**

Kế hoạch này dùng để xác thực hệ thống tự động gửi tin nhắn xác nhận đặt phòng, cảm ơn sau check-out và bảng giả lập gửi tin nhắn thử nghiệm tại trang quản trị Admin.

---

## 📋 Kịch bản 1: Tự động gửi tin nhắn xác nhận khi tạo Đặt phòng mới

### 1. Các bước thực hiện
1. Đi tới trang **Đặt phòng** (`/reservation`).
2. Chọn một phòng trống bất kỳ (ví dụ: Phòng 101 - Loại Single).
3. Nhập thông tin khách hàng giả định:
   - **Tên khách hàng**: `Kiểm Thử Tự Động`
   - **Số điện thoại**: `0999888777`
   - **Nguồn đặt**: `Trực tiếp`
4. Chọn khoảng ngày check-in/check-out bất kỳ.
5. Nhấn **Đặt phòng ngay** để lưu.

### 2. Kết quả mong đợi
- Đặt phòng được tạo thành công. Xuất hiện thông báo Toast thành công.
- Vào trang **Quản trị** (`/admin`), chọn tab **Tin nhắn Automation**.
- **Kết quả cực kỳ quan trọng**: Trong bảng **Nhật ký Tin nhắn**, xuất hiện dòng tin nhắn mới nhất loại `Xác nhận đặt phòng` gửi cho khách hàng `Kiểm Thử Tự Động` với trạng thái `Đã gửi thành công`.
- Bấm nút **Xem (biểu tượng con mắt)** để đọc chi tiết nội dung. Nội dung phải được biên dịch đúng: `Kính chào quý khách Kiểm Thử Tự Động, HotelOS xác nhận đặt phòng BK... thành công...`

---

## 📋 Kịch bản 2: Tự động gửi tin nhắn cảm ơn khi Check-out phòng

### 1. Các bước thực hiện
1. Đi tới trang **Tiền sảnh** (`/frontdesk`).
2. Chọn tab **Khách đang ở**.
3. Tìm một đặt phòng đang ở (ví dụ: phòng 102 - Nguyễn Văn A hoặc bất kỳ phòng occupied nào).
4. Nhấn nút **Thanh toán & Check-out**.
5. Trong modal xuất hiện, nhấn **Xác nhận Thanh toán & Check-out**.

### 2. Kết quả mong đợi
- Phòng chuyển sang trạng thái `Buồng phòng` (cleaning).
- Vào trang **Quản trị** (`/admin`), chọn tab **Tin nhắn Automation**.
- **Kết quả mong đợi**: Dòng tin nhắn mới nhất loại `Cảm ơn check-out` được thêm vào bảng nhật ký cho khách hàng vừa check-out với trạng thái `Đã gửi thành công`. Kênh gửi hiển thị `EMAIL`.

---

## 📋 Kịch bản 3: Giả lập gửi tin nhắn thủ công qua Test Panel

### 1. Các bước thực hiện
1. Vào trang **Quản trị** (`/admin`) → Tab **Tin nhắn Automation**.
2. Tại bảng **Giả lập gửi tin nhắn (Test Panel)** ở phía bên phải:
   - **Bước 1**: Chọn một Đặt phòng bất kỳ trong dropdown list.
   - **Bước 2**: Chọn loại tin nhắn `Nhắc nhở check-in (Email)` hoặc `Email Khuyến mãi quà tặng (Email)`.
   - **Bước 3**: Giữ nguyên hoặc sửa đổi nội dung mẫu tin nhắn tùy thích trong khung textarea (ví dụ chèn chữ: `ƯU ĐÃI LỚN NHẤT THÁNG`).
3. Nhấp nút **Gửi thử tin nhắn ngay**.

### 2. Kết quả mong đợi
- Toast hiển thị: `Đã giả lập gửi tin nhắn automation thành công!`.
- Bảng **Nhật ký Tin nhắn** lập tức cập nhật thêm dòng tin nhắn mới ở trên cùng với đúng loại đã chọn, đúng nội dung tùy biến và trạng thái `Đã gửi thành công`.

---

## 📋 Kịch bản 4: Kiểm tra Lịch sử thao tác & Nhật ký hệ thống

### 1. Các bước thực hiện
1. Vào trang **Quản trị** (`/admin`).
2. Chọn tab **Lịch sử thao tác**.

### 2. Kết quả mong đợi
- Xuất hiện các dòng log ghi nhận hành động tự động gửi tin nhắn từ hệ thống:
  - `"Tự động gửi tin nhắn Xác nhận đặt phòng cho khách hàng Kiểm Thử Tự Động"`
  - `"Tự động gửi tin nhắn Cảm ơn check-out cho khách hàng ..."`
  - Các log này có phân loại `system` (màu xám nhạt thanh lịch).
