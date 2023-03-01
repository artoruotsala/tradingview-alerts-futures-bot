import { Ticker } from 'ccxt'
import { Side, Trade } from '../../entities/trade.entities'
import { info } from '../console.logger'
import { calcStopLoss } from './helpers/calcStopLoss'
import { calcTakeProfits } from './helpers/calcTakeProfits'
import { TradingAccount } from './trading.account'

export const openTrade = async (trade: Trade): Promise<void> => {
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
    const { finalSize } = await account.getOpenOrderOptions(trade)

    const currentLeverage = await account.getLeverage(symbol)
    if (leverage && leverage !== currentLeverage) {
      await account.changeLeverage(symbol, leverage)
    }

    // closes all old orders (for symbol) before opening new stop loss and take profit orders
    if (stopLoss || takeProfit) {
      await account.closeAllOrders(symbol)
    }

    let order

    if (!price) {
      order = await account.createMarketOrder(
        symbol,
        direction,
        finalSize * Number(leverage)
      )
    } else {
      const orderPrice = (await account.priceToPrecision(
        symbol,
        parseFloat(price)
      )) as number
      order = await account.createLimitOrder(
        symbol,
        direction,
        finalSize * Number(leverage),
        orderPrice
      )
    }

    if (stopLoss) {
      const stopPriceRaw = calcStopLoss(
        parseFloat(price),
        parseFloat(stopLoss),
        direction as Side.Long | Side.Close
      )
      const stopPrice = account.priceToPrecision(symbol, stopPriceRaw) as number

      await account.createOrder(
        symbol,
        direction === Side.Long ? Side.Short : Side.Long,
        'STOP_MARKET',
        finalSize * Number(leverage),
        undefined,
        {
          stopPrice,
          reduceOnly: true,
        }
      )
    }

    if (takeProfit && takeProfitLevels) {
      const takeProfits = calcTakeProfits(
        parseFloat(price),
        parseFloat(takeProfit),
        takeProfitLevels,
        direction === Side.Long ? 'buy' : 'sell'
      )

      for (const tp of takeProfits) {
        const tpPrice = account.priceToPrecision(symbol, tp.price) as number
        await account.createOrder(
          symbol,
          direction === Side.Long ? Side.Short : Side.Long,
          'TAKE_PROFIT',
          account.amountToPrecision(symbol, finalSize * leverage * tp.size),
          tpPrice,
          {
            stopPrice: tpPrice,
            reduceOnly: true,
          }
        )
      }
    }

    direction === Side.Long
      ? info(
          `Opened long position for ${symbol} at ${ticker.last} with size ${size} and leverage ${leverage}`
        )
      : info(
          `Opened short position for ${symbol} at ${ticker.last} with size ${size} and leverage ${leverage}`
        )

    return order
  } catch (error) {}
}
