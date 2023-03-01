import { Side } from '../../../entities/trade.entities'

export const calcStopLoss = (
  tickerPrice: number,
  stopLoss: string,
  side: Side.Long | Side.Close
) => {
  let stopLossPrice = parseFloat(stopLoss)
  if (stopLoss.includes('%')) {
    let stopLossPerc = parseFloat(stopLoss.replace('%', ''))
    stopLossPerc = stopLossPerc / 100

    stopLossPrice =
      side === Side.Long
        ? tickerPrice * (1 - stopLossPerc)
        : tickerPrice * (1 + stopLossPerc)
  }
  if (stopLossPrice > tickerPrice && side === Side.Long) {
    throw new Error('Stop loss price is higher than ticker price')
  }
  if (stopLossPrice < tickerPrice && side === Side.Close) {
    throw new Error('Stop loss price is lower than ticker price')
  }

  return stopLossPrice
}
