// !if server restarts, trading will be on
export class TradingExecutor {
  public static Trades = true

  static setTrades(value: boolean) {
    this.Trades = value
  }
}
