import test from 'node:test'
import assert from 'node:assert/strict'
import dns from 'node:dns'
import { PUSH_AGENT, pushEndpointError } from '../cloud/push-security.js'

const resolveWith = (t, address, family = 4) => {
  t.mock.method(dns, 'lookup', (_host, _options, callback) => callback(null, address, Array.isArray(address) ? undefined : family))
  return new Promise((resolve, reject) => {
    PUSH_AGENT.options.lookup('web.push.apple.com', { all: Array.isArray(address) }, (error, resolved, version) => {
      if (error) reject(error)
      else resolve({ resolved, version })
    })
  })
}

test('the cloud push DNS lookup accepts public IPv4 addresses without referencing self-host-only helpers', async t => {
  assert.deepEqual(await resolveWith(t, '17.248.185.73'), { resolved: '17.248.185.73', version: 4 })
})

test('the cloud push DNS lookup accepts public IPv6 answers and the all-addresses callback shape', async t => {
  const answers = [{ address: '2620:149:208:4303::1', family: 6 }, { address: '17.248.185.73', family: 4 }]
  assert.deepEqual(await resolveWith(t, answers), { resolved: answers, version: undefined })
})

test('private or mixed DNS answers are refused, including IPv6 mappings', async t => {
  for (const ip of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.1.1', '::1', '::ffff:7f00:1', '64:ff9b::a00:1', 'fc00::1']) {
    await t.test(ip, async child => {
      await assert.rejects(resolveWith(child, [{ address: '17.248.185.73', family: 4 }, { address: ip, family: ip.includes(':') ? 6 : 4 }]), { code: 'EPUSHBLOCKED' })
    })
  }
})

test('literal private endpoints are rejected before opening a connection', () => {
  for (const host of ['127.0.0.1', '2130706433', '169.254.169.254', '[::1]', '[::ffff:7f00:1]'])
    assert.equal(pushEndpointError('https://' + host + '/secret'), 'endpoint must not point at a private address')
  assert.equal(pushEndpointError('http://web.push.apple.com/push'), 'endpoint must be an https:// URL')
  assert.equal(pushEndpointError('https://user:pass@web.push.apple.com/push'), 'endpoint must not carry credentials')
  assert.equal(pushEndpointError('https://web.push.apple.com/push'), null)
})

test('DNS errors reach the HTTPS client unchanged', async t => {
  const failure = Object.assign(new Error('lookup failed'), { code: 'ENOTFOUND' })
  t.mock.method(dns, 'lookup', (_host, _options, callback) => callback(failure))
  await assert.rejects(new Promise((resolve, reject) => {
    PUSH_AGENT.options.lookup('web.push.apple.com', {}, (error, answer) => error ? reject(error) : resolve(answer))
  }), { code: 'ENOTFOUND' })
})
