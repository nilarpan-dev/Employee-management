package utils

import (
	"fmt"
	"regexp"
	"strings"

	"employee-management/internal/model"
)

var emailRegex = regexp.MustCompile(
	`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`,
)

func ValidateEmployee(employee model.Employee) error {
	if strings.TrimSpace(employee.Name) == "" {
		return fmt.Errorf("name is required")
	}

	if employee.Age < 18 || employee.Age > 100 {
		return fmt.Errorf("age must be between 18 and 100")
	}

	if strings.TrimSpace(employee.Department) == "" {
		return fmt.Errorf("department is required")
	}

	if !emailRegex.MatchString(employee.Email) {
		return fmt.Errorf("invalid email format")
	}

	return nil
}
