<?php
// Simple router for API
$request = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Remove query string
$request = strtok($request, '?');

// Route requests
switch ($request) {
    case '/api/config':
    case '/api/config.php':
        require __DIR__ . '/config.php';
        break;
    
    case '/api/health':
    case '/api/health.php':
        require __DIR__ . '/health.php';
        break;
    
    default:
        header('HTTP/1.0 404 Not Found');
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}
