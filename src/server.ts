import express, { NextFunction } from 'express'
import dotenv from 'dotenv'
dotenv.config()
import cors from 'cors'
import TelegramBot from 'node-telegram-bot-api'
import { info, warning } from './services/console.logger'
import { DISCLAIMER, SERVER_RUNNING } from './services/logger.messages'
import { errorMiddleware } from './middleware/errors.middleware'

const app = express()
app.use(cors())

app.use(
  express.json({
    limit: '2mb',
  })
)

// check if JSON is valid
app.use(function (error: any, req: any, res: any, next: NextFunction) {
  // // check user-agent
  // const correctUserAgent = req.headers['user-agent'].includes('ArtoTrader');

  if (error) {
    res.status(400).send('Invalid JSON')
  } else {
    res.status(400).send('Invalid request')
  }
})

export const chatId = process.env.TELEGRAM_CHAT_ID_LIVE
export const telegramBot = new TelegramBot(process.env.TELEGRAM_TOKEN_LIVE!, {
  polling: true,
})

const PORT = process.env.PORT || 3000

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(errorMiddleware)

app.listen(PORT, () => {
  info(SERVER_RUNNING)
  warning(DISCLAIMER)
  // setTelegramCallbacks(telegramBot);
})
