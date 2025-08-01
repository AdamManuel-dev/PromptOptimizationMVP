#!/bin/bash

# Start local development services
# Usage: ./scripts/start-services.sh [up|down|restart|logs]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMMAND=${1:-up}

cd "$PROJECT_ROOT"

case $COMMAND in
    up)
        echo "🚀 Starting development services..."
        docker-compose up -d
        
        echo "⏳ Waiting for services to be ready..."
        
        # Wait for PostgreSQL
        until docker-compose exec -T postgres pg_isready -U prompt_user -d prompt_optimization >/dev/null 2>&1; do
            echo -n "."
            sleep 1
        done
        echo ""
        echo "✅ PostgreSQL is ready"
        
        # Wait for Redis
        until docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; do
            echo -n "."
            sleep 1
        done
        echo ""
        echo "✅ Redis is ready"
        
        # Wait for Weaviate
        until curl -s http://localhost:8080/v1/.well-known/ready >/dev/null 2>&1; do
            echo -n "."
            sleep 1
        done
        echo ""
        echo "✅ Weaviate is ready"
        
        echo ""
        echo "🎉 All services are up and running!"
        echo ""
        echo "📊 Service URLs:"
        echo "  - PostgreSQL: postgresql://prompt_user:prompt_password@localhost:5432/prompt_optimization"
        echo "  - Redis: redis://:redis_password@localhost:6379"
        echo "  - Weaviate: http://localhost:8080"
        echo "  - Adminer (DB UI): http://localhost:8081"
        echo "  - Redis Commander: http://localhost:8082"
        echo ""
        echo "💡 Update your .env file with these connection strings"
        ;;
    
    down)
        echo "🛑 Stopping development services..."
        docker-compose down
        echo "✅ Services stopped"
        ;;
    
    restart)
        echo "🔄 Restarting development services..."
        docker-compose restart
        echo "✅ Services restarted"
        ;;
    
    logs)
        echo "📜 Showing service logs (Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    
    reset)
        echo "⚠️  This will delete all data! Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo "🗑️  Resetting all services and data..."
            docker-compose down -v
            echo "✅ All data deleted"
        else
            echo "❌ Reset cancelled"
        fi
        ;;
    
    status)
        echo "📊 Service status:"
        docker-compose ps
        ;;
    
    *)
        echo "❌ Unknown command: $COMMAND"
        echo "Usage: $0 [up|down|restart|logs|reset|status]"
        echo ""
        echo "Commands:"
        echo "  up      - Start all services"
        echo "  down    - Stop all services"
        echo "  restart - Restart all services"
        echo "  logs    - Show service logs"
        echo "  reset   - Stop services and delete all data"
        echo "  status  - Show service status"
        exit 1
        ;;
esac