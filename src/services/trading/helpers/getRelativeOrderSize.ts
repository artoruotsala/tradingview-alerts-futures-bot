import { error } from '../../../services/console.logger'

export const getRelativeOrderSize = (balance: number, size: string): number => {
  const percent = Number(size.replace(/%/g, ''))
  if (percent <= 0 || percent > 100) {
    error('Invalid percentage size')
    throw new Error('Invalid percentage size')
  }
  const orderSize = (balance * percent) / 100
  return orderSize
}
