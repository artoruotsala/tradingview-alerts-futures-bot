import { Order } from 'ccxt'
import fs from 'fs'
import axios from 'axios'

export interface TUSDtoEUROPrice extends Order {
  TUSD_to_EURO?: number
}

const filename = '/bot/orders.json'

export async function getTUSDEURRate() {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'true-usd',
          vs_currencies: 'eur',
        },
      }
    )
    return response.data['true-usd'].eur
  } catch (error) {
    console.error('Error fetching TUSD to EUR rate from CoinGecko:', error)
    return null
  }
}

export async function writeOrderToFile(order: Order) {
  const rate = await getTUSDEURRate()

  // Convert the order price to EUR
  let priceInEUR = 0
  if (order.amount && rate) priceInEUR = order.amount * rate

  // Create a new object with the EUR price added
  const orderWithEURPrice = {
    ...order,
    TUSD_to_EURO: rate ? rate : 0,
  } as TUSDtoEUROPrice

  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      console.log(`Error reading file from disk: ${err}`)
    } else {
      let orders: TUSDtoEUROPrice[]
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
