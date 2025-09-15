/**
 * Startup Health Check Service
 * 
 * This module performs comprehensive health checks on application startup
 * to ensure all critical services are available.
 */

import { AppConfig } from './config-validation';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  responseTime: number;
  error?: string;
  details?: Record<string, any>;
}

export interface StartupHealthReport {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  totalTime: number;
  checks: HealthCheckResult[];
  criticalIssues: string[];
  warnings: string[];
}

/**
 * Performs a health check on the backend service
 */
async function checkBackendHealth(backendUrl: string): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        service: 'backend',
        status: 'healthy',
        responseTime,
        details: {
          status_code: response.status,
          version: data.version,
          backend_status: data.status
        }
      };
    } else {
      return {
        service: 'backend',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: {
          status_code: response.status
        }
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      service: 'backend',
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        error_type: error instanceof Error ? error.name : 'Unknown'
      }
    };
  }
}

/**
 * Performs a health check on persona crystallization endpoints
 */
async function checkPersonaCrystallizationHealth(backendUrl: string): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${backendUrl}/api/v1/persona-crystallization/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(8000) // 8 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        service: 'persona-crystallization',
        status: 'healthy',
        responseTime,
        details: {
          status_code: response.status,
          system: data.system,
          version: data.version,
          endpoints: data.endpoints?.length || 0
        }
      };
    } else {
      return {
        service: 'persona-crystallization',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: {
          status_code: response.status
        }
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      service: 'persona-crystallization',
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        error_type: error instanceof Error ? error.name : 'Unknown'
      }
    };
  }
}

/**
 * Performs a health check on Convex service (if configured)
 */
async function checkConvexHealth(convexUrl?: string): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  if (!convexUrl) {
    return {
      service: 'convex',
      status: 'warning',
      responseTime: 0,
      error: 'Convex URL not configured',
      details: {
        configured: false
      }
    };
  }
  
  try {
    // For Convex, we'll check if the URL is reachable
    // Note: Convex doesn't have a standard health endpoint, so this is a basic connectivity check
    const response = await fetch(convexUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      service: 'convex',
      status: response.ok ? 'healthy' : 'warning',
      responseTime,
      details: {
        status_code: response.status,
        configured: true,
        reachable: response.ok
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      service: 'convex',
      status: 'warning',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        configured: true,
        reachable: false,
        error_type: error instanceof Error ? error.name : 'Unknown'
      }
    };
  }
}

/**
 * Performs all startup health checks
 */
export async function performStartupHealthChecks(config: AppConfig): Promise<StartupHealthReport> {
  const startTime = Date.now();
  const checks: HealthCheckResult[] = [];
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  
  console.log('🏥 [HEALTH] Starting application health checks...');
  
  // Check backend health (critical)
  try {
    console.log('🔍 [HEALTH] Checking backend service...');
    const backendCheck = await checkBackendHealth(config.backendUrl);
    checks.push(backendCheck);
    
    if (backendCheck.status === 'unhealthy') {
      criticalIssues.push(`Backend service is unhealthy: ${backendCheck.error}`);
    } else if (backendCheck.status === 'warning') {
      warnings.push(`Backend service has warnings: ${backendCheck.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    criticalIssues.push(`Failed to check backend health: ${errorMessage}`);
    checks.push({
      service: 'backend',
      status: 'unhealthy',
      responseTime: 0,
      error: errorMessage
    });
  }
  
  // Check persona crystallization health (critical for persona features)
  if (config.features.personaCrystallization) {
    try {
      console.log('🔍 [HEALTH] Checking persona crystallization service...');
      const personaCheck = await checkPersonaCrystallizationHealth(config.backendUrl);
      checks.push(personaCheck);
      
      if (personaCheck.status === 'unhealthy') {
        criticalIssues.push(`Persona crystallization service is unhealthy: ${personaCheck.error}`);
      } else if (personaCheck.status === 'warning') {
        warnings.push(`Persona crystallization service has warnings: ${personaCheck.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      warnings.push(`Failed to check persona crystallization health: ${errorMessage}`);
      checks.push({
        service: 'persona-crystallization',
        status: 'unhealthy',
        responseTime: 0,
        error: errorMessage
      });
    }
  }
  
  // Check Convex health (optional)
  if (config.features.convexIntegration) {
    try {
      console.log('🔍 [HEALTH] Checking Convex service...');
      const convexCheck = await checkConvexHealth(config.endpoints.convex);
      checks.push(convexCheck);
      
      if (convexCheck.status === 'unhealthy') {
        warnings.push(`Convex service is unhealthy: ${convexCheck.error}`);
      } else if (convexCheck.status === 'warning') {
        warnings.push(`Convex service has warnings: ${convexCheck.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      warnings.push(`Failed to check Convex health: ${errorMessage}`);
      checks.push({
        service: 'convex',
        status: 'warning',
        responseTime: 0,
        error: errorMessage
      });
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  // Determine overall health status
  let overall: 'healthy' | 'unhealthy' | 'degraded';
  if (criticalIssues.length > 0) {
    overall = 'unhealthy';
  } else if (warnings.length > 0) {
    overall = 'degraded';
  } else {
    overall = 'healthy';
  }
  
  const report: StartupHealthReport = {
    overall,
    timestamp: new Date().toISOString(),
    totalTime,
    checks,
    criticalIssues,
    warnings
  };
  
  return report;
}

/**
 * Logs the health check report
 */
export function logHealthCheckReport(report: StartupHealthReport): void {
  console.log('🏥 [HEALTH] Startup health check completed:');
  console.log(`   Overall Status: ${getStatusEmoji(report.overall)} ${report.overall.toUpperCase()}`);
  console.log(`   Total Time: ${report.totalTime}ms`);
  console.log(`   Checks Performed: ${report.checks.length}`);
  
  console.log('   Service Status:');
  report.checks.forEach(check => {
    const emoji = getStatusEmoji(check.status);
    console.log(`     ${emoji} ${check.service}: ${check.status} (${check.responseTime}ms)`);
    if (check.error) {
      console.log(`       Error: ${check.error}`);
    }
    if (check.details) {
      const detailEntries = Object.entries(check.details);
      if (detailEntries.length > 0) {
        console.log(`       Details: ${detailEntries.map(([k, v]) => `${k}=${v}`).join(', ')}`);
      }
    }
  });
  
  if (report.criticalIssues.length > 0) {
    console.error('❌ [HEALTH] Critical Issues:');
    report.criticalIssues.forEach(issue => console.error(`   - ${issue}`));
  }
  
  if (report.warnings.length > 0) {
    console.warn('⚠️ [HEALTH] Warnings:');
    report.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
}

/**
 * Get emoji for status
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'healthy': return '✅';
    case 'unhealthy': return '❌';
    case 'warning': return '⚠️';
    case 'degraded': return '🟡';
    default: return '❓';
  }
}

/**
 * Validates that critical services are healthy
 */
export function validateCriticalServices(report: StartupHealthReport): void {
  if (report.overall === 'unhealthy') {
    const errorMessage = `Application startup failed due to critical service issues:\n${report.criticalIssues.map(issue => `  - ${issue}`).join('\n')}`;
    console.error('💥 [HEALTH] ' + errorMessage);
    throw new Error(errorMessage);
  }
  
  if (report.overall === 'degraded') {
    console.warn('⚠️ [HEALTH] Application started with degraded health. Some features may not work properly.');
  } else {
    console.log('✅ [HEALTH] All critical services are healthy');
  }
}
