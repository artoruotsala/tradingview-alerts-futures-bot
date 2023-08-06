import { chatId, telegramBot } from '../../server'
import { Trade } from '../../entities/trade.entities'
import { info } from '../console.logger'
import { TradingAccount } from './trading.account'
import { TradingExecutor } from './trading.executor'
import { Exchange, Order } from 'ccxt'
import { checkOrderUntilClosedOrTimeout } from './helpers/checkOrderUntilClosed'

export const closeTrade = async (trade: Trade): Promise<Order> => {
  const account = TradingAccount.getInstance()

  const { symbol, price } = trade

  let order: Order

  try {
    if (!price) {
      const { tokens, side } = await account.getCloseOrderOptions(trade)

      order = await account.createMarketOrder(symbol, side, tokens)
    } else if (price) {
      const { tokens, side } =
        symbol === 'BTC/TUSD'
          ? await account.getCloseOrderOptionsBtc(trade)
          : await account.getCloseOrderOptions(trade)

      const orderPrice = (await account.priceToPrecision(
        symbol,
        parseFloat(price) * 0.9999
      )) as number

      order = await account.createLimitOrder(symbol, side, tokens, orderPrice)
    }

    if (order.status === 'closed') {
      if (symbol === 'BTC/TUSD') {
        TradingExecutor.removeTradeBtc()
        telegramBot.sendMessage(
          chatId,
          `🔴 SELL ${order.status} for ${symbol} at ${order.price}`
        )

        info(`🔴 SELL ${order.status} for ${symbol} at ${order.price}`)
        return order
      }

      TradingExecutor.removeTrade()

      telegramBot.sendMessage(
        chatId,
        `Sell for ${symbol} is ${order.status} : Trade Count ${TradingExecutor.TradeCount}`
      )

      info(
        `Sell for ${symbol} is ${order.status} : Trade Count ${TradingExecutor.TradeCount}`
      )
    } else if (order.status === 'open') {
      TradingExecutor.setTrades(false)
      if (symbol === 'BTC/TUSD') {
        try {
          const closedOrder = await checkOrderUntilClosedOrTimeout(
            account.exchange,
            symbol,
            order.id
          )
          TradingExecutor.setTrades(true)
          return closedOrder
        } catch (err) {
          TradingExecutor.setTrades(true)
          telegramBot.sendMessage(
            chatId,
            `Order did not fully close in time for ${symbol} - close manually!`
          )
          return
        }
      }
    } else {
      telegramBot.sendMessage(chatId, `Sell for ${symbol} failed`)
      return
    }

    return order
  } catch (error) {
    throw error
  }
}
