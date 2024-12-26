<?php
require_once 'config/core.php';
require_once 'config/database.php';

// Router class to handle API endpoints
class Router {
    private $routes = [];
    private $database;

    public function __construct() {
        $this->database = new Database();
    }

    public function addRoute($method, $path, $handler) {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler
        ];
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        foreach ($this->routes as $route) {
            if ($route['method'] === $method) {
                $pattern = $this->convertRouteToRegex($route['path']);
                if (preg_match($pattern, $uri, $matches)) {
                    array_shift($matches); // Remove the full match
                    try {
                        call_user_func_array($route['handler'], array_merge([$this->database], $matches));
                    } catch (Exception $e) {
                        handle_error($e->getMessage());
                    }
                    return;
                }
            }
        }
        
        // No route found
        http_response_code(404);
        echo json_encode(["error" => "Not Found"]);
    }

    private function convertRouteToRegex($route) {
        return "@^" . preg_replace('/\{([a-zA-Z]+)\}/', '([^/]+)', $route) . "$@D";
    }
}

// Initialize router
$router = new Router();

// Define routes
require_once 'routes/auth.php';
require_once 'routes/hotels.php';
require_once 'routes/bookings.php';
require_once 'routes/admin.php';
require_once 'routes/user.php';

// Handle the request
$router->handleRequest();
