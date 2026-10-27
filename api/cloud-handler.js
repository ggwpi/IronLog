import { createApp, nodeHandler } from './cloud/app.js'
import { waitUntil } from '@vercel/functions'
let handler, app
export default async function cloudHandler(req, res) {
  try {
    app ||= createApp()
    handler ||= nodeHandler(app)
    await handler(req, res)
    if (res.statusCode < 300 && req.method === 'POST' && (req.url.split('?')[0] === '/api/internal/worker' || /^\/api\/coach\/(plan|review|debrief|ask)$/.test(req.url.split('?')[0]))) {
      waitUntil(app.runCoach().catch(() => console.error('IronLog Coach worker failed', { code: 'worker-failed' })))
    }
  } catch {
    res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify({ error: 'IronLog backend is not configured', code: 'unavailable' }))
  }
}
