/**
 * Simple logging utility for the application
 * In production, this could be replaced with a proper logging service
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.isDevelopment && level === "debug") {
      return; // Skip debug logs in production
    }

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In development, use console for immediate feedback
    if (this.isDevelopment) {
      const emoji = {
        info: "📘",
        warn: "⚠️",
        error: "🚨",
        debug: "🔍",
      }[level];

      console[level === "debug" ? "log" : level](
        `${emoji} [${level.toUpperCase()}]`,
        message,
        context || ""
      );
    } else {
      // In production, you would typically send to a logging service
      // For now, just use console.error for errors
      if (level === "error") {
        console.error(JSON.stringify(logData));
      }
    }
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext) {
    this.log("error", message, context);
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }
}

export const logger = new Logger();
