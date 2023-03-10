import { Ticker } from 'ccxt'
import { Side, Trade } from '../../entities/trade.entities'
import { info } from '../console.logger'
import { calcStopLoss } from './helpers/calcStopLoss'
import { calcTakeProfits } from './helpers/calcTakeProfits'
import { TradingAccount } from './trading.account'

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

    let currentLeverage = await account.getLeverage(symbol)
    if (leverage && leverage !== currentLeverage) {
      await account.changeLeverage(symbol, leverage)
      currentLeverage = leverage
    }

    let order

    if (!price) {
      order = await account.createMarketOrder(
        symbol,
        direction,
        tokens * currentLeverage
      )
    } else {
      const orderPrice = (await account.priceToPrecision(
        symbol,
        parseFloat(price)
      )) as number
      order = await account.createLimitOrder(
        symbol,
        direction,
        tokens * currentLeverage,
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
        tokens * currentLeverage,
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
          account.amountToPrecision(symbol, tokens * currentLeverage * tp.size),
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
  } catch (error) {
    throw error
  }
}
