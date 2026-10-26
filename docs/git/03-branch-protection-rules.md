# Chính Sách Bảo Vệ Nhánh (Branch Protection Rules)

Để đảm bảo tính toàn vẹn của mã nguồn, ngăn chặn các rủi ro do thao tác nhầm và duy trì chất lượng hệ thống, dự án **VeloX** áp dụng chính sách bảo vệ nhánh nghiêm ngặt cho `prod` và `staging`.

---

## 1. Mục Đích & Nguyên Tắc Bảo Vệ

- **Tuyệt đối ngăn chặn push trực tiếp (`git push`)** vào hai nhánh `prod` và `staging`.
- **Bắt buộc 100% thay đổi phải thông qua Pull Request (PR)** có ít nhất một kỹ sư cấp cao/Tech Lead phê duyệt.
- **Bảo vệ lịch sử Git:** Ngăn chặn các thao tác nguy hiểm như force-push (`git push --force`) hoặc xoá nhánh bảo vệ.

---

## 2. Cấu Hình Trên GitHub / GitLab (Server-Side Protection)

### 2.1. Thiết Lập GitHub Branch Protection Rules

Vào kho lưu trữ trên GitHub -> **Settings** -> **Branches** -> Nhấn **Add branch ruleset** hoặc **Add rule** cho các pattern: `prod` và `staging`.

| Thiết Lập (Rule) | Trạng Thái | Ý Nghĩa Kỹ Thuật |
| :--- | :---: | :--- |
| **Require a pull request before merging** | `BẬT` | Chặn đứng hoàn toàn việc `git push` trực tiếp; mọi thay đổi đều phải tạo PR. |
| **Require approvals** | `Tối thiểu 1` | Đòi hỏi ít nhất 1 thành viên review và approve trước khi mở khoá nút Merge. |
| **Dismiss stale pull request approvals when new commits are pushed** | `BẬT` | Khi có commit mới được đẩy thêm vào PR, trạng thái approve cũ sẽ bị huỷ bỏ để buộc review lại. |
| **Require status checks to pass before merging** | `BẬT` | Các pipeline CI (kiểm tra linting, unit test, build docker) phải thành công màu xanh lá. |
| **Require conversation resolution before merging** | `BẬT` | Mọi bình luận, góp ý của reviewer phải được giải quyết xong mới được merge. |
| **Do not allow bypassing the above settings** | `BẬT` | Áp dụng cả với Administrator của repo, không ai có ngoại lệ. |
| **Restrict deletions** | `BẬT` | Không ai được xoá nhánh `prod` và `staging`. |

---

## 3. Cơ Chế Bảo Vệ Phía Máy Cục Bộ (Client-Side Pre-Push Hook)

Ngoài cấu hình trên máy chủ từ xa, dự án cung cấp script Git Hook `pre-push` được cài đặt tự động trong `.git/hooks/pre-push` hoặc thư mục `.githooks/`. Script này sẽ kiểm tra tên nhánh trước khi gửi lệnh push; nếu phát hiện người dùng đang cố tình push vào `prod` hoặc `staging`, lệnh push sẽ bị huỷ ngay lập tức trên máy local.

### Mã Nguồn Shell Script `pre-push`:

```bash
#!/bin/sh
# VeloX Git Pre-Push Hook: Ngăn chặn push trực tiếp vào prod và staging

protected_branches="prod staging main"
current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)

for branch in $protected_branches; do
    if [ "$current_branch" = "$branch" ]; then
        echo "\033[0;31m======================================================================\033[0m"
        echo "\033[0;31m[LỖI BẢO MẬT] BẠN ĐANG CỐ GẮNG PUSH TRỰC TIẾP VÀO NHÁNH BẢO VỆ: '$current_branch'!\033[0m"
        echo "\033[0;33mQuy chuẩn VeloX nghiêm cấm push trực tiếp vào prod/staging.\033[0m"
        echo "Vui lòng tuân thủ quy trình Gitflow:"
        echo "  1. Tạo nhánh tính năng: git checkout -b feat/<ten_chuc_nang>"
        echo "  2. Đẩy code lên nhánh của bạn: git push origin feat/<ten_chuc_nang>"
        echo "  3. Tạo Pull Request (PR) trên GitHub để được review và merge."
        echo "\033[0;31m======================================================================\033[0m"
        exit 1
    fi
done

exit 0
```

### Cách Kích Hoạt Client Hook:
Để áp dụng hook trên máy phát triển, chạy lệnh cấu hình:
```bash
git config core.hooksPath .githooks
```
Hoặc copy script vào tệp `.git/hooks/pre-push` và cấp quyền thực thi:
```bash
chmod +x .git/hooks/pre-push
```
