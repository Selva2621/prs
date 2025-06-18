import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, context, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]`;
    if (context) log += ` [${context}]`;
    log += ` ${message}`;
    if (stack) log += `\n${stack}`;
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

const createLogger = () => {
  const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, context }) => {
          let log = `${timestamp} [${level}]`;
          if (context) log += ` [${context}]`;
          log += ` ${message}`;
          return log;
        })
      ),
    }),
  ];

  // File transports for production
  if (process.env.NODE_ENV === 'production') {
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exceptionHandlers: [
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      }),
    ],
    rejectionHandlers: [
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      }),
    ],
  });
};

export const logger = createLogger();

export const winstonLogger = WinstonModule.createLogger({
  instance: logger,
});

// Custom logging service for application-specific logs
export class CosmicLogger {
  private static instance: CosmicLogger;
  private logger: winston.Logger;

  private constructor() {
    this.logger = logger;
  }

  static getInstance(): CosmicLogger {
    if (!CosmicLogger.instance) {
      CosmicLogger.instance = new CosmicLogger();
    }
    return CosmicLogger.instance;
  }

  // User activity logs
  logUserActivity(userId: string, activity: string, metadata?: any) {
    this.logger.info('User Activity', {
      userId,
      activity,
      metadata,
      type: 'USER_ACTIVITY',
    });
  }

  // Message logs
  logMessage(senderId: string, recipientId: string, messageType: string, metadata?: any) {
    this.logger.info('Message Sent', {
      senderId,
      recipientId,
      messageType,
      metadata,
      type: 'MESSAGE',
    });
  }

  // Photo upload logs
  logPhotoUpload(userId: string, photoId: string, metadata?: any) {
    this.logger.info('Photo Uploaded', {
      userId,
      photoId,
      metadata,
      type: 'PHOTO_UPLOAD',
    });
  }

  // Video call logs
  logVideoCall(callerId: string, calleeId: string, callStatus: string, duration?: number) {
    this.logger.info('Video Call', {
      callerId,
      calleeId,
      callStatus,
      duration,
      type: 'VIDEO_CALL',
    });
  }

  // Proposal logs
  logProposal(proposerId: string, recipientId: string, proposalStatus: string, metadata?: any) {
    this.logger.info('Proposal Activity', {
      proposerId,
      recipientId,
      proposalStatus,
      metadata,
      type: 'PROPOSAL',
    });
  }

  // Security logs
  logSecurityEvent(userId: string, event: string, ipAddress?: string, userAgent?: string) {
    this.logger.warn('Security Event', {
      userId,
      event,
      ipAddress,
      userAgent,
      type: 'SECURITY',
    });
  }

  // Error logs
  logError(error: Error, context?: string, metadata?: any) {
    this.logger.error('Application Error', {
      error: error.message,
      stack: error.stack,
      context,
      metadata,
      type: 'ERROR',
    });
  }

  // Performance logs
  logPerformance(operation: string, duration: number, metadata?: any) {
    this.logger.info('Performance Metric', {
      operation,
      duration,
      metadata,
      type: 'PERFORMANCE',
    });
  }

  // Database logs
  logDatabaseOperation(operation: string, table: string, duration?: number, metadata?: any) {
    this.logger.debug('Database Operation', {
      operation,
      table,
      duration,
      metadata,
      type: 'DATABASE',
    });
  }
}
