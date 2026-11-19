#!/usr/bin/env node
// Local snapshot files only. No account, network, database access or writes.
import { readFileSync } from 'node:fs'
import { auditCompleteProfilePreservation } from '../frontend/src/lib/migration-audit.js'

const args = process.argv.slice(2)
if (args.length !== 2 || args.some(arg => arg.startsWith('--'))) {
  console.error('Usage: node scripts/check-ironlog-profile-preservation.mjs BEFORE.json AFTER.json')
  process.exitCode = 2
} else {
  try {
    const before = JSON.parse(readFileSync(args[0], 'utf8'))
    const after = JSON.parse(readFileSync(args[1], 'utf8'))
    const result = auditCompleteProfilePreservation(before, after)
    console.log(JSON.stringify(result, null, 2))
    process.exitCode = result.ok ? 0 : 1
  } catch {
    // JSON parse exceptions can include source values. Keep private snapshot contents out of logs.
    console.error('Unable to read, parse or audit the two local JSON snapshots. No files were changed.')
    process.exitCode = 2
  }
}
