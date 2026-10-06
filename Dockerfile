# -------------------------------
# Stage 1: Build React/Vite App
# -------------------------------
    FROM node:18-alpine AS builder

    # Set working directory
    WORKDIR /app
    
    # Copy package files
    COPY package*.json ./
    
    # Install dependencies
    RUN npm install
    
    # Copy the rest of the source code
    COPY . .
    
    # Build the application (output goes to /app/dist)
    RUN npm run build
    
    
    # -------------------------------
    # Stage 2: Serve with Nginx
    # -------------------------------
    FROM nginx:alpine AS production
    
    # Install node and npm only if your app needs them at runtime (optional)
    # RUN apk add --no-cache nodejs npm
    
    # Copy custom nginx config (with /license-management block)
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    # Copy built app into Nginx web root under /license-management
    COPY --from=builder /app/dist /usr/share/nginx/html/license-management
    
    # (Optional) Copy public static assets if needed
    COPY --from=builder /app/public /usr/share/nginx/html/license-management/public
    
    # Expose port 80
    EXPOSE 80
    
    # Health check (optional but good for Docker/K8s)
    HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
        CMD wget -qO- http://localhost/health || exit 1
    
    # Use Nginx’s default entrypoint (DO NOT override it)
    CMD ["nginx", "-g", "daemon off;"]
    
    # Labels (metadata)
    LABEL maintainer="SimplifyQA Team"
    LABEL description="SimplifyQA License Management System"
    LABEL version="1.0.1"
    