export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  HTTP = 'http',
  PERFORMANCE = 'performance',
}

export interface LoggerOptions {
  level?: string;
  enableConsoleLogging?: boolean;
  enableDebug?: boolean;
  service?: string;
}
