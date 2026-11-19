// Compare the six populated phone fixtures; report every pixel difference without hiding it.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { PNG } = require(process.env.IRONLOG_PNG_MODULE || 'pngjs')
const dir = process.env.IRONLOG_VISUAL_OUT || path.join(require('node:os').tmpdir(), 'ironlog-pr69-visual')
const results = []
for (const lang of ['en', 'he']) for (const screen of ['home', 'stats', 'workout']) {
  const a = PNG.sync.read(fs.readFileSync(path.join(dir, `baseline-${lang}-${screen}.png`)))
  const b = PNG.sync.read(fs.readFileSync(path.join(dir, `migration-${lang}-${screen}.png`)))
  assert.equal(a.width, b.width, `${lang}/${screen}: width changed`)
  assert.equal(a.height, b.height, `${lang}/${screen}: height changed`)
  let changedPixels = 0, maxChannelDelta = 0
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data.subarray(i, i + 4).equals(b.data.subarray(i, i + 4))) continue
    changedPixels++
    for (let j = 0; j < 4; j++) maxChannelDelta = Math.max(maxChannelDelta, Math.abs(a.data[i + j] - b.data[i + j]))
  }
  results.push({ lang, screen, width: a.width, height: a.height, changedPixels, maxChannelDelta })
}
fs.writeFileSync(path.join(dir, 'pixel-report.json'), JSON.stringify(results, null, 2) + '\n')
console.log(JSON.stringify(results, null, 2))
