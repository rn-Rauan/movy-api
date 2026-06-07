---
config:
  layout: elk
---
erDiagram
	direction TB
	PLAN {
		int id PK
		PlanName name "unique"
		decimal price
		int maxVehicles
		int maxDrivers
		int maxMonthlyTrips
		int durationDays "default 30"
		boolean isActive
		datetime createdAt
		datetime updatedAt
	}

	ORGANIZATION {
		string id PK
		string name
		string cnpj "unique"
		string email "unique"
		string telephone
		string address
		string slug "unique"
		Status status
		datetime createdAt
		datetime updatedAt
	}

	SUBSCRIPTION {
		string id PK
		string organizationId FK
		int planId FK
		SubscriptionStatus status
		string activeKey "unique, nullable"
		datetime startDate
		datetime expiresAt
		datetime createdAt
		datetime updatedAt
	}

	ROLE {
		int id PK
		RoleName name "unique"
		datetime createdAt
		datetime updatedAt
	}

	USER {
		string id PK
		string name
		string email "unique"
		string passwordHash
		string telephone
		Status status
		datetime emailVerifiedAt "nullable"
		datetime createdAt
		datetime updatedAt
	}

	ORGANIZATION_MEMBERSHIP {
		string userId PK,FK
		int roleId PK,FK
		string organizationId PK,FK
		datetime assignedAt
		datetime removedAt "nullable (soft delete)"
	}

	DRIVER {
		string id PK
		string userId FK "unique"
		string cnh "unique"
		string[] cnhCategories "A-E"
		datetime cnhExpiresAt
		DriverStatus driverStatus
		datetime createdAt
		datetime updatedAt
	}

	VEHICLE {
		string id PK
		string plate "unique"
		string model
		VehicleType type
		int maxCapacity
		Status status
		string organizationId FK
		datetime createdAt
		datetime updatedAt
	}

	TRIP_TEMPLATE {
		string id PK
		string organizationId FK
		string departurePoint
		string destination
		DayOfWeek[] frequency
		string[] stops
		string departureTimeOfDay "HH:mm UTC"
		string arrivalTimeOfDay "HH:mm UTC"
		int defaultCapacity "nullable"
		string defaultDriverId FK "nullable"
		string defaultVehicleId FK "nullable"
		decimal priceOneWay "nullable"
		decimal priceReturn "nullable"
		decimal priceRoundTrip "nullable"
		boolean isPublic
		boolean isRecurring
		boolean autoCancelEnabled
		decimal minRevenue "nullable"
		int autoCancelOffset "min, nullable"
		Status status
		Shift shift
		datetime createdAt
		datetime updatedAt
	}

	TRIP_INSTANCE {
		string id PK
		string tripTemplateId FK
		string organizationId FK
		string driverId FK "nullable"
		string vehicleId FK "nullable"
		TripStatus tripStatus
		decimal minRevenue "nullable"
		datetime autoCancelAt "nullable"
		boolean forceConfirm
		int totalCapacity
		boolean isPublic
		datetime departureTime
		datetime arrivalEstimate
		datetime createdAt
		datetime updatedAt
	}

	TRIP_SCHEDULING_CONFIG {
		string id PK
		string organizationId FK "unique"
		int daysAhead "1-90, default 14"
		boolean enabled
		datetime createdAt
		datetime updatedAt
	}

	ENROLLMENT {
		string id PK
		string userId FK
		string tripInstanceId FK
		string organizationId FK
		Status status
		boolean presenceConfirmed
		EnrollmentType enrollmentType
		decimal recordedPrice
		string activeKey "unique, nullable"
		string boardingStop
		string alightingStop
		datetime enrollmentDate
		datetime createdAt
		datetime updatedAt
	}

	PAYMENT {
		string id PK
		string organizationId FK
		string enrollmentId FK "unique (1:1)"
		MethodPayment method
		decimal amount
		PaymentStatus status
		datetime createdAt
		datetime updatedAt
	}

	REFRESH_TOKEN {
		string jti PK
		string userId FK
		datetime expiresAt
		datetime createdAt
	}

	PASSWORD_RESET_TOKEN {
		string id PK
		string userId FK
		string tokenHash "unique (sha256)"
		datetime expiresAt
		datetime usedAt "nullable"
		datetime createdAt
	}

	EMAIL_VERIFICATION_TOKEN {
		string id PK
		string userId FK
		string tokenHash "unique (sha256)"
		datetime expiresAt
		datetime usedAt "nullable"
		datetime createdAt
	}

	AUDIT_LOG {
		string id PK
		string organizationId FK
		string userId FK
		string action
		json details "nullable"
		datetime timestamp
	}

	ORGANIZATION||--o{VEHICLE:"has"
	ORGANIZATION||--o{TRIP_TEMPLATE:"has"
	ORGANIZATION||--o{TRIP_INSTANCE:"has"
	ORGANIZATION||--o{PAYMENT:"has"
	ORGANIZATION||--o{ENROLLMENT:"has"
	ORGANIZATION||--o{AUDIT_LOG:"has"
	ORGANIZATION||--o{SUBSCRIPTION:"has"
	ORGANIZATION||--o{ORGANIZATION_MEMBERSHIP:"has"
	ORGANIZATION||--o|TRIP_SCHEDULING_CONFIG:"configures"
	PLAN||--o{SUBSCRIPTION:"defines"
	USER||--o{ORGANIZATION_MEMBERSHIP:"belongs"
	ROLE||--o{ORGANIZATION_MEMBERSHIP:"assigns"
	USER||--o|DRIVER:"is"
	USER||--o{ENROLLMENT:"makes"
	USER||--o{AUDIT_LOG:"performs"
	USER||--o{REFRESH_TOKEN:"owns"
	USER||--o{PASSWORD_RESET_TOKEN:"requests"
	USER||--o{EMAIL_VERIFICATION_TOKEN:"requests"
	DRIVER||--o{TRIP_INSTANCE:"drives"
	VEHICLE||--o{TRIP_INSTANCE:"used_in"
	TRIP_TEMPLATE||--o{TRIP_INSTANCE:"generates"
	DRIVER||--o{TRIP_TEMPLATE:"default_driver"
	VEHICLE||--o{TRIP_TEMPLATE:"default_vehicle"
	TRIP_INSTANCE||--o{ENROLLMENT:"has"
	ENROLLMENT||--o|PAYMENT:"generates"
