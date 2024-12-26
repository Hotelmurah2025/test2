<?php
require_once __DIR__ . "/../../config/core.php";
require_once __DIR__ . "/../../vendor/autoload.php";

use Facebook\WebDriver\Remote\DesiredCapabilities;
use Facebook\WebDriver\Remote\RemoteWebDriver;
use Facebook\WebDriver\WebDriverBy;
use Facebook\WebDriver\WebDriverExpectedCondition;
use Facebook\WebDriver\WebDriverWait;

class FrontendTest {
    private $driver;
    private $wait;
    private $baseUrl = "http://localhost:8080";

    public function __construct() {
        $host = 'http://localhost:4444/wd/hub';
        $capabilities = DesiredCapabilities::chrome();
        $this->driver = RemoteWebDriver::create($host, $capabilities);
        $this->wait = new WebDriverWait($this->driver, 10);
    }

    public function __destruct() {
        $this->driver->quit();
    }

    public function runTests() {
        echo "\nRunning Frontend Tests...\n";
        echo "================================\n\n";
        
        try {
            $this->testHomepage();
            $this->testLoginForm();
            $this->testRegistrationForm();
            $this->testSearchForm();
            $this->testBookingFlow();
            $this->testAdminPanel();
        } catch (\Exception $e) {
            echo "Test failed: " . $e->getMessage() . "\n";
            $this->driver->takeScreenshot('error_screenshot.png');
        }
    }
    
    private function testHomepage() {
        echo "Testing Homepage Components...\n";
        
        $this->driver->get($this->baseUrl);
        
        $required_fields = [
            "location" => ["type" => "text", "id" => "location"],
            "check_in" => ["type" => "date", "id" => "check-in"],
            "check_out" => ["type" => "date", "id" => "check-out"],
            "guests" => ["type" => "number", "id" => "guests"],
            "rooms" => ["type" => "number", "id" => "rooms"]
        ];
        
        foreach ($required_fields as $field => $config) {
            echo "- Checking $field field... ";
            try {
                $element = $this->driver->findElement(WebDriverBy::id($config['id']));
                $type = $element->getAttribute('type');
                if ($type === $config['type']) {
                    echo "PASSED\n";
                } else {
                    echo "FAILED (wrong type: $type)\n";
                }
            } catch (\Exception $e) {
                echo "FAILED (not found)\n";
            }
        }
    }
    
    private function testLoginForm() {
        echo "\nTesting Login Form...\n";
        
        $this->driver->get($this->baseUrl . "/login.html");
        
        // Test email validation
        echo "- Testing email validation... ";
        try {
            $emailField = $this->driver->findElement(WebDriverBy::id('email'));
            $emailField->sendKeys('invalid-email');
            $submitButton = $this->driver->findElement(WebDriverBy::id('login-submit'));
            $submitButton->click();
            
            $errorMessage = $this->wait->until(
                WebDriverExpectedCondition::presenceOfElementLocated(WebDriverBy::className('error-message'))
            );
            
            if ($errorMessage->isDisplayed()) {
                echo "PASSED\n";
            } else {
                echo "FAILED (no error shown)\n";
            }
        } catch (\Exception $e) {
            echo "FAILED (" . $e->getMessage() . ")\n";
        }
        
        // Test valid login
        echo "- Testing valid login... ";
        try {
            $emailField->clear();
            $emailField->sendKeys('test@example.com');
            $passwordField = $this->driver->findElement(WebDriverBy::id('password'));
            $passwordField->sendKeys('password123');
            $submitButton->click();
            
            $this->wait->until(
                WebDriverExpectedCondition::urlIs($this->baseUrl . "/dashboard.html")
            );
            echo "PASSED\n";
        } catch (\Exception $e) {
            echo "FAILED (" . $e->getMessage() . ")\n";
        }
    }
    
    private function testRegistrationForm() {
        echo "\nTesting Registration Form...\n";
        
        $this->driver->get($this->baseUrl . "/register.html");
        
        $testData = [
            'name' => 'Test User',
            'email' => 'test' . time() . '@example.com',
            'password' => 'Password123!',
            'confirm_password' => 'Password123!'
        ];
        
        try {
            foreach ($testData as $field => $value) {
                $element = $this->driver->findElement(WebDriverBy::id($field));
                $element->sendKeys($value);
            }
            
            $submitButton = $this->driver->findElement(WebDriverBy::id('register-submit'));
            $submitButton->click();
            
            $this->wait->until(
                WebDriverExpectedCondition::urlIs($this->baseUrl . "/login.html")
            );
            echo "- Registration successful\n";
        } catch (\Exception $e) {
            echo "- Registration failed: " . $e->getMessage() . "\n";
        }
    }
    
    private function testSearchForm() {
        echo "\nTesting Search Functionality...\n";
        
        $this->driver->get($this->baseUrl);
        
        try {
            // Fill search form
            $this->driver->findElement(WebDriverBy::id('location'))->sendKeys('Test City');
            $this->driver->findElement(WebDriverBy::id('check-in'))->sendKeys('2024-01-01');
            $this->driver->findElement(WebDriverBy::id('check-out'))->sendKeys('2024-01-05');
            $this->driver->findElement(WebDriverBy::id('guests'))->sendKeys('2');
            $this->driver->findElement(WebDriverBy::id('rooms'))->sendKeys('1');
            
            $searchButton = $this->driver->findElement(WebDriverBy::id('search-submit'));
            $searchButton->click();
            
            // Wait for results
            $results = $this->wait->until(
                WebDriverExpectedCondition::presenceOfAllElementsLocatedBy(WebDriverBy::className('hotel-result'))
            );
            
            echo "- Search results found: " . count($results) . "\n";
            
            // Test filters
            $priceFilter = $this->driver->findElement(WebDriverBy::id('price-filter'));
            $priceFilter->click();
            
            $this->wait->until(
                WebDriverExpectedCondition::stalenessOf($results[0])
            );
            
            echo "- Filters working\n";
        } catch (\Exception $e) {
            echo "- Search test failed: " . $e->getMessage() . "\n";
        }
    }
    
    private function testBookingFlow() {
        echo "\nTesting Booking Flow...\n";
        
        try {
            // Select a hotel
            $this->driver->findElement(WebDriverBy::className('book-now'))->click();
            
            // Select a room
            $this->wait->until(
                WebDriverExpectedCondition::presenceOfElementLocated(WebDriverBy::className('room-select'))
            )->click();
            
            // Fill booking details
            $this->wait->until(
                WebDriverExpectedCondition::presenceOfElementLocated(WebDriverBy::id('special-requests'))
            )->sendKeys('Test request');
            
            // Proceed to payment
            $this->driver->findElement(WebDriverBy::id('proceed-payment'))->click();
            
            // Select payment method
            $this->wait->until(
                WebDriverExpectedCondition::presenceOfElementLocated(WebDriverBy::id('payment-method'))
            )->click();
            
            // Complete payment
            $this->driver->findElement(WebDriverBy::id('complete-payment'))->click();
            
            // Verify success
            $this->wait->until(
                WebDriverExpectedCondition::presenceOfElementLocated(WebDriverBy::className('booking-confirmation'))
            );
            
            echo "- Booking flow completed successfully\n";
        } catch (\Exception $e) {
            echo "- Booking flow failed: " . $e->getMessage() . "\n";
        }
    }
    
    
    private function testAdminPanel() {
        echo "\nTesting Admin Panel...\n";
        
        try {
            // Login as admin
            $this->driver->get($this->baseUrl . "/admin/login.html");
            $this->driver->findElement(WebDriverBy::id('email'))->sendKeys('admin@example.com');
            $this->driver->findElement(WebDriverBy::id('password'))->sendKeys('admin123');
            $this->driver->findElement(WebDriverBy::id('login-submit'))->click();
            
            // Test hotel management
            $this->wait->until(
                WebDriverExpectedCondition::presenceOfElementLocated(WebDriverBy::id('add-hotel'))
            )->click();
            
            // Fill hotel details
            $hotelName = 'Test Hotel ' . time();
            $this->driver->findElement(WebDriverBy::id('hotel-name'))->sendKeys($hotelName);
            $this->driver->findElement(WebDriverBy::id('hotel-location'))->sendKeys('Test Location');
            $this->driver->findElement(WebDriverBy::id('hotel-description'))->sendKeys('Test Description');
            
            // Save hotel
            $this->driver->findElement(WebDriverBy::id('save-hotel'))->click();
            
            // Verify hotel added
            $this->wait->until(
                WebDriverExpectedCondition::presenceOfElementLocated(WebDriverBy::linkText($hotelName))
            );
            
            echo "- Admin panel tests completed successfully\n";
        } catch (\Exception $e) {
            echo "- Admin panel tests failed: " . $e->getMessage() . "\n";
        }
    }
}

$frontend_test = new FrontendTest();
$frontend_test->runTests();
