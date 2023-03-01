import { Request, Response, NextFunction } from 'express'
import { HttpCode } from '../constants/error.http'
import { error } from '../services/console.logger'
import { ERROR } from '../services/logger.messages'

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
