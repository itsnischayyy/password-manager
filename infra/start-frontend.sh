#!/bin/sh

# This script substitutes the BACKEND_URL environment variable into the Nginx config template
# and then starts Nginx. This makes the backend location fully configurable at runtime.

# Replace the placeholder with the actual environment variable value.
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx in the foreground.
nginx -g 'daemon off;'