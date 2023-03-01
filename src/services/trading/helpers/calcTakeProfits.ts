import { TakeProfit } from '../../../entities/trade.entities'

export const calcTakeProfits = (
  tickerPrice: number,
  takeProfit: number,
  tpLevels: TakeProfit[],
  side: 'buy' | 'sell'
) => {
  const takeProfits = []

  for (let i = 0; i < tpLevels.length; i++) {
    const tp = tpLevels[i]
    const tpPrice =
      side === 'buy'
        ? tickerPrice * (1 + takeProfit * parseFloat(tp.price))
        : tickerPrice * (1 - takeProfit * parseFloat(tp.price))
    takeProfits.push({
      price: tpPrice,
      size: tp.size,
    })
  }
  return takeProfits
}
