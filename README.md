# HCMUT Smart Parking System

Dự án này là một hệ thống quản lý bãi đỗ xe thông minh bao gồm 3 phân hệ chính (Views) được gộp lại từ 3 project riêng biệt.

## 🚀 Cấu trúc dự án

Hệ thống được chia thành 3 giao diện chính:
- **Member View** (Giao diện người dùng): Mặc định tại `/`
- **Admin View** (Giao diện quản trị): Truy cập tại `/admin`
- **Operator View** (Giao diện nhân viên vận hành): Truy cập tại `/operator`

## 🔗 Truy cập các phân hệ (Quick Links)

Khi ứng dụng đang chạy, bạn có thể truy cập nhanh vào các giao diện qua các đường dẫn sau:

- 👤 **Member View:** [http://localhost:3000/](http://localhost:3000/)
- ⚙️ **Admin View:** [http://localhost:3000/admin](http://localhost:3000/admin)
- 🛠️ **Operator View:** [http://localhost:3000/operator](http://localhost:3000/operator)

Mọi mã nguồn nằm trong thư mục `src/views/`.

## 🛠 Yêu cầu hệ thống

Trước khi bắt đầu, đảm bảo bạn đã cài đặt:
- **Node.js** (Phiên bản 18 trở lên)
- **npm** (Đi kèm với Node.js)

## 📦 Hướng dẫn cài đặt

1. **Clone project và di chuyển vào thư mục dự án:**
   ```bash
   cd hcmut-smart-parking
   ```

2. **Cài đặt các thư viện cần thiết:**
   ```bash
   npm install
   ```

## 💻 Chạy ứng dụng ở môi trường Local

Để chạy ứng dụng ở chế độ phát triển (development):

```bash
npm run dev
```

Sau khi chạy lệnh trên, ứng dụng sẽ khả dụng tại: [http://localhost:3000](http://localhost:3000)

## 🏗 Build để triển khai (Production)

Để tạo bản build tối ưu cho việc deploy:

```bash
npm run build
```

Kết quả sẽ nằm trong thư mục `dist/`.

## 📁 Tổ chức thư mục chính

- `src/views/`: Chứa mã nguồn của 3 phân hệ (Member, Admin, Operator).
- `src/assets/`: Nơi lưu trữ logo, hình ảnh dùng chung.
- `src/shared/`: (Sắp tới) Chứa các components/utils dùng chung cho cả 3 views.
- `src/App.tsx`: File cấu hình routing chính cho toàn bộ ứng dụng.

## 🗄️ Database & Phân quyền (Supabase)

Dự án sử dụng **Supabase** để quản lý xác thực (Authentication) và phân quyền (Authorization).

### 👥 Các vai trò người dùng (Roles)

Hệ thống phân quyền dựa trên Email domain `@hcmut.edu.vn` và Metadata:

| Vai trò | Email Domain | Truy cập View |
| :--- | :--- | :--- |
| **Student** | `@hcmut.edu.vn` | Member View |
| **Graduate** | `@hcmut.edu.vn` | Member View |
| **Doctoral** | `@hcmut.edu.vn` | Member View |
| **Faculty** | `@hcmut.edu.vn` | Member View |
| **Staff** | `@hcmut.edu.vn` | Member View |
| **Visitor** | Tự do | Member View (Hạn chế) |
| **Parking Operator** | `@hcmut.edu.vn` | Operator View |
| **System Admin** | `@hcmut.edu.vn` | Admin View |

### 🚀 Thiết lập Database

1. Truy cập [Supabase Console](https://app.supabase.com/).
2. Tạo project mới.
3. Mở **SQL Editor** và chạy nội dung file [supabase_setup.sql](./supabase_setup.sql).
4. Cấu hình biến môi trường:
   - Copy file `.env.example` thành `.env`.
   - Lấy `URL` và `Anon Key` từ **Project Settings -> API** trên Supabase dán vào file `.env`.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-role-key
```

5. File `src/shared/supabase.ts` đã được thiết lập sẵn để kết nối. Bạn có thể import và sử dụng ngay:

```typescript
import { supabase } from '../shared/supabase';
```

### 🧪 Tài khoản dùng thử (Mock Data)

Dưới đây là danh sách các tài khoản gợi ý để bạn tạo trong Supabase Auth và test các View:

| Đối tượng | Email gợi ý | Mật khẩu | Phân quyền (Role) | View sẽ thấy |
| :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên** | `admin@hcmut.edu.vn` | `12345678` | `admin` | Admin View |
| **Nhân viên** | `operator@hcmut.edu.vn` | `12345678` | `operator` | Operator View |
| **Sinh viên** | `sinhvien@hcmut.edu.vn` | `12345678` | `student` | Member View |
| **Giảng viên** | `giangvien@hcmut.edu.vn` | `12345678` | `faculty` | Member View |
| **Cán bộ** | `canbo@hcmut.edu.vn` | `12345678` | `staff` | Member View |
| **Khách** | `guest@gmail.com` | `12345678` | `visitor` | Member View |

*Lưu ý: Sau khi tạo user trên Supabase, hãy chạy các câu lệnh trong file [mock_data.sql](./mock_data.sql) để cập nhật Role chính xác.*

---
© 2024 HCMUT Smart Parking Team


