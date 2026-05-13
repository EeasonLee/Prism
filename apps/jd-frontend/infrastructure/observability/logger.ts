type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_SCOPE = 'app';
const configuredLevel =
  (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel | undefined) ?? 'info';

type LogContext = Record<string, unknown> | undefined;

function emit(
  level: LogLevel,
  scope: string,
  message: string,
  context?: LogContext
) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[configuredLevel]) {
    return;
  }

  const payload = {
    scope,
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  console[level === 'debug' ? 'log' : level](`[${scope}] ${message}`, payload);
}

export function createLogger(scope = DEFAULT_SCOPE) {
  return {
    debug(message: string, context?: LogContext) {
      emit('debug', scope, message, context);
    },
    info(message: string, context?: LogContext) {
      emit('info', scope, message, context);
    },
    warn(message: string, context?: LogContext) {
      emit('warn', scope, message, context);
    },
    error(message: string, context?: LogContext) {
      emit('error', scope, message, context);
    },
  };
}

export const logger = createLogger();
