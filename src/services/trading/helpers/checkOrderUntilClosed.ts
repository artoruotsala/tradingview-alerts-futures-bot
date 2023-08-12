import { Exchange, Order } from 'ccxt'
import { TradingExecutor } from '../trading.executor'

export async function checkOrderUntilClosedOrTimeout(
  exchange: Exchange,
  symbol: string,
  orderId: string,
  timeout = 60 * 120 * 1000,
  interval = 10 * 1000,
  closeAtMarketPrice: boolean = false
) {
  const startTime = Date.now()

  let order: Order

  while (Date.now() - startTime < timeout) {
    order = await exchange.fetchOrder(orderId, symbol)

    if (TradingExecutor.cancelOrder) {
      TradingExecutor.cancelOrder = false
      break
    }

    if (order && order.status === 'closed') {
      return order
    }
    await new Promise((res) => setTimeout(res, interval))
  }

  if (closeAtMarketPrice) {
    if (order.remaining) {
      await exchange.createMarketSellOrder(symbol, order.remaining)
    }
    order = await exchange.fetchOrder(orderId, symbol)
    return order
  }

  // If not closing at market price
  const openOrders = await exchange.fetchOpenOrders(symbol)
  for (const openOrder of openOrders) {
    await exchange.cancelOrder(openOrder.id, symbol)
  }

  order = await exchange.fetchOrder(orderId, symbol)
  return order
}
