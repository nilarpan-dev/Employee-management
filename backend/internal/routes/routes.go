package routes

import (
	"fmt"
	"net/http"
	"strings"

	"employee-management/internal/handler"
	"employee-management/internal/middleware"
)

func home(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Welcome to Employee Management API!")
}

func employeesHandler(w http.ResponseWriter, r *http.Request) {
	// Search employees
	if r.URL.Path == "/employees/search" {
		if r.Method == http.MethodGet {
			handler.SearchEmployees(w, r)
			return
		}

		http.Error(
			w,
			"Method not allowed",
			http.StatusMethodNotAllowed,
		)
		return
	}

	// Employee operations using ID: /employees/{id}
	if strings.HasPrefix(r.URL.Path, "/employees/") {
		switch r.Method {
		case http.MethodPut:
			handler.UpdateEmployee(w, r)
		case http.MethodDelete:
			handler.DeleteEmployee(w, r)
		default:
			http.Error(
				w,
				"Method not allowed",
				http.StatusMethodNotAllowed,
			)
		}
		return
	}

	// /employees
	switch r.Method {
	case http.MethodGet:
		handler.GetEmployees(w, r)
	case http.MethodPost:
		handler.CreateEmployee(w, r)
	default:
		http.Error(
			w,
			"Method not allowed",
			http.StatusMethodNotAllowed,
		)
	}
}

func SetupRoutes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/", home)
	mux.HandleFunc("/employees/request-otp", handler.RequestOTP)
	mux.HandleFunc("/employees/verify-otp", handler.VerifyOTP)
	mux.HandleFunc("/employees/", employeesHandler)
	mux.HandleFunc("/employees", employeesHandler)

	// Wrap mux with CORS then Logging middleware
	return middleware.Logging(middleware.CORS(mux))
}
