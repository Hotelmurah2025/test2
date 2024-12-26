# Hotel Booking Website API Endpoints

## Authentication Endpoints

### 1. User Registration
- **Endpoint:** `/api/auth/register`
- **Method:** POST
- **Parameters:**
  ```json
  {
    "full_name": "string",
    "email": "string",
    "password": "string",
    "confirm_password": "string"
  }
  ```
- **Response:** 
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "user_id": "integer"
  }
  ```

### 2. User Login
- **Endpoint:** `/api/auth/login`
- **Method:** POST
- **Parameters:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "string",
    "user": {
      "id": "integer",
      "full_name": "string",
      "email": "string"
    }
  }
  ```

## Hotel Search Endpoints

### 1. Search Hotels
- **Endpoint:** `/api/hotels/search`
- **Method:** GET
- **Parameters:**
  ```
  location: string
  check_in: date
  check_out: date
  guests: integer
  rooms: integer
  price_min?: number
  price_max?: number
  rating?: number
  facilities?: string[]
  ```
- **Response:**
  ```json
  {
    "hotels": [
      {
        "id": "integer",
        "name": "string",
        "description": "string",
        "location": "string",
        "rating": "float",
        "price_range": {
          "min": "number",
          "max": "number"
        },
        "available_rooms": "integer",
        "thumbnail": "string",
        "facilities": ["string"]
      }
    ],
    "total": "integer",
    "page": "integer",
    "per_page": "integer"
  }
  ```

### 2. Get Hotel Details
- **Endpoint:** `/api/hotels/{hotel_id}`
- **Method:** GET
- **Response:**
  ```json
  {
    "id": "integer",
    "name": "string",
    "description": "string",
    "location": "string",
    "rating": "float",
    "images": ["string"],
    "facilities": ["string"],
    "rooms": [
      {
        "id": "integer",
        "room_type": "string",
        "price": "number",
        "facilities": ["string"],
        "available": "boolean"
      }
    ],
    "reviews": [
      {
        "user_name": "string",
        "rating": "integer",
        "comment": "string",
        "date": "datetime"
      }
    ]
  }
  ```

## Booking Endpoints

### 1. Create Booking
- **Endpoint:** `/api/bookings`
- **Method:** POST
- **Auth Required:** Yes
- **Parameters:**
  ```json
  {
    "hotel_id": "integer",
    "room_id": "integer",
    "check_in": "date",
    "check_out": "date",
    "guests": "integer",
    "special_requests": "string",
    "total_price": "number"
  }
  ```
- **Response:**
  ```json
  {
    "booking_id": "integer",
    "status": "string",
    "payment_required": "number"
  }
  ```

### 2. Process Payment
- **Endpoint:** `/api/payments`
- **Method:** POST
- **Auth Required:** Yes
- **Parameters:**
  ```json
  {
    "booking_id": "integer",
    "payment_method": "string",
    "amount": "number",
    "payment_details": {
      "card_number": "string",
      "expiry": "string",
      "cvv": "string"
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "transaction_id": "string",
    "booking_confirmation": {
      "booking_id": "integer",
      "confirmation_code": "string",
      "check_in": "date",
      "check_out": "date",
      "hotel_name": "string",
      "room_type": "string"
    }
  }
  ```

## User Dashboard Endpoints

### 1. Get User Bookings
- **Endpoint:** `/api/user/bookings`
- **Method:** GET
- **Auth Required:** Yes
- **Parameters:**
  ```
  status?: string (all/upcoming/past)
  page?: integer
  per_page?: integer
  ```
- **Response:**
  ```json
  {
    "bookings": [
      {
        "id": "integer",
        "hotel_name": "string",
        "room_type": "string",
        "check_in": "date",
        "check_out": "date",
        "status": "string",
        "total_price": "number",
        "booking_date": "datetime",
        "confirmation_code": "string"
      }
    ],
    "total": "integer",
    "page": "integer",
    "per_page": "integer"
  }
  ```

### 2. Get Booking Details
- **Endpoint:** `/api/user/bookings/{booking_id}`
- **Method:** GET
- **Auth Required:** Yes
- **Response:**
  ```json
  {
    "booking_details": {
      "id": "integer",
      "hotel": {
        "name": "string",
        "location": "string",
        "contact": "string"
      },
      "room": {
        "type": "string",
        "facilities": ["string"]
      },
      "check_in": "date",
      "check_out": "date",
      "guests": "integer",
      "special_requests": "string",
      "status": "string",
      "payment": {
        "amount": "number",
        "method": "string",
        "status": "string",
        "transaction_id": "string"
      },
      "confirmation_code": "string"
    }
  }
  ```

### 3. Download Booking Voucher
- **Endpoint:** `/api/user/bookings/{booking_id}/voucher`
- **Method:** GET
- **Auth Required:** Yes
- **Response:** PDF file

## Admin Endpoints

### 1. Hotel Management
- **Endpoint:** `/api/admin/hotels`
- **Methods:** 
  - GET (list all)
  - POST (create)
  - PUT /{hotel_id} (update)
  - DELETE /{hotel_id} (delete)
- **Auth Required:** Yes (Admin only)
- **POST/PUT Parameters:**
  ```json
  {
    "name": "string",
    "description": "string",
    "location": "string",
    "facilities": ["string"],
    "images": ["string"]
  }
  ```

### 2. Room Management
- **Endpoint:** `/api/admin/hotels/{hotel_id}/rooms`
- **Methods:**
  - GET (list all)
  - POST (create)
  - PUT /{room_id} (update)
  - DELETE /{room_id} (delete)
- **Auth Required:** Yes (Admin only)
- **POST/PUT Parameters:**
  ```json
  {
    "room_type": "string",
    "price": "number",
    "facilities": ["string"],
    "capacity": "integer"
  }
  ```

### 3. Booking Management
- **Endpoint:** `/api/admin/bookings`
- **Method:** GET
- **Auth Required:** Yes (Admin only)
- **Parameters:**
  ```
  status?: string
  date_from?: date
  date_to?: date
  hotel_id?: integer
  page?: integer
  per_page?: integer
  ```
- **Response:**
  ```json
  {
    "bookings": [
      {
        "id": "integer",
        "user": {
          "name": "string",
          "email": "string"
        },
        "hotel": {
          "name": "string",
          "location": "string"
        },
        "room_type": "string",
        "check_in": "date",
        "check_out": "date",
        "status": "string",
        "payment_status": "string",
        "total_price": "number",
        "booking_date": "datetime"
      }
    ],
    "total": "integer",
    "page": "integer",
    "per_page": "integer"
  }
  ```

### 4. Generate Reports
- **Endpoint:** `/api/admin/reports`
- **Method:** GET
- **Auth Required:** Yes (Admin only)
- **Parameters:**
  ```
  type: string (bookings/revenue)
  date_from: date
  date_to: date
  group_by?: string (day/week/month)
  hotel_id?: integer
  ```
- **Response:**
  ```json
  {
    "report_type": "string",
    "period": {
      "from": "date",
      "to": "date"
    },
    "data": [
      {
        "date": "string",
        "bookings": "integer",
        "revenue": "number"
      }
    ],
    "summary": {
      "total_bookings": "integer",
      "total_revenue": "number",
      "average_daily_bookings": "number",
      "average_daily_revenue": "number"
    }
  }
  ```

## Security Considerations

1. All endpoints will use HTTPS
2. Authentication using PHP sessions and tokens
3. Input validation using server-side validation
4. SQL injection prevention using prepared statements
5. CSRF protection for all POST/PUT/DELETE requests
6. Rate limiting for API endpoints
7. Input sanitization for all user inputs
8. Password hashing using password_hash()
9. Session management with secure session handling
10. Access control checks for protected endpoints
