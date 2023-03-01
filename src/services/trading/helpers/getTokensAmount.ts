import { error } from '../../../services/console.logger'

export const getTokensAmount = (
  symbol: string,
  price: number,
  dollars: number
): number => {
  const tokens = dollars / price

  if (isNaN(tokens)) {
    error(`Invalid token amount for ${symbol}`)
    throw new Error(`Invalid token amount for ${symbol}`)
  }
  return tokens
}
