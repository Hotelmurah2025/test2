<?php
// Show error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set default timezone
date_default_timezone_set('UTC');

// Variables used for JWT
define('SECRET_KEY', 'Your-Secret-Key-Here');
define('ALGORITHM', 'HS256');

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 1);
session_start();

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Function to validate and sanitize input
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Function to validate email
function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Function to generate random string
function generate_random_string($length = 10) {
    return bin2hex(random_bytes($length));
}

// Function to validate date format
function validate_date($date, $format = 'Y-m-d') {
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
}

// Function to check if user is logged in
function is_logged_in() {
    return isset($_SESSION['user_id']);
}

// Function to check if user is admin
function is_admin() {
    return isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
}

// Function to require authentication
function require_auth() {
    if (!is_logged_in()) {
        http_response_code(401);
        echo json_encode(array("message" => "Unauthorized access"));
        exit();
    }
}

// Function to require admin privileges
function require_admin() {
    if (!is_admin()) {
        http_response_code(403);
        echo json_encode(array("message" => "Access forbidden"));
        exit();
    }
}

// Function to send JSON response
function send_json_response($data, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode($data);
    exit();
}

// Function to handle errors
function handle_error($message, $code = 400) {
    http_response_code($code);
    echo json_encode(array("error" => $message));
    exit();
}
