FROM nginxinc/nginx-unprivileged:stable-alpine
# Preserve the base image main nginx.conf (unprivileged PID and temp paths).
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
