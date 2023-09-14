import { TradingAccount } from './trading.account'
import { Side, Trade } from '../../entities/trade.entities'
import { closeTrade } from '../trading/close.trade'
import { writeOrderToFile } from '../trade.logger'
import { chatId, telegramBot } from '../../server'

// !if server restarts, trading will be on
export class TradingExecutor {
  public static Trades = true
  public static OpenTrade: 'none' | 'buy' | 'sell' = 'none'
  public static EntryPrice: number = null
  public static cancelOrder = false
  public static TradeCount = 0
  public static MaxTrades = 4

  public static BTCFDUSDPrice = 0.0

  public static BtcTradeCount = 0
  public static BtcMaxTrades = 2

  public static startingBalance = 5888

  public static TrailingStartFactor = 1.001
  public static TrailingDropValue = 0.001
  public static StopLoss = 0.005

  static setTrades(value: boolean) {
    this.Trades = value
  }

  static setOpenTrade(value: 'none' | 'buy' | 'sell') {
    this.OpenTrade = value
  }

  static addTrade() {
    this.TradeCount++
  }

  static removeTrade() {
    this.TradeCount = Math.max(0, this.TradeCount - 1)
  }

  static addTradeBtc() {
    this.BtcTradeCount++
  }

  static removeTradeBtc() {
    this.BtcTradeCount = Math.max(0, this.BtcTradeCount - 1)
  }

  static addMaxTrade() {
    this.MaxTrades++
  }

  static removeMaxTrade() {
    this.MaxTrades = Math.max(1, this.MaxTrades - 1)
  }

  static setStartingBalance(value: number) {
    this.startingBalance = value
  }

  static getProfitInPercent(balance: number) {
    return ((balance - this.startingBalance) / this.startingBalance) * 100
  }

  public static async trackBTCFDUSDPrice() {
    const exchange = TradingAccount.getInstance().exchange

    let highestPeak = 0
    let inTrailingMode = false
    let trailTriggerPrice: number = null
    let nextCheckTime = null

    if (exchange.has.watchTicker) {
      while (true) {
        try {
          const ticker = await exchange.watchTicker('BTC/FDUSD')
          this.BTCFDUSDPrice = ticker.last

          const currentTime = new Date()

          // Stop Loss Logic
          if (
            this.EntryPrice &&
            this.BTCFDUSDPrice <= this.EntryPrice * (1 - this.StopLoss)
          ) {
            if (TradingExecutor.OpenTrade !== 'none') continue

            telegramBot.sendMessage(
              chatId,
              `Stop loss triggered at ${this.BTCFDUSDPrice}`
            )

            TradingExecutor.setOpenTrade('sell')

            const trade = new Trade()
            trade.direction = Side.Sell
            trade.symbol = 'BTC/FDUSD'
            trade.size = '100%'
            trade.price = this.BTCFDUSDPrice.toString()

            const order = await closeTrade(trade)

            if (order) {
              TradingExecutor.setOpenTrade('none')
              if (order?.filled > 0) writeOrderToFile(order)
            }

            this.EntryPrice = null
            trailTriggerPrice = null
            nextCheckTime = null
            inTrailingMode = false
            highestPeak = 0
            continue
          }

          if (this.EntryPrice) {
            if (!nextCheckTime || currentTime >= nextCheckTime) {
              let currentMinutes = currentTime.getMinutes()
              let minutesToAdd = 15 - (currentMinutes % 15)
              nextCheckTime = new Date(
                currentTime.getTime() + minutesToAdd * 60000
              )

              nextCheckTime.setSeconds(0)
              nextCheckTime.setMilliseconds(0)

              if (!trailTriggerPrice)
                trailTriggerPrice = this.EntryPrice * this.TrailingStartFactor
              else
                trailTriggerPrice =
                  this.BTCFDUSDPrice * this.TrailingStartFactor
            }

            if (!inTrailingMode && this.BTCFDUSDPrice >= trailTriggerPrice) {
              inTrailingMode = true
              highestPeak = this.BTCFDUSDPrice
            }

            if (inTrailingMode) {
              if (this.BTCFDUSDPrice > highestPeak) {
                highestPeak = this.BTCFDUSDPrice
              }

              if (
                this.BTCFDUSDPrice <=
                highestPeak - highestPeak * this.TrailingDropValue
              ) {
                if (TradingExecutor.OpenTrade !== 'none') continue

                telegramBot.sendMessage(
                  chatId,
                  `Take profit triggered at ${this.BTCFDUSDPrice}`
                )

                TradingExecutor.setOpenTrade('sell')

                const trade = new Trade()
                trade.direction = Side.Sell
                trade.symbol = 'BTC/FDUSD'
                trade.size = '100%'
                trade.price = this.BTCFDUSDPrice.toString()

                const order = await closeTrade(trade)

                if (order) {
                  TradingExecutor.setOpenTrade('none')
                  if (order?.filled > 0) writeOrderToFile(order)
                }
                this.EntryPrice = null
                trailTriggerPrice = null
                nextCheckTime = null
                inTrailingMode = false
                highestPeak = 0
              }
            }
          } else if (!this.EntryPrice) {
            inTrailingMode = false
            highestPeak = 0
            trailTriggerPrice = null
            nextCheckTime = null
          }
        } catch (error) {
          console.error('Error while fetching BTC/FDUSD price:', error)
          await new Promise((resolve) => setTimeout(resolve, 10000)) // wait 10s before retrying
        }
      }
    } else {
      console.error('The exchange does not support WebSocket ticker updates.')
    }
  }
}
