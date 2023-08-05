import { Order } from 'ccxt'
import fs from 'fs'

const filename = '/bot/orders.json'

export function writeOrderToFile(order: Order) {
  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      console.log(`Error reading file from disk: ${err}`)
    } else {
      // Attempt to parse JSON string to JSON object
      let orders
      try {
        orders = JSON.parse(data)
      } catch (parseErr) {
        console.error(`Error parsing JSON string: ${parseErr}`)
        // Set a default value (empty array) if parsing fails
        orders = []
      }

      // add the new order to existing orders
      orders.push(order)

      // write back to file
      fs.writeFile(filename, JSON.stringify(orders, null, 2), (err) => {
        if (err) {
          console.log(`Error writing file: ${err}`)
        }
      })
    }
  })
}
