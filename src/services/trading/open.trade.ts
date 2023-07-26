import { Ticker } from 'ccxt'
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

    TradingExecutor.addTrade()

    info(order)
    // info(
    //   `Opened ${direction} position for ${symbol} at ${ticker.last} : Trade Count ${TradingExecutor.TradeCount}`
    // )

    return order
  } catch (error) {
    throw error
  }
}
