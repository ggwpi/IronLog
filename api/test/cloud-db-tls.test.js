import { test } from 'node:test'
import assert from 'node:assert/strict'
import pg from 'pg'
import { rootCertificates } from 'node:tls'
import { connectionOptions } from '../cloud/db.js'

const remote = 'postgresql://runtime:password@pooler.example:6543/postgres'

test('remote connections refuse modes without certificate and hostname verification', () => {
  for (const mode of ['', '?sslmode=require', '?sslmode=no-verify', '?sslmode=verify-ca'])
    assert.throws(() => connectionOptions(remote + mode), /verify-full/)
})

test('pg keeps the configured trust root and strict TLS after parsing the URL', () => {
  const ca = rootCertificates[0]
  const client = new pg.Client(connectionOptions(remote + '?sslmode=verify-full', ca))
  assert.equal(client.connectionParameters.ssl.rejectUnauthorized, true)
  assert.ok(client.connectionParameters.ssl.ca.includes(ca))
  assert.equal(client.connectionParameters.host, 'pooler.example')
  // No checkServerIdentity override: Node still performs its standard hostname check.
  assert.equal(client.connectionParameters.ssl.checkServerIdentity, undefined)
})

test('URL TLS options cannot silently replace the explicitly verified configuration', () => {
  for (const key of ['sslrootcert', 'sslcert', 'sslkey', 'ssl'])
    assert.throws(() => connectionOptions(remote + '?sslmode=verify-full&' + key + '=other'), /IRONLOG_DATABASE_CA/)
})

test('loopback fixtures keep their explicit local connection configuration', () => {
  const url = 'postgresql://postgres@127.0.0.1:55432/fixture'
  assert.deepEqual(connectionOptions(url), { connectionString: url })
})
