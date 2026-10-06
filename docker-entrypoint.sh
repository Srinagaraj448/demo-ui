#!/bin/sh

# SimplifyQA Docker Entrypoint Script
set -e

echo "🚀 Starting SimplifyQA License Management System..."

# Function to handle shutdown gracefully
shutdown() {
    echo "🔄 Received shutdown signal, stopping services gracefully..."
    nginx -s quit
    exit 0
}

# Trap signals for graceful shutdown
trap shutdown TERM INT

# Environment variable defaults
export NODE_ENV=${NODE_ENV:-production}
export REACT_APP_ENV=${REACT_APP_ENV:-qa}

echo "📊 Environment: $NODE_ENV"
echo "🌐 React App Environment: $REACT_APP_ENV"

# Create necessary directories
mkdir -p /var/log/nginx
mkdir -p /var/run

# Set proper permissions
chown -R nginx:nginx /var/log/nginx
chown -R nginx:nginx /usr/share/nginx/html

# Inject environment variables into the built application if needed
if [ -f "/usr/share/nginx/html/index.html" ]; then
    echo "🔧 Configuring application..."
    
    # Replace placeholder environment variables in the built files
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|REACT_APP_ENV_PLACEHOLDER|$REACT_APP_ENV|g" {} \;
    find /usr/share/nginx/html -name "*.html" -exec sed -i "s|REACT_APP_ENV_PLACEHOLDER|$REACT_APP_ENV|g" {} \;
fi

# Test nginx configuration
echo "🔍 Testing nginx configuration..."
nginx -t

# Start nginx in foreground
echo "✅ Starting nginx server..."
exec nginx -g "daemon off;" 