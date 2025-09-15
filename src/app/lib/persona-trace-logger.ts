/**
 * Comprehensive logging utility for tracing persona crystallization flow
 * across Frontend -> API Routes -> Backend -> Convex
 * 
 * USAGE EXAMPLE:
 * 
 * // In a React hook:
 * const requestId = generatePersonaRequestId();
 * personaLogger.info(LogComponent.FRONTEND_HOOK, 'Starting trace extraction', requestId, { userId, conversationId });
 * 
 * // In an API route:
 * personaLogger.debug(LogComponent.API_ROUTE, 'Received request', requestId, { bodySize: req.body.length });
 * 
 * // In a Convex mutation:
 * personaLogger.success(LogComponent.CONVEX_MUTATION, 'Traces stored', requestId, { tracesCount: 5 }, 150);
 * 
 * // To see complete flow:
 * personaLogger.printRequestTrace(requestId);
 */

export enum LogLevel {
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

export enum LogComponent {
  FRONTEND_HOOK = 'FRONTEND_HOOK',
  FRONTEND_API = 'FRONTEND_API', 
  API_ROUTE = 'API_ROUTE',
  BACKEND = 'BACKEND',
  CONVEX_MUTATION = 'CONVEX_MUTATION',
  CONVEX_QUERY = 'CONVEX_QUERY',
  CONVEX_ACTION = 'CONVEX_ACTION'
}

interface LogEntry {
  timestamp: string;
  requestId: string;
  component: LogComponent;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  duration?: number;
  userId?: string;
  conversationId?: string;
}

class PersonaTraceLogger {
  private static instance: PersonaTraceLogger;
  private logs: LogEntry[] = [];
  
  static getInstance(): PersonaTraceLogger {
    if (!PersonaTraceLogger.instance) {
      PersonaTraceLogger.instance = new PersonaTraceLogger();
    }
    return PersonaTraceLogger.instance;
  }

  private formatLog(entry: LogEntry): string {
    const emoji = this.getEmojiForLevel(entry.level);
    const componentTag = `[${entry.component}:${entry.requestId}]`;
    const durationText = entry.duration ? ` (${entry.duration}ms)` : '';
    
    return `${emoji} ${componentTag} ${entry.message}${durationText}`;
  }

  private getEmojiForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      case LogLevel.SUCCESS: return '✅';
      default: return '📝';
    }
  }

  log(
    component: LogComponent,
    level: LogLevel,
    message: string,
    requestId: string,
    data?: Record<string, any>,
    duration?: number,
    userId?: string,
    conversationId?: string
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      component,
      level,
      message,
      data,
      duration,
      userId,
      conversationId
    };

    this.logs.push(entry);
    
    // Output to console with structured format
    const logMessage = this.formatLog(entry);
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }

    // Keep only last 1000 logs to prevent memory issues
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  // Convenience methods for different log levels
  info(component: LogComponent, message: string, requestId: string, data?: Record<string, any>, userId?: string, conversationId?: string) {
    this.log(component, LogLevel.INFO, message, requestId, data, undefined, userId, conversationId);
  }

  debug(component: LogComponent, message: string, requestId: string, data?: Record<string, any>, userId?: string, conversationId?: string) {
    this.log(component, LogLevel.DEBUG, message, requestId, data, undefined, userId, conversationId);
  }

  warn(component: LogComponent, message: string, requestId: string, data?: Record<string, any>, userId?: string, conversationId?: string) {
    this.log(component, LogLevel.WARN, message, requestId, data, undefined, userId, conversationId);
  }

  error(component: LogComponent, message: string, requestId: string, data?: Record<string, any>, userId?: string, conversationId?: string) {
    this.log(component, LogLevel.ERROR, message, requestId, data, undefined, userId, conversationId);
  }

  success(component: LogComponent, message: string, requestId: string, data?: Record<string, any>, duration?: number, userId?: string, conversationId?: string) {
    this.log(component, LogLevel.SUCCESS, message, requestId, data, duration, userId, conversationId);
  }

  // Get logs for a specific request ID to trace the complete flow
  getLogsForRequest(requestId: string): LogEntry[] {
    return this.logs.filter(log => log.requestId === requestId);
  }

  // Get logs for a specific user
  getLogsForUser(userId: string): LogEntry[] {
    return this.logs.filter(log => log.userId === userId);
  }

  // Get logs for a specific conversation
  getLogsForConversation(conversationId: string): LogEntry[] {
    return this.logs.filter(log => log.conversationId === conversationId);
  }

  // Print a trace summary for a request
  printRequestTrace(requestId: string) {
    const requestLogs = this.getLogsForRequest(requestId);
    
    if (requestLogs.length === 0) {
      console.log(`🔍 No logs found for request ID: ${requestId}`);
      return;
    }

    console.log(`\n🗂️ === PERSONA CRYSTALLIZATION TRACE: ${requestId} ===`);
    requestLogs.forEach((log, index) => {
      const step = `${index + 1}`.padStart(2, '0');
      console.log(`${step}. ${this.formatLog(log)}`);
      if (log.data) {
        console.log(`    📋 Data:`, log.data);
      }
    });
    console.log(`🗂️ === END TRACE ===\n`);
  }
}

// Export singleton instance
export const personaLogger = PersonaTraceLogger.getInstance();

// Helper function to generate consistent request IDs across the flow
export function generatePersonaRequestId(): string {
  return `persona_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Helper function for timing operations
export function createTimer() {
  const startTime = Date.now();
  return {
    elapsed: () => Date.now() - startTime,
    stop: () => Date.now() - startTime
  };
}
