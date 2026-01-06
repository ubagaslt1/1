<?php
header('Content-Type: application/json');

$xmrig_running = false;
$config_exists = file_exists('/config/config.json');

// Check if XMRig is running
exec("supervisorctl status xmrig 2>&1", $output);
if (isset($output[0]) && strpos($output[0], 'RUNNING') !== false) {
    $xmrig_running = true;
}

echo json_encode([
    'status' => 'healthy',
    'xmrig_running' => $xmrig_running,
    'config_exists' => $config_exists,
    'timestamp' => time()
]);
