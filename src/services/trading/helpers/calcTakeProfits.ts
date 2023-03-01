import { TakeProfit } from '../../../entities/trade.entities'

export const calcTakeProfits = (
  tickerPrice: number,
  takeProfitFull: string,
  tpLevels: TakeProfit[],
  side: 'buy' | 'sell'
) => {
  let takeProfitPrice = parseFloat(takeProfitFull)
  let takeProfitPerc

  if (takeProfitFull.includes('%')) {
    takeProfitPerc = parseFloat(takeProfitFull.replace('%', ''))
    takeProfitPerc = takeProfitPerc / 100

    takeProfitPrice =
      side === 'buy'
        ? tickerPrice * (1 + takeProfitPerc)
        : tickerPrice * (1 - takeProfitPerc)
  } else {
    takeProfitPerc = Math.abs((takeProfitPrice - tickerPrice) / tickerPrice)

    if (takeProfitPrice < tickerPrice && side === 'buy') {
      throw new Error('Take profit price is lower than ticker price')
    } else if (takeProfitPrice > tickerPrice && side === 'sell') {
      throw new Error('Take profit price is higher than ticker price')
    }
  }

  if (takeProfitPerc <= 0 || takeProfitPerc > 1) {
    throw new Error('Invalid take profit percentage')
  }

  const takeProfits = []

  for (let i = 0; i < tpLevels.length; i++) {
    const tp = tpLevels[i]
    if (!tp.size.includes('%') || !tp.price.includes('%')) {
      throw new Error(
        'Multiple take profit sizes and prices must be percentages'
      )
    }

    const tpPrice =
      side === 'buy'
        ? tickerPrice *
          (1 + (takeProfitPerc * parseFloat(tp.price.replace('%', ''))) / 100)
        : tickerPrice *
          (1 - (takeProfitPerc * parseFloat(tp.price.replace('%', ''))) / 100)

    takeProfits.push({
      price: tpPrice,
      size: parseFloat(tp.size.replace('%', '')) / 100,
    })
  }
  takeProfits.push({
    price: takeProfitPrice,
    size: 1,
  })
  return takeProfits
}
