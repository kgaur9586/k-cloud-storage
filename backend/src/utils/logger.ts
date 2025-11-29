import { LogLevel, LoggerOptions } from "./types.js";
import "json-circular-stringify";

import { WinstonTransport as AxiomTransport } from "@axiomhq/winston";
import { ApplicationError } from "../shared/globals/error/AppError.js";
import { requestContextService } from "./requestContext.js";
import { filterKeysNotInAxiom } from "./helper.js";
import { error as err } from "console";
import { Environment } from "../types/index.js";
import winston from "winston";
import path from "path";

// Define logging levels with custom http level
const logLevels = {
  ...winston.config.syslog.levels,
  [LogLevel.HTTP]: 5, // Add http level with priority 5 (between info and warn)
  [LogLevel.PERFORMANCE]: 5,
};

const logColors = {
  ...winston.config.syslog.colors,
  [LogLevel.WARN]: "yellow",
  [LogLevel.HTTP]: "magenta",
  [LogLevel.PERFORMANCE]: "cyan",
};

const AXIOM_LIMIT_EXCEED_MESSAGE = "exceed the column limit";

winston.addColors(logColors);
interface IFormatAdditionalParamsResult {
  error?: Error | ApplicationError;
  additionalParams?: unknown[];
}
export class LoggerService {
  private logger: winston.Logger;
  private module: string;
  private environment: Environment;

  constructor(module: string, options?: LoggerOptions) {
    this.environment = process.env.NODE_ENV as Environment;
    this.module = module;
    this.logger = this.configureLogger(options);
  }

  private logError = (error: Error) => {
    const requestId = requestContextService.getRequestId();
    if (error instanceof Error && error.stack?.includes(AXIOM_LIMIT_EXCEED_MESSAGE)) {
      const errorStr = `[Failed to log these errors]: RequestId: ${requestId} Name: ${error.name} Cause: ${error.cause} Message: ${error.message}`;
      this.logger.error(errorStr);
    }
  };

  private configureLogger(options?: LoggerOptions): winston.Logger {
    const defaultOptions: LoggerOptions = {
      service: "k-cloud-storage",
      level: options?.level || this.determineLogLevel(this.environment, options?.enableDebug),
      // Enable console logging in local environment
      enableConsoleLogging: options?.enableConsoleLogging !== undefined ? options.enableConsoleLogging : this.environment !== Environment.PRODUCTION,
      enableDebug: options?.enableDebug || false,
    };

    const transports: winston.transport[] = [];
    const enableAxiom = this.environment !== Environment.LOCAL;
    // Only add Axiom transport if not in local environment
    if (enableAxiom) {
      transports.push(
        new AxiomTransport({
          dataset: process.env.AXIOM_DATASET_ID!,
          token: process.env.AXIOM_TOKEN!,
          orgId: process.env.AXIOM_ORG_ID!,
          onError: (error) => {
            err("Axiom transport error:", error);
            this.logError(error);
          },
        }),
      );
    }

    if (defaultOptions.enableConsoleLogging) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...metadata }) => {
              const requestId = requestContextService.getRequestId();
              const requestIdStr = requestId ? `[req-id: ${requestId}] - ` : "";
              return `${timestamp} - ${level} - ${this.module} - ${requestIdStr}${message} ${Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ""}`;
            }),
          ),
        }),
      );
    }

    return winston.createLogger({
      level: defaultOptions.level,
      levels: logLevels,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
          const cleanMetadata = Object.keys(metadata).length ? metadata : {};
          return JSON.stringify({
            timestamp,
            level,
            module: this.module,
            requestId: requestContextService.getRequestId(),
            message,
            ...cleanMetadata,
          });
        }),
      ),
      defaultMeta: { service: defaultOptions.service || "k-cloud-storage" },
      transports,
    });
  }

  private log(level: LogLevel, message: string, optionalParams: unknown[]): void {
    const sanitizedOptionalParams = this.sanitizeParams(optionalParams);
    const requestContext = requestContextService.getContext() || {};
    const metadataToLog = {
      ...sanitizedOptionalParams,
      ...requestContext,
    };
    const filteredMetadataForAxiom = this.environment !== Environment.LOCAL ? filterKeysNotInAxiom(metadataToLog) : metadataToLog;
    this.logger.log({
      ...filteredMetadataForAxiom,
      level,
      message,
      src: this.getSourceFile(),
    });
  }

  public error(message: string, ...params: unknown[]): void {
    const errorInstance = params.find((p) => p instanceof Error || p instanceof ApplicationError) as Error | undefined;
    if (!errorInstance) {
      const newError = new Error(message);
      newError.name = "UnknownError";
      if (Error.captureStackTrace) {
        Error.captureStackTrace(newError, this.error);
      }
      params.push(newError);
    }
    this.log(LogLevel.ERROR, message, params);
  }

  public warn(message: string, ...params: unknown[]): void {
    this.log(LogLevel.WARN, message, params);
  }

  public info(message: string, ...params: unknown[]): void {
    this.log(LogLevel.INFO, message, params);
  }

  public debug(message: string, ...params: unknown[]): void {
    this.log(LogLevel.DEBUG, message, params);
  }

  public http(message: string, ...params: unknown[]): void {
    this.log(LogLevel.HTTP, message, params);
  }

  public performance(message: string, ...params: unknown[]): void {
    this.log(LogLevel.PERFORMANCE, message, params);
  }

  private determineLogLevel(environment: Environment, enableDebug?: boolean): string {
    // Only enable debug in local environment if explicitly set to true
    if (environment === Environment.LOCAL && enableDebug === true) {
      return "debug";
    }

    // For all other cases, return appropriate log level based on environment
    switch (environment) {
      case Environment.PRODUCTION:
      case Environment.DEVELOPMENT:
      case Environment.LOCAL:
        return "info";
      default:
        return "warning";
    }
  }

  private formatAdditionalParams(params: unknown[]): IFormatAdditionalParamsResult {
    const result: Record<string, unknown> = {};
    if (params.length === 0) {
      return result;
    }

    const errorInstance = params.find((p) => p instanceof Error || p instanceof ApplicationError) as Error | undefined;
    const restParams = params.filter((p) => p !== errorInstance);

    if (errorInstance) {
      result.error = errorInstance;
    }

    // If we have exactly one object in restParams, use it directly for cleaner logs
    if (restParams.length === 1 && typeof restParams[0] === "object" && restParams[0] !== null) {
      Object.assign(result, restParams[0] as Record<string, unknown>);
    } else if (restParams.length > 0) {
      result.additionalParams = restParams;
    }

    return result;
  }

  private sanitizeParams(parameters: unknown[]): Record<string, unknown> {
    const params = this.formatAdditionalParams(parameters);
    const result: Record<string, unknown> = {};

    try {
      // Process each property
      for (const [key, value] of Object.entries(params)) {
        // Special handling for ApplicationError
        if (value instanceof ApplicationError) {
          try {
            const errorJson = value.toJSON();

            // If JSON is a string, try to parse it
            if (typeof errorJson === "string") {
              try {
                result[key] = JSON.parse(errorJson);
              } catch {
                result[key] = { message: value.message, raw: errorJson };
              }
            } else {
              // Otherwise use the JSON object directly
              result[key] = errorJson;
            }
            continue;
          } catch {
            // Fallback for any ApplicationError processing errors
            result[key] = { message: value.message };
            continue;
          }
        }

        // Handle regular Error objects
        if (value instanceof Error) {
          result[key] = {
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
          continue;
        }

        // For everything else, try safe JSON conversion to handle circular references
        try {
          // For basic values this is unnecessary but harmless
          // For complex objects this handles circular references
          result[key] = JSON.parse(JSON.stringify(value));
        } catch {
          // If JSON conversion fails, provide a simple representation
          const type = value === null ? "null" : typeof value;
          result[key] = `[Unserializable ${type}]`;
        }
      }
    } catch (e) {
      // Fallback if anything goes wrong during sanitization
      return { sanitizationError: true, message: e instanceof Error ? e.message : String(e) };
    }

    return result;
  }

  private getSourceFile(): string | undefined {
    const stack = new Error().stack;
    if (!stack) {
      return undefined;
    }

    const frames = stack.split("\n");

    // Skip the first few lines (Error, getSourceFile, and possibly wrapper functions)
    for (let i = 3; i < frames.length; i++) {
      const match = frames[i].match(/(?:at\s+[\w.]+\s+\()?((?:[a-zA-Z]:)?[^:()\n]*?\.(?:ts|js)):(\d+):(\d+)/);

      if (!match) {
        continue;
      }

      const [, rawPath, line, col] = match;

      if (rawPath.includes("loggerv2.ts")) {
        continue;
      }

      try {
        const normalized = path.normalize(rawPath);
        const relative = path.relative(process.cwd(), normalized);
        return `${relative}:${line}:${col}`;
      } catch {
        return rawPath;
      }
    }

    return undefined;
  }
}

export const createLogger = (module: string, options?: LoggerOptions) => {
  return new LoggerService(module, options);
};

export const logger = createLogger('k-cloud-storage');
