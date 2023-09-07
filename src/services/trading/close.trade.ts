import { chatId, telegramBot } from '../../server'
import { Trade } from '../../entities/trade.entities'
import { info } from '../console.logger'
import { TradingAccount } from './trading.account'
import { TradingExecutor } from './trading.executor'
import { Exchange, Order } from 'ccxt'
import { checkOrderUntilClosedOrTimeoutClose } from './helpers/checkOrderUntilClosedClose'

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
        symbol === 'BTC/FDUSD'
          ? await account.getCloseOrderOptionsBtc(trade)
          : await account.getCloseOrderOptions(trade)

      const precisePrice = Math.min(
        TradingExecutor.BTCFDUSDPrice,
        Number(price)
      )
      const orderPrice = account.priceToPrecision(symbol, precisePrice) // little tweak for BTC price

      order = await account.createLimitOrder(symbol, side, tokens, orderPrice)

      await telegramBot.sendMessage(
        chatId,
        `Starting to sell for ${symbol} @ ${orderPrice}...`
      )
    }

    if (order.status === 'closed') {
      if (symbol === 'BTC/FDUSD') {
        TradingExecutor.removeTradeBtc()
        telegramBot.sendMessage(
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
      if (symbol === 'BTC/FDUSD') {
        try {
          const closedOrder = await checkOrderUntilClosedOrTimeoutClose(
            account.exchange,
            symbol,
            order.id,
            undefined,
            undefined
          )

          if (closedOrder.status === 'closed') {
            TradingExecutor.removeTradeBtc()
            telegramBot.sendMessage(
              chatId,
              `🔴 SELL ${closedOrder.status} for ${symbol} at ${closedOrder.price}`
            )
          } else {
            TradingExecutor.removeTradeBtc()
            telegramBot.sendMessage(
              chatId,
              `Order closed at market price but failed to fully close for ${symbol}. Close manually!`
            )
          }
          return closedOrder
        } catch (err) {
          TradingExecutor.setOpenTrade('none')
          telegramBot.sendMessage(
            chatId,
            `Error in order handling for ${symbol} - close manually!`
          )
          return
        }
      }
    } else {
      TradingExecutor.setOpenTrade('none')
      telegramBot.sendMessage(chatId, `Sell for ${symbol} failed`)
      return
    }

    return order
  } catch (error) {
    throw error
  }
}
