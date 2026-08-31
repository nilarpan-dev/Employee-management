package handler

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"net/smtp"
	"os"
	"strings"
	"sync"
	"time"

	"employee-management/internal/database"
	"employee-management/internal/model"
	"employee-management/internal/utils"

	"go.mongodb.org/mongo-driver/v2/bson"
)

var (
	otpStore = make(map[string]model.OTP)
	otpMutex sync.Mutex
)

// =========================
// EMPLOYEE HANDLERS
// =========================

// GetEmployees fetches all employees
func GetEmployees(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	cursor, err := database.EmployeeCollection.Find(
		ctx,
		bson.M{},
	)
	if err != nil {
		http.Error(
			w,
			"Failed to fetch employees",
			http.StatusInternalServerError,
		)
		return
	}
	defer cursor.Close(ctx)

	var employees []model.Employee
	err = cursor.All(ctx, &employees)
	if err != nil {
		http.Error(
			w,
			"Failed to read employees",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(employees)
}

// CreateEmployee adds a new employee
func CreateEmployee(w http.ResponseWriter, r *http.Request) {
	var newEmployee model.Employee

	err := json.NewDecoder(r.Body).Decode(&newEmployee)
	if err != nil {
		http.Error(
			w,
			"Invalid JSON",
			http.StatusBadRequest,
		)
		return
	}

	// Validate employee
	if err := utils.ValidateEmployee(newEmployee); err != nil {
		http.Error(
			w,
			err.Error(),
			http.StatusBadRequest,
		)
		return
	}

	// Generate MongoDB ID
	newEmployee.ID = bson.NewObjectID()

	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	_, err = database.EmployeeCollection.InsertOne(
		ctx,
		newEmployee,
	)
	if err != nil {
		http.Error(
			w,
			"Failed to create employee",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(newEmployee)
}

// UpdateEmployee updates an existing employee
func UpdateEmployee(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(
		r.URL.Path,
		"/employees/",
	)

	id, err := bson.ObjectIDFromHex(idStr)
	if err != nil {
		http.Error(
			w,
			"Invalid employee ID",
			http.StatusBadRequest,
		)
		return
	}

	var updatedEmployee model.Employee
	err = json.NewDecoder(r.Body).Decode(&updatedEmployee)
	if err != nil {
		http.Error(
			w,
			"Invalid JSON",
			http.StatusBadRequest,
		)
		return
	}

	// Validate updated employee
	if err := utils.ValidateEmployee(updatedEmployee); err != nil {
		http.Error(
			w,
			err.Error(),
			http.StatusBadRequest,
		)
		return
	}

	// Keep the original ID
	updatedEmployee.ID = id

	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	filter := bson.M{"_id": id}
	update := bson.M{"$set": updatedEmployee}

	result, err := database.EmployeeCollection.UpdateOne(
		ctx,
		filter,
		update,
	)
	if err != nil {
		http.Error(
			w,
			"Failed to update employee",
			http.StatusInternalServerError,
		)
		return
	}

	if result.MatchedCount == 0 {
		http.Error(
			w,
			"Employee not found",
			http.StatusNotFound,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedEmployee)
}

// DeleteEmployee removes an employee by ID
func DeleteEmployee(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(
		r.URL.Path,
		"/employees/",
	)

	id, err := bson.ObjectIDFromHex(idStr)
	if err != nil {
		http.Error(
			w,
			"Invalid employee ID",
			http.StatusBadRequest,
		)
		return
	}

	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	result, err := database.EmployeeCollection.DeleteOne(
		ctx,
		bson.M{"_id": id},
	)
	if err != nil {
		http.Error(
			w,
			"Failed to delete employee",
			http.StatusInternalServerError,
		)
		return
	}

	if result.DeletedCount == 0 {
		http.Error(
			w,
			"Employee not found",
			http.StatusNotFound,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(
		map[string]string{
			"message": "Employee deleted successfully",
		},
	)
}

// SearchEmployees searches employees by name query
func SearchEmployees(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")

	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	filter := bson.M{
		"name": bson.M{
			"$regex":   name,
			"$options": "i",
		},
	}

	cursor, err := database.EmployeeCollection.Find(
		ctx,
		filter,
	)
	if err != nil {
		http.Error(
			w,
			"Failed to search employees",
			http.StatusInternalServerError,
		)
		return
	}
	defer cursor.Close(ctx)

	var employees []model.Employee
	err = cursor.All(ctx, &employees)
	if err != nil {
		http.Error(
			w,
			"Failed to read search results",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(employees)
}

// =========================
// OTP & EMAIL HANDLERS
// =========================

// RequestOTP generates and sends an OTP
func RequestOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		Email string `json:"email"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	email := strings.TrimSpace(request.Email)
	if email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	otp, err := generateOTP()
	if err != nil {
		http.Error(w, "Failed to generate OTP", http.StatusInternalServerError)
		return
	}

	// Store OTP for 5 minutes
	otpMutex.Lock()
	otpStore[email] = model.OTP{
		Email:     email,
		Code:      otp,
		ExpiresAt: time.Now().Add(5 * time.Minute),
		Attempts:  0,
	}
	otpMutex.Unlock()

	// Send OTP email
	err = sendOTPEmail(email, otp)
	if err != nil {
		fmt.Println("EMAIL ERROR:", err)
		http.Error(
			w,
			"Failed to send OTP email: "+err.Error(),
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "OTP sent successfully",
	})
}

// VerifyOTP verifies the OTP entered by the user
func VerifyOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		Email string `json:"email"`
		OTP   string `json:"otp"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	email := strings.TrimSpace(request.Email)
	otp := strings.TrimSpace(request.OTP)

	if email == "" || otp == "" {
		http.Error(
			w,
			"Email and OTP are required",
			http.StatusBadRequest,
		)
		return
	}

	otpMutex.Lock()
	data, exists := otpStore[email]

	if !exists {
		otpMutex.Unlock()
		http.Error(
			w,
			"No OTP found. Please request a new OTP.",
			http.StatusBadRequest,
		)
		return
	}

	// Check if OTP has expired
	if time.Now().After(data.ExpiresAt) {
		delete(otpStore, email)
		otpMutex.Unlock()
		http.Error(
			w,
			"OTP has expired. Please request a new OTP.",
			http.StatusBadRequest,
		)
		return
	}

	// Check maximum attempts
	if data.Attempts >= 5 {
		delete(otpStore, email)
		otpMutex.Unlock()
		http.Error(
			w,
			"Too many attempts. Please request a new OTP.",
			http.StatusTooManyRequests,
		)
		return
	}

	// Compare entered OTP with stored OTP
	if data.Code != otp {
		data.Attempts++
		otpStore[email] = data
		otpMutex.Unlock()
		http.Error(
			w,
			"Invalid OTP",
			http.StatusBadRequest,
		)
		return
	}

	// OTP is correct
	delete(otpStore, email)
	otpMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":  "Email verified successfully",
		"verified": true,
	})
}

// =========================
// HELPERS
// =========================

func generateOTP() (string, error) {
	max := big.NewInt(900000)
	number, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	otp := number.Int64() + 100000
	return fmt.Sprintf("%06d", otp), nil
}

func sendOTPEmail(toEmail string, otp string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	username := os.Getenv("SMTP_USERNAME")
	password := os.Getenv("SMTP_PASSWORD")

	auth := smtp.PlainAuth(
		"",
		username,
		password,
		host,
	)

	subject := "Employee Management - Email Verification"
	body := fmt.Sprintf(
		"Your OTP for Employee Management is: %s\n\nThis OTP will expire in 5 minutes.\n\nIf you did not request this OTP, please ignore this email.",
		otp,
	)

	message := []byte(
		"From: " + username + "\r\n" +
			"To: " + toEmail + "\r\n" +
			"Subject: " + subject + "\r\n" +
			"\r\n" +
			body,
	)

	return smtp.SendMail(
		host+":"+port,
		auth,
		username,
		[]string{toEmail},
		message,
	)
}
