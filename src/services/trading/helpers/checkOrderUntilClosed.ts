import { Exchange, Order } from 'ccxt'
import { TradingExecutor } from '../trading.executor'

export async function checkOrderUntilClosedOrTimeout(
  exchange: Exchange,
  symbol: string,
  orderId: string,
  timeout = 60 * 30 * 1000,
  interval = 10 * 1000
) {
  const startTime = Date.now()

  let order: Order

  while (Date.now() - startTime < timeout) {
    order = await exchange.fetchOrder(orderId, symbol)

    if (order && order.status === 'closed') {
      return order
    }

    if (TradingExecutor.cancelOrder) {
      TradingExecutor.cancelOrder = false
      break
    }

    await new Promise((res) => setTimeout(res, interval))
  }

  // remove open orders for buy
  const openOrders = await exchange.fetchOpenOrders(symbol)
  for (const openOrder of openOrders) {
    await exchange.cancelOrder(openOrder.id, symbol)
  }

  order = await exchange.fetchOrder(orderId, symbol)
  return order
}
