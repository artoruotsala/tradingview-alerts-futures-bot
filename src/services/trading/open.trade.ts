import { Ticker } from 'ccxt'
import { chatId, telegramBot } from '../../server'
import { Side, Trade } from '../../entities/trade.entities'
import { info } from '../console.logger'
import { calcStopLoss } from './helpers/calcStopLoss'
import { calcTakeProfits } from './helpers/calcTakeProfits'
import { TradingAccount } from './trading.account'
import { TradingExecutor } from './trading.executor'
import { checkOrderUntilClosedOrTimeout } from './helpers/checkOrderUntilClosed'

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

    if (symbol === 'BTC/TUSD') {
      const ticker: Ticker = await account.getTicker(symbol)
      const { tokens } = await account.getOpenOrderOptionsBtc(trade, ticker)
      // const orderPrice = (await account.priceToPrecision(
      //   symbol,
      //   parseFloat(price) * 0.999
      // )) as number

      let order = await account.createMarketOrder(symbol, Side.Buy, tokens)

      if (order.status === 'closed') {
        TradingExecutor.addTradeBtc()
        telegramBot.sendMessage(
          chatId,
          `🟢 BUY ${order.status} for ${symbol} at ${ticker.last}`
        )

        info(`🟢 BUY ${order.status} for ${symbol} at ${ticker.last}`)
      } else if (order.status === 'open') {
        TradingExecutor.setTrades(false)
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
            `Order did not fully close in time for ${symbol}!`
          )
        }
      } else {
        telegramBot.sendMessage(chatId, `Sell for ${symbol} failed`)
        return
      }

      return order
    }

    if (TradingExecutor.TradeCount >= TradingExecutor.MaxTrades) {
      telegramBot.sendMessage(chatId, 'Max trades reached')
      return
    }

    const ticker: Ticker = await account.getTicker(symbol)
    const { tokens } = await account.getOpenOrderOptions(trade, ticker)

    let order = await account.createMarketOrder(symbol, direction, tokens)

    if (order.status === 'closed' || order.status === 'open') {
      TradingExecutor.addTrade()
      telegramBot.sendMessage(
        chatId,
        `Buy for ${symbol} at ${ticker.last} is ${order.status} : Trade Count ${TradingExecutor.TradeCount}`
      )

      info(
        `Buy for ${symbol} at ${ticker.last} is ${order.status} : Trade Count ${TradingExecutor.TradeCount}`
      )
    } else {
      telegramBot.sendMessage(chatId, `Buy for ${symbol} failed`)
    }

    return order
  } catch (error) {
    throw error
  }
}
