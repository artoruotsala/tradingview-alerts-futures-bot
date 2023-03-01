import { Request, Response, NextFunction } from 'express'
import { error } from '../services/console.logger'
import { ERROR } from '../services/logger.messages'

enum HttpCode {
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err.stack) error(err.stack)
  res.status(HttpCode.INTERNAL_SERVER_ERROR).send(ERROR)
  next()
}
