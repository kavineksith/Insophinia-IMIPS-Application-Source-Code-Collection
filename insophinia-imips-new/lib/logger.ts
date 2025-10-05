import { LogEntry } from '../types';

const LOG_STORAGE_KEY = 'imips_app_logs';
const MAX_LOG_ENTRIES = 500;

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private userId: string | null = null;

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
    } catch (error) {
      console.error("Failed to load logs from localStorage", error);
      this.logs = [];
    }
  }

  private saveLogs() {
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error("Failed to save logs to localStorage", error);
    }
  }
  
  public setUserId(userId: string | null) {
    this.userId = userId;
  }

  private addLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, context?: any) {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.userId || undefined,
    };
    
    this.logs = [newLog, ...this.logs];
    if (this.logs.length > MAX_LOG_ENTRIES) {
        this.logs.pop();
    }
    
    this.saveLogs();
    this.listeners.forEach(listener => listener([...this.logs]));
    
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
    return [...this.logs];
  }

  public clearLogs() {
    this.info('Logs cleared by admin.');
    this.logs = [];
    this.saveLogs();
    this.listeners.forEach(listener => listener(this.logs));
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
