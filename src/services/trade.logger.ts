import { Order } from 'ccxt'
import axios from 'axios'
import sqlite3 from 'sqlite3'
import fs from 'fs'

// TUSD changed to FDUSD since binance raised fees of TUSD
export interface TUSDtoEUROPrice extends Order {
  TUSD_to_EURO?: number
}

const db = new sqlite3.Database('/bot/orders.db', (err) => {
  if (err) {
    console.error(err.message)
  }
  console.log('Connected to the orders database.')
})

// Init tables
// fs.readFile('./bot/init.sql', 'utf8', (err, data) => {
//   if (err) {
//     console.error(err.message)
//     return
//   }

//   db.exec(data, (err) => {
//     if (err) {
//       console.error(err.message)
//     }
//   })
// })

export async function getFDUSDEURRate() {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'first-digital-usd',
          vs_currencies: 'eur',
        },
      }
    )
    return response.data['first-digital-usd'].eur
  } catch (error) {
    console.error('Error fetching TUSD to EUR rate from CoinGecko:', error)
    return null
  }
}

export async function writeOrderToFile(order: Order) {
  const rate = await getFDUSDEURRate()

  // Convert the order price to EUR
  let priceInEUR = 0
  if (order.amount && rate) priceInEUR = order.amount * rate

  // Create a new object with the EUR price added
  const orderWithEURPrice = {
    ...order,
    TUSD_to_EURO: rate ? rate : 0,
  } as TUSDtoEUROPrice

  // insert into the orders table
  db.run(
    `INSERT INTO orders(id, clientOrderId, datetime, timestamp, lastTradeTimestamp, lastUpdateTimestamp, status, symbol, type, timeInForce, side, price, average, amount, filled, remaining, stopPrice, takeProfitPrice, stopLossPrice, cost, TUSD_to_EURO, trades, fee) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderWithEURPrice.id,
      orderWithEURPrice.clientOrderId,
      orderWithEURPrice.datetime,
      orderWithEURPrice.timestamp,
      orderWithEURPrice.lastTradeTimestamp,
      orderWithEURPrice.lastUpdateTimestamp,
      orderWithEURPrice.status,
      orderWithEURPrice.symbol,
      orderWithEURPrice.type,
      orderWithEURPrice.timeInForce,
      orderWithEURPrice.side,
      orderWithEURPrice.price,
      orderWithEURPrice.average,
      orderWithEURPrice.amount,
      orderWithEURPrice.filled,
      orderWithEURPrice.remaining,
      orderWithEURPrice.stopPrice,
      orderWithEURPrice.takeProfitPrice,
      orderWithEURPrice.stopLossPrice,
      orderWithEURPrice.cost,
      orderWithEURPrice.TUSD_to_EURO,
      JSON.stringify(orderWithEURPrice.trades),
      JSON.stringify(orderWithEURPrice.fee),
    ],
    (err) => {
      if (err) {
        console.error(err.message)
      }
    }
  )
}
