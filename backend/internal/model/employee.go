package model

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Employee struct {
	ID         bson.ObjectID `json:"id" bson:"_id,omitempty"`
	Name       string        `json:"name" bson:"name"`
	Age        int           `json:"age" bson:"age"`
	Department string        `json:"department" bson:"department"`
	Email      string        `json:"email" bson:"email"`
}

type OTP struct {
	Email     string    `json:"email"`
	Code      string    `json:"code"`
	ExpiresAt time.Time `json:"expiresAt"`
	Attempts  int       `json:"attempts"`
}
