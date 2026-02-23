// @ts-check
const cron = require('node-cron')
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { runMonitor } = require('./monitor')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '/', true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  }).listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)

    // Schedule monitor every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      try {
        await runMonitor()
      } catch (err) {
        console.error('[cron] Monitor run failed:', err)
      }
    })

    console.log('[cron] Scheduled monitor every 15 minutes')
  })
})
