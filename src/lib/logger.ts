type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const sensitiveKeyPattern = /email|password|token|secret|cookie/i;

function isPlainObject(value: unknown): value is LogContext {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function withoutSensitiveKeys(context: LogContext): LogContext {
  return Object.fromEntries(
    Object.entries(context)
      .filter(([key]) => !sensitiveKeyPattern.test(key))
      .map(([key, value]) => [
        key,
        isPlainObject(value) ? withoutSensitiveKeys(value) : value,
      ]),
  );
}

function writeLog(level: LogLevel, event: string, context: LogContext = {}) {
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...withoutSensitiveKeys(context),
  };
  console[level](JSON.stringify(entry));
}

export const logger = {
  info: (event: string, context?: LogContext) =>
    writeLog("info", event, context),
  warn: (event: string, context?: LogContext) =>
    writeLog("warn", event, context),
  error: (event: string, context?: LogContext) =>
    writeLog("error", event, context),
};
