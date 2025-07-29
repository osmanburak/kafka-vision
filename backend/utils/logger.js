const fs = require('fs');
const path = require('path');
const util = require('util');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const debugLogPath = path.join(logsDir, 'debug.log');
const errorLogPath = path.join(logsDir, 'error.log');

// Create write streams
const debugStream = fs.createWriteStream(debugLogPath, { flags: 'a' });
const errorStream = fs.createWriteStream(errorLogPath, { flags: 'a' });

// Format log message with timestamp
function formatLogMessage(level, args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => 
    typeof arg === 'object' ? util.inspect(arg, { depth: null, colors: false }) : arg
  ).join(' ');
  
  return `[${timestamp}] [${level}] ${message}\n`;
}

// Logger object
const logger = {
  debug: (...args) => {
    const message = formatLogMessage('DEBUG', args);
    debugStream.write(message);
    // Do not output to console for debug messages
  },
  
  info: (...args) => {
    const message = formatLogMessage('INFO', args);
    debugStream.write(message);
    // Do not output to console for info messages
  },
  
  warn: (...args) => {
    const message = formatLogMessage('WARN', args);
    debugStream.write(message);
    errorStream.write(message);
    console.warn(...args); // Keep console output for warnings
  },
  
  error: (...args) => {
    const message = formatLogMessage('ERROR', args);
    errorStream.write(message);
    debugStream.write(message); // Also write errors to debug log
    console.error(...args); // Keep console output for errors
  },
  
  // Rotate logs if they get too big (optional, call manually or via cron)
  rotateLogs: () => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    try {
      // Check debug log size
      const debugStats = fs.statSync(debugLogPath);
      if (debugStats.size > maxSize) {
        const archivePath = path.join(logsDir, `debug-${Date.now()}.log`);
        fs.renameSync(debugLogPath, archivePath);
        debugStream.destroy();
        debugStream = fs.createWriteStream(debugLogPath, { flags: 'a' });
      }
      
      // Check error log size
      const errorStats = fs.statSync(errorLogPath);
      if (errorStats.size > maxSize) {
        const archivePath = path.join(logsDir, `error-${Date.now()}.log`);
        fs.renameSync(errorLogPath, archivePath);
        errorStream.destroy();
        errorStream = fs.createWriteStream(errorLogPath, { flags: 'a' });
      }
    } catch (error) {
      console.error('Error rotating logs:', error);
    }
  }
};

// Replace console methods globally (optional - uncomment if you want to catch all console calls)
// console.log = logger.debug;
// console.info = logger.info;
// console.warn = logger.warn;
// console.error = logger.error;

module.exports = logger;