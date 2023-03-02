import { Ticker } from 'ccxt'
import { Side, Trade } from '../../entities/trade.entities'
import { TradingAccount } from './trading.account'

export const closeTrade = async (trade: Trade): Promise<void> => {
  const account = TradingAccount.getInstance()

  const { symbol, price } = trade

  try {
    if (!price) {
      const { tokens, side, contracts } = await account.getCloseOrderOptions(
        trade
      )

      await account.createMarketOrder(symbol, side, tokens, {
        reduceOnly: true,
      })

      if (contracts === tokens) {
        await account.cancelAllOrders(symbol)
      }
    } else if (price) {
      const { tokens, side, contracts } = await account.getCloseOrderOptions(
        trade
      )

      await account.createLimitOrder(symbol, side, tokens, parseFloat(price), {
        reduceOnly: true,
      })
      if (contracts === tokens) {
        await account.cancelAllOrders(symbol)
      }
    }
  } catch (error) {
    throw error
  }
}
