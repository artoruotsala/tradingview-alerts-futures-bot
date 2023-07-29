import TelegramBot from 'node-telegram-bot-api'
import { chatId } from '../../server'
import { SERVER_RUNNING } from '../logger.messages'
import { TradingAccount } from '../trading/trading.account'
import { TradingExecutor } from '../trading/trading.executor'

export const setTelegramCallbacks = (telegramBot: TelegramBot) => {
  const account = TradingAccount.getInstance()

  const keyboards = {
    main_menu: {
      reply_markup: {
        keyboard: [
          [{ text: '/trades on' }, { text: '/trades off' }],
          [{ text: '/tradecount add' }, { text: '/tradecount remove' }],
          [{ text: '/maxtrades add' }, { text: '/maxtrades remove' }],
          [{ text: '/tradecount addbtc' }, { text: '/tradecount removebtc' }],
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

    let totalBalanceInUSDT = 0

    for (const currency in balance.total) {
      const total = balance.total[currency]

      if (total === 0) continue

      if (currency === 'USDT') {
        totalBalanceInUSDT += total
      } else {
        const symbol = `${currency}/USDT`
        const ticker = await exchange.getTicker(symbol)
        totalBalanceInUSDT += total * ticker.last
      }
    }

    return totalBalanceInUSDT
  } catch (error) {
    console.error(error)
    return 0
  }
}
