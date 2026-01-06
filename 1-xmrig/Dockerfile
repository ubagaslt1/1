# Build stage
FROM alpine:3.18 as builder

# Install dependencies
RUN apk add --no-cache wget tar

# Download XMRig
ARG XMRIG_VERSION=6.25.0
RUN wget -q https://github.com/xmrig/xmrig/releases/download/v${XMRIG_VERSION}/xmrig-${XMRIG_VERSION}-linux-static-x64.tar.gz \
    && tar -xzf xmrig-${XMRIG_VERSION}-linux-static-x64.tar.gz \
    && mv xmrig-${XMRIG_VERSION}/xmrig /usr/local/bin/xmrig \
    && chmod +x /usr/local/bin/xmrig \
    && rm -rf xmrig-${XMRIG_VERSION}*

# Runtime stage
FROM alpine:3.18

# Install runtime dependencies
RUN apk add --no-cache \
    libstdc++ \
    libgcc \
    nginx \
    php81 \
    php81-fpm \
    php81-json \
    php81-session \
    supervisor \
    curl \
    jq

# Create user and directories
RUN adduser -D -u 1000 xmrig \
    && mkdir -p /run/nginx \
    && mkdir -p /run/php \
    && mkdir -p /var/www/html \
    && mkdir -p /config /data /api \
    && chown -R xmrig:xmrig /var/www/html /run /config /data /api

# Copy XMRig binary
COPY --from=builder /usr/local/bin/xmrig /usr/local/bin/xmrig

# Copy web files
COPY dashboard /var/www/html
COPY api /var/www/html/api

# Copy configuration files
COPY config.json /config/config.default.json
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisord.conf
COPY start.sh /start.sh

# Set permissions
RUN chmod +x /start.sh \
    && chmod 777 /config /data \
    && cp /config/config.default.json /config/config.json

# Switch to non-root user
USER xmrig

# Expose ports
EXPOSE 80 18080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/api/health.php || exit 1

# Start services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
