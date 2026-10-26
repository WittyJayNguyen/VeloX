# Quy Chuẩn Hệ Thống Đa Ngôn Ngữ (Multilingual Architecture - i18n)

Hệ thống **VeloX** bắt buộc hỗ trợ đầy đủ 5 ngôn ngữ chính trên cả hai giao diện: **Trang Khách Hàng (Home/Portal)** và **Trang Quản Trị (Admin Dashboard)**.

---

## 1. Danh Sách Mã Ngôn Ngữ Tiêu Chuẩn (ISO 639-1)

| Ngôn Ngữ | Mã Code (Locale) | Hướng Đọc | Cờ Biểu Tượng | Mục Tiêu Thị Trường |
| :--- | :---: | :---: | :---: | :--- |
| **Tiếng Việt** | `vi` (Mặc định) | LTR | 🇻🇳 | Thị trường nội địa Việt Nam |
| **Tiếng Anh** | `en` | LTR | 🇺🇸 / 🇬🇧 | Khách hàng quốc tế, nhà phát triển |
| **Tiếng Nhật** | `ja` | LTR | 🇯🇵 | Khách hàng Nhật Bản |
| **Tiếng Hàn** | `ko` | LTR | 🇰🇷 | Khách hàng Hàn Quốc |
| **Tiếng Trung (Giản Thể)** | `zh` | LTR | 🇨🇳 | Khách hàng Trung Quốc |

---

## 2. Chiến Lược Tổ Chức Tệp Dịch (Namespaced Translation Files)

Để tránh tình trạng tệp ngôn ngữ phình to và khó quản lý, hệ thống chia nhỏ từ điển dịch theo từng module chức năng:

```
locales/
  ├── vi/
  │    ├── common.json        # Nút bấm, thông báo, phân trang dùng chung
  │    ├── auth.json          # Đăng nhập, đăng ký, xác thực
  │    ├── home.json          # Trang chủ giới thiệu, hero, tính năng
  │    ├── dashboard.json     # Thống kê, biểu đồ, KPI
  │    ├── services.json      # Quản lý Pool, Key, Token, Model
  │    ├── billing.json       # Nạp credits, bảng giá, lịch sử
  │    └── logs.json          # Nhật ký gọi API, hình ảnh, video
  ├── en/
  ├── ja/
  ├── ko/
  └── zh/
```

---

## 3. Cơ Chế Hoạt Động Kỹ Thuật (i18next trên Frontend)

1. **Phát Hiện Ngôn Ngữ Tự Động:** Ưu tiên theo `localStorage.getItem('velox_lang')` -> Cookie -> Ngôn ngữ trình duyệt (`navigator.language`).
2. **Lazy Loading:** Chỉ tải tệp ngôn ngữ của trang hiện tại thay vì tải toàn bộ từ điển lúc mở web.
3. **Chuyển Đổi Tức Thì (Instant Switching):** Người dùng bấm nút chọn cờ/ngôn ngữ trên Header, toàn bộ nội dung chuyển đổi mượt mà mà không cần tải lại trang (No page reload).
