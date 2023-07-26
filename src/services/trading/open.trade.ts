import { Ticker } from 'ccxt'
import { chatId, telegramBot } from '../../server'
import { Side, Trade } from '../../entities/trade.entities'
import { info } from '../console.logger'
import { calcStopLoss } from './helpers/calcStopLoss'
import { calcTakeProfits } from './helpers/calcTakeProfits'
import { TradingAccount } from './trading.account'
import { TradingExecutor } from './trading.executor'

export const openTrade = async (trade: Trade) => {
  const account = TradingAccount.getInstance()

  try {
    const {
      direction,
      symbol,
      leverage,
      stopLoss,
      takeProfit,
      price,
      size,
      takeProfitLevels,
    } = trade

    const ticker: Ticker = await account.getTicker(symbol)
    const { tokens } = await account.getOpenOrderOptions(trade, ticker)

    let order

    if (!price) {
      order = await account.createMarketOrder(symbol, direction, tokens)
    } else {
      const orderPrice = (await account.priceToPrecision(
        symbol,
        parseFloat(price)
      )) as number

      order = await account.createLimitOrder(
        symbol,
        direction,
        tokens,
        orderPrice
      )
    }
    if (order.status === 'closed') {
      TradingExecutor.addTrade()
      telegramBot.sendMessage(
        chatId,
        `Buy for ${symbol} at ${ticker.last} is ${order.status} : Trade Count ${TradingExecutor.TradeCount}`
      )
    }

    info(
      `Buy for ${symbol} at ${ticker.last} is ${order.status} : Trade Count ${TradingExecutor.TradeCount}`
    )

    return order
  } catch (error) {
    throw error
  }
}
