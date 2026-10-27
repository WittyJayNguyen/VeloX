# Quy Định Vận Hành & Triển Khai VeloX (VeloX DevOps & Gitflow Guidelines)

Tài liệu này là quy chuẩn bắt buộc áp dụng cho toàn bộ quá trình phát triển, kiểm thử và triển khai mã nguồn dự án **VeloX**.

---

## 1. Nguyên Tắc Cốt Lõi: Chạy Kiểm Thử Local Trước Khi Merge

> **BẮT BUỘC:** Không được phép merge code vào `dev`, `staging`, hoặc `prod` khi chưa kiểm tra và chạy thành công trên máy Local.

### Quy trình kiểm tra Local:
1. **Frontend**:
   ```bash
   npm run --prefix frontend build
   ```
   - Đảm bảo 100% không phát sinh lỗi TypeScript (`tsc -b`) và đóng gói Vite thành công.
2. **Backend**:
   - Kiểm tra import, migration và cú pháp Python:
     ```bash
     python -m py_compile backend/app/main.py
     ```
3. **Đa ngôn ngữ (i18n)**:
   - Khi thêm mới hoặc chỉnh sửa text/tiêu đề, phải khai báo đầy đủ trong 5 file locale:
     `frontend/src/locales/{en,vi,zh,ja,ko}/common.json`. Tuyệt đối không để chuỗi hardcoded.

---

## 2. Quy Trình Phân Nhánh Gitflow Chuẩn

Hệ thống mã nguồn tuân thủ nghiêm ngặt 3 tầng môi trường:

```
[feat/* hoặc fix/*] ──> [dev] ──> [staging] ──> [prod]
```

1. **Phát triển tính năng / Sửa lỗi**:
   - Tạo nhánh từ `dev`:
     ```bash
     git checkout dev
     git checkout -b feat/<ten_tinh_nang>   # hoặc fix/<ten_loi>
     ```
2. **Hợp nhất vào nhánh `dev` (Sau khi test local pass)**:
   ```bash
   git checkout dev
   git merge feat/<ten_tinh_nang>
   ```
3. **Đưa lên môi trường Staging (`testvelox.nexoratech.com.vn`)**:
   ```bash
   git checkout staging
   git merge dev
   git push server staging
   ```
   - **Tự động hóa**: Server sẽ kích hoạt Git Hook `post-receive`, tự động pull mã nguồn mới nhất và chạy `docker compose up -d --build` cho Staging.
4. **Đưa lên môi trường Production (`velox.nexoratech.com.vn`)**:
   ```bash
   git checkout prod
   git merge staging
   git push server prod
   ```
   - **Tự động hóa**: Server tự động kích hoạt tiến trình build Docker Production, cập nhật dịch vụ với Zero-Downtime.

---

## 3. Cấu Hình CI/CD Git Hook Trên Server

- **Remote Git Server**: `ssh://root@221.121.1.3/opt/velox/repo.git`
- **Hook Script**: `/opt/velox/repo.git/hooks/post-receive`
- **Cơ chế hoạt động**:
  - Khi có lệnh `git push server prod`, hook tự động cập nhật thư mục `/opt/velox/prod` và chạy `docker compose -f docker-compose.prod.yml up -d --build`.
  - Khi có lệnh `git push server staging`, hook tự động cập nhật thư mục `/opt/velox/staging` và chạy `docker compose -f docker-compose.staging.yml up -d --build`.
