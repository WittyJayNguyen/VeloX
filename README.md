# VeloX AI System

Hệ thống quản lý và phát triển dự án VeloX tuân thủ tiêu chuẩn quản trị mã nguồn (SCM) doanh nghiệp và mô hình Gitflow Workflow phân tầng.

---

## 📚 Tài Liệu Hướng Dẫn Kỹ Thuật (Documentation)

Hệ thống tài liệu hướng dẫn chuẩn nghiệp vụ được lưu trữ trong thư mục [`docs/`](./docs/README.md):

- [x] [01. Git Cơ Bản & Quy Chuẩn Commit Message](./docs/git/01-git-fundamentals.md)
- [x] [02. Quy Trình Phân Phối Nhánh (Gitflow Workflow)](./docs/git/02-gitflow-workflow.md)
- [x] [03. Chính Sách Bảo Vệ Nhánh (Branch Protection)](./docs/git/03-branch-protection-rules.md)
- [x] [04. Kịch Bản & Bài Tập Thực Hành](./docs/git/04-practice-and-scenarios.md)

---

## 🌳 Kiến Trúc Nhánh (Branch Architecture)

- **`prod`**: Mã nguồn vận hành thực tế (Production), chỉ cập nhật qua PR từ `staging` hoặc `hotfix/*`.
- **`staging`**: Môi trường kiểm thử QA, UAT và demo đối tác.
- **`dev`**: Nhánh làm việc trung tâm tích hợp các tính năng từ `feat/*`.

---

## 🚀 Quy Tắc Bắt Buộc

1. **Gắn Issue ID:** 100% commit và PR bắt buộc phải có mã Issue (Ví dụ: `feat: add homepage #101` hoặc `fix: resolve auth bug #104`).
2. **Bảo Vệ Nhánh:** Nghiêm cấm push trực tiếp lên `prod` và `staging`.
3. **Đồng Bộ Sau Hotfix:** Khi hoàn thành hotfix trên `prod`, bắt buộc merge đồng bộ ngược vào `staging` và `dev`.
