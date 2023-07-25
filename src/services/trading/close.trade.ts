import { Trade } from '../../entities/trade.entities'
import { info } from '../console.logger'
import { TradingAccount } from './trading.account'
import { TradingExecutor } from './trading.executor'

export const closeTrade = async (trade: Trade): Promise<void> => {
  const account = TradingAccount.getInstance()

  const { symbol, price } = trade

  try {
    if (!price) {
      const { tokens, side } = await account.getCloseOrderOptions(trade)

      await account.createMarketOrder(symbol, side, tokens)
    } else if (price) {
      const { tokens, side } = await account.getCloseOrderOptions(trade)

      await account.createLimitOrder(symbol, side, tokens, parseFloat(price))
    }
    TradingExecutor.removeTrade()

    info(
      `Closed position for ${symbol} : Trade Count ${TradingExecutor.TradeCount}`
    )
  } catch (error) {
    throw error
  }
}
