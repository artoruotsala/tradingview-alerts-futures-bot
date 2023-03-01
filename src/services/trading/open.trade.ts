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
    const { finalSize } = await account.getOpenOrderOptions(trade, ticker)

    let currentLeverage = await account.getLeverage(symbol)
    if (leverage && leverage !== currentLeverage) {
      await account.changeLeverage(symbol, leverage)
      currentLeverage = leverage
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
        finalSize * currentLeverage
      )
    } else {
      const orderPrice = (await account.priceToPrecision(
        symbol,
        parseFloat(price)
      )) as number
      order = await account.createLimitOrder(
        symbol,
        direction,
        finalSize * currentLeverage,
        orderPrice
      )
    }

    if (stopLoss && order.price) {
      const stopPriceFinal = calcStopLoss(
        order.price,
        stopLoss,
        direction as Side.Long | Side.Close
      )
      const stopPrice = account.priceToPrecision(
        symbol,
        stopPriceFinal
      ) as number

      await account.createOrder(
        symbol,
        direction === Side.Long ? Side.Short : Side.Long,
        'STOP_MARKET',
        finalSize * currentLeverage,
        undefined,
        {
          stopPrice,
          reduceOnly: true,
        }
      )
    }

    if (takeProfit && order.price) {
      const takeProfits = calcTakeProfits(
        order.price,
        takeProfit,
        takeProfitLevels || [],
        direction === Side.Long ? 'buy' : 'sell'
      )

      for (const tp of takeProfits) {
        const tpPrice = account.priceToPrecision(symbol, tp.price) as number
        await account.createOrder(
          symbol,
          direction === Side.Long ? Side.Short : Side.Long,
          'TAKE_PROFIT',
          account.amountToPrecision(
            symbol,
            finalSize * currentLeverage * tp.size
          ),
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
          `Opened long position for ${symbol} at ${ticker.last} with size ${size} and leverage ${currentLeverage}`
        )
      : info(
          `Opened short position for ${symbol} at ${ticker.last} with size ${size} and leverage ${currentLeverage}`
        )

    return order
  } catch (error) {}
}
