# 🐳 SimplifyQA Docker Setup

This document provides comprehensive instructions for running the SimplifyQA License Management System using Docker.

## 📋 Prerequisites

- Docker Engine 20.10+ 
- Docker Compose 2.0+
- 4GB+ RAM available for containers
- Port 3000 (production) and 8080 (development) available

## 🚀 Quick Start

### Production Deployment

```bash
# Build and run the production container
docker-compose up -d

# Access the application
open http://localhost:3000
```

### Development Setup

```bash
# Run development environment with hot reloading
docker-compose --profile dev up

# Access the development server
open http://localhost:8080
```

## 🏗️ Build Options

### 1. Production Build

```bash
# Build production image
docker build -t simplifyqa:latest .

# Run production container
docker run -d \
  --name simplifyqa-app \
  -p 3000:80 \
  -e NODE_ENV=production \
  -e REACT_APP_ENV=qa \
  simplifyqa:latest
```

### 2. Development Build

```bash
# Build development image
docker build -f Dockerfile.dev -t simplifyqa:dev .

# Run development container with hot reloading
docker run -d \
  --name simplifyqa-dev \
  -p 8080:8080 \
  -v $(pwd):/app \
  -v /app/node_modules \
  simplifyqa:dev
```

## ⚙️ Environment Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Application environment |
| `REACT_APP_ENV` | `qa` | SimplifyQA environment (qa, uat, production) |
| `VITE_API_URL` | - | API base URL (development only) |

### Environment Files

Create environment-specific configurations:

```bash
# .env.production
NODE_ENV=production
REACT_APP_ENV=qa

# .env.development  
NODE_ENV=development
VITE_API_URL=http://localhost:4001
```

## 🔧 Configuration Files

### 1. Dockerfile (Production)
- Multi-stage build for optimized image size
- Nginx web server for static file serving
- Health checks and security headers
- Custom entrypoint for environment handling

### 2. Dockerfile.dev (Development)
- Hot reloading with Vite dev server
- Volume mounting for live code changes
- Development dependencies included

### 3. nginx.conf
- Optimized for React SPA routing
- Gzip compression enabled
- Security headers configured
- API proxy support

### 4. docker-compose.yml
- Production and development services
- Network isolation
- Volume management
- Health monitoring

## 📊 Container Management

### Health Checks

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# View health check logs
docker inspect --format='{{json .State.Health}}' simplifyqa-license-management
```

### Logs and Monitoring

```bash
# View application logs
docker-compose logs -f simplifyqa-app

# View nginx access logs
docker exec simplifyqa-license-management tail -f /var/log/nginx/access.log

# Monitor container resources
docker stats simplifyqa-license-management
```

### Debugging

```bash
# Access container shell
docker exec -it simplifyqa-license-management sh

# Debug nginx configuration
docker exec simplifyqa-license-management nginx -T

# Check file permissions
docker exec simplifyqa-license-management ls -la /usr/share/nginx/html
```

## 🌐 Networking

### Port Mapping

| Service | Container Port | Host Port | Description |
|---------|---------------|-----------|-------------|
| Production | 80 | 3000 | Nginx web server |
| Development | 8080 | 8080 | Vite dev server |
| Health Check | 80 | - | `/health` endpoint |

### Network Configuration

```bash
# Create custom network
docker network create simplifyqa-net

# Run with custom network
docker run --network simplifyqa-net simplifyqa:latest
```

## 🚀 Deployment Strategies

### 1. Single Container

```bash
# Simple deployment
docker run -d \
  --name simplifyqa \
  --restart unless-stopped \
  -p 3000:80 \
  simplifyqa:latest
```

### 2. Docker Compose (Recommended)

```bash
# Production deployment
docker-compose up -d

# Scale if needed
docker-compose up -d --scale simplifyqa-app=3
```

### 3. Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml simplifyqa-stack
```

### 4. Kubernetes

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: simplifyqa-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: simplifyqa
  template:
    metadata:
      labels:
        app: simplifyqa
    spec:
      containers:
      - name: simplifyqa
        image: simplifyqa:latest
        ports:
        - containerPort: 80
        env:
        - name: NODE_ENV
          value: "production"
        - name: REACT_APP_ENV
          value: "qa"
```

## 🔒 Security Considerations

### 1. Non-root User
- Development container runs as non-root user
- Proper file permissions configured

### 2. Security Headers
- X-Frame-Options, X-XSS-Protection enabled
- Content Security Policy configured
- HTTPS ready configuration

### 3. Minimal Image
- Alpine-based images for smaller attack surface
- Only necessary packages installed
- Multi-stage builds to exclude build dependencies

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000

# Kill process or use different port
docker run -p 3001:80 simplifyqa:latest
```

#### Permission Denied
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x docker-entrypoint.sh
```

#### Build Failures
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t simplifyqa:latest .
```

#### Container Won't Start
```bash
# Check logs
docker logs simplifyqa-license-management

# Inspect container
docker inspect simplifyqa-license-management
```

### Performance Tuning

```bash
# Increase memory limit
docker run -m 1g simplifyqa:latest

# Set CPU limits
docker run --cpus=".5" simplifyqa:latest

# Monitor performance
docker stats --no-stream
```

## 📈 Production Recommendations

### 1. Resource Limits
```yaml
# docker-compose.yml
services:
  simplifyqa-app:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          memory: 256M
```

### 2. Load Balancing
- Use reverse proxy (Traefik, nginx)
- Implement health checks
- Configure sticky sessions if needed

### 3. Backup Strategy
- Volume backups for persistent data
- Image registry for deployment artifacts
- Configuration management

### 4. Monitoring
- Container metrics (Prometheus)
- Application logs (ELK stack)
- Health check endpoints

## 📋 Maintenance

### Updates
```bash
# Pull latest image
docker pull simplifyqa:latest

# Recreate containers
docker-compose down && docker-compose up -d

# Clean up old images
docker image prune -a
```

### Backup
```bash
# Export container
docker export simplifyqa-license-management > simplifyqa-backup.tar

# Backup volumes
docker run --rm -v simplifyqa_logs:/data -v $(pwd):/backup alpine tar czf /backup/logs-backup.tar.gz /data
```

## 🆘 Support

For issues and questions:
- Check container logs: `docker-compose logs`
- Verify environment variables: `docker exec container env`
- Test health endpoint: `curl http://localhost:3000/health`

---

## 📄 Files Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Production image build |
| `Dockerfile.dev` | Development image build |
| `docker-compose.yml` | Service orchestration |
| `nginx.conf` | Web server configuration |
| `docker-entrypoint.sh` | Container startup script |
| `.dockerignore` | Build context exclusions |

Happy Containerizing! 🐳 