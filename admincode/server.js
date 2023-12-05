const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
let {schedukeCron}=require("./src/pages/api/schedule")
var cron = require('node-cron');
const dev = process.env.ENVIRONMENT !== 'production'
const hostname = 'localhost'
const port = 3016

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()
cron.schedule('* * * * *', () => {
  schedukeCron()
 
  });
app.prepare().then(() => {
  createServer(async (req, res) => {
    try {

      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl
 
      if (pathname === '/a') {
        await app.render(req, res, '/a', query)
      } else if (pathname === '/b') {
        await app.render(req, res, '/b', query)
      } else {
        await handle(req, res, parsedUrl)
      }

    } catch (err) {
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {

      process.exit(1)
    })
    .listen(port, () => {
    })
})