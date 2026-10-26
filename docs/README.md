# VeloX AI Gateway - Trung Tâm Tài Liệu Dự Án (Project Documentation)

Chào mừng bạn đến với kho tài liệu chuẩn doanh nghiệp của hệ thống **VeloX AI Gateway** — Nền tảng trung gian kết nối, tối ưu chi phí và điều phối mô hình AI thông minh (AI Reverse Proxy & Aggregator).

---

## 📑 Danh Mục Toàn Bộ Hệ Thống Tài Liệu

### 1. Phân Tầng Nghiệp Vụ & Mô Hình Kinh Doanh (`docs/business/`)
- [x] [01. Tổng Quan Hệ Thống & Phân Quyền](./business/01-system-overview.md): Cơ chế Gateway, 2 nguồn cấp (API Key chính thức & Token tài khoản mua sỉ), quy tắc phân quyền (User chỉ ở Home/Portal, Admin cấp sẵn mới vào Dashboard).
- [x] [02. Đặc Tả Chi Tiết Các Phân Hệ Quản Trị](./business/02-core-modules-specs.md): Phân tích chi tiết bản vẽ thiết kế (Dashboard KPI, Service Pool, API Key/Token, Bảng giá & Biên lợi nhuận, Quản lý nguồn hàng & Nhật ký Logs).
- [x] [03. Chuẩn Hóa Đa Ngôn Ngữ (i18n)](./business/03-i18n-multilingual.md): Cơ chế hỗ trợ 5 ngôn ngữ: Tiếng Việt (`vi`), Tiếng Anh (`en`), Tiếng Nhật (`ja`), Tiếng Hàn (`ko`), Tiếng Trung (`zh`).

### 2. Kiến Trúc Kỹ Thuật & Thiết Kế Hệ Thống (`docs/architecture/`)
- [x] [01. Kiến Trúc Front-End ReactJS Module-Based](./architecture/01-frontend-architecture.md): Tổ chức module chuẩn theo sơ đồ (`components/common`, `layouts`, `features/<module>/{components, hooks, services, types}`, `routes`, `store`, `assets`, `styles`).
- [x] [02. Kiến Trúc Back-End Python FastAPI](./architecture/02-backend-architecture.md): Kiến trúc Async High-Concurrency, cơ chế AI Proxy Streaming, xoay vòng Pool Key, tính tiền tức thì.
- [x] [03. Thiết Kế Cơ Sở Dữ Liệu PostgreSQL](./architecture/03-database-schema-pgsql.md): Sơ đồ ERD, định nghĩa bảng 3NF, ràng buộc khóa ngoại, chỉ mục (Index) tối ưu cho hàng triệu bản ghi logs.

### 3. Quy Trình Quản Trị Mã Nguồn & Gitflow (`docs/git/`)
- [x] [01. Git Cơ Bản & Quy Chuẩn Commit](./git/01-git-fundamentals.md): Conventional Commits bắt buộc đi kèm `#id_issue`.
- [x] [02. Quy Trình Phân Phối Nhánh (Gitflow)](./git/02-gitflow-workflow.md): Phân tầng 3 nhánh `prod`, `staging`, `dev` và nhánh `hotfix/*`.
- [x] [03. Chính Sách Bảo Vệ Nhánh](./git/03-branch-protection-rules.md): Chặn push trực tiếp vào `prod`/`staging`.
- [x] [04. Kịch Bản & Thực Hành Thực Tế](./git/04-practice-and-scenarios.md): Bài tập mô phỏng từ tạo nhánh tính năng đến hotfix production.
