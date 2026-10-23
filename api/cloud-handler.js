import { createApp, nodeHandler } from './cloud/app.js'
let handler
export default async function cloudHandler(req, res) {
  try {
    handler ||= nodeHandler(createApp())
    await handler(req, res)
  } catch {
    res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify({ error: 'IronLog backend is not configured', code: 'unavailable' }))
  }
}
