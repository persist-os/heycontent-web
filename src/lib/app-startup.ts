/**
 * Application Startup Module
 * 
 * This module handles the complete application startup process including
 * configuration validation and health checks.
 */

import { performStartupConfigCheck, logConfigValidation, AppConfig } from './config-validation';
import { performStartupHealthChecks, logHealthCheckReport, validateCriticalServices, StartupHealthReport } from './startup-health-check';

export interface StartupResult {
  config: AppConfig;
  healthReport: StartupHealthReport;
  startupTime: number;
  success: boolean;
  error?: string;
}

/**
 * Performs complete application startup validation
 */
export async function performAppStartup(): Promise<StartupResult> {
  const startTime = Date.now();
  console.log('🚀 [STARTUP] Initializing HeyContent application...');
  
  try {
    // Step 1: Validate configuration
    console.log('📋 [STARTUP] Step 1: Validating configuration...');
    const config = performStartupConfigCheck();
    console.log('✅ [STARTUP] Configuration validation completed');
    
    // Step 2: Perform health checks
    console.log('🏥 [STARTUP] Step 2: Performing health checks...');
    const healthReport = await performStartupHealthChecks(config);
    logHealthCheckReport(healthReport);
    
    // Step 3: Validate critical services
    console.log('🔍 [STARTUP] Step 3: Validating critical services...');
    validateCriticalServices(healthReport);
    
    const startupTime = Date.now() - startTime;
    
    console.log('🎉 [STARTUP] Application startup completed successfully!');
    console.log(`⏱️ [STARTUP] Total startup time: ${startupTime}ms`);
    
    return {
      config,
      healthReport,
      startupTime,
      success: true
    };
    
  } catch (error) {
    const startupTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown startup error';
    
    console.error('💥 [STARTUP] Application startup failed!');
    console.error(`❌ [STARTUP] Error: ${errorMessage}`);
    console.error(`⏱️ [STARTUP] Failed after: ${startupTime}ms`);
    
    return {
      config: {} as AppConfig,
      healthReport: {} as StartupHealthReport,
      startupTime,
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Lightweight startup check for development mode
 */
export async function performDevelopmentStartup(): Promise<StartupResult> {
  const startTime = Date.now();
  console.log('🛠️ [DEV-STARTUP] Initializing development environment...');
  
  try {
    // Only validate configuration in development
    const config = performStartupConfigCheck();
    
    // Skip health checks in development to speed up startup
    const healthReport: StartupHealthReport = {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      totalTime: 0,
      checks: [],
      criticalIssues: [],
      warnings: ['Health checks skipped in development mode']
    };
    
    const startupTime = Date.now() - startTime;
    
    console.log('🎉 [DEV-STARTUP] Development environment ready!');
    console.log(`⏱️ [DEV-STARTUP] Startup time: ${startupTime}ms`);
    
    return {
      config,
      healthReport,
      startupTime,
      success: true
    };
    
  } catch (error) {
    const startupTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown startup error';
    
    console.error('💥 [DEV-STARTUP] Development startup failed!');
    console.error(`❌ [DEV-STARTUP] Error: ${errorMessage}`);
    
    return {
      config: {} as AppConfig,
      healthReport: {} as StartupHealthReport,
      startupTime,
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get startup mode based on environment
 */
export function getStartupMode(): 'full' | 'development' {
  // Use full startup in production, development startup in dev
  return process.env.NODE_ENV === 'production' ? 'full' : 'development';
}

/**
 * Performs startup based on environment
 */
export async function performEnvironmentBasedStartup(): Promise<StartupResult> {
  const mode = getStartupMode();
  
  if (mode === 'full') {
    return await performAppStartup();
  } else {
    return await performDevelopmentStartup();
  }
}
