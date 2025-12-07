#!/bin/bash

# Setup script for different environments
# Usage: ./scripts/setup-env.sh [development|staging|production]

set -e

ENVIRONMENT=${1:-development}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Setting up $ENVIRONMENT environment..."

# Create environment file if it doesn't exist
if [ "$ENVIRONMENT" = "development" ]; then
    ENV_FILE="$PROJECT_ROOT/.env"
else
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating $ENV_FILE from template..."
    cp "$PROJECT_ROOT/.env.example" "$ENV_FILE"
    
    # Generate secure keys for development
    if [ "$ENVIRONMENT" = "development" ]; then
        JWT_SECRET=$(openssl rand -base64 32)
        ENCRYPTION_KEY=$(openssl rand -hex 16)
        WEBHOOK_SECRET=$(openssl rand -base64 24)
        
        # Update the .env file with generated values
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"
            sed -i '' "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" "$ENV_FILE"
            sed -i '' "s|WEBHOOK_SECRET=.*|WEBHOOK_SECRET=$WEBHOOK_SECRET|" "$ENV_FILE"
        else
            # Linux
            sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"
            sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" "$ENV_FILE"
            sed -i "s|WEBHOOK_SECRET=.*|WEBHOOK_SECRET=$WEBHOOK_SECRET|" "$ENV_FILE"
        fi
        
        echo "🔐 Generated secure keys for development"
    fi
else
    echo "✅ $ENV_FILE already exists"
fi

# Create required directories
echo "📁 Creating required directories..."
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$PROJECT_ROOT/data"
mkdir -p "$PROJECT_ROOT/tmp"

# Environment-specific setup
case $ENVIRONMENT in
    development)
        echo "🔧 Development environment setup complete"
        echo ""
        echo "Next steps:"
        echo "1. Update $ENV_FILE with your local configuration"
        echo "2. Start local services (PostgreSQL, Redis, Vector DB)"
        echo "3. Run 'npm run dev' to start the development server"
        ;;
    
    staging)
        echo "🧪 Staging environment setup complete"
        echo ""
        echo "Next steps:"
        echo "1. Update $ENV_FILE with staging credentials"
        echo "2. Deploy to staging server"
        echo "3. Run database migrations"
        ;;
    
    production)
        echo "🚀 Production environment setup complete"
        echo ""
        echo "⚠️  IMPORTANT: Ensure all credentials in $ENV_FILE are production-ready"
        echo "Next steps:"
        echo "1. Review and update $ENV_FILE with production credentials"
        echo "2. Set up monitoring and alerting"
        echo "3. Deploy with zero-downtime strategy"
        ;;
    
    *)
        echo "❌ Unknown environment: $ENVIRONMENT"
        echo "Usage: $0 [development|staging|production]"
        exit 1
        ;;
esac

echo ""
echo "✨ Environment setup complete!"