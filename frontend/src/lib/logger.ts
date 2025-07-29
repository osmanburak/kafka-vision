// Frontend logger that sends logs to backend for file storage
class Logger {
  private apiUrl: string;
  private logBuffer: any[] = [];
  private flushInterval: number = 5000; // Flush logs every 5 seconds
  private maxBufferSize: number = 100;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    
    // Start periodic flush
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), this.flushInterval);
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private formatLogEntry(level: string, args: any[]) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    };
  }

  private addToBuffer(entry: any) {
    this.logBuffer.push(entry);
    
    // Flush if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.logBuffer.length === 0) return;
    
    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      await fetch(`${this.apiUrl}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ logs: logsToSend })
      });
    } catch (error) {
      // If logging fails, don't throw - just print to console
      console.error('Failed to send logs to server:', error);
    }
  }

  debug(...args: any[]) {
    const entry = this.formatLogEntry('DEBUG', args);
    this.addToBuffer(entry);
    // Do not output to console for debug
  }

  info(...args: any[]) {
    const entry = this.formatLogEntry('INFO', args);
    this.addToBuffer(entry);
    // Do not output to console for info
  }

  warn(...args: any[]) {
    const entry = this.formatLogEntry('WARN', args);
    this.addToBuffer(entry);
    console.warn(...args); // Keep console output for warnings
  }

  error(...args: any[]) {
    const entry = this.formatLogEntry('ERROR', args);
    this.addToBuffer(entry);
    console.error(...args); // Keep console output for errors
  }
}

// Create singleton instance
const logger = new Logger();

// Export logger instance
export default logger;

// Optional: Replace console methods globally
// if (typeof window !== 'undefined') {
//   window.console.log = (...args) => logger.debug(...args);
//   window.console.info = (...args) => logger.info(...args);
//   window.console.warn = (...args) => logger.warn(...args);
//   window.console.error = (...args) => logger.error(...args);
// }