import { chatId, telegramBot } from '../../server'
import { Trade } from '../../entities/trade.entities'
import { info } from '../console.logger'
import { TradingAccount } from './trading.account'
import { TradingExecutor } from './trading.executor'
import { Order } from 'ccxt'

export const closeTrade = async (trade: Trade): Promise<Order> => {
  const account = TradingAccount.getInstance()

  const { symbol, price } = trade

  let order: Order

  try {
    if (!price) {
      const { tokens, side } = await account.getCloseOrderOptions(trade)

      order = await account.createMarketOrder(symbol, side, tokens)
    } else if (price) {
      if (symbol === 'BTC/TUSD') {
        const { tokens, side } = await account.getCloseOrderOptionsBtc(trade)

        const orderPrice = (await account.priceToPrecision(
          symbol,
          parseFloat(price)
        )) as number

        order = await account.createLimitOrder(symbol, side, tokens, orderPrice)
      } else {
        const { tokens, side } = await account.getCloseOrderOptions(trade)

        const orderPrice = (await account.priceToPrecision(
          symbol,
          parseFloat(price) * 0.999
        )) as number

        order = await account.createLimitOrder(symbol, side, tokens, orderPrice)
      }
    }

    if (order.status === 'closed' || order.status === 'open') {
      if (symbol === 'BTC/TUSD') {
        TradingExecutor.removeTradeBtc()
        telegramBot.sendMessage(
          chatId,
          `Sell for ${symbol} is ${order.status} : BTC Trade Count ${TradingExecutor.BtcTradeCount}`
        )

        info(
          `Sell for ${symbol} is ${order.status} : BTC Trade Count ${TradingExecutor.BtcTradeCount}`
        )
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
    } else {
      telegramBot.sendMessage(chatId, `Sell for ${symbol} failed`)
    }

    return order
  } catch (error) {
    throw error
  }
}
