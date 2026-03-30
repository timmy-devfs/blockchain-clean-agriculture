import winston from 'winston';

export function createLogger(service: string) {
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service },
    transports: [new winston.transports.Console()],
  });
}