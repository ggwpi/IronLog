import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { providerFetch } from '../cloud/coach-transport.js'

function fakeConnection(reply) {
  return (_url, _options, onResponse) => {
    const req = new EventEmitter()
    req.setTimeout = () => req
    req.destroy = error => { req.emit('error', error); req.emit('close') }
    req.end = () => queueMicrotask(() => {
      const socket = new EventEmitter()
      socket.connecting = true
      req.emit('socket', socket)
      socket.emit('lookup', null, '203.0.113.1', 4)
      socket.emit('connect')
      if (!reply) return
      socket.emit('secureConnect')
      req.emit('finish')
      // A slow provider answer must keep working after the separate connection deadline.
      setTimeout(() => {
        const res = new EventEmitter()
        res.statusCode = 200; res.headers = { 'content-type': 'application/json' }
        onResponse(res)
        res.emit('data', Buffer.from('{"ok":true}'))
        res.emit('end')
        req.emit('close')
      }, 25)
    })
    return req
  }
}

test('a stalled TLS handshake fails on the connection deadline rather than waiting for a model timeout', async () => {
  const phases = []
  await assert.rejects(providerFetch('https://example.com', { onTransportProgress: p => phases.push(p) }, { request: fakeConnection(false), connectTimeoutMs: 10 }), /Provider connection did not complete/)
  assert.deepEqual(phases, ['socket-assigned', 'dns-complete', 'tcp-connected', 'connection-timeout'])
})

test('a connected provider may take longer to answer; its connection timer is cleared and phases identify the wait', async () => {
  const phases = []
  const response = await providerFetch('https://example.com', { onTransportProgress: p => phases.push(p) }, { request: fakeConnection(true), connectTimeoutMs: 10 })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.deepEqual(phases, ['socket-assigned', 'dns-complete', 'tcp-connected', 'tls-connected', 'request-sent', 'response-headers', 'response-body', 'response-complete'])
})
