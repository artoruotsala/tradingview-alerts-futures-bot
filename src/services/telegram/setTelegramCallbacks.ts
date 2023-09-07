import TelegramBot from 'node-telegram-bot-api'
import { Side, Trade } from '../../entities/trade.entities'
import { chatId } from '../../server'
import { SERVER_RUNNING } from '../logger.messages'
import { writeOrderToFile } from '../trade.logger'
import { closeTrade } from '../trading/close.trade'
import { openTrade } from '../trading/open.trade'
import { TradingAccount } from '../trading/trading.account'
import { TradingExecutor } from '../trading/trading.executor'

export const setTelegramCallbacks = (telegramBot: TelegramBot) => {
  const account = TradingAccount.getInstance()

  const keyboards = {
    main_menu: {
      reply_markup: {
        keyboard: [
          [{ text: '/trades on' }, { text: '/trades off' }],
          [{ text: '/manual buy' }, { text: '/manual sell' }],
          [{ text: '/profit get' }],
        ],
        resize_keyboard: true,
      },
    },
  }

  telegramBot.sendMessage(chatId, SERVER_RUNNING, keyboards.main_menu)

  telegramBot.onText(/\/trades (.+)/, async (msg, match) => {
    const resp = match?.[1]

    if (resp && resp === 'off') {
      TradingExecutor.setTrades(false)
      telegramBot.sendMessage(chatId, 'Trades disabled')
    } else if (resp && resp === 'on') {
      TradingExecutor.setTrades(true)
      telegramBot.sendMessage(chatId, 'Trades enabled')
    }
  })

  telegramBot.onText(/\/manual (.+)/, async (msg, match) => {
    const resp = match?.[1]
    const currentPrice = TradingExecutor.BTCFDUSDPrice

    if (TradingExecutor.OpenTrade !== 'none') {
      telegramBot.sendMessage(
        chatId,
        TradingExecutor.OpenTrade + ' in progress, skipped.'
      )
      return
    }

    if (resp && resp === 'buy') {
      TradingExecutor.setOpenTrade('buy')

      const trade = new Trade()
      trade.direction = Side.Buy
      trade.symbol = 'BTC/FDUSD'
      trade.size = '100%'
      trade.price = currentPrice.toString()

      const order = await openTrade(trade)

      if (order) {
        TradingExecutor.setOpenTrade('none')
        if (order?.filled > 0) writeOrderToFile(order)
      }
    } else if (resp && resp === 'sell') {
      TradingExecutor.setOpenTrade('sell')

      const trade = new Trade()
      trade.direction = Side.Sell
      trade.symbol = 'BTC/FDUSD'
      trade.size = '100%'
      trade.price = currentPrice.toString()

      const order = await closeTrade(trade)

      if (order) {
        TradingExecutor.setOpenTrade('none')
        if (order?.filled > 0) writeOrderToFile(order)
      }
    }
  })

  telegramBot.onText(/\/tradecount (.+)/, async (msg, match) => {
    const resp = match?.[1]

    if (resp && resp === 'add') {
      TradingExecutor.addTrade()
    } else if (resp && resp === 'remove') {
      TradingExecutor.removeTrade()
    } else if (resp && resp === 'addbtc') {
      TradingExecutor.addTradeBtc()
    } else if (resp && resp === 'removebtc') {
      TradingExecutor.removeTradeBtc()
    }

    if ((resp && resp === 'addbtc') || (resp && resp === 'removebtc')) {
      telegramBot.sendMessage(
        chatId,
        `Current BTC trades count: ${TradingExecutor.BtcTradeCount}`
      )
      return
    }

    telegramBot.sendMessage(
      chatId,
      `Max trades count: ${TradingExecutor.MaxTrades}, current trades count: ${TradingExecutor.TradeCount}`
    )
  })

  telegramBot.onText(/\/maxtrades (.+)/, async (msg, match) => {
    const resp = match?.[1]

    if (resp && resp === 'add') {
      TradingExecutor.addMaxTrade()
    } else if (resp && resp === 'remove') {
      TradingExecutor.removeMaxTrade()
    }

    telegramBot.sendMessage(
      chatId,
      `Max trades count: ${TradingExecutor.MaxTrades}, current trades count: ${TradingExecutor.TradeCount}`
    )
  })

  telegramBot.onText(/\/profit (\w+)(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id
    const resp = match?.[1]
    const balance = match?.[2]

    if (resp && resp === 'setstart') {
      TradingExecutor.setStartingBalance(Number(balance))

      telegramBot.sendMessage(
        chatId,
        `Starting balance set to ${TradingExecutor.startingBalance} USDT`
      )
    } else if (resp && resp === 'get') {
      const balance = await calculateTotalBalanceInUSDT()
      const profit = TradingExecutor.getProfitInPercent(balance)

      telegramBot.sendMessage(
        chatId,
        `Current balance: ${balance.toFixed(2)}, profit: ${profit.toFixed(2)}%`
      )
    }
  })
}
const calculateTotalBalanceInUSDT = async () => {
  const exchange = TradingAccount.getInstance()
  try {
    const balance = await exchange.getBalance()

    let totalBalanceInUSDT = (balance.USDT.total as number) || 0
    const symbols = []

    for (const currency in balance.total) {
      const total = balance[currency].total as number

      if (total === 0 || currency === 'USDT') continue

      symbols.push(`${currency}/USDT`)
    }

    const tickers = await exchange.getTickers(symbols)

    for (const symbol of symbols) {
      const currency = symbol.split('/')[0]
      const total = balance.total[currency]
      const ticker = tickers[symbol]
      totalBalanceInUSDT += total * ticker.last
    }

    return totalBalanceInUSDT
  } catch (error) {
    console.error(error)
    return 0
  }
}
