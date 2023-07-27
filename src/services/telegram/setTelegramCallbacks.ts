import TelegramBot from 'node-telegram-bot-api'
import { chatId } from '../../server'
import { SERVER_RUNNING } from '../logger.messages'
import { TradingExecutor } from '../trading/trading.executor'

export const setTelegramCallbacks = (telegramBot: TelegramBot) => {
  const keyboards = {
    main_menu: {
      reply_markup: {
        keyboard: [
          [{ text: '/trades on' }, { text: '/trades off' }],
          [{ text: '/tradecount add' }, { text: '/tradecount remove' }],
          [{ text: '/maxtrades add' }, { text: '/maxtrades remove' }],
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
}
