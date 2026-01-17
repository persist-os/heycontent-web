#!/bin/bash
set -e

# Configuration - set via environment variables or defaults
PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"
SERVICE_NAME="${CLOUD_RUN_SERVICE_NAME:-heycontext-web}"
REGION="${GCP_REGION:-us-central1}"

# Convex deployment configuration
CONVEX_DOMAIN="${CONVEX_CLOUD_DOMAIN:-your-convex-domain.convex.cloud}"

# Check if custom domain is verified
echo "🔍 Checking Convex custom domain status..."
CUSTOM_DOMAIN_VERIFIED=$(npx convex run --no-tty internal:checkDomainVerification 2>/dev/null || echo "false")

# Set environment variables based on domain verification
if [ "$CUSTOM_DOMAIN_VERIFIED" == "true" ]; then
  echo "✅ Custom domain is verified. Using custom domain for deployment."
  export CONVEX_CLOUD_URL="https://$CONVEX_DOMAIN"
  export NEXT_PUBLIC_CONVEX_URL="https://$CONVEX_DOMAIN"
else
  echo "⚠️ Custom domain not verified yet. Using default Convex domain."
  # Use the default Convex URL from .env.local
  source .env.local
fi

# Deploy to Convex first
echo "🚀 Deploying backend to Convex..."
npx convex deploy

# Build and push the Docker image for Linux/AMD64
echo "🐳 Building and pushing Docker image for Linux/AMD64..."
# Create and use a new builder instance
docker buildx create --name mybuilder --use || true
# Start the builder if it's not already running
docker buildx inspect --bootstrap || true
# Build and push the image
docker buildx build --platform linux/amd64 \
  -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --push \
  .

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \

echo "✅ Deployment complete!"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
echo "🌐 Service URL: $SERVICE_URL"
