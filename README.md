# 📚 Captain In One Heart - Hệ Thống Quản Lý & Bán Sách Toàn Diện

![Admin Dashboard Preview](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-NodeJS%20%7C%20Express%20%7C%20MongoDB%20%7C%20ChartJS-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)

**Captain In One Heart** là một nền tảng thương mại điện tử chuyên biệt cho sách, được thiết kế với giao diện hiện đại, trải nghiệm người dùng mượt mà và một hệ thống quản trị (Admin Dashboard) mạnh mẽ, chuyên nghiệp.

---

## 🚀 Tính Năng Nổi Bật

### 👔 Quản Trị Hệ Thống (Admin Dashboard)
*   **Thống Kê Trực Quan**: Tích hợp **Chart.js** hiển thị doanh thu theo thời gian thực, tỉ trọng đơn hàng và tăng trưởng khách hàng.
*   **Quản Lý Sản Phẩm (CRUD)**: Quản lý kho sách khổng lồ với đầy đủ thông tin Tác giả, Nhà xuất bản, Thể loại và Tồn kho.
*   **Hệ Thống Đơn Hàng Thông Minh**: Xử lý trạng thái đơn hàng (Chờ xử lý, Đang giao, Đã giao, Hủy), in hóa đơn chuyên nghiệp.
*   **Quản Lý Khách Hàng & Nhân Viên**: Phân quyền chi tiết (Admin, Staff, Customer), hỗ trợ chặn/mở khóa tài khoản linh hoạt.
*   **Công Cụ Khuyến Mãi Linh Hoạt**: 
    *   Tạo Mã Voucher hoặc Giảm giá trực tiếp (Direct).
    *   Áp dụng theo danh sách Sản phẩm, Tác giả, NXB hoặc **Hạng Thành Viên**.

### 👤 Trải Nghiệm Khách Hàng
*   **Hạng Thành Viên (Membership)**: Tự động phân hạng (Đồng, Bạc, Vàng, Kim Cương) dựa trên chi tiêu thực tế.
*   **Tìm Kiếm Toàn Cầu**: Bộ lọc tìm kiếm thông minh giúp khách hàng tìm sách yêu thích trong chớp mắt.
*   **Giỏ Hàng & Thanh Toán**: Đồng bộ hóa giỏ hàng đa thiết bị, hỗ trợ nhiều địa chỉ giao hàng và phương thức thanh toán.

---

## 🛠 Công Nghệ Sử Dụng

| Tầng | Công nghệ |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Vanilla), JavaScript (ES6+), FontAwesome 6 |
| **Backend** | Node.js, Express Framework |
| **Database** | MongoDB & Mongoose ODM |
| **Visualization** | Chart.js (Dashboard Analytics) |
| **Security** | Bcrypt (Mã hóa mật khẩu), Phân quyền Role-based |

---

## 💻 Hướng Dẫn Cài Đặt

### 1. Yêu Cầu Hệ Thống
*   Đã cài đặt [Node.js](https://nodejs.org/) (Phiên bản >= 14)
*   Đã cài đặt [MongoDB](https://www.mongodb.com/) (Chạy local trên cổng 27017 hoặc dùng Atlas)

### 2. Triển Khai Project
```bash
# Clone project về máy
git clone https://github.com/diggory1102/Website-Selling-Books-Caption-in-the-Heart.git

# Di chuyển vào thư mục backend
cd backend

# Cài đặt các thư viện phụ thuộc
npm install
```

### 3. Tạo Dữ Liệu Mẫu (Seeding)
Hệ thống cung cấp sẵn file `seed.js` để bạn có ngay dữ liệu mẫu (Sách, Tài khoản, Đơn hàng) để trải nghiệm:
```bash
node seed.js
```

### 4. Khởi Chạy
```bash
# Chạy server backend (Cổng mặc định: 5000)
npm start
```

---

## 🔑 Tài Khoản Truy Cập Mẫu

| Vai trò | Email / Tài khoản | Mật khẩu |
| :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@gmail.com` | `admin123` |
| **Nhân viên (Staff)** | `staff@gmail.com` | `staff123` |
| **Khách hàng (Customer)** | `khachhang_01` | `customer123` |

---

## 📁 Cấu Trúc Thư Mục Chính
*   `/frontend`: Chứa toàn bộ giao diện người dùng và Admin Dashboard.
*   `/backend/src/models`: Định nghĩa các Schema Database (MongoDB).
*   `/backend/src/controllers`: Xử lý Logic nghiệp vụ của hệ thống.
*   `/backend/src/routes`: Các đường dẫn API hệ thống.

---

## 📄 Giấy Phép
Dự án được phát hành dưới giấy phép **MIT**. Vui lòng liên hệ tác giả nếu bạn có bất kỳ câu hỏi nào về bản quyền và sử dụng thương mại.

---
*Phát triển bởi đội ngũ đam mê sách tại Captain In One Heart ❤️*