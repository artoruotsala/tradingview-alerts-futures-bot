import { chatId, telegramBot } from '../../server'
import { Trade } from '../../entities/trade.entities'
import { info } from '../console.logger'
import { TradingAccount } from './trading.account'
import { TradingExecutor } from './trading.executor'

export const closeTrade = async (trade: Trade): Promise<void> => {
  const account = TradingAccount.getInstance()

  const { symbol, price } = trade

  let order

  try {
    if (!price) {
      const { tokens, side } = await account.getCloseOrderOptions(trade)

      order = await account.createMarketOrder(symbol, side, tokens)
    } else if (price) {
      const { tokens, side } = await account.getCloseOrderOptions(trade)

      const orderPrice = (await account.priceToPrecision(
        symbol,
        parseFloat(price) * 0.99
      )) as number

      order = await account.createLimitOrder(symbol, side, tokens, orderPrice)
    }

    if (order.status === 'closed' || order.status === 'open') {
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
  } catch (error) {
    throw error
  }
}
