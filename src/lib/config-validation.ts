/**
 * Configuration Validation Module
 * 
 * This module provides comprehensive validation for environment variables
 * and application configuration on startup.
 */

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: AppConfig;
}

export interface AppConfig {
  backendUrl: string;
  frontendUrl: string;
  environment: 'development' | 'production' | 'staging';
  features: {
    personaCrystallization: boolean;
    smartNotes: boolean;
    convexIntegration: boolean;
  };
  endpoints: {
    backend: string;
    convex?: string;
  };
}

/**
 * Validates the NEXT_PUBLIC_BACKEND_URL environment variable
 */
export function validateBackendUrl(): { isValid: boolean; url?: string; error?: string } {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  if (!backendUrl) {
    return {
      isValid: false,
      error: 'NEXT_PUBLIC_BACKEND_URL environment variable is not configured'
    };
  }
  
  if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
    return {
      isValid: false,
      error: 'NEXT_PUBLIC_BACKEND_URL must start with http:// or https://'
    };
  }
  
  // Check for localhost/development URLs in production
  if (process.env.NODE_ENV === 'production' && 
      (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1'))) {
    return {
      isValid: false,
      error: 'NEXT_PUBLIC_BACKEND_URL cannot use localhost in production environment'
    };
  }
  
  try {
    new URL(backendUrl);
  } catch {
    return {
      isValid: false,
      error: 'NEXT_PUBLIC_BACKEND_URL is not a valid URL'
    };
  }
  
  return {
    isValid: true,
    url: backendUrl
  };
}

/**
 * Validates all required environment variables
 */
export function validateEnvironmentVariables(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate backend URL
  const backendValidation = validateBackendUrl();
  if (!backendValidation.isValid) {
    errors.push(backendValidation.error!);
  }
  
  // Validate frontend URL
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
  if (!frontendUrl) {
    warnings.push('NEXT_PUBLIC_FRONTEND_URL not set, defaulting to http://localhost:3000');
  }
  
  // Validate Convex configuration
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    warnings.push('NEXT_PUBLIC_CONVEX_URL not set, Convex features may not work');
  }
  
  // Validate Node environment
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv) {
    warnings.push('NODE_ENV not set, defaulting to development');
  }
  
  // Check for required auth configuration
  const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (!firebaseConfig) {
    warnings.push('NEXT_PUBLIC_FIREBASE_CONFIG not set, authentication may not work');
  }
  
  // Determine environment
  let environment: 'development' | 'production' | 'staging' = 'development';
  if (nodeEnv === 'production') {
    environment = 'production';
  } else if (nodeEnv === 'staging') {
    environment = 'staging';
  }
  
  // Build configuration object
  const config: AppConfig = {
    backendUrl: backendValidation.url || '',
    frontendUrl: frontendUrl || 'http://localhost:3000',
    environment,
    features: {
      personaCrystallization: !!backendValidation.url,
      smartNotes: !!backendValidation.url,
      convexIntegration: !!convexUrl
    },
    endpoints: {
      backend: backendValidation.url || '',
      convex: convexUrl
    }
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  };
}

/**
 * Logs configuration validation results
 */
export function logConfigValidation(result: ConfigValidationResult): void {
  console.log('🔧 [CONFIG] Environment configuration validation:');
  console.log(`   Status: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`   Environment: ${result.config.environment}`);
  console.log(`   Backend URL: ${result.config.backendUrl}`);
  console.log(`   Frontend URL: ${result.config.frontendUrl}`);
  
  if (result.config.endpoints.convex) {
    console.log(`   Convex URL: ${result.config.endpoints.convex}`);
  }
  
  console.log('   Features:');
  console.log(`     Persona Crystallization: ${result.config.features.personaCrystallization ? '✅' : '❌'}`);
  console.log(`     Smart Notes: ${result.config.features.smartNotes ? '✅' : '❌'}`);
  console.log(`     Convex Integration: ${result.config.features.convexIntegration ? '✅' : '❌'}`);
  
  if (result.errors.length > 0) {
    console.error('❌ [CONFIG] Configuration errors:');
    result.errors.forEach(error => console.error(`   - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️ [CONFIG] Configuration warnings:');
    result.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
}

/**
 * Get the current validated configuration
 */
export function getValidatedConfig(): AppConfig {
  const result = validateEnvironmentVariables();
  
  if (!result.isValid) {
    throw new Error(`Configuration validation failed: ${result.errors.join(', ')}`);
  }
  
  return result.config;
}

/**
 * Startup configuration check - throws if critical issues are found
 */
export function performStartupConfigCheck(): AppConfig {
  const result = validateEnvironmentVariables();
  
  logConfigValidation(result);
  
  if (!result.isValid) {
    const errorMessage = `Application startup failed due to configuration errors:\n${result.errors.map(e => `  - ${e}`).join('\n')}`;
    console.error('💥 [CONFIG] ' + errorMessage);
    throw new Error(errorMessage);
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️ [CONFIG] Application started with configuration warnings. Some features may not work properly.');
  } else {
    console.log('✅ [CONFIG] All configuration checks passed successfully');
  }
  
  return result.config;
}
