import { Side } from '../../../entities/trade.entities'

export const calcStopLoss = (
  tickerPrice: number,
  stopLoss: number,
  side: Side.Long | Side.Close
) => {
  const stopLossPrice =
    side === Side.Long
      ? tickerPrice * (1 - stopLoss)
      : tickerPrice * (1 + stopLoss)
  return stopLossPrice
}
