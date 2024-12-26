<?php
// Booking and payment routes
$router->addRoute('POST', '/api/bookings', function($db) {
    require_auth();
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->hotel_id) || !isset($data->room_id) || 
        !isset($data->check_in) || !isset($data->check_out) || 
        !isset($data->guests) || !isset($data->total_price)) {
        handle_error("Missing required fields");
    }
    
    // Validate dates
    if (!validate_date($data->check_in) || !validate_date($data->check_out)) {
        handle_error("Invalid date format");
    }
    
    $check_in = new DateTime($data->check_in);
    $check_out = new DateTime($data->check_out);
    
    if ($check_in >= $check_out) {
        handle_error("Check-out date must be after check-in date");
    }
    
    try {
        $conn = $db->getConnection();
        
        // Check room availability
        $stmt = $conn->prepare("
            SELECT COUNT(*) FROM bookings 
            WHERE room_id = ? 
            AND status != 'cancelled'
            AND (
                (check_in <= ? AND check_out >= ?) OR
                (check_in <= ? AND check_out >= ?) OR
                (check_in >= ? AND check_out <= ?)
            )
        ");
        $stmt->execute([
            $data->room_id,
            $data->check_out, $data->check_in,
            $data->check_in, $data->check_in,
            $data->check_in, $data->check_out
        ]);
        
        if ($stmt->fetchColumn() > 0) {
            handle_error("Room is not available for the selected dates");
        }
        
        // Generate confirmation code
        $confirmation_code = strtoupper(substr(md5(uniqid()), 0, 8));
        
        // Create booking
        $stmt = $conn->prepare("
            INSERT INTO bookings (
                user_id, room_id, check_in, check_out, 
                guests, total_price, special_requests, 
                confirmation_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $_SESSION['user_id'],
            $data->room_id,
            $data->check_in,
            $data->check_out,
            $data->guests,
            $data->total_price,
            $data->special_requests ?? null,
            $confirmation_code
        ]);
        
        $booking_id = $conn->lastInsertId();
        
        send_json_response([
            "booking_id" => $booking_id,
            "confirmation_code" => $confirmation_code,
            "status" => "pending",
            "payment_required" => $data->total_price
        ], 201);
        
    } catch (PDOException $e) {
        handle_error($e->getMessage(), 500);
    }
});

$router->addRoute('POST', '/api/payments', function($db) {
    require_auth();
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->booking_id) || !isset($data->payment_method) || 
        !isset($data->amount) || !isset($data->payment_details)) {
        handle_error("Missing required fields");
    }
    
    try {
        $conn = $db->getConnection();
        
        // Verify booking exists and belongs to user
        $stmt = $conn->prepare("
            SELECT total_price, status 
            FROM bookings 
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$data->booking_id, $_SESSION['user_id']]);
        
        if ($stmt->rowCount() === 0) {
            handle_error("Booking not found", 404);
        }
        
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($booking['status'] !== 'pending') {
            handle_error("Invalid booking status");
        }
        
        if ($booking['total_price'] != $data->amount) {
            handle_error("Invalid payment amount");
        }
        
        // Generate transaction ID
        $transaction_id = 'TXN' . time() . rand(1000, 9999);
        
        // Start transaction
        $conn->beginTransaction();
        
        try {
            // Create payment record
            $stmt = $conn->prepare("
                INSERT INTO payments (
                    booking_id, amount, payment_method,
                    transaction_id, status
                ) VALUES (?, ?, ?, ?, 'completed')
            ");
            
            $stmt->execute([
                $data->booking_id,
                $data->amount,
                $data->payment_method,
                $transaction_id
            ]);
            
            // Update booking status
            $stmt = $conn->prepare("
                UPDATE bookings 
                SET status = 'confirmed', 
                    payment_status = 'paid' 
                WHERE id = ?
            ");
            $stmt->execute([$data->booking_id]);
            
            $conn->commit();
            
            send_json_response([
                "success" => true,
                "transaction_id" => $transaction_id,
                "booking_confirmation" => [
                    "booking_id" => $data->booking_id,
                    "status" => "confirmed",
                    "transaction_id" => $transaction_id
                ]
            ]);
            
        } catch (Exception $e) {
            $conn->rollBack();
            throw $e;
        }
        
    } catch (PDOException $e) {
        handle_error($e->getMessage(), 500);
    }
});
