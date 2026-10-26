# Tài Liệu Quy Chuẩn Quản Lý Mã Nguồn VeloX (Source Code Management)

Chào mừng bạn đến với tài liệu quy chuẩn kỹ thuật và quy trình quản trị mã nguồn (SCM) của dự án **VeloX**. Tài liệu này được thiết kế theo tiêu chuẩn công nghiệp nhằm đảm bảo chất lượng phần mềm, tính nhất quán khi làm việc nhóm và an toàn trong quá trình triển khai sản phẩm.

---

## 📑 Danh Mục Tài Liệu

| Tài liệu | Mô tả | Đối tượng |
| :--- | :--- | :--- |
| [01. Git Cơ Bản & Quy Chuẩn Commit](./git/01-git-fundamentals.md) | Các lệnh Git nền tảng, khái niệm branch, định dạng Commit Message chuẩn Conventional Commits kèm Issue ID. | Tất cả Developer |
| [02. Quy Trình Phân Phối Nhánh (Gitflow Workflow)](./git/02-gitflow-workflow.md) | Kiến trúc 3 nhánh chính (`prod`, `staging`, `dev`), luồng phát triển tính năng (`feat/*`), và quy trình xử lý sự cố khẩn cấp (`hotfix/*`). | Dev, Tech Lead, DevOps |
| [03. Chính Sách Bảo Vệ Nhánh (Branch Protection)](./git/03-branch-protection-rules.md) | Thiết lập bảo vệ nhánh `prod` và `staging`, quy định Pull Request, Code Review và tự động hoá CI/CD. | Repository Admin, Lead |
| [04. Kịch Bản & Bài Tập Thực Hành](./git/04-practice-and-scenarios.md) | Kịch bản thao tác thực tế từng bước: tạo nhánh, mở PR, merge code, deploy staging, và mô phỏng xử lý hotfix production. | Toàn bộ thành viên |

---

## 🎯 Mục Tiêu Chuẩn Nghiệp Vụ

1. **Minh bạch và Truy vết (Traceability):** 100% commit và Pull Request đều phải gắn kèm mã định danh công việc (Issue ID / Ticket ID).
2. **An toàn Môi trường (Environment Isolation):** Mã nguồn được tách biệt nghiêm ngặt qua 3 tầng: `dev` (phát triển), `staging` (kiểm thử chất lượng - QA/UAT), `prod` (vận hành thực tế).
3. **Chất lượng Mã nguồn (Code Quality):** Không ai được phép push code trực tiếp lên `prod` và `staging`. Mọi thay đổi bắt buộc phải thông qua Pull Request được review và phê duyệt.
4. **Khắc phục Sự cố Nhanh chóng (Rapid Hotfix):** Cơ chế xử lý lỗi khẩn cấp trên Production độc lập, có quy trình đồng bộ ngược bảo đảm tính toàn vẹn của nhánh dev và staging.
