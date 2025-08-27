import dotenv from 'dotenv';
import path from 'path';

// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || 'development';
const envFile = path.resolve(process.cwd(), `env.${env}`);

// Try to load the specific environment file
try {
  dotenv.config({ path: envFile });
} catch (error) {
  console.warn(`Could not load ${envFile}, using default environment variables`);
}

// Fallback to .env file if it exists
dotenv.config();

const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server Configuration
  PORT: parseInt(process.env.PORT) || 7777,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:8080',
  SESSION_SECRET: process.env.SESSION_SECRET || 'default-session-secret',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/organizer',
  DB_NAME: process.env.DB_NAME || 'organizer',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT) || 27017,
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'default-jwt-secret',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  
  // API Configuration
  API_VERSION: process.env.API_VERSION || 'v1',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ENABLE_LOGGING: process.env.ENABLE_LOGGING !== 'false',
  
  // External Services
  REDIS_URL: process.env.REDIS_URL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  
  // Monitoring
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
  METRICS_PORT: parseInt(process.env.METRICS_PORT) || 9090,
  
  // Performance
  ENABLE_COMPRESSION: process.env.ENABLE_COMPRESSION === 'true',
  ENABLE_CACHE: process.env.ENABLE_CACHE === 'true',
  CACHE_TTL: parseInt(process.env.CACHE_TTL) || 3600,
  
  // SSL/TLS
  SSL_ENABLED: process.env.SSL_ENABLED === 'true',
  SSL_KEY_PATH: process.env.SSL_KEY_PATH,
  SSL_CERT_PATH: process.env.SSL_CERT_PATH,
};

// Validation
const requiredFields = ['MONGODB_URI', 'SESSION_SECRET', 'JWT_SECRET'];

requiredFields.forEach(field => {
  if (!config[field]) {
    console.warn(`Warning: ${field} is not set. Using default value.`);
  }
});

// Environment-specific validations
if (config.NODE_ENV === 'production') {
  if (config.SESSION_SECRET === 'default-session-secret' || 
      config.JWT_SECRET === 'default-jwt-secret') {
    console.error('ERROR: Default secrets detected in production environment!');
    console.error('Please set proper SESSION_SECRET and JWT_SECRET values.');
    process.exit(1);
  }
}

export default config;
