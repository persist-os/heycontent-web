# HeyContent Configuration Guide

This document provides comprehensive information about configuring the HeyContent frontend application.

## Environment Variables

### Required Environment Variables

#### NEXT_PUBLIC_BACKEND_URL

- **Description**: URL of the HeyContent backend API service
- **Required**: Yes
- **Format**: Must start with `http://` or `https://`
- **Examples**:
  - Development: `http://localhost:8000`
  - Production: `https://api.heycontent.co`
- **Validation**:
  - Cannot be empty
  - Must be a valid URL
  - Cannot use localhost in production

#### NEXT_PUBLIC_FRONTEND_URL

- **Description**: URL of the frontend application
- **Required**: No (defaults to `http://localhost:3000`)
- **Format**: Must start with `http://` or `https://`
- **Examples**:
  - Development: `http://localhost:3000`
  - Production: `https://app.heycontent.co`

### Optional Environment Variables

#### NEXT_PUBLIC_CONVEX_URL

- **Description**: Convex database service URL
- **Required**: No
- **Impact**: Required for real-time features and data synchronization
- **Example**: `https://your-convex-deployment.convex.cloud`

#### NEXT_PUBLIC_FIREBASE_CONFIG

- **Description**: Firebase configuration JSON for authentication
- **Required**: No (but needed for auth features)
- **Format**: JSON string containing Firebase config
- **Example**: `{"apiKey":"...","authDomain":"...","projectId":"..."}`

#### NODE_ENV

- **Description**: Node.js environment mode
- **Required**: No (defaults to development)
- **Values**: `development`, `production`, `staging`
- **Impact**: Affects configuration validation and health check behavior

## Configuration Validation

The application performs comprehensive configuration validation on startup:

### Startup Validation Process

1. **Environment Variable Validation**
   - Checks all required variables are present
   - Validates URL formats and accessibility
   - Ensures production-safe configurations

2. **Health Check Validation**
   - Tests backend service connectivity
   - Validates persona crystallization endpoints
   - Checks optional service availability

3. **Feature Flag Resolution**
   - Determines which features are available
   - Based on configured services and URLs
   - Gracefully handles missing optional services

### Validation Levels

#### Critical Errors

These will prevent application startup:

- Missing `NEXT_PUBLIC_BACKEND_URL`
- Invalid URL formats
- Localhost URLs in production
- Backend service unreachable

#### Warnings

These allow startup but may impact functionality:

- Missing optional environment variables
- Degraded service health
- Development configurations in staging

## Service Dependencies

### Backend API Service

- **Purpose**: Core application logic and data processing
- **Health Check**: `GET /health`
- **Required For**: All application features
- **Configuration**: `NEXT_PUBLIC_BACKEND_URL`

### Persona Crystallization Service

- **Purpose**: Psychological insight extraction and analysis
- **Health Check**: `GET /api/v1/persona-crystallization/health`
- **Required For**: Persona features
- **Configuration**: Part of backend service

### Convex Database

- **Purpose**: Real-time data synchronization
- **Health Check**: Basic connectivity test
- **Required For**: Real-time features, collaboration
- **Configuration**: `NEXT_PUBLIC_CONVEX_URL`

### Firebase Authentication

- **Purpose**: User authentication and session management
- **Health Check**: Configuration validation
- **Required For**: User authentication
- **Configuration**: `NEXT_PUBLIC_FIREBASE_CONFIG`

## Environment-Specific Configuration

### Development Environment

```bash
# Required
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Optional
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_CONVEX_URL=https://dev-deployment.convex.cloud
NODE_ENV=development
```

### Staging Environment

```bash
# Required
NEXT_PUBLIC_BACKEND_URL=https://staging-api.heycontent.co

# Optional
NEXT_PUBLIC_FRONTEND_URL=https://staging.heycontent.co
NEXT_PUBLIC_CONVEX_URL=https://staging-deployment.convex.cloud
NODE_ENV=staging
```

### Production Environment

```bash
# Required
NEXT_PUBLIC_BACKEND_URL=https://api.heycontent.co

# Required for production
NEXT_PUBLIC_FRONTEND_URL=https://app.heycontent.co
NEXT_PUBLIC_CONVEX_URL=https://prod-deployment.convex.cloud
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"..."}
NODE_ENV=production
```

## Startup Modes

### Full Startup (Production)

- Complete configuration validation
- Comprehensive health checks
- Critical service validation
- Longer startup time, maximum reliability

### Development Startup

- Configuration validation only
- Skipped health checks for faster development
- Warning-only for missing optional services
- Faster startup time for development efficiency

## Troubleshooting

### Common Configuration Issues

#### "NEXT_PUBLIC_BACKEND_URL environment variable is not configured"

- **Cause**: Missing required environment variable
- **Solution**: Set `NEXT_PUBLIC_BACKEND_URL` in your environment
- **Example**: `export NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`

#### "NEXT_PUBLIC_BACKEND_URL must start with http:// or https://"

- **Cause**: Invalid URL format
- **Solution**: Ensure URL includes protocol
- **Example**: Use `https://api.example.com` not `api.example.com`

#### "NEXT_PUBLIC_BACKEND_URL cannot use localhost in production"

- **Cause**: Development URL used in production
- **Solution**: Use proper production backend URL
- **Example**: Use `https://api.heycontent.co` not `http://localhost:8000`

#### "Backend service is unhealthy"

- **Cause**: Backend service not responding
- **Solution**:
  1. Check backend service status
  2. Verify network connectivity
  3. Check backend URL configuration
  4. Review backend service logs

### Health Check Failures

#### Backend Service Unreachable

```
❌ Backend service is unhealthy: Network timeout
```

- Check backend service is running
- Verify URL configuration
- Check network connectivity
- Review firewall settings

#### Persona Crystallization Service Issues

```
⚠️ Persona crystallization service has warnings: HTTP 503
```

- Backend service may be overloaded
- Check backend service capacity
- Review persona service configuration
- May continue with degraded functionality

### Configuration Validation Logs

The application provides detailed logging during startup:

```
🔧 [CONFIG] Environment configuration validation:
   Status: ✅ Valid
   Environment: production
   Backend URL: https://api.heycontent.co
   Frontend URL: https://app.heycontent.co
   Features:
     Persona Crystallization: ✅
     Smart Notes: ✅
     Convex Integration: ✅
```

### Health Check Logs

```
🏥 [HEALTH] Startup health check completed:
   Overall Status: ✅ HEALTHY
   Total Time: 1250ms
   Checks Performed: 3
   Service Status:
     ✅ backend: healthy (245ms)
     ✅ persona-crystallization: healthy (678ms)
     ✅ convex: healthy (327ms)
```

## Best Practices

### Environment Variable Management

- Use `.env.local` for local development
- Use proper secret management for production
- Never commit sensitive environment variables
- Use different configurations per environment

### Configuration Validation

- Always validate configuration on deployment
- Monitor health check status in production
- Set up alerts for configuration issues
- Test configuration changes in staging first

### Service Dependencies

- Design for graceful degradation
- Handle missing optional services
- Monitor service health continuously
- Implement fallback mechanisms where possible
