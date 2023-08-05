import { Exchange, Order } from 'ccxt'
import fs from 'fs'
import { TradingAccount } from './trading/trading.account'

export interface OrderWithEURPrice extends Order {
  priceEUR?: number
  currentBTCPriceEUR?: number
}

const filename = '/bot/orders.json'

export async function getBTCEURRate() {
  const exchange = TradingAccount.getInstance()

  const ticker = await exchange.getTicker('BTC/EUR')
  return ticker.last
}

export async function writeOrderToFile(order: Order) {
  const rate = await getBTCEURRate()

  // Convert the order price to EUR
  let priceInEUR = 0
  if (order.amount && rate) priceInEUR = order.amount * rate

  // Create a new object with the EUR price added
  const orderWithEURPrice = {
    ...order,
    priceEUR: priceInEUR,
    currentBTCPriceEUR: rate ? rate : 0,
  } as OrderWithEURPrice

  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      console.log(`Error reading file from disk: ${err}`)
    } else {
      let orders: OrderWithEURPrice[]
      try {
        orders = JSON.parse(data)
      } catch (err) {
        console.log(`Error parsing JSON string: ${err}`)
        return
      }

      // add the new order to existing orders
      orders.push(orderWithEURPrice)

      // write back to file
      fs.writeFile(filename, JSON.stringify(orders, null, 2), (err) => {
        if (err) {
          console.log(`Error writing file: ${err}`)
        }
      })
    }
  })
}
