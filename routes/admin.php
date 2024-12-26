<?php
// Admin routes
$router->addRoute('GET', '/api/admin/hotels', function($db) {
    require_admin();
    
    try {
        $conn = $db->getConnection();
        $stmt = $conn->query("SELECT * FROM hotels ORDER BY name");
        $hotels = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        send_json_response($hotels);
    } catch (PDOException $e) {
        handle_error($e->getMessage(), 500);
    }
});

$router->addRoute('POST', '/api/admin/hotels', function($db) {
    require_admin();
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->name) || !isset($data->location)) {
        handle_error("Missing required fields");
    }
    
    try {
        $conn = $db->getConnection();
        
        $stmt = $conn->prepare("
            INSERT INTO hotels (name, description, location) 
            VALUES (?, ?, ?)
        ");
        
        $stmt->execute([
            $data->name,
            $data->description ?? null,
            $data->location
        ]);
        
        $hotel_id = $conn->lastInsertId();
        
        // Add facilities if provided
        if (isset($data->facilities) && is_array($data->facilities)) {
            foreach ($data->facilities as $facility) {
                // Insert facility if it doesn't exist
                $stmt = $conn->prepare("
                    INSERT IGNORE INTO hotel_facilities (name) 
                    VALUES (?)
                ");
                $stmt->execute([$facility]);
                
                $facility_id = $conn->lastInsertId() ?: $conn->query("
                    SELECT id FROM hotel_facilities WHERE name = '$facility'
                ")->fetchColumn();
                
                // Map facility to hotel
                $stmt = $conn->prepare("
                    INSERT INTO hotel_facility_mappings (hotel_id, facility_id)
                    VALUES (?, ?)
                ");
                $stmt->execute([$hotel_id, $facility_id]);
            }
        }
        
        send_json_response([
            "success" => true,
            "message" => "Hotel created successfully",
            "hotel_id" => $hotel_id
        ], 201);
        
    } catch (PDOException $e) {
        handle_error($e->getMessage(), 500);
    }
});

$router->addRoute('GET', '/api/admin/bookings', function($db) {
    require_admin();
    
    $status = isset($_GET['status']) ? sanitize_input($_GET['status']) : null;
    $date_from = isset($_GET['date_from']) ? sanitize_input($_GET['date_from']) : null;
    $date_to = isset($_GET['date_to']) ? sanitize_input($_GET['date_to']) : null;
    $hotel_id = isset($_GET['hotel_id']) ? (int)$_GET['hotel_id'] : null;
    
    try {
        $conn = $db->getConnection();
        
        $query = "
            SELECT b.*, u.full_name as user_name, u.email,
            h.name as hotel_name, r.room_type,
            p.payment_method, p.transaction_id
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN rooms r ON b.room_id = r.id
            JOIN hotels h ON r.hotel_id = h.id
            LEFT JOIN payments p ON b.id = p.booking_id
            WHERE 1=1
        ";
        $params = [];
        
        if ($status) {
            $query .= " AND b.status = ?";
            $params[] = $status;
        }
        
        if ($date_from) {
            $query .= " AND b.check_in >= ?";
            $params[] = $date_from;
        }
        
        if ($date_to) {
            $query .= " AND b.check_out <= ?";
            $params[] = $date_to;
        }
        
        if ($hotel_id) {
            $query .= " AND h.id = ?";
            $params[] = $hotel_id;
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

$router->addRoute('GET', '/api/admin/reports', function($db) {
    require_admin();
    
    $type = isset($_GET['type']) ? sanitize_input($_GET['type']) : 'bookings';
    $date_from = isset($_GET['date_from']) ? sanitize_input($_GET['date_from']) : date('Y-m-d', strtotime('-30 days'));
    $date_to = isset($_GET['date_to']) ? sanitize_input($_GET['date_to']) : date('Y-m-d');
    $group_by = isset($_GET['group_by']) ? sanitize_input($_GET['group_by']) : 'day';
    
    try {
        $conn = $db->getConnection();
        
        $date_format = $group_by === 'month' ? '%Y-%m' : ($group_by === 'week' ? '%Y-%u' : '%Y-%m-%d');
        
        $query = "
            SELECT 
                DATE_FORMAT(b.booking_date, '$date_format') as date,
                COUNT(*) as total_bookings,
                SUM(b.total_price) as total_revenue
            FROM bookings b
            WHERE b.booking_date BETWEEN ? AND ?
            GROUP BY DATE_FORMAT(b.booking_date, '$date_format')
            ORDER BY date ASC
        ";
        
        $stmt = $conn->prepare($query);
        $stmt->execute([$date_from, $date_to]);
        
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate summary
        $total_bookings = array_sum(array_column($data, 'total_bookings'));
        $total_revenue = array_sum(array_column($data, 'total_revenue'));
        $days = (strtotime($date_to) - strtotime($date_from)) / (60 * 60 * 24);
        
        send_json_response([
            "report_type" => $type,
            "period" => [
                "from" => $date_from,
                "to" => $date_to
            ],
            "data" => $data,
            "summary" => [
                "total_bookings" => $total_bookings,
                "total_revenue" => $total_revenue,
                "average_daily_bookings" => $days > 0 ? round($total_bookings / $days, 2) : 0,
                "average_daily_revenue" => $days > 0 ? round($total_revenue / $days, 2) : 0
            ]
        ]);
        
    } catch (PDOException $e) {
        handle_error($e->getMessage(), 500);
    }
});
