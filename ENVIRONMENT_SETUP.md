# Environment Configuration Setup

This project supports multiple environment configurations for local development, staging, and production deployments.

## Environment Files

The project uses the following environment configuration files:

- `env.local.example` - Local development environment template
- `env.staging.example` - Staging environment template  
- `env.production.example` - Production environment template

## Setup Instructions

### 1. Create Environment Files

Copy the example files and rename them to remove the `.example` suffix:

```bash
# For local development
cp env.local.example env.local

# For staging
cp env.staging.example env.staging

# For production
cp env.production.example env.production
```

### 2. Configure Environment Variables

Edit each environment file with your specific values:

#### Local Development (`env.local`)
```bash
NODE_ENV=development
PORT=7777
MONGODB_URI=mongodb://localhost:27017/organizer
CORS_ORIGIN=http://localhost:8080
SESSION_SECRET=your-local-session-secret-key
JWT_SECRET=your-local-jwt-secret-key
```

#### Staging (`env.staging`)
```bash
NODE_ENV=staging
PORT=7777
MONGODB_URI=mongodb://staging-mongodb-host:27017/organizer-staging
CORS_ORIGIN=https://staging.yourdomain.com
SESSION_SECRET=your-staging-session-secret-key
JWT_SECRET=your-staging-jwt-secret-key
```

#### Production (`env.production`)
```bash
NODE_ENV=production
PORT=7777
MONGODB_URI=mongodb://production-mongodb-host:27017/organizer-production
CORS_ORIGIN=https://yourdomain.com
SESSION_SECRET=your-production-session-secret-key
JWT_SECRET=your-production-jwt-secret-key
```

### 3. Running the Application

The application will automatically load the appropriate environment file based on the `NODE_ENV` environment variable:

```bash
# Local development
NODE_ENV=local npm run start-dev

# Staging
NODE_ENV=staging npm run server

# Production
NODE_ENV=production npm run server
```

## Environment Variables Reference

### Required Variables
- `NODE_ENV` - Environment mode (development, staging, production)
- `PORT` - Server port number
- `MONGODB_URI` - MongoDB connection string
- `SESSION_SECRET` - Secret key for session management
- `JWT_SECRET` - Secret key for JWT tokens

### Optional Variables
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:8080)
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `ENABLE_LOGGING` - Enable/disable logging (true/false)
- `BCRYPT_ROUNDS` - Number of bcrypt rounds for password hashing
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window
- `ENABLE_METRICS` - Enable metrics collection (true/false)
- `METRICS_PORT` - Port for metrics endpoint
- `ENABLE_COMPRESSION` - Enable response compression (true/false)
- `ENABLE_CACHE` - Enable caching (true/false)
- `CACHE_TTL` - Cache time-to-live in seconds

### External Services
- `REDIS_URL` - Redis connection URL
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

### SSL/TLS (Production)
- `SSL_ENABLED` - Enable SSL/TLS (true/false)
- `SSL_KEY_PATH` - Path to SSL private key
- `SSL_CERT_PATH` - Path to SSL certificate

## Security Notes

1. **Never commit actual environment files** - The `.env*` files are ignored by git
2. **Use strong secrets** - Generate strong, unique secrets for each environment
3. **Production validation** - The application will exit if default secrets are detected in production
4. **Environment isolation** - Use different databases and services for each environment

## Configuration Loading

The application uses a centralized configuration system (`src/server/config.js`) that:

1. Loads environment-specific files based on `NODE_ENV`
2. Falls back to default values for missing variables
3. Validates required configuration
4. Provides type-safe access to configuration values

## Troubleshooting

### Common Issues

1. **Configuration not loading**: Ensure the environment file exists and `NODE_ENV` is set correctly
2. **Default secrets in production**: The app will exit if default secrets are detected in production mode
3. **CORS errors**: Verify `CORS_ORIGIN` is set correctly for your frontend URL
4. **Database connection issues**: Check `MONGODB_URI` format and network connectivity

### Debug Mode

To see which configuration file is being loaded, check the server startup logs:

```
Server running in development mode, listening on port 7777
CORS origin: http://localhost:8080
```
