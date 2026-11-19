// Local synthetic guests only. Block non-loopback traffic and mock all API calls.
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const assert = require('node:assert/strict')
const { chromium } = require(process.env.IRONLOG_PLAYWRIGHT_MODULE || 'playwright')
const out = process.env.IRONLOG_VISUAL_OUT || path.join(os.tmpdir(), 'ironlog-pr69-csv-visual')
fs.mkdirSync(out, { recursive: true })
const longNote = 'א'.repeat(499) + 'ב'
const run = { baseline: process.env.IRONLOG_BASELINE_SHA || '1696160064c61b474e91c91b58107fca029711d0', startedAt: new Date().toISOString(), viewport: { width: 390, height: 844 } }
fs.writeFileSync(path.join(out, 'run.json'), JSON.stringify({ ...run, status: 'running' }, null, 2))

;(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.IRONLOG_CHROMIUM_PATH ? { executablePath: process.env.IRONLOG_CHROMIUM_PATH } : {}) })
  const results = []
  for (const theme of ['dark', 'light']) for (const lang of ['en', 'he']) for (const [label, port] of [['baseline', 5180], ['migration', 5179]]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce', timezoneId: 'Asia/Jerusalem', locale: lang, serviceWorkers: 'block', acceptDownloads: true })
    const page = await context.newPage(), errors = []
    let loads = 0
    page.on('load', () => loads++)
    page.on('pageerror', e => errors.push(e.message))
    await page.route('**/*', route => {
      const url = new URL(route.request().url())
      if (url.hostname !== '127.0.0.1') return route.abort()
      if (url.pathname.startsWith('/api/')) return route.fulfill({ status: url.pathname.includes('/me') ? 401 : 200, contentType: 'application/json', body: JSON.stringify(url.pathname === '/api/config' ? { invite_only: false, password_login: false, coach: { cloud: false } } : {}) })
      if (url.pathname.startsWith('/exercise-media/')) return route.abort()
      return route.continue()
    })
    await page.addInitScript(() => { localStorage.setItem('gym_guest', '1'); Date.now = () => 1795078800000 })
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' })
    await page.waitForFunction(async () => (await import('/src/store/useStore.js')).useStore.getState().ready === true)
    await page.evaluate(async ({ lang, theme }) => {
      const { DEF, useStore } = await import('/src/store/useStore.js')
      const { setLang } = await import('/src/lib/i18n.js')
      const { DEFAULT_ACCENT } = await import('/src/lib/accent.js')
      // A real profile after IronLog's existing one-time palette setup; do not let that setup
      // reset a requested light-theme fixture to dark while claiming light coverage.
      const S = { ...structuredClone(DEF), lang, theme, ironlogPaletteVersion: 1, accent: DEFAULT_ACCENT, langAuto: false, gifSize: 'off', sound: false, weighIn: false, dailyForm: false,
        routines: [{ id: 'r-fixture', name: 'Fixture plan', ex: [{ id: '0025', sets: 2, reps: 8, weight: 60, mode: 'reps' }] }], week: { 4: ['r-fixture'] },
        bodyweight: [{ d: '2026-11-17', w: 80 }], measurements: [{ d: '2026-11-17', waist: 85 }],
        workouts: [{ id: 'w-fixture', name: 'Fixture workout', d: '2026-11-17', start: 1794902400000, end: 1794906000000, vol: 960, entries: [{ id: '0025', target: { mode: 'reps' }, sets: [{ w: 60, r: 8, done: true }, { w: 60, r: 8, done: true }] }] }], active: null }
      useStore.setState({ S, user: null, ready: true, needsMobileOnboarding: false, permSteps: false })
      await setLang(lang)
    }, { lang, theme })
    const shot = async name => page.screenshot({ path: path.join(out, `${label}-${theme}-${lang}-${name}.png`), fullPage: true, animations: 'disabled' })
    for (const screen of ['home', 'stats', 'workout']) {
      if (screen === 'workout') await page.evaluate(async () => {
        const { useStore } = await import('/src/store/useStore.js')
        useStore.setState(s => ({ S: { ...s.S, active: { id: 'active-fixture', d: '2026-11-19', name: 'Fixture workout', start: 1795078200000, cur: 0, bw: null, routineIds: ['r-fixture'], entries: [{ id: '0025', rid: 'r-fixture', target: { mode: 'reps', sets: 2, reps: 8, weight: 60 }, sets: [{ w: 60, r: 8, done: false }, { w: 60, r: 8, done: false }] }] } } }))
      })
      await page.evaluate(screen => { location.hash = screen === 'home' ? '#/' : '#/' + screen }, screen)
      await page.waitForTimeout(600)
      await shot(screen)
      const renderedTheme = await page.evaluate(() => document.documentElement.dataset.theme)
      assert.equal(renderedTheme, theme)
      results.push({ label, theme, renderedTheme, lang, screen, direction: await page.evaluate(() => document.documentElement.dir) })
    }
    if (label === 'migration') {
      if (process.env.IRONLOG_VERIFY_CARDIO === '1') {
        const original = await page.evaluate(async () => structuredClone((await import('/src/store/useStore.js')).useStore.getState().S))
        const words = await page.evaluate(async () => {
          const { t } = await import('/src/lib/i18n.js')
          const { useStore } = await import('/src/store/useStore.js')
          useStore.setState(s => ({ S: { ...s.S, workouts: [...s.S.workouts, { id: 'cardio-fixture', name: 'Cardio fixture', d: '2026-11-19', start: 1795076100000, end: 1795078800000, vol: 0, entries: [{ id: '0685', sets: [{ min: 45, km: 7.5, speed: 10, done: true }] }] }] } }))
          location.hash = '#/stats'
          return { addGoal: t('Add a goal'), add: t('Add'), run: t('Run'), any: t('Any cardio'), distance: t('Distance'), first: t('Show first') }
        })
        const card = page.locator('[data-cardio-week]')
        await card.waitFor({ state: 'visible' })
        await card.getByRole('button').click()
        await page.getByRole('button', { name: words.addGoal, exact: true }).click()
        await page.locator('[data-kind="run"]').click()
        await page.getByRole('button', { name: words.distance, exact: true }).click()
        await shot('cardio-goal-editor')
        assert.equal(await page.locator('[data-cardio-goal-edit] input').evaluateAll(inputs => inputs.every(input => { const r = input.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth })), true)
        await page.getByRole('button', { name: words.add, exact: true }).click()
        await page.getByRole('button', { name: words.addGoal, exact: true }).click()
        await page.getByRole('button', { name: words.add, exact: true }).click()
        await page.locator('[data-cardio-goals-sheet] button.lrow').filter({ has: page.getByText(words.any, { exact: true }) }).click()
        await page.getByRole('button', { name: words.first, exact: true }).click()
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gym_state_v1')))
        assert.equal(saved.cardioGoal, 150)
        assert.deepEqual(saved.cardioGoals, [{ kind: 'any', unit: 'min', v: 150 }, { kind: 'run', unit: 'km', v: 10 }])
        assert.deepEqual(saved.active, original.active)
        assert.deepEqual(saved.workouts.slice(0, -1), original.workouts)
        assert.deepEqual(saved.bodyweight, original.bodyweight)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(400)
        assert.equal(await card.locator('.cardio-bar').count(), 8)
        await shot('cardio-goals-saved')
        results.push({ label, theme, lang, story: 'existing Stats -> original goals editor -> run distance and any-minutes goals -> reorder -> actual guest JSON, eight-week chart and original user data retained', passed: true })
        // Restore only the synthetic test fixture before the independent note/CSV/tempo stories.
        await page.evaluate(async S => { (await import('/src/store/useStore.js')).useStore.setState({ S }); location.hash = '#/workout' }, original)
        await page.waitForTimeout(500)
      }
      if (process.env.IRONLOG_VERIFY_TEMPO === '1') {
        const words = await page.evaluate(async () => {
          const { t } = await import('/src/lib/i18n.js')
          return { tempo: t('Tempo'), save: t('Save'), none: t('No tempo'), cancel: t('Cancel') }
        })
        const before = await page.evaluate(async () => JSON.stringify((await import('/src/store/useStore.js')).useStore.getState().S))
        await page.locator('button.n').first().click()
        await page.locator('.menu-item .tt').filter({ hasText: words.tempo }).first().click()
        await page.getByRole('button', { name: '5-0-X-0', exact: true }).click()
        await shot('tempo-editor')
        const fits = await page.locator('.sheet input').evaluateAll(inputs => inputs.every(input => { const r = input.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth }))
        assert.equal(fits, true, 'tempo steppers must fit the phone viewport')
        await page.getByRole('button', { name: words.save, exact: true }).click()
        await page.waitForTimeout(400)
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('gym_state_v1')).active.entries[0].sets[0].tempo), '5-0-X-0')
        await shot('tempo-workout')
        await page.locator('[data-set-tempo]').click()
        await page.getByRole('button', { name: words.none, exact: true }).click()
        await page.waitForTimeout(400)
        const after = await page.evaluate(async () => structuredClone((await import('/src/store/useStore.js')).useStore.getState().S))
        const original = JSON.parse(before)
        assert.ok(after._ts >= (original._ts || 0), 'actual editing advances the existing sync clock')
        delete after._ts; delete original._ts
        assert.deepEqual(after, original)
        results.push({ label, theme, lang, story: 'actual set menu -> original tempo preset -> saved guest JSON -> inline reopen -> clear without changing original data', passed: true })
      }
      const words = await page.evaluate(async () => {
        const { t } = await import('/src/lib/i18n.js')
        return { note: t('Note'), save: t('Save'), csv: t('Export as spreadsheet (CSV)'), workouts: t('Workouts (CSV)'), body: t('Body weight & measurements (CSV)'), nothing: t('Nothing new to import'), cancel: t('Cancel'), import: t('Import'), custom: t('Custom'), all: t('All'), from: t('From'), to: t('To') }
      })
      await page.locator('button.n').first().click()
      await page.locator('.menu-item .tt').filter({ hasText: words.note }).first().click()
      const textarea = page.locator('textarea').last()
      assert.equal(await textarea.getAttribute('maxlength'), '500')
      await textarea.fill(longNote)
      await shot('set-note-editor')
      await page.getByRole('button', { name: words.save, exact: true }).click()
      await page.waitForTimeout(400)
      assert.equal(await page.locator('[data-set-note]').textContent().then(t => t.trim()), longNote)
      const edited = await page.evaluate(async () => {
        const { useStore } = await import('/src/store/useStore.js')
        return useStore.getState().S.active.entries[0].sets[0]
      })
      assert.equal(edited.note, longNote); assert.equal(edited.w, 60); assert.equal(edited.r, 8); assert.equal(edited.done, false)
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('gym_state_v1')).active.entries[0].sets[0].note.length), 500)
      await shot('set-note-workout')
      await page.evaluate(async note => {
        const { useStore } = await import('/src/store/useStore.js')
        useStore.setState(s => ({ S: { ...s.S, workouts: s.S.workouts.map(w => ({ ...w, entries: w.entries.map(e => ({ ...e, sets: e.sets.map((set, i) => i ? set : { ...set, tag: 'blue', note }) })) })) } }))
        location.hash = '#/settings/data'
      }, longNote)
      await page.waitForTimeout(500)
      const snapshot = await page.evaluate(async () => JSON.stringify((await import('/src/store/useStore.js')).useStore.getState().S))
      await page.getByText(words.csv, { exact: true }).click()
      await page.waitForTimeout(400)
      await shot('csv-sheet')
      await page.getByRole('button', { name: words.custom, exact: true }).click()
      await page.getByLabel(words.from, { exact: true }).fill('2026-11-16')
      await page.getByLabel(words.to, { exact: true }).fill('2026-11-19')
      await shot('csv-custom-dates')
      const fieldsFit = await page.locator('input[type=date]').evaluateAll(inputs => inputs.every(input => {
        const r = input.getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth
      }))
      assert.equal(fieldsFit, true, 'date fields must fit the phone viewport')
      await page.getByRole('button', { name: words.all, exact: true }).click()
      let waiting = page.waitForEvent('download')
      await page.getByRole('button', { name: words.workouts, exact: true }).click()
      const workoutDownload = await waiting
      const file = path.join(out, `${theme}-${lang}-workouts.csv`)
      await workoutDownload.saveAs(file)
      assert.ok(workoutDownload.suggestedFilename().startsWith('ironlog-workouts-'))
      assert.ok(fs.readFileSync(file, 'utf8').includes(longNote))
      assert.equal(await page.evaluate(async () => JSON.stringify((await import('/src/store/useStore.js')).useStore.getState().S)), snapshot)
      await page.waitForTimeout(400)
      await page.getByText(words.csv, { exact: true }).click()
      waiting = page.waitForEvent('download')
      await page.getByRole('button', { name: words.body, exact: true }).click()
      const bodyDownload = await waiting
      await bodyDownload.saveAs(path.join(out, `${theme}-${lang}-body.csv`))
      assert.ok(bodyDownload.suggestedFilename().startsWith('ironlog-body-'))
      assert.equal(await page.evaluate(async () => JSON.stringify((await import('/src/store/useStore.js')).useStore.getState().S)), snapshot)
      await page.waitForTimeout(400)
      // The actual existing import UI must leave a day already present untouched.
      await page.locator('input[type=file][accept*="csv"]').setInputFiles(file)
      await page.waitForTimeout(400)
      assert.equal(await page.getByRole('button', { name: words.nothing, exact: true }).isDisabled(), true)
      await shot('csv-duplicate-import')
      await page.getByRole('button', { name: words.cancel, exact: true }).click()
      // A fresh import uses the existing confirm/update/sync path, without changing the active draft.
      await page.evaluate(async () => {
        const { useStore } = await import('/src/store/useStore.js')
        useStore.setState(s => ({ S: { ...s.S, workouts: [] } }))
      })
      await page.waitForTimeout(400)
      await page.locator('input[type=file][accept*="csv"]').setInputFiles(file)
      await page.waitForTimeout(400)
      await page.getByRole('button', { name: words.import, exact: true }).click()
      await page.waitForTimeout(400)
      const restored = await page.evaluate(async () => (await import('/src/store/useStore.js')).useStore.getState().S)
      assert.equal(restored.workouts.length, 1)
      assert.equal(restored.workouts[0].entries[0].id, '0025')
      assert.equal(restored.workouts[0].entries[0].sets[0].note, longNote)
      assert.equal(restored.workouts[0].entries[0].sets[0].tag, 'blue')
      assert.equal(restored.active.entries[0].sets[0].note, longNote)
      assert.equal(restored.bodyweight[0].w, 80)
      results.push({ label, theme, lang, story: '500-character existing note editor -> saved guest JSON; CSV downloads read-only; duplicate import protected; fresh confirmed import retains ID/tag/note and active draft', passed: true })
    }
    assert.deepEqual(errors, [])
    assert.equal(loads, 1, 'frontend sources/cache reloaded during capture; rerun against stable isolated servers')
    await context.close()
  }
  await browser.close()
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2) + '\n')
  fs.writeFileSync(path.join(out, 'run.json'), JSON.stringify({ ...run, status: 'passed', completedAt: new Date().toISOString() }, null, 2) + '\n')
  console.log(JSON.stringify({ out, results }, null, 2))
})().catch(e => { fs.writeFileSync(path.join(out, 'run.json'), JSON.stringify({ ...run, status: 'failed', error: e.message }, null, 2)); console.error(e); process.exit(1) })
