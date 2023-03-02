import ccxt, { Ticker } from 'ccxt'
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

  public async getPosition(symbol: string): Promise<any> {
    return await this.exchange.fetchPositionsRisk([symbol])
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

  public async cancelAllOrders(symbol: string): Promise<void> {
    await this.exchange.cancelAllOrders(symbol)
  }

  public async createMarketOrder(
    symbol: string,
    side: Side,
    size: number,
    params?: any
  ): Promise<ccxt.Order> {
    const finalSide = side === Side.Long ? 'buy' : 'sell'
    return await this.exchange.createMarketOrder(
      symbol,
      finalSide,
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
  ): Promise<ccxt.Order> {
    const finalSide = side === Side.Long ? 'buy' : 'sell'
    return await this.exchange.createLimitOrder(
      symbol,
      finalSide,
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
    const { size, symbol } = trade
    let orderSize = parseFloat(size)

    if (size.includes('%')) {
      const balance = await (await this.getBalance()).info.availableBalance
      orderSize = getRelativeOrderSize(balance, size)
    }

    const tokens = getTokensAmount(symbol, ticker.last, orderSize)
    return { tokens: this.amountToPrecision(symbol, tokens) }
  }

  public async getCloseOrderOptions(trade: Trade): Promise<{
    tokens: number
    contracts: number
    side: Side.Short | Side.Long
  }> {
    const { size, symbol } = trade
    let orderSize = parseFloat(size)

    const position = await this.getPosition(symbol)
    const contracts = position?.[0]?.contracts
    const side = position?.[0]?.side
    const leverage = position?.[0]?.leverage

    if (!contracts) {
      throw new Error('No open position')
    }

    let tokens = 0
    if (size.includes('%')) {
      if (size === '100%') {
        tokens = contracts
      } else tokens = getRelativeOrderSize(contracts, size)
    } else {
      const ticker: Ticker = await this.getTicker(symbol)
      tokens = getTokensAmount(symbol, ticker.last, orderSize * leverage)
    }

    return {
      tokens: this.amountToPrecision(symbol, tokens),
      contracts,
      side: side === 'long' ? Side.Short : Side.Long,
    }
  }
}
