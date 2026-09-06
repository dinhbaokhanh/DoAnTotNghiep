# 📋 Discussion Service — Implementation Plan

> **Tech Stack**: Node.js + NestJS + TypeORM + PostgreSQL  
> **Port**: `8084`  
> **Phụ trách**: Trần Thành Trung  
> **Dự án**: AcaSocial — Microservices Architecture

---

## 1. Tổng quan

Discussion Service là **Core Subdomain** của hệ thống AcaSocial, chịu trách nhiệm toàn bộ vòng đời bài viết:

| Chức năng | Mô tả |
|---|---|
| Quản lý bài viết | Tạo, sửa, xóa bài viết (Question, Discussion) |
| Bình luận phân cấp | Comment cấp 1 + reply (cấp 2+), có hỗ trợ ẩn danh |
| Upvote / Downvote | Đánh giá bài viết & bình luận |
| Accepted Answer | Đánh dấu câu trả lời đúng → chuyển trạng thái "Solved" |
| Tag hệ thống | Gắn tag môn học/chủ đề cho bài viết |
| Domain Events | Phát sự kiện cho Gamification, Search, AI Service |

### Nguyên tắc thiết kế (theo PDF)
- **Không lưu dữ liệu ngoài phạm vi**: chỉ lưu `authorId` (tham chiếu Identity), `mediaIds` (tham chiếu Media)
- **Không gọi trực tiếp service khác**: Gateway inject `X-User-ID` và `X-User-Role` → service chỉ đọc header
- **Soft delete**: dùng `deletedAt` để bảo toàn dữ liệu

---

## 2. Cấu trúc thư mục

```
services/discussion-service/
├── src/
│   ├── main.ts                          # Entry point (port 8084)
│   ├── app.module.ts                    # Root module
│   │
│   ├── common/                          # Shared utilities
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts    # Đọc X-User-ID, X-User-Role từ header
│   │   │   └── roles.decorator.ts           # @Roles('admin', 'moderator')
│   │   ├── guards/
│   │   │   └── roles.guard.ts               # RolesGuard kiểm tra role
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts     # Global exception filter
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts     # Chuẩn hóa response format
│   │   └── pagination/
│   │       ├── pagination.dto.ts            # PaginationQueryDto
│   │       └── paginated-result.interface.ts
│   │
│   ├── discussions/                     # Core module - Bài viết
│   │   ├── discussions.module.ts
│   │   ├── discussions.controller.ts
│   │   ├── discussions.service.ts
│   │   ├── entities/
│   │   │   ├── discussion.entity.ts
│   │   │   └── discussion-media.entity.ts   # Join table: discussion ↔ mediaId
│   │   ├── dto/
│   │   │   ├── create-discussion.dto.ts
│   │   │   ├── update-discussion.dto.ts
│   │   │   └── filter-discussion.dto.ts     # Query params: postType, tag, status, sort
│   │   └── enums/
│   │       ├── post-type.enum.ts            # QUESTION, DISCUSSION
│   │       └── post-status.enum.ts          # OPEN, SOLVED, CLOSED
│   │
│   ├── comments/                        # Module bình luận
│   │   ├── comments.module.ts
│   │   ├── comments.controller.ts
│   │   ├── comments.service.ts
│   │   ├── entities/
│   │   │   └── comment.entity.ts
│   │   └── dto/
│   │       ├── create-comment.dto.ts
│   │       └── update-comment.dto.ts
│   │
│   ├── votes/                           # Module upvote/downvote
│   │   ├── votes.module.ts
│   │   ├── votes.controller.ts
│   │   ├── votes.service.ts
│   │   ├── entities/
│   │   │   └── vote.entity.ts
│   │   └── dto/
│   │       └── cast-vote.dto.ts
│   │
│   └── tags/                            # Module quản lý tag
│       ├── tags.module.ts
│       ├── tags.controller.ts
│       ├── tags.service.ts
│       ├── entities/
│       │   └── tag.entity.ts
│       └── dto/
│           └── create-tag.dto.ts
│
├── test/
│   └── jest-e2e.json
├── .env
├── .env.example
├── .dockerignore
├── .gitignore
├── Dockerfile
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

---

## 3. Database Schema

### 3.1. Entity: `Discussion` (bảng `discussions`)

| Column | Type | Constraint | Mô tả |
|---|---|---|---|
| `id` | `uuid` | PK, auto-gen | ID bài viết |
| `title` | `varchar(300)` | NOT NULL | Tiêu đề |
| `content` | `text` | NOT NULL | Nội dung (hỗ trợ Markdown) |
| `post_type` | `enum` | NOT NULL | `question` \| `discussion` |
| `status` | `enum` | DEFAULT `open` | `open` \| `solved` \| `closed` |
| `author_id` | `uuid` | NOT NULL | Tham chiếu đến Identity Service |
| `is_anonymous` | `boolean` | DEFAULT `false` | Chế độ ẩn danh |
| `upvote_count` | `int` | DEFAULT `0` | Cache counter upvote |
| `downvote_count` | `int` | DEFAULT `0` | Cache counter downvote |
| `comment_count` | `int` | DEFAULT `0` | Cache counter bình luận |
| `view_count` | `int` | DEFAULT `0` | Lượt xem |
| `accepted_comment_id` | `uuid` | NULLABLE, FK → comments | Câu trả lời được chấp nhận |
| `created_at` | `timestamptz` | auto | |
| `updated_at` | `timestamptz` | auto | |
| `deleted_at` | `timestamptz` | NULLABLE | Soft delete |

### 3.2. Entity: `Comment` (bảng `comments`)

| Column | Type | Constraint | Mô tả |
|---|---|---|---|
| `id` | `uuid` | PK, auto-gen | |
| `discussion_id` | `uuid` | FK → discussions, NOT NULL | Bài viết chứa bình luận |
| `author_id` | `uuid` | NOT NULL | Tham chiếu Identity |
| `content` | `text` | NOT NULL | Nội dung bình luận |
| `parent_comment_id` | `uuid` | FK → comments, NULLABLE | NULL = comment cấp 1 |
| `is_anonymous` | `boolean` | DEFAULT `false` | |
| `upvote_count` | `int` | DEFAULT `0` | |
| `downvote_count` | `int` | DEFAULT `0` | |
| `created_at` | `timestamptz` | auto | |
| `updated_at` | `timestamptz` | auto | |
| `deleted_at` | `timestamptz` | NULLABLE | Soft delete |

### 3.3. Entity: `Vote` (bảng `votes`)

| Column | Type | Constraint | Mô tả |
|---|---|---|---|
| `id` | `uuid` | PK, auto-gen | |
| `user_id` | `uuid` | NOT NULL | Người vote |
| `target_type` | `enum` | NOT NULL | `discussion` \| `comment` |
| `target_id` | `uuid` | NOT NULL | ID bài viết hoặc bình luận |
| `vote_type` | `enum` | NOT NULL | `upvote` \| `downvote` |
| `created_at` | `timestamptz` | auto | |

> **Unique constraint**: `(user_id, target_type, target_id)` — mỗi user chỉ vote 1 lần cho 1 target.

### 3.4. Entity: `Tag` (bảng `tags`)

| Column | Type | Constraint | Mô tả |
|---|---|---|---|
| `id` | `uuid` | PK, auto-gen | |
| `name` | `varchar(100)` | UNIQUE, NOT NULL | Tên tag (vd: "OOP", "Cơ sở dữ liệu") |
| `slug` | `varchar(120)` | UNIQUE, NOT NULL | URL-friendly slug |
| `description` | `text` | NULLABLE | Mô tả tag |
| `usage_count` | `int` | DEFAULT `0` | Số bài viết dùng tag này |
| `created_at` | `timestamptz` | auto | |

### 3.5. Join table: `discussion_tags`

| Column | Type | Constraint |
|---|---|---|
| `discussion_id` | `uuid` | FK → discussions |
| `tag_id` | `uuid` | FK → tags |

> **Primary key**: `(discussion_id, tag_id)`

### 3.6. Join table: `discussion_media`

| Column | Type | Constraint | Mô tả |
|---|---|---|---|
| `discussion_id` | `uuid` | FK → discussions | |
| `media_id` | `uuid` | NOT NULL | Tham chiếu Media Service |
| `sort_order` | `int` | DEFAULT `0` | Thứ tự hiển thị |

---

## 4. API Endpoints

### 4.1. Discussions (Bài viết)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/discussions` | ✅ | Tạo bài viết mới |
| `GET` | `/discussions` | ❌ | Danh sách bài viết (phân trang, lọc, sắp xếp) |
| `GET` | `/discussions/:id` | ❌ | Chi tiết bài viết (tăng view_count) |
| `PATCH` | `/discussions/:id` | ✅ | Cập nhật bài viết (author hoặc admin/mod) |
| `DELETE` | `/discussions/:id` | ✅ | Soft delete (author hoặc admin/mod) |
| `PATCH` | `/discussions/:id/status` | ✅ | Đóng/mở thảo luận |
| `PATCH` | `/discussions/:id/accept/:commentId` | ✅ | Đánh dấu Accepted Answer (chỉ Question) |

**Query params cho `GET /discussions`:**
```
?page=1
&limit=20
&postType=question|discussion
&status=open|solved|closed
&tag=oop,database                   # lọc theo tag slug (nhiều tag, dấu phẩy)
&authorId=uuid
&sort=newest|oldest|most_votes|most_comments
&search=keyword                     # tìm kiếm trong title (basic ILIKE)
```

### 4.2. Comments (Bình luận)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/discussions/:id/comments` | ✅ | Tạo bình luận mới |
| `GET` | `/discussions/:id/comments` | ❌ | Danh sách bình luận (phân trang, kèm reply) |
| `PATCH` | `/comments/:id` | ✅ | Sửa bình luận (author hoặc admin/mod) |
| `DELETE` | `/comments/:id` | ✅ | Soft delete bình luận |

### 4.3. Votes (Upvote/Downvote)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/discussions/:id/vote` | ✅ | Vote bài viết |
| `POST` | `/comments/:id/vote` | ✅ | Vote bình luận |
| `DELETE` | `/discussions/:id/vote` | ✅ | Hủy vote bài viết |
| `DELETE` | `/comments/:id/vote` | ✅ | Hủy vote bình luận |

### 4.4. Tags

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/tags` | ❌ | Danh sách tag (search, phân trang) |
| `POST` | `/tags` | ✅ (admin/mod) | Tạo tag mới |
| `PATCH` | `/tags/:id` | ✅ (admin/mod) | Cập nhật tag |
| `DELETE` | `/tags/:id` | ✅ (admin/mod) | Xóa tag |

---

## 5. Business Logic chi tiết

### 5.1. Tạo bài viết (`POST /discussions`)

```
Input: { title, content, postType, tags: [tagId], mediaIds?: [uuid], isAnonymous? }
```

1. Validate: title & content không trống, postType hợp lệ
2. Kiểm tra `tags` có ít nhất 1 tag, tất cả tag ID phải tồn tại trong DB
3. Kiểm tra `mediaIds` (nếu có) — lưu tham chiếu, **không gọi Media Service**
4. Lưu discussion + liên kết tag + media
5. Tăng `usage_count` của các tag được sử dụng
6. **(Future)** Publish `PostCreatedEvent` → Kafka/RabbitMQ

### 5.2. Cập nhật & Xóa bài viết

- **Chỉ author** hoặc **admin/moderator** mới được sửa/xóa
- Xóa = soft delete (`deletedAt = now()`)
- Khi xóa bài, comment vẫn giữ nguyên (orphaned comments hiển thị "[Bài viết đã bị xóa]")

### 5.3. Bình luận phân cấp

```
Comment cấp 1: parentCommentId = NULL
Comment cấp 2+: parentCommentId = ID của comment cha
```

- Query trả về comment cấp 1 kèm `replies[]` (eager load 1 cấp, lazy load sâu hơn)
- Khi tạo comment → tăng `comment_count` trên discussion
- Khi xóa comment → giảm `comment_count`

### 5.4. Upvote / Downvote

```typescript
// Logic khi user cast vote:
1. Nếu chưa vote → tạo vote mới, tăng counter tương ứng
2. Nếu đã vote cùng loại → xóa vote (toggle off), giảm counter
3. Nếu đã vote khác loại → đổi vote, cập nhật cả 2 counter
```

- Dùng **Unique constraint** `(user_id, target_type, target_id)` để đảm bảo 1 user 1 vote
- Counter `upvote_count` / `downvote_count` được **cache trực tiếp** trên bảng discussion/comment để tránh COUNT() mỗi query

### 5.5. Accepted Answer (chỉ dành cho `postType = QUESTION`)

```
PATCH /discussions/:id/accept/:commentId
```

1. Kiểm tra bài viết có `postType = QUESTION`
2. Kiểm tra người request là **author** hoặc **admin/teacher**
3. Cập nhật `accepted_comment_id` trên discussion
4. Chuyển `status` → `SOLVED`
5. **(Future)** Publish `AnswerAcceptedEvent` → Kafka/RabbitMQ (cho Gamification cộng điểm)

### 5.6. Quyền hạn (Authorization)

| Hành động | Student (author) | Student (khác) | Teacher | Moderator | Admin |
|---|---|---|---|---|---|
| Tạo bài viết | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sửa bài viết | ✅ (own) | ❌ | ❌ | ✅ | ✅ |
| Xóa bài viết | ✅ (own) | ❌ | ❌ | ✅ | ✅ |
| Accept Answer | ✅ (own post) | ❌ | ✅ | ✅ | ✅ |
| Đóng/mở thảo luận | ✅ (own) | ❌ | ❌ | ✅ | ✅ |
| Quản lý tag | ❌ | ❌ | ❌ | ✅ | ✅ |
| Bóc mác ẩn danh | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 6. Tích hợp hệ thống

### 6.1. Gateway → Discussion Service

Thêm vào `gateway/.env`:
```env
DISCUSSION_SERVICE_URL=http://localhost:8084
```

Thêm vào `docker-compose.yml` → `gateway.environment`:
```yaml
DISCUSSION_SERVICE_URL: http://discussion-service:8084
```

Thêm routes vào `gateway/gateway.json`:
```json
// --- Discussions ---
{ "endpoint": "/api/discussions",     "method": "POST",   "auth_required": true,  "backend": [{"host": ["${DISCUSSION_SERVICE_URL}"], "url_pattern": "/discussions"}] },
{ "endpoint": "/api/discussions",     "method": "GET",    "backend": [{"host": ["${DISCUSSION_SERVICE_URL}"], "url_pattern": "/discussions"}] },
{ "endpoint": "/api/discussions/:id", "method": "GET",    "backend": [{"host": ["${DISCUSSION_SERVICE_URL}"], "url_pattern": "/discussions/:id"}] },
{ "endpoint": "/api/discussions/:id", "method": "PATCH",  "auth_required": true,  "backend": [{"host": ["${DISCUSSION_SERVICE_URL}"], "url_pattern": "/discussions/:id"}] },
{ "endpoint": "/api/discussions/:id", "method": "DELETE", "auth_required": true,  "backend": [{"host": ["${DISCUSSION_SERVICE_URL}"], "url_pattern": "/discussions/:id"}] },
// ... (tương tự cho comments, votes, tags)
```

### 6.2. Discussion Service đọc user context từ Gateway

```typescript
// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return {
    id: request.headers['x-user-id'],
    role: request.headers['x-user-role'],
  };
});
```

> [!IMPORTANT]
> Discussion Service **không verify JWT**. Gateway đã làm việc này.  
> Service chỉ đọc `X-User-ID` và `X-User-Role` từ header.

### 6.3. Docker Compose

```yaml
# Thêm vào docker-compose.yml
discussion-service:
  build:
    context: ./services/discussion-service
    dockerfile: Dockerfile
  container_name: acasocial-discussion
  restart: unless-stopped
  env_file:
    - ./services/discussion-service/.env
  environment:
    DB_HOST: postgres
    DB_PORT: 5432
  networks:
    - internal
  depends_on:
    postgres:
      condition: service_healthy
```

### 6.4. Domain Events (Future — Phase 2)

Khi tích hợp Message Broker (Kafka/RabbitMQ):

| Event | Trigger | Consumer |
|---|---|---|
| `PostCreatedEvent` | Tạo bài viết mới | Search Service, AI Service (auto-tag) |
| `AnswerAcceptedEvent` | Đánh dấu câu trả lời đúng | Gamification Service (cộng điểm) |
| `PostVotedEvent` | Upvote/downvote bài viết | Gamification Service |
| `CommentCreatedEvent` | Tạo bình luận | Notification Service |

---

## 7. Phân chia Phase triển khai

### Phase 1 — Foundation (Ưu tiên cao nhất) ⏱️ ~2 ngày
- [x] Khởi tạo NestJS project (`npx -y @nestjs/cli new discussion-service`)
- [ ] Cấu hình TypeORM + PostgreSQL (theo pattern của identity-service)
- [ ] Tạo entity: `Discussion`, `Tag`, join table `discussion_tags`
- [ ] Tạo `CurrentUser` decorator đọc header Gateway
- [ ] Tạo `RolesGuard` + `@Roles()` decorator
- [ ] Setup Dockerfile + `.env` + `.env.example`

### Phase 2 — CRUD Discussions ⏱️ ~2 ngày
- [ ] `POST /discussions` — tạo bài viết + validation
- [ ] `GET /discussions` — danh sách + phân trang + filter + sort
- [ ] `GET /discussions/:id` — chi tiết + tăng view
- [ ] `PATCH /discussions/:id` — cập nhật (kiểm tra ownership)
- [ ] `DELETE /discussions/:id` — soft delete

### Phase 3 — Comments ⏱️ ~1.5 ngày
- [ ] Entity `Comment` + relationship
- [ ] `POST /discussions/:id/comments` — tạo comment/reply
- [ ] `GET /discussions/:id/comments` — danh sách phân cấp
- [ ] `PATCH /comments/:id` + `DELETE /comments/:id`
- [ ] Đồng bộ `comment_count` trên discussion

### Phase 4 — Votes ⏱️ ~1 ngày
- [ ] Entity `Vote` + unique constraint
- [ ] `POST /discussions/:id/vote` + `POST /comments/:id/vote`
- [ ] Toggle logic (vote, un-vote, change vote)
- [ ] Đồng bộ `upvote_count` / `downvote_count`

### Phase 5 — Accepted Answer ⏱️ ~0.5 ngày
- [ ] `PATCH /discussions/:id/accept/:commentId`
- [ ] Chuyển trạng thái → SOLVED
- [ ] Validation: chỉ cho QUESTION, kiểm tra quyền

### Phase 6 — Tags Management ⏱️ ~0.5 ngày
- [ ] CRUD Tag (admin/moderator only)
- [ ] `GET /tags` — public, hỗ trợ search + pagination

### Phase 7 — Integration ⏱️ ~1 ngày
- [ ] Thêm routes vào `gateway.json`
- [ ] Thêm service vào `docker-compose.yml`
- [ ] Cập nhật `gateway/.env` + `.env.example`
- [ ] Test end-to-end qua Gateway
- [ ] Cập nhật `README.md`

---

## 8. Biến môi trường (`.env.example`)

```env
# ===== SERVER =====
PORT=8084

# ===== DATABASE (PostgreSQL) =====
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_db_password
DB_NAME=discussion_db
```

> [!NOTE]
> Discussion Service dùng **database riêng** (`discussion_db`) theo nguyên tắc Database-per-Service.  
> Hiện tại chung PostgreSQL instance, tách DB bằng tên database.

---

## 9. Tech Stack tổng hợp

| Component | Technology | Lý do chọn |
|---|---|---|
| Runtime | Node.js 20+ | Thống nhất với identity-service |
| Framework | NestJS 10 | Modular, DI, decorator-based — giống identity-service |
| ORM | TypeORM 0.3 | Đã dùng ở identity-service, entity-based |
| Database | PostgreSQL 16 | Đã có sẵn trong docker-compose |
| Validation | class-validator + class-transformer | Pattern đã có |
| Containerization | Docker + Docker Compose | Đã setup sẵn |

> [!TIP]
> Không dùng Redis cho Discussion Service ở phase đầu. Nếu cần cache (hot posts, view count throttle), sẽ thêm sau.

---

## 10. Câu hỏi cần xác nhận

1. **Database riêng hay chung?** Theo DDD nên tách `discussion_db`, nhưng PostgreSQL instance có thể dùng chung → chỉ tách bằng tên database. Có cần tạo PostgreSQL instance riêng không?

2. **Message Broker**: Phase đầu chưa tích hợp Kafka/RabbitMQ. Domain Events sẽ được thiết kế sẵn interface nhưng chưa publish thật. OK không?

3. **Gateway wildcard routing**: Gateway hiện tại define route từng endpoint cụ thể. Discussion Service có nhiều route lồng nhau (`/discussions/:id/comments`, `/discussions/:id/vote`). Gateway có hỗ trợ path parameter matching không, hay cần thêm logic mới?

4. **Media validation**: Khi tạo bài viết có `mediaIds`, Discussion Service chỉ lưu ID mà không verify ID có tồn tại trên Media Service. Đây là đúng ý không?

5. **Ẩn danh**: Khi bài viết ẩn danh, `authorId` vẫn lưu trong DB (cho admin bóc mác), nhưng API response không trả `authorId` cho user thường. Đúng logic không?
