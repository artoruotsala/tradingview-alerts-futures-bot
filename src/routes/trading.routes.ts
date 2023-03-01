import { Request, Response, Router } from 'express'
import { HttpCode } from '../constants/error.http'
import { Side, Trade } from '../entities/trade.entities'
import { openTrade } from '../services/trading/open.trade'
import { validateTrade } from '../validators/trade.validator'

const router = Router()

export const postTrade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { direction, symbol }: Trade = req.body

    if (direction === Side.Long || direction === Side.Short) {
      await openTrade(req.body)
    } else {
    }
    // await closeTrade(req.body)

    res.write(
      JSON.stringify({
        message: `Trade ${direction} | ${symbol} success!`,
      })
    )
  } catch (err) {
    res.writeHead(HttpCode.INTERNAL_SERVER_ERROR)
    res.write(
      JSON.stringify({
        message: err.message,
      })
    )
  }
  res.end()
}

export const tradingRouter = router.post('/trade', validateTrade, postTrade)
