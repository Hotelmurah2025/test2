-- MySQL Schema for Hotel Booking System

-- Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Hotels Table
CREATE TABLE hotels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    rating DECIMAL(2,1) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Hotel Images Table
CREATE TABLE hotel_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Hotel Facilities Table
CREATE TABLE hotel_facilities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    UNIQUE KEY unique_facility_name (name)
);

-- Hotel Facilities Bridge Table
CREATE TABLE hotel_facility_mappings (
    hotel_id INT NOT NULL,
    facility_id INT NOT NULL,
    PRIMARY KEY (hotel_id, facility_id),
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES hotel_facilities(id) ON DELETE CASCADE
);

-- Rooms Table
CREATE TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id INT NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    capacity INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Room Facilities Table
CREATE TABLE room_facilities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    UNIQUE KEY unique_facility_name (name)
);

-- Room Facilities Bridge Table
CREATE TABLE room_facility_mappings (
    room_id INT NOT NULL,
    facility_id INT NOT NULL,
    PRIMARY KEY (room_id, facility_id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES room_facilities(id) ON DELETE CASCADE
);

-- Bookings Table
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_requests TEXT,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmation_code VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Payments Table
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'bank_transfer', 'e_wallet') NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Reviews Table
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    hotel_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX idx_hotel_location ON hotels(location);
CREATE INDEX idx_room_price ON rooms(price);
CREATE INDEX idx_booking_dates ON bookings(check_in, check_out);
CREATE INDEX idx_booking_status ON bookings(status);
CREATE INDEX idx_payment_status ON payments(status);
CREATE INDEX idx_hotel_rating ON hotels(rating);
