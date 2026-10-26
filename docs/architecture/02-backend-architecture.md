# Kiến Trúc Back-End Python Chuẩn Hóa Theo Module

Hệ thống Back-End của **VeloX** được xây dựng trên nền tảng **FastAPI (Python 3.11+)** kết hợp cơ chế lập trình bất đồng bộ (**Async I/O**) và kiến trúc phân lớp hướng module (**Modular Layered Architecture**), tối ưu hóa hiệu năng làm việc với lượng lớn request đồng thời (High-Concurrency AI Proxy).

---

## 1. Cấu Trúc Mã Nguồn Dự Án (`backend/`)

```
backend/
├── app/
│   ├── core/                          # Tầng lõi dùng chung (Core Infrastructure)
│   │   ├── config.py                  # Đọc biến môi trường (.env) bằng Pydantic Settings
│   │   ├── database.py                # Quản lý Session SQLAlchemy 2.0 Async (PostgreSQL)
│   │   ├── redis.py                   # Kết nối Redis phục vụ Rate-limit & Xoay Pool Key
│   │   ├── security.py                # Mã hóa mật khẩu (Argon2/Bcrypt) & Cấp JWT Tokens
│   │   ├── exceptions.py              # Bộ lọc ngoại lệ chuẩn hóa (HTTP Error Handlers)
│   │   └── middleware.py              # CORS, Audit Logging, i18n Language Detector
│   │
│   ├── common/                        # Thư viện tái sử dụng (Shared Utilities)
│   │   ├── base_model.py              # Lớp cơ sở SQLAlchemy: id (UUID), created_at, updated_at
│   │   ├── pagination.py              # Chuẩn hóa phân trang: {page, size, total, items}
│   │   └── responses.py               # Định dạng JSON trả về chuẩn: {success, data, message, code}
│   │
│   ├── modules/                       # CÁC MODULE NGHIỆP VỤ ĐỘC LẬP (DOMAIN MODULES)
│   │   │
│   │   ├── auth/                      # Quản lý Xác thực & Đăng ký
│   │   │   ├── models.py              # (Liên kết User)
│   │   │   ├── schemas.py             # LoginRequest, RegisterRequest, TokenResponse
│   │   │   ├── services.py            # Logic đăng nhập, xác minh vai trò (Admin vs User)
│   │   │   └── router.py              # Endpoints: /api/v1/auth/login, /register, /me
│   │   │
│   │   ├── users/                     # Quản lý Người Dùng & Phân Quyền (RBAC)
│   │   │   ├── models.py              # User, Role, UserRole
│   │   │   ├── schemas.py             # UserRead, UserUpdate, RoleUpdate
│   │   │   ├── services.py            # Thêm, sửa, khoá tài khoản, cấp quyền Admin
│   │   │   └── router.py              # Endpoints: /api/v1/users/
│   │   │
│   │   ├── pools/                     # Quản lý Pool, API Key & Token Account
│   │   │   ├── models.py              # ServicePool, ProviderCredential, PoolHealthCheck
│   │   │   ├── schemas.py             # PoolCreate, CredentialCreate, PoolMetrics
│   │   │   ├── services.py            # Quản lý pool, kiểm tra số dư, cảnh báo cạn kiệt
│   │   │   ├── rotator.py             # Thuật toán xoay vòng key (Round-Robin/Least-Used)
│   │   │   └── router.py              # Endpoints: /api/v1/pools/, /credentials/
│   │   │
│   │   ├── models_catalog/            # Quản lý Danh mục Model & Tự Động Nhận Diện
│   │   │   ├── models.py              # AIModel, ModelProviderMapping
│   │   │   ├── schemas.py             # ModelRead, ModelPricingConfig
│   │   │   ├── scanner.py             # Tự động scan model từ API Key NCC
│   │   │   └── router.py              # Endpoints: /api/v1/models/
│   │   │
│   │   ├── billing/                   # Quản lý Gói Nạp, Credits & Biên Lợi Nhuận
│   │   │   ├── models.py              # CreditPackage, UserBalance, PaymentTransaction
│   │   │   ├── schemas.py             # PackageCreate, CheckoutIntent, MarginCalculation
│   │   │   ├── services.py            # Cộng/trừ credits, tính toán giá bán theo biên lợi nhuận
│   │   │   └── router.py              # Endpoints: /api/v1/billing/
│   │   │
│   │   ├── proxy/                     # BỘ ĐỊNH TUYẾN AI TRUNG GIAN (AI GATEWAY ENGINE)
│   │   │   ├── engine.py              # Reverse Proxy xử lý streaming response (SSE)
│   │   │   ├── cost_tracker.py        # Đếm tokens, tính tiền & khấu trừ credits tức thì
│   │   │   └── router.py              # Chuẩn hoá OpenAI: /v1/chat/completions, /v1/images
│   │   │
│   │   ├── logs/                      # Kiểm Toán & Nhật Ký Gọi API
│   │   │   ├── models.py              # ApiCallLog, MediaGenerationLog
│   │   │   ├── schemas.py             # LogFilter, LogDetail
│   │   │   ├── services.py            # Lưu log bất đồng bộ (Background Tasks / Celery)
│   │   │   └── router.py              # Endpoints: /api/v1/logs/
│   │   │
│   │   └── analytics/                 # Thống Kê & Báo Cáo Dashboard
│   │       ├── schemas.py             # DashboardMetrics, RevenueChartData
│   │       ├── services.py            # Truy vấn tổng hợp doanh thu, lượt dùng theo model
│   │       └── router.py              # Endpoints: /api/v1/analytics/dashboard
│   │
│   ├── database/                      # Quản lý Migrations & Dữ liệu mẫu
│   │   ├── migrations/                # Tệp kịch bản sinh bởi Alembic
│   │   └── seeders.py                 # Khởi tạo sẵn tài khoản Admin, vai trò, mẫu cước
│   │
│   └── main.py                        # Điểm khởi chạy ứng dụng (FastAPI App Factory)
├── pyproject.toml
├── alembic.ini
└── Dockerfile
```

---

## 2. Luồng Xử Lý Của AI Proxy Engine (Request Pipeline)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Khách Hàng / User
    participant Gateway as VeloX Proxy Router
    participant Billing as Billing & Credits Service
    participant PoolMgr as Pool Key Rotator
    participant Provider as Nhà Cung Cấp AI (OpenAI/Midjourney)
    participant Logger as Async Audit Logger

    Client->>Gateway: POST /v1/chat/completions (kèm Token/API Key)
    Gateway->>Billing: Kiểm tra số dư Credits của User
    alt Không đủ credits
        Billing-->>Client: 402 Payment Required ("Số dư credits không đủ")
    else Đủ credits
        Gateway->>PoolMgr: Yêu cầu lấy Key/Token tốt nhất cho model này
        PoolMgr-->>Gateway: Trả về Credential (API Key hoặc Session Token)
        Gateway->>Provider: Chuyển tiếp request đến NCC (Streaming)
        Provider-->>Gateway: Trả dữ liệu luồng (Server-Sent Events)
        Gateway-->>Client: Stream dữ liệu ngay lập tức tới người dùng
        Note over Gateway,Logger: Khi kết thúc stream (Done)
        Gateway->>Billing: Khấu trừ số Credits tương ứng Tokens tiêu thụ
        Gateway->)Logger: Ghi nhật ký vào PostgreSQL (Background Task)
    end
```

---

## 3. Quy Tắc Code Tối Giản & Sạch Sẽ (Clean Code)

- **Không viết file dài:** Tách biệt rõ ràng giữa Schema định nghĩa dữ liệu (Pydantic), Model cơ sở dữ liệu (SQLAlchemy) và Logic xử lý (Service).
- **Tránh N+1 Query:** Luôn sử dụng `selectinload` hoặc `joinedload` khi truy vấn các bảng có liên kết khóa ngoại.
- **Background Worker:** Việc lưu nhật ký gọi API (Logs) được thực hiện ngầm bằng `fastapi.BackgroundTasks` để không làm tăng độ trễ (latency) của người dùng.
