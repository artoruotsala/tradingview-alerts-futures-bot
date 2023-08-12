import { TradingAccount } from './trading.account'

// !if server restarts, trading will be on
export class TradingExecutor {
  public static Trades = true
  public static OpenTrade: 'none' | 'buy' | 'sell' = 'none'
  public static cancelOrder = false
  public static TradeCount = 0
  public static MaxTrades = 4

  public static BTCTUSDPrice = 0.0

  public static BtcTradeCount = 0
  public static BtcMaxTrades = 2

  public static startingBalance = 5888

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

  public static async trackBTCTUSDPrice() {
    const exchange = TradingAccount.getInstance().exchange

    if (exchange.has.watchTicker) {
      while (true) {
        try {
          const ticker = await exchange.watchTicker('BTC/TUSD')
          this.BTCTUSDPrice = ticker.last
        } catch (error) {
          console.error('Error while fetching BTC/TUSD price:', error)
          await new Promise((resolve) => setTimeout(resolve, 10000)) // wait 10s before retrying
        }
      }
    } else {
      console.error('The exchange does not support WebSocket ticker updates.')
    }
  }
}
