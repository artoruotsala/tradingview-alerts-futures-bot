import { Request, Response, Router } from 'express'
import { closeTrade } from '../services/trading/close.trade'
import { HttpCode } from '../constants/error.http'
import { Side, Trade } from '../entities/trade.entities'
import { openTrade } from '../services/trading/open.trade'
import { validateTrade } from '../validators/trade.validator'
import { TradingExecutor } from '../services/trading/trading.executor'

const router = Router()

export const postTrade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { direction, symbol, size, leverage }: Trade = req.body

    if (!TradingExecutor.Trades) {
      throw new Error('Trading is disabled')
    }

    if (
      direction === Side.Long ||
      direction === Side.Short ||
      direction === Side.Buy
    ) {
      await openTrade(req.body)
      res.write(
        JSON.stringify({
          message: `Trade ${direction} | ${symbol} | ${
            size.includes('%') ? `${size}` : `${size}$`
          }${leverage ? `| leverage: ${leverage}` : ''} success!`,
        })
      )
    } else if (
      direction === Side.Close ||
      direction === Side.Sell ||
      direction === Side.Exit
    ) {
      await closeTrade(req.body)

      res.write(
        JSON.stringify({
          message: `Trade exited | ${symbol} | success!`,
        })
      )
    } else {
      res.write(
        JSON.stringify({
          message: `Invalid direction: ${direction}`,
        })
      )
    }
  } catch (err) {
    res.writeHead(HttpCode.INTERNAL_SERVER_ERROR)
    res.write(
      JSON.stringify({
        error: err.message,
      })
    )
  }
  res.end()
}

export const tradingRouter = router.post('/trade', validateTrade, postTrade)
