import { Exchange, Order } from 'ccxt'

export async function checkOrderUntilClosedOrTimeout(
  exchange: Exchange,
  symbol: string,
  orderId: string,
  timeout = 45 * 60 * 1000,
  interval = 15 * 1000
) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    const order: Order = await exchange.fetchOrder(orderId, symbol)
    if (order && order.status === 'closed') {
      return order
    }
    await new Promise((res) => setTimeout(res, interval))
  }
  throw new Error('Order did not close within the expected time frame.')
}
