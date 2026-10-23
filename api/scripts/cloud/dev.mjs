import http from 'node:http'
import { createApp, nodeHandler } from '../../cloud/app.js'
const app = createApp()
http
  .createServer(nodeHandler(app))
  .listen(Number(process.env.PORT) || 3000, '127.0.0.1', () =>
    console.log('IronLog cloud API listening on localhost'),
  )
