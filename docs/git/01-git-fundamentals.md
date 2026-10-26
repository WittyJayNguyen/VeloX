# Hướng Dẫn Git Cơ Bản & Quy Chuẩn Commit Message

Tài liệu này cung cấp kiến thức nền tảng về Git, tư duy quản lý nhánh và quy chuẩn viết commit message chuyên nghiệp có gắn mã theo dõi công việc (Issue ID).

---

## 1. Tìm Hiểu Về Git Cơ Bản

Git là hệ thống quản lý phiên bản phân tán (Distributed Version Control System - DVCS) giúp theo dõi sự thay đổi của mã nguồn trong quá trình phát triển phần mềm.

### 1.1. Các Lệnh Git Nền Tảng

| Lệnh | Ý Nghĩa Nghiệp Vụ | Cú Pháp Minh Hoạ |
| :--- | :--- | :--- |
| `git init` | Khởi tạo một Git repository mới tại thư mục hiện tại. | `git init` |
| `git clone` | Sao chép toàn bộ kho mã nguồn từ máy chủ từ xa (remote) về máy cục bộ (local). | `git clone https://github.com/WittyJayNguyen/VeloX.git` |
| `git status` | Kiểm tra trạng thái hiện tại của working directory và staging area. | `git status` |
| `git add` | Đưa các tệp tin đã chỉnh sửa vào khu vực chờ commit (Staging Area). | `git add .` hoặc `git add index.html` |
| `git commit` | Lưu lại ảnh chụp (snapshot) các thay đổi trong Staging Area vào lịch sử Git cục bộ. | `git commit -m "feat: add homepage #101"` |
| `git pull` | Kéo các commit mới nhất từ nhánh trên remote về và merge vào nhánh local hiện tại. | `git pull origin dev` |
| `git push` | Đẩy các commit cục bộ lên máy chủ từ xa (GitHub/GitLab). | `git push origin feat/homepage` |
| `git branch` | Quản lý, liệt kê, tạo mới hoặc xoá nhánh. | `git branch` hoặc `git branch -a` |
| `git checkout` / `git switch` | Chuyển đổi giữa các nhánh hoặc khôi phục tệp. | `git checkout -b feat/login` hoặc `git switch dev` |
| `git merge` | Hợp nhất lịch sử của một nhánh khác vào nhánh hiện tại. | `git merge feat/homepage` |
| `git log` | Xem lịch sử các commit đã thực hiện. | `git log --oneline --graph --decorate` |

---

## 2. Khái Niệm Về Branch (Nhánh)

Trong Git, một nhánh (branch) thực chất là một con trỏ có thể di chuyển (movable pointer) trỏ đến một commit cụ thể. Việc tạo nhánh cho phép các lập trình viên làm việc song song trên nhiều tính năng mà không ảnh hưởng đến mã nguồn chính.

### 2.1. Phân Loại Nhánh Tiêu Chuẩn

```
      (hotfix/xxx)
           |
           v
       [ prod ] <=========================== Release chính thức
           ^
           |
       [ staging ] <======================== Môi trường kiểm thử QA/UAT
           ^
           |
       [ dev ] <============================ Tích hợp mã nguồn của team
           ^
           |
      (feat/xxx) <========================== Phát triển tính năng mới
```

- **`prod` (hoặc `main` / `master`):**
  - Nhánh chứa mã nguồn ổn định nhất, phản ánh chính xác trạng thái đang chạy trên môi trường người dùng cuối (Production).
  - Không bao giờ commit hay push trực tiếp vào nhánh này. Chỉ cập nhật thông qua Pull Request từ `staging` (hoặc `hotfix`).
- **`staging`:**
  - Nhánh môi trường trung gian, dùng để kiểm thử chất lượng (QA), kiểm thử nghiệm thu (UAT) và chạy demo trước khi đưa ra thị trường.
- **`dev` (Development):**
  - Nhánh trung tâm cho đội ngũ phát triển, nơi hội tụ tất cả các tính năng hoàn thiện từ các nhánh `feat/*`.
- **`feat/*` (Feature Branch):**
  - Nhánh tạm thời được tạo ra để phát triển một tính năng cụ thể. Sau khi hoàn thành và được review, nhánh này sẽ được merge vào `dev` và xoá đi.
- **`hotfix/*` (Hotfix Branch):**
  - Nhánh đặc biệt tạo trực tiếp từ `prod` để khắc phục lỗi khẩn cấp xảy ra trên môi trường Production.

---

## 3. Tầm Quan Trọng Của Commit Message Rõ Ràng

Commit message không chỉ đơn thuần là mô tả kỹ thuật mà còn là **tài liệu lịch sử của dự án**.

### Lợi Ích Của Commit Rõ Ràng:
1. **Truy vết lỗi nhanh chóng (Bisect & Debugging):** Khi phát sinh bug, một commit rõ ràng giúp xác định ngay lập tức commit nào gây lỗi và bối cảnh tại thời điểm viết mã.
2. **Hỗ trợ Code Review hiệu quả:** Người review hiểu ngay mục đích và phạm vi thay đổi mà không cần phải đọc từng dòng code.
3. **Tự động sinh Release Notes (Changelog):** Dễ dàng xuất lịch sử thay đổi phiên bản tự động bằng các công cụ CI/CD.
4. **Gắn kết nghiệp vụ:** Cho phép liên kết trực tiếp giữa dòng code và yêu cầu nghiệp vụ / ticket / issue trên hệ thống quản lý dự án (Jira, GitHub Issues, Trello).

---

## 4. Quy Chuẩn Commit Message (Conventional Commits + Issue ID)

Tại **VeloX**, toàn bộ thành viên bắt buộc tuân thủ quy tắc commit message theo định dạng sau:

```
<type>(<scope>?): <mô tả ngắn ngọn bằng tiếng Anh/Việt> #<id_issue>

[Tùy chọn: Thân commit giải thích chi tiết lý do và giải pháp]

[Tùy chọn: Footer ghi chú breaking changes hoặc người liên quan]
```

### 4.1. Các Loại `<type>` Được Phép Sử Dụng:

| Type | Ý Nghĩa Nghiệp Vụ | Ví Dụ |
| :--- | :--- | :--- |
| `feat` | Thêm mới tính năng hoặc chức năng giao diện | `feat: add homepage hero section #101` |
| `fix` | Sửa lỗi phần mềm | `fix: resolve login authentication bug #104` |
| `docs` | Thêm hoặc sửa đổi tài liệu (README, docs, guides) | `docs: update gitflow workflow documentation #102` |
| `style` | Định dạng mã nguồn, không làm thay đổi logic (format, white-space, semicolon) | `style: format css with prettier #105` |
| `refactor` | Tái cấu trúc mã nguồn, không sửa lỗi và không thêm tính năng mới | `refactor: optimize database query helper #108` |
| `test` | Thêm hoặc cập nhật unit test, integration test | `test: add unit test for payment gateway #110` |
| `chore` | Thay đổi công cụ build, dependencies, cấu hình CI/CD | `chore: update package dependencies and build script #112` |

### 4.2. Nguyên Tắc Bắt Buộc Gắn Issue ID:
- **Tất cả các commit nghiệp vụ đều phải đi kèm Issue ID** (ví dụ: `#101`, `#204`, `PROJ-1234`).
- Điều này kích hoạt cơ chế liên kết tự động trên GitHub / GitLab / Jira, giúp chuyển trạng thái issue và lưu vết lịch sử thảo luận.

### 4.3. Bảng So Sánh Ví Dụ Tốt & Không Đạt:

| Trạng Thái | Commit Message | Nhận Xét |
| :---: | :--- | :--- |
| ❌ Kém | `update code` | Quá mơ hồ, không rõ sửa đổi cái gì và vì sao. |
| ❌ Kém | `fix bug` | Không biết sửa bug nào, không có Issue ID để đối chiếu. |
| ❌ Kém | `done homepage` | Sai định dạng, không theo chuẩn Conventional Commits. |
| ✅ Đạt | `feat: add homepage layout and responsive navbar #101` | Rõ ràng tính năng, đúng định dạng, có Issue ID. |
| ✅ Đạt | `fix: resolve session expiration loop on safari #205` | Nêu rõ lỗi được sửa, môi trường ảnh hưởng và gắn Issue ID. |
| ✅ Đạt | `chore: configure branch protection pre-push hook #103` | Rõ ràng mục đích công việc bảo trì hệ thống. |
