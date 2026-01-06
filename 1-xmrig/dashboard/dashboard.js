// Global state
let currentConfig = null;
let statsInterval = null;

// Tab management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Load specific tab content
    switch(tabName) {
        case 'dashboard':
            updateStats();
            break;
        case 'logs':
            loadLogs();
            break;
        case 'config':
            loadConfig();
            break;
    }
}

// Notification system
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Format hashrate
function formatHashrate(hashes) {
    if (!hashes || hashes === 0) return '0 H/s';
    
    const units = ['H/s', 'kH/s', 'MH/s', 'GH/s', 'TH/s'];
    let i = 0;
    let value = hashes;
    
    while (value >= 1000 && i < units.length - 1) {
        value /= 1000;
        i++;
    }
    
    return value.toFixed(2) + ' ' + units[i];
}

// Format time
function formatTime(seconds) {
    if (!seconds) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Format memory
function formatMemory(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let value = bytes;
    
    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }
    
    return value.toFixed(2) + ' ' + units[i];
}

// Load and update mining stats
async function updateStats() {
    try {
        const response = await fetch('/xmrig-api/1/summary');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        // Update status indicator
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (data.connection && data.connection.uptime > 0) {
            statusDot.className = 'status-dot active';
            statusText.textContent = 'Mining Active';
        } else {
            statusDot.className = 'status-dot';
            statusText.textContent = 'Connecting...';
        }
        
        // Update hashrate
        const hashrate = data.hashrate?.total?.[0] || 0;
        const hashrateHighest = data.hashrate?.highest || 0;
        const hashrateTotal = data.hashrate?.total?.[1] || 0;
        
        document.getElementById('hashrate').textContent = formatHashrate(hashrate);
        document.getElementById('hashrateHighest').textContent = formatHashrate(hashrateHighest);
        document.getElementById('hashrateTotal').textContent = formatHashrate(hashrateTotal);
        
        // Update shares
        const sharesGood = data.results?.shares_good || 0;
        const sharesTotal = data.results?.shares_total || 0;
        const sharesBad = sharesTotal - sharesGood;
        
        document.getElementById('sharesGood').textContent = sharesGood;
        document.getElementById('sharesGoodCount').textContent = sharesGood;
        document.getElementById('sharesBadCount').textContent = sharesBad;
        document.getElementById('sharesTotal').textContent = sharesTotal;
        
        // Update uptime
        document.getElementById('uptime').textContent = formatTime(data.connection?.uptime || 0);
        
        // Update connection info
        if (data.connection?.pool) {
            document.getElementById('poolUrl').textContent = data.connection.pool;
            document.getElementById('diff').textContent = data.connection.difficulty?.toLocaleString() || '0';
        }
        
        // Update algorithm
        document.getElementById('algo').textContent = data.algo || 'RandomX';
        
        // Update results
        const hashesTotal = data.results?.hashes_total || 0;
        const avgTime = data.results?.avg_time || 0;
        const threads = data.resources?.threads || 0;
        
        document.getElementById('resultsHashes').textContent = hashesTotal.toLocaleString();
        document.getElementById('avgTime').textContent = avgTime.toFixed(0) + 'ms';
        document.getElementById('threads').textContent = threads;
        
        // Update hardware stats if available
        if (data.resources?.memory) {
            document.getElementById('memoryUsage').textContent = formatMemory(data.resources.memory[0]);
            document.getElementById('memoryTotal').textContent = formatMemory(data.resources.memory[1]);
        }
        
        // Update pool stats
        if (data.connection) {
            document.getElementById('poolPing').textContent = data.connection.ping + 'ms';
            document.getElementById('poolFailures').textContent = data.connection.failures;
            document.getElementById('poolRetries').textContent = data.connection.retries;
        }
        
    } catch (error) {
        console.error('Error fetching stats:', error);
        
        // Update status to error
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        statusDot.className = 'status-dot error';
        statusText.textContent = 'Connection Error';
    }
}

// Configuration management
async function loadConfig() {
    try {
        const response = await fetch('/api/config.php');
        const data = await response.json();
        
        if (data.success) {
            currentConfig = data.config;
            const editor = document.getElementById('configEditor');
            if (editor) {
                editor.value = JSON.stringify(data.config, null, 2);
                showNotification('Configuration loaded successfully', 'success');
            }
        } else {
            throw new Error(data.error || 'Failed to load config');
        }
    } catch (error) {
        console.error('Error loading config:', error);
        showNotification('Failed to load configuration: ' + error.message, 'error');
    }
}

async function saveConfig() {
    try {
        const editor = document.getElementById('configEditor');
        if (!editor) return;
        
        const config = JSON.parse(editor.value);
        
        const response = await fetch('/api/config.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ config })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentConfig = config;
            showNotification('Configuration saved and applied. Miner is restarting...', 'success');
            
            // Wait a bit and reload stats
            setTimeout(() => {
                updateStats();
            }, 3000);
        } else {
            throw new Error(data.error || 'Failed to save config');
        }
    } catch (error) {
        console.error('Error saving config:', error);
        
        if (error instanceof SyntaxError) {
            showNotification('Invalid JSON format. Please check your configuration.', 'error');
        } else {
            showNotification('Failed to save configuration: ' + error.message, 'error');
        }
    }
}

async function resetConfig() {
    if (confirm('Are you sure you want to reset to default configuration? This will restart the miner.')) {
        try {
            const response = await fetch('/api/config.php', {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Configuration reset to defaults. Miner is restarting...', 'success');
                setTimeout(() => {
                    loadConfig();
                    updateStats();
                }, 3000);
            } else {
                throw new Error(data.error || 'Failed to reset config');
            }
        } catch (error) {
            console.error('Error resetting config:', error);
            showNotification('Failed to reset configuration: ' + error.message, 'error');
        }
    }
}

function downloadConfig() {
    const editor = document.getElementById('configEditor');
    if (!editor || !editor.value) return;
    
    try {
        const config = JSON.parse(editor.value);
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'xmrig-config-' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Configuration downloaded', 'success');
    } catch (error) {
        showNotification('Invalid JSON format', 'error');
    }
}

function uploadConfig() {
    const input = document.getElementById('configUpload');
    if (!input) return;
    
    input.click();
}

// Handle config file upload
document.addEventListener('DOMContentLoaded', function() {
    const uploadInput = document.getElementById('configUpload');
    if (uploadInput) {
        uploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const config = JSON.parse(event.target.result);
                    const editor = document.getElementById('configEditor');
                    if (editor) {
                        editor.value = JSON.stringify(config, null, 2);
                        showNotification('Configuration loaded from file', 'success');
                    }
                } catch (error) {
                    showNotification('Invalid JSON file', 'error');
                }
            };
            reader.readAsText(file);
            
            // Reset input
            e.target.value = '';
        });
    }
});

// Load logs
async function loadLogs() {
    try {
        const response = await fetch('/xmrig-api/1/logs');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const logs = await response.text();
        const logViewer = document.getElementById('logViewer');
        
        if (logViewer) {
            logViewer.innerHTML = '';
            const lines = logs.split('\n');
            
            lines.forEach(line => {
                if (line.trim()) {
                    const entry = document.createElement('div');
                    entry.className = 'log-entry';
                    
                    // Color code log levels
                    if (line.includes('[INFO]')) {
                        entry.classList.add('info');
                    } else if (line.includes('[WARNING]')) {
                        entry.classList.add('warning');
                    } else if (line.includes('[ERROR]')) {
                        entry.classList.add('error');
                    } else if (line.includes('[DEBUG]')) {
                        entry.classList.add('debug');
                    }
                    
                    entry.textContent = line;
                    logViewer.appendChild(entry);
                }
            });
            
            // Scroll to bottom
            logViewer.scrollTop = logViewer.scrollHeight;
        }
    } catch (error) {
        console.error('Error loading logs:', error);
    }
}

// Control miner
async function controlMiner(action) {
    const actions = {
        start: { method: 'start' },
        stop: { method: 'stop' },
        restart: { method: 'restart' },
        pause: { method: 'pause' },
        resume: { method: 'resume' }
    };
    
    if (!actions[action]) return;
    
    try {
        const response = await fetch('/xmrig-api/1/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: 1,
                jsonrpc: "2.0",
                method: actions[action].method
            })
        });
        
        const data = await response.json();
        
        if (data.result === 'OK') {
            showNotification(`Miner ${action}ed successfully`, 'success');
            setTimeout(() => updateStats(), 2000);
        } else {
            throw new Error(data.error || 'Control command failed');
        }
    } catch (error) {
        console.error(`Error ${action}ing miner:`, error);
        showNotification(`Failed to ${action} miner: ${error.message}`, 'error');
    }
}

// Initialize dashboard
async function initializeDashboard() {
    // Load initial config
    await loadConfig();
    
    // Start stats polling
    updateStats();
    statsInterval = setInterval(updateStats, 5000);
    
    // Load logs every 10 seconds if on logs tab
    setInterval(() => {
        if (document.querySelector('#logs.tab-content.active')) {
            loadLogs();
        }
    }, 10000);
    
    // Add event listeners for control buttons
    document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            controlMiner(action);
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (statsInterval) {
        clearInterval(statsInterval);
    }
});

// Export for debugging
window.xmrigDashboard = {
    updateStats,
    loadConfig,
    saveConfig,
    resetConfig,
    controlMiner,
    loadLogs
};
