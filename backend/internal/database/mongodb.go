package database

import (
	"context"
	"fmt"
	"time"

	"employee-management/internal/config"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var Client *mongo.Client
var EmployeeCollection *mongo.Collection

func ConnectMongoDB(cfg *config.Config) error {
	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	if cfg == nil || cfg.MongoURI == "" {
		return fmt.Errorf("invalid MongoDB configuration")
	}

	serverAPI := options.ServerAPI(options.ServerAPIVersion1)

	opts := options.Client().
		ApplyURI(cfg.MongoURI).
		SetServerAPIOptions(serverAPI)

	client, err := mongo.Connect(opts)
	if err != nil {
		return err
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		return err
	}

	Client = client

	dbName := cfg.MongoDBName
	if dbName == "" {
		dbName = "employee_management"
	}

	EmployeeCollection = client.
		Database(dbName).
		Collection("employees")

	fmt.Println("✅ MongoDB connected successfully")

	return nil
}
