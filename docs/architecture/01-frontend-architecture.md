# Kiến Trúc Front-End ReactJS Chuẩn Hóa Theo Module

Kiến trúc Front-End của **VeloX** được thiết kế dựa trên mô hình **Feature-Based Modular Architecture** (Kiến trúc phân rã theo tính năng nghiệp vụ), tuân thủ 100% sơ đồ tổ chức thư mục quy chuẩn, đảm bảo tính tái sử dụng cao, không trùng lặp và sẵn sàng mở rộng quy mô lớn.

---

## 1. Sơ Đồ Cấu Trúc Thư Mục Chuẩn (`src/`)

```
src/
├── components/                  # Các thành phần giao diện dùng chung toàn dự án
│   ├── common/                  # Atomic & Molecule UI (Tái sử dụng độc lập)
│   │   ├── Button/              # Component Button chuẩn
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.scss
│   │   │   └── index.ts
│   │   ├── Modal/               # Hộp thoại Modal
│   │   ├── Table/               # Bảng dữ liệu chuẩn (Pagination, Sorting)
│   │   ├── Card/                # Thẻ thống kê KPI
│   │   └── Input/               # Form controls
│   └── layouts/                 # Khung sườn giao diện
│       ├── MainLayout/          # Layout cho khách vãng lai & User (Header, Nav, Footer)
│       ├── AdminLayout/         # Layout trang quản trị (Sidebar, Topbar, Metric Bar)
│       └── AuthLayout/          # Layout trang đăng nhập, đăng ký
│
├── features/                    # TẬP HỢP CÁC MODULE NGHIỆP VỤ RIÊNG BIỆT
│   ├── dashboard/               # Module Dashboard & Thống kê
│   │   ├── components/          # UI riêng: StatCards, SalesChart, ConsumptionList
│   │   ├── hooks/               # useDashboardMetrics.ts
│   │   ├── services/            # dashboardService.ts
│   │   └── types/               # dashboard.ts
│   ├── services-pool/           # Module Quản Lý Dịch Vụ, Pool, API Key & Token
│   │   ├── components/          # PoolTable, KeyModal, ModelMappingGrid
│   │   ├── hooks/               # usePools.ts, useCredentials.ts
│   │   ├── services/            # poolService.ts, credentialService.ts
│   │   └── types/               # pool.ts, credential.ts, model.ts
│   ├── billing/                 # Module Gói Nạp & Biên Lợi Nhuận
│   │   ├── components/          # PackageList, ProfitMarginCalculator
│   │   ├── hooks/               # useBilling.ts, usePricing.ts
│   │   ├── services/            # billingService.ts
│   │   └── types/               # billing.ts
│   ├── logs/                    # Module Lịch Sử & Kiểm Toán
│   │   ├── components/          # ApiLogTable, MediaGenerationGallery
│   │   ├── hooks/               # useApiLogs.ts
│   │   ├── services/            # logService.ts
│   │   └── types/               # log.ts
│   └── users/                   # Module Quản Lý Tài Khoản & RBAC
│       ├── components/          # UserTable, RoleAssignmentModal
│       ├── hooks/               # useUsers.ts
│       ├── services/            # userService.ts
│       └── types/               # user.ts
│
├── hooks/                       # Custom Hooks dùng chung toàn hệ thống
│   ├── useAuth.ts               # Quản lý trạng thái phiên đăng nhập & vai trò
│   ├── useDebounce.ts           # Tối ưu hóa tìm kiếm & gọi API
│   ├── useI18n.ts               # Hỗ trợ chuyển đổi 5 ngôn ngữ
│   └── index.ts
│
├── routes/                      # Hệ thống định tuyến & Bảo vệ quyền truy cập
│   ├── AppRoutes.tsx            # Bảng điều phối URL toàn bộ ứng dụng
│   ├── ProtectedRoute.tsx       # Bắt buộc đăng nhập
│   ├── AdminRoute.tsx           # CHẶN USER THƯỜNG - Chỉ cho phép Admin cấp sẵn
│   └── index.ts
│
├── services/                    # Cấu hình mạng & Xử lý lỗi tập trung
│   ├── apiClient.ts             # Axios instance gắn Bearer Token & Interceptor
│   └── errorHandler.ts          # Xử lý mã lỗi chuẩn (401, 403, 429, 500)
│
├── store/                       # Quản lý trạng thái toàn cục (Redux Toolkit / Zustand)
│   ├── slices/
│   │   ├── authSlice.ts         # User info, token, role, permissions
│   │   ├── poolSlice.ts         # Danh sách pool đang chọn
│   │   └── uiSlice.ts           # Sidebar collapse, theme, current language
│   ├── hooks.ts
│   └── store.ts
│
├── utils/                       # Hàm tiện ích & Hằng số
│   ├── constants.ts             # API endpoints, default languages, roles
│   ├── formatters.ts            # Định dạng tiền tệ, ngày tháng, token count
│   └── helpers.ts               # Các logic xử lý chuỗi và dữ liệu
│
├── styles/                      # Hệ thống Styling toàn cục (SASS/SCSS)
│   ├── variables.scss           # Bảng màu, typography, breakpoints, shadow
│   ├── global.scss              # Reset CSS, baseline styles
│   └── mixins.scss              # Media query, flex/grid shortcuts, animations
│
├── assets/                      # Tài nguyên tĩnh
│   ├── images/                  # Logo, banner, minh hoạ
│   ├── icons/                   # SVG icons (AI models, arrows, flags)
│   └── fonts/                   # Webfonts
│
├── pages/                       # Các View chính (kết nối Layout + Feature Components)
│   ├── HomePage.tsx             # Trang chủ giới thiệu, tra cứu & demo
│   ├── UserPortalPage.tsx       # Trang người dùng thường: xem số dư, lịch sử nạp
│   ├── LoginPage.tsx            # Đăng nhập
│   ├── RegisterPage.tsx         # Đăng ký (mặc định chỉ cấp ROLE_USER)
│   └── admin/
│       ├── DashboardPage.tsx    # Báo cáo thống kê
│       ├── ServicePoolPage.tsx  # Quản lý Pool & Key
│       ├── BillingManagePage.tsx# Quản lý gói cước & Định giá
│       └── AuditLogsPage.tsx    # Quản lý Logs
│
├── locales/                     # Từ điển đa ngôn ngữ (vi, en, ja, ko, zh)
├── App.tsx
├── main.tsx
└── index.html
```

---

## 2. Quy Tắc Bất Biến Về Kiến Trúc

1. **Tính Tự Chứa Của Module (Self-Contained Module):**
   Mỗi thư mục trong `features/<tên_tính_năng>/` chứa đầy đủ 4 thành phần nội tại: `components/`, `hooks/`, `services/`, `types/`. Không được nhập (import) các component nội bộ của feature A sang feature B; nếu một thành phần cần dùng chéo, bắt buộc phải đưa lên `components/common/` hoặc `components/shared/`.
2. **Không Viết Mã Dài Lan Man (Concise & Focused):**
   - Mỗi file component tối đa không vượt quá 150 - 200 dòng.
   - Tách biệt hoàn toàn phần UI và phần Logic bằng cách đưa trạng thái gọi API vào Custom Hook (`useXxx.ts`).
3. **Kiểm Soát Quyền Truy Cập (Route Guards):**
   - Người dùng mới đăng ký qua `RegisterPage` được gắn cố định role `USER`.
   - Khi cố gắng truy cập `/admin/*`, `AdminRoute` sẽ chặn lại và đẩy về `/workspace` (hoặc `/`).
