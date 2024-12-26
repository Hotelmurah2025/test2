<?php
// Authentication routes
$router->addRoute('POST', '/api/auth/register', function($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->full_name) || !isset($data->email) || !isset($data->password) || !isset($data->confirm_password)) {
        handle_error("Missing required fields");
    }

    // Validate input
    $full_name = sanitize_input($data->full_name);
    $email = sanitize_input($data->email);
    $password = $data->password;
    $confirm_password = $data->confirm_password;

    if (!validate_email($email)) {
        handle_error("Invalid email format");
    }

    if ($password !== $confirm_password) {
        handle_error("Passwords do not match");
    }

    if (strlen($password) < 8) {
        handle_error("Password must be at least 8 characters long");
    }

    try {
        $conn = $db->getConnection();
        
        // Check if email exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() > 0) {
            handle_error("Email already exists");
        }

        // Hash password
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        // Insert user
        $stmt = $conn->prepare("INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)");
        $stmt->execute([$full_name, $email, $hashed_password]);

        $user_id = $conn->lastInsertId();

        send_json_response([
            "success" => true,
            "message" => "Registration successful",
            "user_id" => $user_id
        ], 201);

    } catch (PDOException $e) {
        handle_error($e->getMessage(), 500);
    }
});

$router->addRoute('POST', '/api/auth/login', function($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->email) || !isset($data->password)) {
        handle_error("Missing email or password");
    }

    $email = sanitize_input($data->email);
    $password = $data->password;

    try {
        $conn = $db->getConnection();
        
        $stmt = $conn->prepare("SELECT id, full_name, email, password, is_admin FROM users WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() === 0) {
            handle_error("Invalid email or password", 401);
        }

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!password_verify($password, $user['password'])) {
            handle_error("Invalid email or password", 401);
        }

        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['is_admin'] = $user['is_admin'];
        $_SESSION['full_name'] = $user['full_name'];

        // Remove password from response
        unset($user['password']);

        send_json_response([
            "success" => true,
            "message" => "Login successful",
            "user" => $user
        ]);

    } catch (PDOException $e) {
        handle_error($e->getMessage(), 500);
    }
});

$router->addRoute('POST', '/api/auth/logout', function($db) {
    session_destroy();
    send_json_response([
        "success" => true,
        "message" => "Logout successful"
    ]);
});
