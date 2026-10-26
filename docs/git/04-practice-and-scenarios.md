# Kịch Bản Thực Hành Gitflow Chi Tiết (Hands-on Practice)

Tài liệu này là cẩm nang hướng dẫn thực hành từng bước mô phỏng chính xác môi trường dự án thực tế tại **VeloX**.

---

## 🎯 Mục Tiêu Bài Thực Hành

1. Hiểu và áp dụng quy trình Gitflow trong thực tế sản xuất phần mềm.
2. Thành thạo cách làm việc với branch, quy chuẩn commit kèm Issue ID, quy trình Pull Request (PR) và Code Review.
3. Làm chủ kỹ năng xử lý sự cố khẩn cấp (Hotfix) trên nhánh `prod` và kỹ thuật đồng bộ ngược về `staging` và `dev`.

---

## 📋 Tóm Tắt Quy Trình Thực Hành

```
[Khởi tạo nhánh chính: prod, staging, dev]
       │
       ▼
[Tạo feat/homepage từ dev] ──> [Commit & Push: feat: add homepage #101]
       │
       ▼
[PR & Merge: feat/homepage ──> dev]
       │
       ▼
[Merge QA: dev ──> staging #102]
       │
       ▼
[Release: staging ──> prod #103]
       │
       ▼
[Mô phỏng phát sinh lỗi trên prod #104]
       │
       ▼
[Tạo hotfix/fix_homepage_header từ prod] ──> [Fix bug & Commit #105]
       │
       ▼
[PR & Merge: hotfix ──> prod #105]
       │
       ▼
[Đồng bộ ngược: prod ──> staging và dev #105]
```

---

## 🛠️ Các Bước Thực Hiện Chi Tiết

### Bước 1: Chuẩn Bị Repo & 3 Nhánh Chính
Khởi tạo cấu trúc 3 nhánh chính từ nhánh ban đầu:
```bash
# Đứng tại nhánh prod
git checkout -b prod

# Tạo nhánh staging từ prod
git checkout -b staging

# Tạo nhánh dev từ staging
git checkout -b dev
```

### Bước 2: Tạo Nhánh Tính Năng (Feature) & Viết Code
1. Tạo nhánh `feat/homepage` từ `dev`:
   ```bash
   git checkout dev
   git checkout -b feat/homepage
   ```
2. Thêm tệp tin giao diện `index.html` và commit đúng định dạng chuẩn Conventional Commits kèm `#id_issue`:
   ```bash
   git add index.html
   git commit -m "feat: add homepage interface #101"
   ```
3. Đẩy nhánh lên remote repository:
   ```bash
   git push origin feat/homepage
   ```

### Bước 3: Tạo PR & Merge Vào Nhánh `dev`
- Trên giao diện GitHub/GitLab, tạo Pull Request từ `feat/homepage` vào nhánh đích `dev`.
- Điền đầy đủ mô tả công việc, gắn link issue `#101`.
- Tiến hành Code Review. Sau khi phê duyệt, thực hiện merge vào `dev`:
   ```bash
   git checkout dev
   git merge --no-ff feat/homepage -m "Merge pull request #101 from feat/homepage into dev"
   ```

### Bước 4: Chuyển Giao Cho Đội Ngũ QA Trên Môi Trường Staging
Khi các tính năng trên `dev` đã hoàn thành và sẵn sàng cho bài kiểm thử tích hợp:
```bash
git checkout staging
git merge --no-ff dev -m "chore: merge dev into staging for QA release #102"
```

### Bước 5: Triển Khai Lên Production
Sau khi QA/UAT xác nhận bản build trên Staging đạt chuẩn chất lượng:
```bash
git checkout prod
git merge --no-ff staging -m "chore: release version 1.0.0 to production #103"
git tag -a v1.0.0 -m "Release v1.0.0"
```

### Bước 6: Mô Phỏng Sự Cố Trên Production
Giả lập một lỗi hiển thị tiêu đề header trên môi trường Production (Issue `#104`).

### Bước 7: Kích Hoạt Quy Trình Hotfix Khẩn Cấp
1. **Tạo nhánh hotfix từ `prod`:**
   ```bash
   git checkout prod
   git checkout -b hotfix/fix_homepage_header
   ```
2. **Sửa lỗi và kiểm tra kỹ lưỡng:**
   Sửa lại mã nguồn trong `index.html`.
3. **Commit theo chuẩn:**
   ```bash
   git add index.html
   git commit -m "fix: resolve homepage header display issue #105"
   ```
4. **Merge bản hotfix vào `prod`:**
   ```bash
   git checkout prod
   git merge --no-ff hotfix/fix_homepage_header -m "Merge pull request #105 from hotfix/fix_homepage_header into prod"
   ```
5. **ĐỒNG BỘ NGƯỢC (BẮT BUỘC):**
   Đồng bộ bản vá từ `prod` vào `staging` và `dev` để đảm bảo lỗi không tái diễn ở các phiên bản tiếp theo:
   ```bash
   # Đồng bộ vào staging
   git checkout staging
   git merge --no-ff prod -m "chore: sync hotfix #105 from prod into staging"

   # Đồng bộ vào dev
   git checkout dev
   git merge --no-ff prod -m "chore: sync hotfix #105 from prod into dev"
   ```

---

## ⚠️ Nguyên Tắc Cốt Lõi Cần Ghi Nhớ

1. **Luôn Review Code Trước Khi Merge:** Tuyệt đối không tự ý merge khi chưa có sự kiểm định chéo giữa các lập trình viên.
2. **Commit Message Chuẩn Xác:** Bắt buộc có tiền tố (`feat:`, `fix:`, `docs:`, ...) và **phải có `#id_issue`** để liên kết hệ thống quản lý tác vụ.
3. **Đồng Bộ Sau Hotfix:** Không bao giờ được quên bước merge từ `prod` ngược về `staging` và `dev` sau khi đóng sự cố.
