<?php
// Hotel search and management routes
$router->addRoute('GET', '/api/hotels/search', function($db) {
    $location = isset($_GET['location']) ? sanitize_input($_GET['location']) : '';
    $check_in = isset($_GET['check_in']) ? sanitize_input($_GET['check_in']) : '';
    $check_out = isset($_GET['check_out']) ? sanitize_input($_GET['check_out']) : '';
    $guests = isset($_GET['guests']) ? (int)$_GET['guests'] : 0;
    $rooms = isset($_GET['rooms']) ? (int)$_GET['rooms'] : 0;
    $price_min = isset($_GET['price_min']) ? (float)$_GET['price_min'] : null;
    $price_max = isset($_GET['price_max']) ? (float)$_GET['price_max'] : null;
    $rating = isset($_GET['rating']) ? (float)$_GET['rating'] : null;
    
    // Validate dates
    if ($check_in && !validate_date($check_in)) {
        handle_error("Invalid check-in date format");
    }
    if ($check_out && !validate_date($check_out)) {
        handle_error("Invalid check-out date format");
    }
    
    try {
        $conn = $db->getConnection();
        
        $query = "SELECT DISTINCT h.*, 
                  MIN(r.price) as min_price, 
                  MAX(r.price) as max_price,
                  COUNT(DISTINCT r.id) as available_rooms
                  FROM hotels h
                  LEFT JOIN rooms r ON h.id = r.hotel_id
                  WHERE 1=1";
        $params = [];
        
        if ($location) {
            $query .= " AND h.location LIKE ?";
            $params[] = "%$location%";
        }
        
        if ($rating) {
            $query .= " AND h.rating >= ?";
            $params[] = $rating;
        }
        
        if ($price_min !== null) {
            $query .= " AND r.price >= ?";
            $params[] = $price_min;
        }
        
        if ($price_max !== null) {
            $query .= " AND r.price <= ?";
            $params[] = $price_max;
        }
        
        // Check room availability
        if ($check_in && $check_out) {
            $query .= " AND r.id NOT IN (
                SELECT room_id FROM bookings 
                WHERE (check_in <= ? AND check_out >= ?)
                AND status != 'cancelled'
            )";
            $params[] = $check_out;
            $params[] = $check_in;
        }
        
        $query .= " GROUP BY h.id HAVING available_rooms >= ?";
        $params[] = $rooms > 0 ? $rooms : 1;
        
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        
        $hotels = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get facilities for each hotel
        foreach ($hotels as &$hotel) {
            $stmt = $conn->prepare("
                SELECT hf.name 
                FROM hotel_facilities hf
                JOIN hotel_facility_mappings hfm ON hf.id = hfm.facility_id
                WHERE hfm.hotel_id = ?
            ");
            $stmt->execute([$hotel['id']]);
            $hotel['facilities'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        }
        
        send_json_response([
            "hotels" => $hotels,
            "total" => count($hotels)
        ]);
        
    } catch (PDOException $e) {
        handle_error($e->getMessage(), 500);
    }
});

$router->addRoute('GET', '/api/hotels/{id}', function($db, $id) {
    try {
        $conn = $db->getConnection();
        
        // Get hotel details
        $stmt = $conn->prepare("
            SELECT h.*, 
            (SELECT COUNT(*) FROM reviews r WHERE r.hotel_id = h.id) as review_count,
            (SELECT AVG(rating) FROM reviews r WHERE r.hotel_id = h.id) as average_rating
            FROM hotels h 
            WHERE h.id = ?
        ");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            handle_error("Hotel not found", 404);
        }
        
        $hotel = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get hotel images
        $stmt = $conn->prepare("SELECT image_url FROM hotel_images WHERE hotel_id = ?");
        $stmt->execute([$id]);
        $hotel['images'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Get hotel facilities
        $stmt = $conn->prepare("
            SELECT hf.name 
            FROM hotel_facilities hf
            JOIN hotel_facility_mappings hfm ON hf.id = hfm.facility_id
            WHERE hfm.hotel_id = ?
        ");
        $stmt->execute([$id]);
        $hotel['facilities'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Get rooms
        $stmt = $conn->prepare("
            SELECT r.*, 
            (SELECT GROUP_CONCAT(rf.name) 
             FROM room_facilities rf 
             JOIN room_facility_mappings rfm ON rf.id = rfm.facility_id 
             WHERE rfm.room_id = r.id) as facilities
            FROM rooms r 
            WHERE r.hotel_id = ?
        ");
        $stmt->execute([$id]);
        $hotel['rooms'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get reviews
        $stmt = $conn->prepare("
            SELECT r.*, u.full_name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.hotel_id = ?
            ORDER BY r.created_at DESC
            LIMIT 10
        ");
        $stmt->execute([$id]);
        $hotel['reviews'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        send_json_response($hotel);
        
    } catch (PDOException $e) {
        handle_error($e->getMessage(), 500);
    }
});
