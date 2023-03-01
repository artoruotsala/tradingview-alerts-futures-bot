import ccxt from 'ccxt'
import { Side, Trade } from '../../entities/trade.entities'
import { ExchangeId } from '../../constants/exchanges.id'
import { getRelativeOrderSize } from './helpers/getRelativeOrderSize'
import { getTokensAmount } from './helpers/getTokensAmount'

export class TradingAccount {
  private static instance: TradingAccount
  private exchange: ccxt.Exchange

  private constructor() {
    const exchangeId: string = process.env.EXCHANGE_ID as string
    if (exchangeId !== 'binanceusdm' && exchangeId !== 'bybit') {
      throw new Error('Binance or Bybit exchange is required')
    }
    this.exchange = new ccxt[exchangeId]()

    this.exchange.apiKey = process.env.TRADING_API_KEY
    this.exchange.secret = process.env.TRADING_SECRET
    this.exchange.enableRateLimit = true

    const paper = process.env.PAPER === 'true'
    this.exchange.setSandboxMode(paper)
  }

  public static getInstance(): TradingAccount {
    if (!TradingAccount.instance) {
      TradingAccount.instance = new TradingAccount()
    }
    return TradingAccount.instance
  }

  public async getBalance(): Promise<ccxt.Balances> {
    return await this.exchange.fetchBalance()
  }

  public async getTicker(symbol: string): Promise<ccxt.Ticker> {
    return await this.exchange.fetchTicker(symbol)
  }

  public async getLeverage(symbol: string): Promise<number> {
    const leverage = (
      await this.exchange.fapiPrivateGetPositionRisk({
        symbol: symbol.replace('/', ''),
      })
    )?.[0]?.leverage
    return leverage
  }

  public async changeLeverage(symbol: string, leverage: number): Promise<void> {
    await this.exchange.setLeverage(leverage, symbol.replace('/', ''))
  }

  public async closeAllOrders(symbol: string): Promise<void> {
    await this.exchange.cancelAllOrders(symbol)
  }

  public async createMarketOrder(
    symbol: string,
    side: Side,
    size: number
  ): Promise<ccxt.Order> {
    const finalSide = side === Side.Long ? 'buy' : 'sell'
    return await this.exchange.createMarketOrder(symbol, finalSide, size)
  }

  public async createLimitOrder(
    symbol: string,
    side: Side,
    size: number,
    price: number
  ): Promise<ccxt.Order> {
    const finalSide = side === Side.Long ? 'buy' : 'sell'
    return await this.exchange.createLimitOrder(symbol, finalSide, size, price)
  }

  public async createOrder(
    symbol: string,
    side: Side,
    type: string,
    size: number,
    price: number,
    params?: any
  ): Promise<ccxt.Order> {
    const finalSide = side === Side.Long ? 'buy' : 'sell'
    return await this.exchange.createOrder(
      symbol,
      type,
      finalSide,
      size,
      price,
      params
    )
  }

  public async createStopOrder(
    symbol: string,
    side: Side,
    size: number,
    price: number
  ): Promise<ccxt.Order> {
    const finalSide = side === Side.Long ? 'buy' : 'sell'
    return await this.exchange.createStopOrder(symbol, finalSide, size, price)
  }

  public priceToPrecision(symbol: string, price: number): number {
    return this.exchange.priceToPrecision(symbol, price)
  }

  public amountToPrecision(symbol: string, amount: number): number {
    return this.exchange.amountToPrecision(symbol, amount)
  }

  public async getOpenOrderOptions(
    trade: Trade
  ): Promise<{ finalSize: number }> {
    const { size, symbol } = trade
    let orderSize = parseFloat(size)

    if (size.includes('%')) {
      const balance = await (await this.getBalance()).info.availableBalance
      orderSize = getRelativeOrderSize(balance, size)
    }

    const tickerPrice = (await this.getTicker(trade.symbol)).last
    const finalSize = getTokensAmount(symbol, tickerPrice, orderSize)
    return { finalSize }
  }
}
