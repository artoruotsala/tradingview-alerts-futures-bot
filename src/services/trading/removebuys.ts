import { TradingExecutor } from './trading.executor'

export const removeOpenBuys = async () => {
  TradingExecutor.cancelOrder = true

  const waitForCancelOrderToBeFalse = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(null)
      }, 30000)
    })
  }
  await waitForCancelOrderToBeFalse()

  TradingExecutor.cancelOrder = false
}
