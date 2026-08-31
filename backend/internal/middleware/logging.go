package middleware

import (
	"log"
	"net/http"
	"time"
)

// responseWriterInterceptor captures the HTTP status code
type responseWriterInterceptor struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriterInterceptor) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		interceptor := &responseWriterInterceptor{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		next.ServeHTTP(interceptor, r)

		log.Printf(
			"[%s] %s %d (%v)",
			r.Method,
			r.URL.Path,
			interceptor.statusCode,
			time.Since(start),
		)
	})
}
