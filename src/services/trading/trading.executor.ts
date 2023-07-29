// !if server restarts, trading will be on
export class TradingExecutor {
  public static Trades = true
  public static TradeCount = 0
  public static MaxTrades = 3

  public static BtcTradeCount = 0
  public static BtcMaxTrades = 2

  static setTrades(value: boolean) {
    this.Trades = value
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
}
