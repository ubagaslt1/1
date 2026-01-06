<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$config_file = '/config/config.json';
$default_config = '/config/config.default.json';

// Helper function to restart XMRig
function restart_xmrig() {
    // Send SIGTERM to XMRig process (supervisord will restart it)
    exec("supervisorctl restart xmrig 2>&1", $output, $return);
    return ['success' => $return === 0, 'output' => $output];
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (file_exists($config_file)) {
            $config = json_decode(file_get_contents($config_file), true);
            echo json_encode(['success' => true, 'config' => $config]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Config file not found']);
        }
        break;

    case 'POST':
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['config'])) {
            $config = $input['config'];
            
            // Validate JSON
            if (json_last_error() === JSON_ERROR_NONE) {
                // Backup current config
                if (file_exists($config_file)) {
                    copy($config_file, $config_file . '.bak.' . time());
                }
                
                // Write new config
                if (file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT))) {
                    // Restart XMRig with new config
                    $restart = restart_xmrig();
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Configuration saved and applied',
                        'restart' => $restart
                    ]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Failed to write config file']);
                }
            } else {
                echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'No config provided']);
        }
        break;

    case 'DELETE':
        if (file_exists($default_config) && file_exists($config_file)) {
            copy($default_config, $config_file);
            $restart = restart_xmrig();
            
            echo json_encode([
                'success' => true,
                'message' => 'Configuration reset to defaults',
                'restart' => $restart
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Default config not found']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
