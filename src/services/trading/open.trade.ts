import { Order, Ticker } from 'ccxt'
import { chatId, telegramBot } from '../../server'
import { Side, Trade } from '../../entities/trade.entities'
import { info } from '../console.logger'
import { calcStopLoss } from './helpers/calcStopLoss'
import { calcTakeProfits } from './helpers/calcTakeProfits'
import { TradingAccount } from './trading.account'
import { TradingExecutor } from './trading.executor'
import { checkOrderUntilClosedOrTimeout } from './helpers/checkOrderUntilClosed'

export const openTrade = async (trade: Trade): Promise<Order> => {
  const account = TradingAccount.getInstance()

  try {
    const { direction, symbol, price } = trade

    if (symbol === 'BTC/FDUSD') {
      const ticker: Ticker = await account.getTicker(symbol)
      const { tokens } = await account.getOpenOrderOptionsBtc(trade, ticker)

      const precisePrice = Math.min(
        TradingExecutor.BTCFDUSDPrice,
        Number(price)
      )
      const orderPrice = account.priceToPrecision(symbol, precisePrice)

      let order = await account.createLimitOrder(
        symbol,
        Side.Buy,
        tokens,
        orderPrice
      )

      await telegramBot.sendMessage(
        chatId,
        `Starting to buy for ${symbol} @ ${orderPrice}...`
      )

      if (order.status === 'closed') {
        TradingExecutor.addTradeBtc()
        await telegramBot.sendMessage(
          chatId,
          `🟢 BUY ${order.status} for ${symbol} at ${order?.average}`
        )
        TradingExecutor.EntryPrice = order?.average
      } else if (order.status === 'open') {
        try {
          const closedOrder = await checkOrderUntilClosedOrTimeout(
            account.exchange,
            symbol,
            order.id
          )
          if (closedOrder.status === 'closed') {
            TradingExecutor.addTradeBtc()
            telegramBot.sendMessage(
              chatId,
              `🟢 BUY ${closedOrder.status} for ${symbol} at ${closedOrder?.average}`
            )
            TradingExecutor.EntryPrice = closedOrder?.average
          } else {
            TradingExecutor.addTradeBtc()
            telegramBot.sendMessage(
              chatId,
              `Order did not fully close in time and all open orders were cancelled for ${symbol}!`
            )
            if (closedOrder?.average && closedOrder?.average > 0)
              TradingExecutor.EntryPrice = closedOrder?.average
          }
          return closedOrder
        } catch (err) {
          TradingExecutor.setOpenTrade('none')
          telegramBot.sendMessage(
            chatId,
            `Open order did not fully close in time for ${symbol}!`
          )
          if (order?.average && order?.average > 0)
            TradingExecutor.EntryPrice = order?.average
        }
      } else {
        TradingExecutor.setOpenTrade('none')
        telegramBot.sendMessage(chatId, `Open for ${symbol} failed`)
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
