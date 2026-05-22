# HotelOS – Kế hoạch kiểm thử Phase 4D: Channel Manager Integration

> Trạng thái: **Ready for Verification**  
> Phiên bản: **1.0 (Simulation-verified)**  
> Ngày tạo: 2026-05-21  

Tài liệu này hướng dẫn chi tiết quy trình kiểm thử thủ công và tự động cho tính năng **Channel Manager Integration (OTA Simulation)** thuộc Phase 4D của hệ thống **HotelOS**.

---

## 📋 1. Các mục tiêu cần kiểm thử (Test Objectives)

1. **Kết nối & Trạng thái hoạt động (Connection & Toggle status)**:
   - Kênh phân phối được hiển thị chính xác trạng thái tắt/bật.
   - Bật kết nối kênh phân phối sẽ tự động mở modal cấu hình chi tiết.
   - Tắt kết nối kênh phân phối sẽ chuyển trạng thái hiển thị sang vô hiệu hóa tương ứng.
2. **Cấu hình tham số kênh (Channel Configuration)**:
   - Thay đổi các thông số: Tỷ lệ hoa hồng (Commission), Hệ số nhân giá (Rate Modifier), và Số phòng phân bổ (Allocated Rooms) thành công.
   - Dữ liệu cấu hình mới được phản ánh ngay lập tức trên giao diện.
3. **Mô phỏng Đồng bộ (Synchronization Simulation)**:
   - Click nút "Đồng bộ ngay" hiển thị trạng thái chờ (loading) và cập nhật trường `lastSync` thành mốc thời gian thực hiện mới nhất.
4. **Nhật ký Hệ thống (Activity Logs Integration)**:
   - Bất kỳ thao tác bật/tắt hoặc cập nhật cấu hình kênh phân phối nào đều phải được ghi nhận vào Lịch sử hoạt động của Admin.

---

## 🛠️ 2. Quy trình kiểm thử từng bước (Step-by-Step Test cases)

### Kịch bản 1: Bật kết nối & Cấu hình kênh phân phối mới (Agoda / Expedia)

- **Bước 1**: Đăng nhập bằng tài khoản `admin` / `hotel123`.
- **Bước 2**: Truy cập menu **Quản trị** từ Sidebar → chọn tab **Channel Manager**.
- **Bước 3**: Tìm kênh phân phối đang tắt (ví dụ: `Expedia`).
- **Bước 4**: Nhấn nút **Bật kết nối**.
- **Bước 5**: Kiểm tra xem modal cấu hình có hiển thị chính xác không.
- **Bước 6**: Thay đổi:
  - Tỷ lệ hoa hồng: `18%`
  - Hệ số giá: `1.20`
  - Số phòng phân bổ: `4`
- **Bước 7**: Nhấn **Lưu cấu hình**.
- **Kết quả mong đợi**: Kênh `Expedia` đổi trạng thái thành "Đang bật", hiển thị đúng các thông số đã cài đặt và hiện thời gian đồng bộ cuối cùng là thời điểm hiện tại. Xuất hiện toast `"Đã cập nhật cấu hình kênh Expedia!"`.

### Kịch bản 2: Đồng bộ hóa kênh phân phối thủ công

- **Bước 1**: Tại tab **Channel Manager**, chọn một kênh đang hoạt động (ví dụ: `Booking.com`).
- **Bước 2**: Nhấn nút **Đồng bộ ngay** (icon Refresh).
- **Bước 3**: Quan sát phản hồi UI.
- **Kết quả mong đợi**: Xuất hiện toast `"Đang đồng bộ Booking.com..."`. Sau 1 giây, xuất hiện tiếp toast `"Đã đồng bộ thành công kênh Booking.com!"` và thời gian đồng bộ cuối cùng chuyển thành giờ hiện tại.

### Kịch bản 3: Tắt kết nối kênh phân phối

- **Bước 1**: Chọn một kênh đang bật (ví dụ: `Airbnb`).
- **Bước 2**: Nhấn nút **Tắt kênh** (màu đỏ).
- **Kết quả mong đợi**: Kênh chuyển sang trạng thái "Đang tắt" ngay lập tức. Xuất hiện toast `"Đã ngắt kết nối kênh Airbnb"`. Các thông số chuyển sang trạng thái vô hiệu hóa.

### Kịch bản 4: Kiểm tra Lịch sử thao tác (Activity Logs)

- **Bước 1**: Chuyển sang tab **Lịch sử thao tác** ngay trên trang Admin.
- **Bước 2**: Lọc loại hành động theo **Cấu hình** hoặc tìm từ khóa tên kênh phân phối (ví dụ: `Booking.com`, `Expedia`).
- **Kết quả mong đợi**: Xuất hiện các dòng log ghi nhận chính xác hành động:
  - `"Bật kênh phân phối Expedia"`
  - `"Tắt kênh phân phối Airbnb"`
  - `"Cập nhật cấu hình kênh Booking.com"`

---

## 📈 3. Xác thực Dữ liệu (Database Integrity Check)

Các thao tác qua API đều được lưu trực tiếp vào Redis DB / `db.json` thông qua các API endpoint:
* `GET /api/channels`: Trả về danh sách channels gồm 5 kênh (`booking`, `agoda`, `expedia`, `airbnb`, `direct`).
* `PATCH /api/channels/[id]`: Gửi body chứa cấu hình thay đổi để cập nhật DB.

Bạn có thể mở Tab Console của Chrome F12 hoặc kiểm tra nhật ký trong tệp DB để đảm bảo trường dữ liệu lưu chính xác 100%.
