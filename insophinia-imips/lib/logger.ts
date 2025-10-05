import { LogEntry } from '../types';

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  private addLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, context?: any) {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
    
    this.logs = [newLog, ...this.logs];
    if (this.logs.length > 500) { // Keep last 500 logs
        this.logs.pop();
    }
    
    // Notify listeners (e.g., the Logs page)
    this.listeners.forEach(listener => listener(this.logs));
    
    // Also log to console for development
    const consoleArgs = context ? [message, context] : [message];
    switch(level) {
        case 'INFO': console.log(`[INFO]`, ...consoleArgs); break;
        case 'WARN': console.warn(`[WARN]`, ...consoleArgs); break;
        case 'ERROR': console.error(`[ERROR]`, ...consoleArgs); break;
    }
  }

  public info(message: string, context?: any) {
    this.addLog('INFO', message, context);
  }
  
  public warn(message: string, context?: any) {
    this.addLog('WARN', message, context);
  }

  public error(message: string, error?: any, context?: any) {
    const logContext = {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        ...error
      } : undefined
    };
    this.addLog('ERROR', message, logContext);
  }
  
  public getLogs(): LogEntry[] {
    return this.logs;
  }

  public clearLogs() {
    this.logs = [];
    this.listeners.forEach(listener => listener(this.logs));
    this.info('Logs cleared by admin.');
  }
  
  public subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener);
    // Unsubscribe function
    return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const logger = new LoggerService();
