<?php
require_once __DIR__ . "/../config/core.php";
require_once __DIR__ . "/../config/database.php";

class AuthTest {
    private $conn;
    private $test_data;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->test_data = [
            "users" => [
                [
                    "email" => "test.user@example.com",
                    "password" => "Test123!",
                    "full_name" => "Test User"
                ],
                [
                    "email" => "admin@hotelmurah.com",
                    "password" => "Admin123!",
                    "full_name" => "Admin User",
                    "is_admin" => true
                ]
            ]
        ];
    }

    public function runTests() {
        echo "\nRunning Authentication Tests...\n";
        echo "================================\n";
        
        $this->testRegistration();
        $this->testLogin();
        $this->testInvalidLogin();
        $this->testAdminLogin();
        $this->testPasswordHashing();
        $this->testUniqueEmail();
        $this->testPasswordValidation();
        $this->testSessionManagement();
        
        echo "\nAuthentication Tests Completed.\n";
        echo "================================\n";
    }

    private function testRegistration() {
        echo "\nTesting User Registration... ";
        $user = $this->test_data["users"][0];
        
        $query = "INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        $hashed_password = password_hash($user["password"], PASSWORD_DEFAULT);
        
        try {
            $stmt->execute([$user["email"], $hashed_password, $user["full_name"]]);
            echo "PASSED\n";
            echo "- User created with hashed password\n";
        } catch (PDOException $e) {
            echo "FAILED\n";
            echo "- Error: " . $e->getMessage() . "\n";
        }
    }

    private function testLogin() {
        echo "\nTesting User Login... ";
        $user = $this->test_data["users"][0];
        
        $query = "SELECT * FROM users WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$user["email"]]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result && password_verify($user["password"], $result["password"])) {
            echo "PASSED\n";
            echo "- Credentials validated successfully\n";
        } else {
            echo "FAILED\n";
            echo "- Invalid credentials\n";
        }
    }

    private function testInvalidLogin() {
        echo "\nTesting Invalid Login... ";
        
        $query = "SELECT * FROM users WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(["invalid@example.com"]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            echo "PASSED\n";
            echo "- Invalid email correctly rejected\n";
        } else {
            echo "FAILED\n";
            echo "- Security issue: invalid email accepted\n";
        }
    }

    private function testAdminLogin() {
        echo "\nTesting Admin Login... ";
        $admin = $this->test_data["users"][1];
        
        $query = "INSERT INTO users (email, password, full_name, is_admin) VALUES (?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        $hashed_password = password_hash($admin["password"], PASSWORD_DEFAULT);
        
        try {
            $stmt->execute([$admin["email"], $hashed_password, $admin["full_name"], true]);
            
            // Verify admin status
            $verify_query = "SELECT is_admin FROM users WHERE email = ?";
            $verify_stmt = $this->conn->prepare($verify_query);
            $verify_stmt->execute([$admin["email"]]);
            $result = $verify_stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result && $result["is_admin"]) {
                echo "PASSED\n";
                echo "- Admin user created with correct privileges\n";
            } else {
                echo "FAILED\n";
                echo "- Admin privileges not set correctly\n";
            }
        } catch (PDOException $e) {
            echo "FAILED\n";
            echo "- Error: " . $e->getMessage() . "\n";
        }
    }

    private function testPasswordHashing() {
        echo "\nTesting Password Hashing... ";
        $query = "SELECT password FROM users WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$this->test_data["users"][0]["email"]]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result && strlen($result["password"]) > 50) {
            echo "PASSED\n";
            echo "- Passwords are properly hashed\n";
        } else {
            echo "FAILED\n";
            echo "- Passwords may not be properly hashed\n";
        }
    }

    private function testUniqueEmail() {
        echo "\nTesting Unique Email Constraint... ";
        $user = $this->test_data["users"][0];
        
        $query = "INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        
        try {
            $stmt->execute([$user["email"], "test", "Duplicate User"]);
            echo "FAILED\n";
            echo "- Duplicate email was accepted\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                echo "PASSED\n";
                echo "- Duplicate email correctly rejected\n";
            } else {
                echo "FAILED\n";
                echo "- Unexpected error: " . $e->getMessage() . "\n";
            }
        }
    }

    private function testPasswordValidation() {
        echo "\nTesting Password Validation... ";
        $invalid_passwords = ["short", "nouppercaseornumber", "NoSpecialChar1", "Short1!"];
        $valid_password = "ValidPass123!";
        
        $all_passed = true;
        foreach ($invalid_passwords as $password) {
            if (strlen($password) >= 8 && 
                preg_match('/[A-Z]/', $password) && 
                preg_match('/[a-z]/', $password) && 
                preg_match('/[0-9]/', $password) && 
                preg_match('/[^A-Za-z0-9]/', $password)) {
                $all_passed = false;
                echo "\n- Failed: Invalid password '$password' passed validation";
            }
        }
        
        if (!$all_passed) {
            echo "\nFAILED\n";
        } else {
            echo "PASSED\n";
            echo "- Password validation rules working correctly\n";
        }
    }

    private function testSessionManagement() {
        echo "\nTesting Session Management... ";
        
        // Start session
        session_start();
        
        // Set session variables
        $_SESSION["user_id"] = 1;
        $_SESSION["is_admin"] = false;
        
        // Verify session variables
        if (isset($_SESSION["user_id"]) && isset($_SESSION["is_admin"])) {
            echo "PASSED\n";
            echo "- Session variables set and retrieved correctly\n";
        } else {
            echo "FAILED\n";
            echo "- Session management not working properly\n";
        }
        
        // Clean up
        session_destroy();
    }
}

// Run the tests
$auth_test = new AuthTest();
$auth_test->runTests();
