import * as fs from 'fs'
import { Dropbox } from 'dropbox'
import { chatId, telegramBot } from '../../server'

function createBackup() {
  const dbPath = '/bot/orders.db'
  const backupPath = `/orders-${new Date().toISOString().replace(/:/g, '-')}.db`

  const dbx = new Dropbox({
    clientId: process.env.DROPBOX_APP_KEY,
    clientSecret: process.env.DROPBOX_APP_SECRET,
    refreshToken: process.env.DROPBOX_TOKEN,
  })

  fs.readFile(dbPath, (err, data) => {
    if (err) {
      console.error('Error reading the database file:', err)
      return
    }

    dbx
      .filesUpload({
        path: backupPath,
        contents: data,
      })
      .then((response) => {
        console.log('Backup uploaded successfully')
        telegramBot.sendMessage(
          chatId,
          'Backup uploaded successfully to Dropbox!'
        )
      })
      .catch((error) => {
        console.error('Error uploading to Dropbox:', error)
        telegramBot.sendMessage(
          chatId,
          'Error in uploading backup file to Dropbox: ' + error.error
        )
      })
  })
}

export function runBackupTimer() {
  createBackup()
  setInterval(createBackup, 24 * 60 * 60 * 1000)
}
