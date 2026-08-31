package main

import (
	"fmt"
	"net/http"

	"employee-management/internal/config"
	"employee-management/internal/database"
	"employee-management/internal/routes"
)

func main() {
	// Load environment configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Println("Warning loading configuration:", err)
	}

	// Connect to MongoDB
	err = database.ConnectMongoDB(cfg)
	if err != nil {
		fmt.Println("MongoDB connection failed:", err)
		return
	}

	// Setup routes with middleware stack
	router := routes.SetupRoutes()

	port := "8080"
	if cfg != nil && cfg.Port != "" {
		port = cfg.Port
	}

	fmt.Printf("🚀 Server running at http://localhost:%s\n", port)

	// Start server
	err = http.ListenAndServe(":"+port, router)
	if err != nil {
		fmt.Println("Server error:", err)
	}
}
