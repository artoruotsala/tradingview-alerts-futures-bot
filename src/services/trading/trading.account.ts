import ccxt, { Balances, Exchange, Order, Ticker } from 'ccxt'
import { Side, Trade } from '../../entities/trade.entities'
import { ExchangeId } from '../../constants/exchanges.id'
import { getRelativeOrderSize } from './helpers/getRelativeOrderSize'
import { getTokensAmount } from './helpers/getTokensAmount'
import { TradingExecutor } from './trading.executor'

export class TradingAccount {
  private static instance: TradingAccount
  private exchange: Exchange
  private exchangeId: string

  private constructor() {
    const paper = process.env.PAPER === 'true'

    this.exchangeId = paper
      ? process.env.PAPER_EXCHANGE_ID
      : process.env.EXCHANGE_ID

    if (
      this.exchangeId !== 'binanceusdm' &&
      this.exchangeId !== 'bybit' &&
      this.exchangeId !== 'binance'
    ) {
      throw new Error('Binance or Bybit exchange is required')
    }
    this.exchange = new ccxt[this.exchangeId]()

    if (this.exchangeId === 'bybit')
      this.exchange['options']['defaultType'] = 'future'

    this.exchange.apiKey = paper
      ? process.env.PAPER_TRADING_API_KEY
      : process.env.TRADING_API_KEY
    this.exchange.secret = paper
      ? process.env.PAPER_TRADING_SECRET
      : process.env.TRADING_SECRET
    this.exchange.enableRateLimit = true

    this.exchange.setSandboxMode(paper)
  }

  public static getInstance(): TradingAccount {
    if (!TradingAccount.instance) {
      TradingAccount.instance = new TradingAccount()
    }
    return TradingAccount.instance
  }

  public getExchange(): string {
    return this.exchangeId
  }

  public async getBalance(): Promise<Balances> {
    return await this.exchange.fetchBalance()
  }

  public async getTicker(symbol: string): Promise<Ticker> {
    return await this.exchange.fetchTicker(symbol)
  }

  public async getPosition(symbol: string): Promise<any> {
    const balance = await this.exchange.fetchBalance()
    const firstSymbol = symbol.split('/')[0]
    return balance.free[firstSymbol]
  }

  public async getLeverage(symbol: string): Promise<number> {
    let leverage = 1
    // if (this.exchangeId === 'binanceusdm') {
    //   leverage = (
    //     await this.exchange.({
    //       symbol: symbol.replace('/', ''),
    //     })
    //   )?.[0]?.leverage
    // } else if (this.exchangeId === 'bybit') {
    //   leverage = (await this.exchange.fetchPosition(symbol)).leverage
    // }
    return leverage
  }

  public async changeLeverage(symbol: string, leverage: number): Promise<void> {
    if (this.exchangeId === 'binanceusdm') {
      await this.exchange.setLeverage(leverage, symbol.replace('/', ''))
    } else if (this.exchangeId === 'bybit') {
      await this.exchange.setLeverage(leverage, symbol)
    }
  }

  public async cancelAllOrders(symbol: string): Promise<void> {
    await this.exchange.cancelAllOrders(symbol)
  }

  public async createMarketOrder(
    symbol: string,
    side: Side,
    size: number,
    params?: any
  ): Promise<Order> {
    return await this.exchange.createMarketOrder(
      symbol,
      side,
      size,
      undefined,
      params
    )
  }

  public async createLimitOrder(
    symbol: string,
    side: Side,
    size: number,
    price: number,
    params?: any
  ): Promise<Order> {
    return await this.exchange.createLimitOrder(
      symbol,
      side,
      size,
      price,
      params
    )
  }

  public async createOrder(
    symbol: string,
    side: Side,
    type: string,
    size: number,
    price: number,
    params?: any
  ): Promise<Order> {
    return await this.exchange.createOrder(
      symbol,
      type,
      side,
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
  ): Promise<Order> {
    return await this.exchange.createStopOrder(
      symbol,
      'market',
      side,
      size,
      price
    )
  }

  public priceToPrecision(symbol: string, price: number): number {
    const priceToPre = this.exchange.priceToPrecision(symbol, price)
    return parseFloat(priceToPre)
  }

  public amountToPrecision(symbol: string, amount: number): number {
    const amountToPre = this.exchange.amountToPrecision(symbol, amount)
    return parseFloat(amountToPre)
  }

  public async getOpenOrderOptions(
    trade: Trade,
    ticker: Ticker
  ): Promise<{ tokens: number }> {
    const { size, margin, symbol } = trade

    let orderSize = parseFloat(size) * (margin ? parseFloat(margin) : 1)

    if (size.includes('%')) {
      let balance = 0
      // if (this.exchangeId === 'bybit')
      //   balance = (await this.getBalance()).USDT.free
      if (this.exchangeId === 'binanceusdm' || this.exchangeId === 'binance')
        balance = (await this.getBalance()).USDT.free as number

      let maxTrades = TradingExecutor.MaxTrades
      let tradeCount = TradingExecutor.TradeCount
      let remainingTrades = maxTrades - tradeCount
      const cappedSize = Math.min(100 / remainingTrades, 99)
      orderSize = getRelativeOrderSize(balance, `${cappedSize}%`)

      // orderSize = getRelativeOrderSize(balance, size)
    }

    const tokens = getTokensAmount(symbol, ticker.last, orderSize)
    return { tokens: this.amountToPrecision(symbol, tokens) }
  }

  public async getCloseOrderOptions(trade: Trade): Promise<{
    tokens: number
    contracts: number
    side: Side.Sell
  }> {
    const { size, symbol } = trade
    let finalSize = '100%' // hardcoded for now, for current strategy
    let orderSize = parseFloat(size)

    const position = await this.getPosition(symbol)

    const contracts = position
    const leverage = 1

    if (!contracts) {
      throw new Error('No open position')
    }

    let tokens = 0
    if (finalSize.includes('%')) {
      if (finalSize === '100%') {
        tokens = contracts
      } else tokens = getRelativeOrderSize(contracts, finalSize)
    } else {
      const ticker: Ticker = await this.getTicker(symbol)
      tokens = getTokensAmount(symbol, ticker.last, orderSize * leverage)
    }

    return {
      tokens: this.amountToPrecision(symbol, tokens),
      contracts,
      side: Side.Sell,
    }
  }
}
