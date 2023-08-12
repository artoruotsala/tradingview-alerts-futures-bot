import { Request, Response, Router } from 'express'
import { closeTrade } from '../services/trading/close.trade'
import { HttpCode } from '../constants/error.http'
import { Side, Trade } from '../entities/trade.entities'
import { openTrade } from '../services/trading/open.trade'
import { validateTrade } from '../validators/trade.validator'
import { TradingExecutor } from '../services/trading/trading.executor'
import { Order } from 'ccxt'
import { writeOrderToFile } from '../services/trade.logger'
import { removeOpenBuys } from '../services/trading/removebuys'
import { chatId, telegramBot } from '../server'

const router = Router()

export const postTrade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { direction, symbol, size, leverage }: Trade = req.body

    let order: Order

    if (!TradingExecutor.Trades) {
      throw new Error('Trading is disabled')
    }

    if (
      direction === Side.Buy ||
      direction === Side.Long ||
      direction === Side.Short
    ) {
      if (TradingExecutor.OpenTrade === 'sell') {
        // Logic to skip the buy if a sell is in progress
        res.write(JSON.stringify({ message: 'Sell in progress, buy skipped.' }))
        telegramBot.sendMessage(chatId, `Sell in progress, buy skipped.`)
        return
      }

      TradingExecutor.setOpenTrade('buy')

      order = await openTrade(req.body)
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
      if (TradingExecutor.OpenTrade === 'buy') {
        telegramBot.sendMessage(
          chatId,
          'Removing buy order and write buy to db...'
        )
        await removeOpenBuys()
      }

      TradingExecutor.setOpenTrade('sell')

      order = await closeTrade(req.body)

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

    if (order) {
      TradingExecutor.setOpenTrade('none')
      if (order?.filled > 0) writeOrderToFile(order)
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
