#!/bin/bash
set -e

# Create config directory
mkdir -p ${APP_DATA_DIR}/config

# Copy default config if doesn't exist
if [ ! -f "${APP_DATA_DIR}/config/env.conf" ]; then
    cp ${APP_DIR}/default.env ${APP_DATA_DIR}/config/env.conf
fi

# Load configuration
source ${APP_DATA_DIR}/config/env.conf

# Update docker-compose with user config
envsubst < ${APP_DIR}/docker-compose.template.yml > ${APP_DIR}/docker-compose.yml

# Start the container
docker-compose up -d
