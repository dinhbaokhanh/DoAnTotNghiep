package middleware

import "net/http"

// SecurityHeadersMiddleware inject các HTTP security header vào mọi response.
// Đặt ở tầng global (app.go) để áp dụng cho tất cả route kể cả /health.
//
// Giải thích từng header:
//
//   X-Content-Type-Options: nosniff
//     Ngăn trình duyệt "sniff" MIME type từ nội dung response.
//     Không có header này, browser có thể chạy file text/plain như JavaScript
//     nếu nội dung trông giống script — dẫn đến XSS.
//
//   X-Frame-Options: DENY
//     Ngăn trang web bị nhúng vào <iframe> của domain khác.
//     Chặn clickjacking: kẻ tấn công overlay iframe trong suốt lên trang thật
//     để lừa user click vào nút mà họ không thấy.
//
//   Referrer-Policy: strict-origin-when-cross-origin
//     Khi điều hướng cross-origin: chỉ gửi origin (không có path/query).
//     Khi same-origin: gửi đầy đủ URL.
//     Bảo vệ thông tin nhạy cảm trong URL (token, ID) không bị lộ qua Referer header.
//
//   X-XSS-Protection: 0
//     Tắt bộ lọc XSS tích hợp của trình duyệt cũ (IE/Chrome < 78).
//     Nghe có vẻ nghịch lý nhưng đây là khuyến nghị hiện đại:
//     bộ lọc này có thể bị bypass và chính nó tạo ra lỗ hổng XSS mới.
//     Trình duyệt hiện đại dùng CSP thay thế.
//
//   Permissions-Policy: camera=(), microphone=(), geolocation=()
//     Vô hiệu hóa quyền truy cập camera, microphone, geolocation cho trang web.
//     API mạng xã hội học thuật không cần các quyền này —
//     tắt đi giảm diện tích tấn công nếu có XSS.
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("X-XSS-Protection", "0")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		next.ServeHTTP(w, r)
	})
}
