import { createLogger, transports, format } from 'winston'
const { combine, json, timestamp, colorize } = format

const defaultLoggerFormat = combine(timestamp(), json())

const consoleLoggerOptions: transports.ConsoleTransportOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    colorize(),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.printf(({ level, message, timestamp }) => {
      return `${timestamp}:${level}:${message}`
    })
  ),
}

const consoleLogger = createLogger({
  level: 'debug',
  format: defaultLoggerFormat,
  transports: [new transports.Console(consoleLoggerOptions)],
})

export const debug = (message: string): void => {
  consoleLogger.debug(message)
}

export const info = (message: string): void => {
  consoleLogger.info(message)
}

export const warning = (message: string): void => {
  consoleLogger.warn(message)
}

export const error = (
  message: string,
  error?: Record<string, unknown>
): void => {
  if (!error) {
    consoleLogger.error(message)
  } else {
    const formattedError = JSON.stringify(error)
    const hasError = error && formattedError !== '{}'
    consoleLogger.error(`${message}${hasError ? ' -> ' + formattedError : ''}`)
  }
}
