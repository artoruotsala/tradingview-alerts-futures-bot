import { Trade } from '../../entities/trade.entities'
import { TradingAccount } from './trading.account'

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
  } catch (error) {
    throw error
  }
}
