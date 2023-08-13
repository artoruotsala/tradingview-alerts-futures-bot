import { Exchange, Order } from 'ccxt'
import { TradingExecutor } from '../trading.executor'

export async function checkOrderUntilClosedOrTimeoutClose(
  exchange: Exchange,
  symbol: string,
  orderId: string,
  timeout = 60 * 1 * 1000,
  interval = 10 * 1000
) {
  const startTime = Date.now()

  let order: Order

  while (Date.now() - startTime < timeout) {
    order = await exchange.fetchOrder(orderId, symbol)

    if (order && order.status === 'closed') {
      return order
    }
    await new Promise((res) => setTimeout(res, interval))
  }

  // If we reach here, the order wasn't fully filled within the timeout
  if (order.remaining) {
    // Check if the order needs to be cancelled before creating a market order
    if (order.status !== 'closed') {
      await exchange.cancelOrder(orderId, symbol) // Cancel the open order
    }
    return await exchange.createMarketSellOrder(symbol, order.remaining) // Sell the remaining quantity at market price
  }

  order = await exchange.fetchOrder(orderId, symbol)
  return order
}
