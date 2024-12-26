<?php
require_once __DIR__ . "/../config/core.php";
require_once __DIR__ . "/../config/database.php";

class AuthTest {
    private $conn;
    private $test_data;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->test_data = json_decode(file_get_contents(__DIR__ . "/data/users.json"), true);
    }

    public function runTests() {
        echo "Running Authentication Tests...\n";
        
        $this->testRegistration();
        $this->testLogin();
        $this->testInvalidLogin();
        $this->testAdminLogin();
        
        echo "Authentication Tests Completed.\n";
    }

    private function testRegistration() {
        echo "Testing User Registration... ";
        $user = $this->test_data["users"][0];
        
        $query = "INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        $hashed_password = password_hash($user["password"], PASSWORD_DEFAULT);
        
        try {
            $stmt->execute([$user["email"], $hashed_password, $user["full_name"]]);
            echo "PASSED\n";
        } catch (PDOException $e) {
            echo "FAILED: " . $e->getMessage() . "\n";
        }
    }

    private function testLogin() {
        echo "Testing User Login... ";
        $user = $this->test_data["users"][0];
        
        $query = "SELECT * FROM users WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$user["email"]]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result && password_verify($user["password"], $result["password"])) {
            echo "PASSED\n";
        } else {
            echo "FAILED\n";
        }
    }

    private function testInvalidLogin() {
        echo "Testing Invalid Login... ";
        
        $query = "SELECT * FROM users WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(["invalid@example.com"]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            echo "PASSED\n";
        } else {
            echo "FAILED\n";
        }
    }

    private function testAdminLogin() {
        echo "Testing Admin Login... ";
        $admin = $this->test_data["users"][1];
        
        $query = "INSERT INTO users (email, password, full_name, is_admin) VALUES (?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        $hashed_password = password_hash($admin["password"], PASSWORD_DEFAULT);
        
        try {
            $stmt->execute([$admin["email"], $hashed_password, $admin["full_name"], true]);
            echo "PASSED\n";
        } catch (PDOException $e) {
            echo "FAILED: " . $e->getMessage() . "\n";
        }
    }
}

// Run the tests
$auth_test = new AuthTest();
$auth_test->runTests();
