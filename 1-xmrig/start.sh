#!/bin/sh

# Create config directory if it doesn't exist
mkdir -p /config
mkdir -p /data

# If config.json doesn't exist, create from default
if [ ! -f /config/config.json ]; then
    echo "Creating initial config.json from default..."
    cp /config/config.default.json /config/config.json
fi

# Set permissions
chown -R xmrig:xmrig /config /data
chmod 755 /config /data

# Start supervisord
echo "Starting XMRig Miner with full GUI..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
