import express, { NextFunction } from 'express'
import dotenv from 'dotenv'
dotenv.config()
import cors from 'cors'
import TelegramBot from 'node-telegram-bot-api'
import { info, warning } from './services/console.logger'
import { DISCLAIMER, SERVER_RUNNING } from './services/logger.messages'
import { errorMiddleware } from './middleware/errors.middleware'
import { tradingRouter } from './routes/trading.routes'
import { setTelegramCallbacks } from './services/telegram/setTelegramCallbacks'
import { TradingExecutor } from './services/trading/trading.executor'
import { runBackupTimer } from './services/dropbox/createBackup'

const app = express()
app.use(cors())

app.use(
  express.json({
    limit: '2mb',
  })
)

app.use(function (error: any, req: any, res: any, next: NextFunction) {
  if (error) {
    res.status(400).send('Invalid JSON')
  } else {
    res.status(400).send('Invalid request')
  }
})

const tgToken = process.env.TELEGRAM_TOKEN_LIVE

export const chatId = process.env.TELEGRAM_CHAT_ID_LIVE
export const telegramBot = tgToken
  ? new TelegramBot(tgToken, {
      polling: true,
    })
  : null

const PORT = process.env.PORT || 3000

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(errorMiddleware)
app.use(tradingRouter)

app.listen(PORT, async () => {
  info(SERVER_RUNNING)
  warning(DISCLAIMER)
  if (telegramBot) setTelegramCallbacks(telegramBot)
  TradingExecutor.trackBTCTUSDPrice()
  runBackupTimer()
})
