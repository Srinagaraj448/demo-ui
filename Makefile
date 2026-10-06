# SimplifyQA Docker Management
.PHONY: help build dev prod up down logs clean restart shell health

# Variables
IMAGE_NAME = simplifyqa
CONTAINER_NAME = simplifyqa-license-management
PROD_PORT = 3000
DEV_PORT = 8080

# Default target
help: ## Show this help message
	@echo "SimplifyQA Docker Management Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Build commands
build: ## Build production Docker image
	@echo "🏗️  Building production image..."
	docker build -t $(IMAGE_NAME):latest .

build-dev: ## Build development Docker image
	@echo "🏗️  Building development image..."
	docker build -f Dockerfile.dev -t $(IMAGE_NAME):dev .

build-all: build build-dev ## Build both production and development images

# Development commands
dev: ## Start development environment with hot reloading
	@echo "🚀 Starting development environment..."
	docker-compose --profile dev up

dev-build: ## Start development environment and rebuild if needed
	@echo "🚀 Starting development environment (with build)..."
	docker-compose --profile dev up --build

# Production commands
prod: ## Start production environment
	@echo "🚀 Starting production environment..."
	docker-compose up -d

prod-build: ## Start production environment and rebuild if needed
	@echo "🚀 Starting production environment (with build)..."
	docker-compose up -d --build

# Container management
up: prod ## Alias for prod (start production)

down: ## Stop all containers
	@echo "🛑 Stopping containers..."
	docker-compose down

restart: down up ## Restart production containers

restart-dev: ## Restart development containers
	@echo "🔄 Restarting development environment..."
	docker-compose --profile dev down
	docker-compose --profile dev up

# Monitoring and debugging
logs: ## Show production container logs
	docker-compose logs -f

logs-dev: ## Show development container logs
	docker-compose --profile dev logs -f

shell: ## Access production container shell
	docker exec -it $(CONTAINER_NAME) sh

shell-dev: ## Access development container shell
	docker exec -it simplifyqa-dev sh

health: ## Check container health
	@echo "🏥 Checking container health..."
	@curl -f http://localhost:$(PROD_PORT)/health 2>/dev/null && echo "✅ Production container healthy" || echo "❌ Production container unhealthy"
	@curl -f http://localhost:$(DEV_PORT)/ 2>/dev/null && echo "✅ Development container healthy" || echo "❌ Development container unhealthy"

status: ## Show container status
	@echo "📊 Container Status:"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=simplifyqa"

# Cleanup commands
clean: ## Remove containers and images
	@echo "🧹 Cleaning up..."
	docker-compose down --rmi all --volumes --remove-orphans

clean-all: ## Remove all containers, images, and volumes
	@echo "🧹 Deep cleaning..."
	docker-compose down --rmi all --volumes --remove-orphans
	docker system prune -af --volumes

# Testing and validation
test-build: ## Test if images build successfully
	@echo "🧪 Testing production build..."
	docker build -t $(IMAGE_NAME):test .
	@echo "🧪 Testing development build..."
	docker build -f Dockerfile.dev -t $(IMAGE_NAME):test-dev .
	@echo "✅ All builds successful"

validate: ## Validate Docker configurations
	@echo "🔍 Validating configurations..."
	docker-compose config
	@echo "✅ Docker Compose configuration valid"

# Quick deploy commands
quick-prod: build prod ## Quick production deployment
	@echo "⚡ Quick production deployment complete!"

quick-dev: build-dev dev ## Quick development deployment
	@echo "⚡ Quick development deployment complete!"

# Backup and maintenance
backup: ## Backup container and volumes
	@echo "💾 Creating backup..."
	mkdir -p backups
	docker export $(CONTAINER_NAME) > backups/simplifyqa-$(shell date +%Y%m%d-%H%M%S).tar
	@echo "✅ Backup created in backups/ directory"

update: ## Update and restart containers
	@echo "🔄 Updating containers..."
	docker-compose pull
	docker-compose up -d
	@echo "✅ Update complete!"

# Environment management
env-prod: ## Set production environment
	@echo "🌐 Setting production environment..."
	@echo "NODE_ENV=production" > .env
	@echo "REACT_APP_ENV=qa" >> .env

env-dev: ## Set development environment
	@echo "🌐 Setting development environment..."
	@echo "NODE_ENV=development" > .env
	@echo "VITE_API_URL=http://localhost:4001" >> .env

# Information commands
info: ## Show project information
	@echo "📋 SimplifyQA Project Information:"
	@echo "   Production URL: http://localhost:$(PROD_PORT)"
	@echo "   Development URL: http://localhost:$(DEV_PORT)"
	@echo "   Health Check: http://localhost:$(PROD_PORT)/health"
	@echo "   Image Name: $(IMAGE_NAME)"
	@echo "   Container Name: $(CONTAINER_NAME)"

ports: ## Show port usage
	@echo "🔌 Port Information:"
	@echo "   Production: localhost:$(PROD_PORT) -> container:80"
	@echo "   Development: localhost:$(DEV_PORT) -> container:8080"
	@echo "   Health Check: localhost:$(PROD_PORT)/health" 