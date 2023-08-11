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
        parseFloat(price)
      )) as number

      order = await account.createLimitOrder(symbol, side, tokens, orderPrice)

      await telegramBot.sendMessage(chatId, `Starting to sell for ${symbol}...`)
    }

    if (order.status === 'closed') {
      if (symbol === 'BTC/TUSD') {
        TradingExecutor.removeTradeBtc()
        await telegramBot.sendMessage(
          chatId,
          `🔴 SELL ${order.status} for ${symbol} at ${order.price}`
        )

        return order
      }

      TradingExecutor.removeTrade()

      telegramBot.sendMessage(
        chatId,
        `Sell for ${symbol} is ${order.status} : Trade Count ${TradingExecutor.TradeCount}`
      )
    } else if (order.status === 'open') {
      if (symbol === 'BTC/TUSD') {
        try {
          const closedOrder = await checkOrderUntilClosedOrTimeout(
            account.exchange,
            symbol,
            order.id,
            undefined,
            undefined,
            true
          )

          if (closedOrder.status === 'closed') {
            TradingExecutor.removeTradeBtc()
            await telegramBot.sendMessage(
              chatId,
              `🔴 SELL ${closedOrder.status} for ${symbol} at ${closedOrder.price}`
            )
          } else {
            TradingExecutor.removeTradeBtc()
            await telegramBot.sendMessage(
              chatId,
              `Order closed at market price but failed to fully close for ${symbol}. Close manually!`
            )
          }
          return closedOrder
        } catch (err) {
          await telegramBot.sendMessage(
            chatId,
            `Error in order handling for ${symbol} - close manually!`
          )
          return
        }
      }
    } else {
      await telegramBot.sendMessage(chatId, `Sell for ${symbol} failed`)
      return
    }

    return order
  } catch (error) {
    throw error
  }
}
