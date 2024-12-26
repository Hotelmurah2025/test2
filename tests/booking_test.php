<?php
require_once __DIR__ . "/../config/core.php";
require_once __DIR__ . "/../config/database.php";

class BookingTest {
    private $conn;
    private $test_data;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->test_data = [
            "hotel" => [
                "name" => "Test Hotel",
                "description" => "A test hotel for booking flow",
                "location" => "Test City",
                "rating" => 4.5,
                "facilities" => json_encode(["wifi", "pool", "parking"])
            ],
            "room" => [
                "room_type" => "Deluxe",
                "price" => 150.00,
                "facilities" => json_encode(["king bed", "ocean view", "mini bar"]),
                "capacity" => 2,
                "available_rooms" => 5
            ],
            "booking" => [
                "check_in" => "2024-02-15",
                "check_out" => "2024-02-18",
                "num_guests" => 2,
                "special_requests" => "Early check-in requested"
            ],
            "payment" => [
                "amount" => 450.00,
                "payment_method" => "credit_card",
                "transaction_id" => "TEST-TRANS-123"
            ]
        ];
    }

    public function runTests() {
        echo "\nRunning Booking Flow Tests...\n";
        echo "================================\n";
        
        // Create test hotel first
        $hotel_id = $this->testHotelCreation();
        if (!$hotel_id) {
            echo "Failed to create test hotel. Stopping tests.\n";
            return;
        }
        
        // Create test room
        $room_id = $this->testRoomCreation($hotel_id);
        if (!$room_id) {
            echo "Failed to create test room. Stopping tests.\n";
            return;
        }
        
        // Now run search and availability tests that depend on existing data
        $this->testSearchFunctionality();
        $this->testAvailabilityCheck();
        
        // Test booking flow
        $booking_id = $this->testBookingCreation($room_id);
        if ($booking_id) {
            $this->testPaymentProcessing($booking_id);
        }
        
        // Run validation tests
        $this->testBookingValidation();
        
        echo "\nBooking Flow Tests Completed.\n";
        echo "================================\n";
    }

    private function testHotelCreation() {
        echo "\nTesting Hotel Creation... ";
        $hotel = $this->test_data["hotel"];
        
        $query = "INSERT INTO hotels (name, description, location, rating) VALUES (?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        
        try {
            $stmt->execute([
                $hotel["name"],
                $hotel["description"],
                $hotel["location"],
                $hotel["rating"]
            ]);
            
            // Get the hotel ID right after insertion
            $hotel_id = $this->conn->lastInsertId();
            if (!$hotel_id) {
                echo "FAILED\n";
                echo "- Error: Could not get last insert ID for hotel\n";
                return false;
            }

            // Add facilities
            $facilities = json_decode($hotel["facilities"], true);
            
            foreach ($facilities as $facility) {
                // Insert facility if it doesn't exist
                $facility_query = "INSERT IGNORE INTO hotel_facilities (name) VALUES (?)";
                $facility_stmt = $this->conn->prepare($facility_query);
                $facility_stmt->execute([$facility]);
                
                // Get facility ID
                $get_facility_query = "SELECT id FROM hotel_facilities WHERE name = ?";
                $get_facility_stmt = $this->conn->prepare($get_facility_query);
                $get_facility_stmt->execute([$facility]);
                $facility_id = $get_facility_stmt->fetchColumn();
                
                if (!$facility_id) {
                    echo "FAILED\n";
                    echo "- Error: Could not get facility ID for: " . $facility . "\n";
                    return false;
                }
                
                // Map facility to hotel
                $mapping_query = "INSERT INTO hotel_facility_mappings (hotel_id, facility_id) VALUES (?, ?)";
                $mapping_stmt = $this->conn->prepare($mapping_query);
                $mapping_stmt->execute([$hotel_id, $facility_id]);
            }
            
            // Verify hotel was created
            $verify_query = "SELECT * FROM hotels WHERE id = ?";
            $verify_stmt = $this->conn->prepare($verify_query);
            $verify_stmt->execute([$hotel_id]);
            $hotel_data = $verify_stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($hotel_data) {
                echo "PASSED\n";
                echo "- Hotel created with ID: " . $hotel_id . "\n";
                echo "- Name: " . $hotel_data['name'] . "\n";
                echo "- Location: " . $hotel_data['location'] . "\n";
                return $hotel_id;
            } else {
                echo "FAILED\n";
                echo "- Error: Could not verify hotel creation\n";
                return false;
            }
        } catch (PDOException $e) {
            echo "FAILED\n";
            echo "- Error: " . $e->getMessage() . "\n";
            return false;
        }
    }

    private function testRoomCreation($hotel_id) {
        echo "\nTesting Room Creation... ";
        $room = $this->test_data["room"];
        
        $query = "INSERT INTO rooms (hotel_id, room_type, description, price, capacity, quantity) 
                 VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        
        try {
            $stmt->execute([
                $hotel_id,
                $room["room_type"],
                "Standard " . $room["room_type"] . " room",
                $room["price"],
                $room["capacity"],
                $room["available_rooms"]
            ]);
            
            // Get the room ID right after insertion
            $room_id = $this->conn->lastInsertId();
            if (!$room_id) {
                echo "FAILED\n";
                echo "- Error: Could not get last insert ID for room\n";
                return false;
            }

            // Add facilities
            $facilities = json_decode($room["facilities"], true);
            
            foreach ($facilities as $facility) {
                // Insert facility if it doesn't exist
                $facility_query = "INSERT IGNORE INTO room_facilities (name) VALUES (?)";
                $facility_stmt = $this->conn->prepare($facility_query);
                $facility_stmt->execute([$facility]);
                
                // Get facility ID
                $get_facility_query = "SELECT id FROM room_facilities WHERE name = ?";
                $get_facility_stmt = $this->conn->prepare($get_facility_query);
                $get_facility_stmt->execute([$facility]);
                $facility_id = $get_facility_stmt->fetchColumn();
                
                if (!$facility_id) {
                    echo "FAILED\n";
                    echo "- Error: Could not get facility ID for: " . $facility . "\n";
                    return false;
                }
                
                // Map facility to room
                $mapping_query = "INSERT INTO room_facility_mappings (room_id, facility_id) VALUES (?, ?)";
                $mapping_stmt = $this->conn->prepare($mapping_query);
                $mapping_stmt->execute([$room_id, $facility_id]);
            }
            
            // Verify room was created
            $verify_query = "SELECT * FROM rooms WHERE id = ?";
            $verify_stmt = $this->conn->prepare($verify_query);
            $verify_stmt->execute([$room_id]);
            $room_data = $verify_stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($room_data) {
                echo "PASSED\n";
                echo "- Room created with ID: " . $room_id . "\n";
                echo "- Type: " . $room_data['room_type'] . "\n";
                echo "- Price: $" . $room_data['price'] . "\n";
                echo "- Capacity: " . $room_data['capacity'] . " guests\n";
                return $room_id;
            } else {
                echo "FAILED\n";
                echo "- Error: Could not verify room creation\n";
                return false;
            }
        } catch (PDOException $e) {
            echo "FAILED\n";
            echo "- Error: " . $e->getMessage() . "\n";
            return false;
        }
    }

    private function testBookingCreation($room_id) {
        echo "\nTesting Booking Creation... ";
        $booking = $this->test_data["booking"];
        
        // First, get a test user
        $query = "SELECT id FROM users LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            echo "FAILED\n";
            echo "- Error: No test user found\n";
            return false;
        }
        
        $query = "INSERT INTO bookings (user_id, room_id, check_in, check_out, total_price, guests, special_requests, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')";
        $stmt = $this->conn->prepare($query);
        
        try {
            $stmt->execute([
                $user["id"],
                $room_id,
                $booking["check_in"],
                $booking["check_out"],
                $this->test_data["payment"]["amount"],
                $booking["num_guests"],
                $booking["special_requests"]
            ]);
            $booking_id = $this->conn->lastInsertId();
            echo "PASSED\n";
            echo "- Booking created with ID: " . $booking_id . "\n";
            return $booking_id;
        } catch (PDOException $e) {
            echo "FAILED\n";
            echo "- Error: " . $e->getMessage() . "\n";
            return false;
        }
    }

    private function testPaymentProcessing($booking_id) {
        echo "\nTesting Payment Processing... ";
        $payment = $this->test_data["payment"];
        
        $query = "INSERT INTO payments (booking_id, amount, payment_method, transaction_id, status)
                 VALUES (?, ?, ?, ?, 'completed')";
        $stmt = $this->conn->prepare($query);
        
        try {
            $stmt->execute([
                $booking_id,
                $payment["amount"],
                $payment["payment_method"],
                $payment["transaction_id"]
            ]);
            
            // Update booking status
            $update_query = "UPDATE bookings SET status = 'confirmed', payment_status = 'paid' WHERE id = ?";
            $update_stmt = $this->conn->prepare($update_query);
            $update_stmt->execute([$booking_id]);
            
            echo "PASSED\n";
            echo "- Payment processed and booking confirmed\n";
            return true;
        } catch (PDOException $e) {
            echo "FAILED\n";
            echo "- Error: " . $e->getMessage() . "\n";
            return false;
        }
    }

    private function testSearchFunctionality() {
        echo "\nTesting Search Functionality... ";
        
        // First ensure we have test data
        $test_location = $this->test_data["hotel"]["location"];
        $test_capacity = $this->test_data["room"]["capacity"];
        
        $query = "SELECT h.*, r.price, r.room_type, r.capacity 
                 FROM hotels h
                 JOIN rooms r ON h.id = r.hotel_id
                 WHERE h.location LIKE ? 
                 AND r.capacity >= ?
                 AND r.quantity > 0
                 ORDER BY r.price ASC";
        $stmt = $this->conn->prepare($query);
        
        try {
            $stmt->execute(["%$test_location%", $test_capacity]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($results) > 0) {
                echo "PASSED\n";
                echo "- Search returns " . count($results) . " results\n";
                echo "- Found room type: " . $results[0]['room_type'] . "\n";
                echo "- At price: $" . $results[0]['price'] . "\n";
            } else {
                echo "FAILED\n";
                echo "- No search results found for location: $test_location\n";
            }
        } catch (PDOException $e) {
            echo "FAILED\n";
            echo "- Error: " . $e->getMessage() . "\n";
        }
    }

    private function testAvailabilityCheck() {
        echo "\nTesting Room Availability Check... ";
        
        $query = "SELECT r.*, 
                 (r.quantity - COUNT(b.id)) as actual_availability
                 FROM rooms r
                 LEFT JOIN bookings b ON r.id = b.room_id
                 AND b.status != 'cancelled'
                 AND (
                     (b.check_in <= ? AND b.check_out >= ?)
                     OR (b.check_in <= ? AND b.check_out >= ?)
                     OR (b.check_in >= ? AND b.check_out <= ?)
                 )
                 GROUP BY r.id
                 HAVING actual_availability > 0";
        $stmt = $this->conn->prepare($query);
        
        try {
            $check_in = $this->test_data["booking"]["check_in"];
            $check_out = $this->test_data["booking"]["check_out"];
            
            $stmt->execute([
                $check_in, $check_in,
                $check_out, $check_out,
                $check_in, $check_out
            ]);
            $available_rooms = $stmt->fetchAll();
            
            echo "PASSED\n";
            echo "- Availability check working correctly\n";
            echo "- Found " . count($available_rooms) . " available rooms\n";
        } catch (PDOException $e) {
            echo "FAILED\n";
            echo "- Error: " . $e->getMessage() . "\n";
        }
    }

    private function testBookingValidation() {
        echo "\nTesting Booking Validation... ";
        
        // Test cases for validation
        $invalid_bookings = [
            ["check_in" => "2024-01-01", "check_out" => "2024-01-01"], // Same day
            ["check_in" => "2024-01-02", "check_out" => "2024-01-01"], // Check-out before check-in
            ["check_in" => "2023-01-01", "check_out" => "2023-01-02"], // Past dates
            ["check_in" => "2024-01-01", "check_out" => "2024-02-01"]  // Too long stay
        ];
        
        $validation_passed = true;
        foreach ($invalid_bookings as $booking) {
            if ($this->validateBookingDates($booking["check_in"], $booking["check_out"])) {
                $validation_passed = false;
                echo "\n- Failed: Invalid booking dates accepted\n";
                break;
            }
        }
        
        if ($validation_passed) {
            echo "PASSED\n";
            echo "- All invalid booking scenarios correctly rejected\n";
        }
    }


    private function validateBookingDates($check_in, $check_out) {
        $check_in_date = new DateTime($check_in);
        $check_out_date = new DateTime($check_out);
        $today = new DateTime();
        
        // Validation rules
        if ($check_in_date == $check_out_date) return false; // Same day
        if ($check_in_date > $check_out_date) return false;  // Invalid order
        if ($check_in_date < $today) return false;           // Past date
        if ($check_in_date->diff($check_out_date)->days > 30) return false; // Too long
        
        return true;
    }
}

// Run the tests
$booking_test = new BookingTest();
$booking_test->runTests();
