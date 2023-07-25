// !if server restarts, trading will be on
export class TradingExecutor {
  public static Trades = true
  public static TradeCount = 0

  static setTrades(value: boolean) {
    this.Trades = value
  }

  static addTrade() {
    this.TradeCount++
  }

  static removeTrade() {
    this.TradeCount = Math.max(0, this.TradeCount - 1)
  }
}
