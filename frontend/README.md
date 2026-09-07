# AcaSocial Frontend

Frontend của **AcaSocial** - mạng xã hội học thuật dành cho sinh viên và giảng viên. Ứng dụng cung cấp giao diện để đăng nhập, duyệt và tạo câu hỏi/thảo luận, trả lời, bình chọn, gắn tag, quản lý hồ sơ và tải ảnh đại diện.

Frontend được xây dựng bằng **Next.js App Router** và giao tiếp với hệ thống backend thông qua **API Gateway**. Trong môi trường phát triển, frontend chạy ở `http://localhost:3000` và Gateway mặc định chạy ở `http://localhost:8080`.

## Công nghệ

- Next.js `16`
- React `19`
- TypeScript `5`
- ESLint `9`
- CSS Modules và các design tokens trong `src/styles`

## Yêu cầu

- Node.js `20` trở lên
- npm `10` trở lên
- API Gateway và các backend service cần thiết đang chạy nếu muốn sử dụng các chức năng gọi API

## Cài đặt và chạy local

Từ thư mục `frontend/`:

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

Nếu Gateway không chạy ở địa chỉ mặc định, tạo file `.env.local` trong thư mục `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`NEXT_PUBLIC_API_URL` là URL gốc của API Gateway. Các API client trong `src/lib/api/` tự thêm prefix `/api` vào các request. Không đặt secret hoặc thông tin nhạy cảm trong biến bắt đầu bằng `NEXT_PUBLIC_` vì các biến này có thể được đưa vào bundle phía client.

## Các lệnh npm

```bash
npm run dev      # Chạy development server với hot reload
npm run lint     # Kiểm tra ESLint
npm run build    # Build production
npm run start    # Chạy production build
```

## Các khu vực chính

| Đường dẫn           | Chức năng                              |
| ------------------- | -------------------------------------- |
| `/login`            | Đăng nhập                              |
| `/register`         | Đăng ký và xác thực OTP                |
| `/forgot-password`  | Khôi phục mật khẩu                     |
| `/`                 | Feed câu hỏi và thảo luận              |
| `/questions`        | Danh sách câu hỏi                      |
| `/discussions`      | Danh sách thảo luận                    |
| `/posts/create`     | Tạo bài viết                           |
| `/posts/[id]`       | Xem bài viết, bình luận và câu trả lời |
| `/tags`             | Duyệt các tag                          |
| `/profile`          | Trang cá nhân                          |
| `/profile/settings` | Cài đặt tài khoản                      |

## Cấu trúc thư mục

```text
src/
├── app/                  # Routes và layouts của Next.js App Router
│   ├── (auth)/           # Các trang xác thực
│   └── (app)/            # Các trang cần layout ứng dụng
├── components/           # Components dùng chung và components theo domain
├── lib/
│   ├── api/              # API clients cho auth, users, discussions, comments...
│   ├── auth/             # Auth context và xử lý token
│   └── constants.ts      # Routes, API URL và hằng số dùng chung
├── styles/               # Global styles và design tokens
└── types/                # TypeScript types dùng chung
```

## Kết nối với backend

Frontend chỉ nên gọi API qua Gateway, không gọi trực tiếp các service nội bộ. Luồng request chính:

```text
Browser (localhost:3000)
	│
	▼
API Gateway (localhost:8080)
	│
	├── identity-service  # Auth và users
	├── discussion-service # Discussions, comments, votes và tags
	└── media-service      # Upload và quản lý media
```

Để chạy toàn bộ hệ thống, xem hướng dẫn tại [README.md](../README.md). Khi chỉ phát triển giao diện tĩnh, có thể chạy riêng frontend nhưng các thao tác cần dữ liệu backend sẽ không hoạt động.

## Quy ước phát triển

- Tạo route trong `src/app/` theo quy ước App Router của Next.js.
- Đặt API client theo domain trong `src/lib/api/`; dùng lại `apiGet`, `apiPost`, `apiPatch`, `apiDelete` trong `src/lib/api/client.ts`.
- Tái sử dụng components trong `src/components/` trước khi tạo component mới.
- Chạy `npm run lint` trước khi mở pull request.

## Build production

```bash
npm run build
npm run start
```

Production server mặc định chạy tại [http://localhost:3000](http://localhost:3000). Đảm bảo `NEXT_PUBLIC_API_URL` trỏ tới Gateway của môi trường triển khai trước khi build.
