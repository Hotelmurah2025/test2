<?php
// User dashboard routes
$router->addRoute('GET', '/api/user/bookings', function($db) {
    require_auth();
    
    $status = isset($_GET['status']) ? sanitize_input($_GET['status']) : null;
    
    try {
        $conn = $db->getConnection();
        
        $query = "
            SELECT b.*, h.name as hotel_name, r.room_type,
            p.payment_method, p.transaction_id
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN hotels h ON r.hotel_id = h.id
            LEFT JOIN payments p ON b.id = p.booking_id
            WHERE b.user_id = ?
        ";
        $params = [$_SESSION['user_id']];
        
        if ($status === 'upcoming') {
            $query .= " AND b.check_in >= CURDATE()";
        } elseif ($status === 'past') {
            $query .= " AND b.check_out < CURDATE()";
        }
        
        $query .= " ORDER BY b.booking_date DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        send_json_response([
            "bookings" => $bookings,
            "total" => count($bookings)
        ]);
        
    } catch (PDOException $e) {
        handle_error($e->getMessage(), 500);
    }
});

$router->addRoute('GET', '/api/user/bookings/{id}', function($db, $id) {
    require_auth();
    
    try {
        $conn = $db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT b.*, h.name as hotel_name, h.location,
            r.room_type, r.price,
            p.payment_method, p.transaction_id, p.status as payment_status
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN hotels h ON r.hotel_id = h.id
            LEFT JOIN payments p ON b.id = p.booking_id
            WHERE b.id = ? AND b.user_id = ?
        ");
        
        $stmt->execute([$id, $_SESSION['user_id']]);
        
        if ($stmt->rowCount() === 0) {
            handle_error("Booking not found", 404);
        }
        
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        send_json_response($booking);
        
    } catch (PDOException $e) {
        handle_error($e->getMessage(), 500);
    }
});

$router->addRoute('GET', '/api/user/bookings/{id}/voucher', function($db, $id) {
    require_auth();
    
    try {
        $conn = $db->getConnection();
        
        $stmt = $conn->prepare("
            SELECT b.*, h.name as hotel_name, h.location,
            r.room_type, u.full_name, u.email
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN hotels h ON r.hotel_id = h.id
            JOIN users u ON b.user_id = u.id
            WHERE b.id = ? AND b.user_id = ?
            AND b.status = 'confirmed'
        ");
        
        $stmt->execute([$id, $_SESSION['user_id']]);
        
        if ($stmt->rowCount() === 0) {
            handle_error("Booking voucher not available", 404);
        }
        
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Generate PDF voucher
        require_once 'lib/fpdf/fpdf.php';
        
        $pdf = new FPDF();
        $pdf->AddPage();
        
        // Add booking voucher content
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(0, 10, 'Booking Voucher', 0, 1, 'C');
        
        $pdf->SetFont('Arial', '', 12);
        $pdf->Cell(0, 10, 'Confirmation Code: ' . $booking['confirmation_code'], 0, 1);
        $pdf->Cell(0, 10, 'Hotel: ' . $booking['hotel_name'], 0, 1);
        $pdf->Cell(0, 10, 'Guest: ' . $booking['full_name'], 0, 1);
        $pdf->Cell(0, 10, 'Check-in: ' . $booking['check_in'], 0, 1);
        $pdf->Cell(0, 10, 'Check-out: ' . $booking['check_out'], 0, 1);
        $pdf->Cell(0, 10, 'Room Type: ' . $booking['room_type'], 0, 1);
        
        // Output PDF
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="booking_voucher_' . $booking['confirmation_code'] . '.pdf"');
        echo $pdf->Output('S');
        exit();
        
    } catch (PDOException $e) {
        handle_error($e->getMessage(), 500);
    }
});
