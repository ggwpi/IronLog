import { describe, it, expect, vi } from 'vitest'
import { resetLegacyData } from './cloud-reset.js'

const store = initial => {
  const data = new Map(Object.entries(initial))
  return {
    get length() { return data.size },
    key: i => [...data.keys()][i],
    getItem: k => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: k => data.delete(k),
    data,
  }
}

describe('IronLog non-destructive startup', () => {
  it('never deletes legacy workout history, stashes, backups or cloud data', async () => {
    const storage = store({
      gym_state_v1: JSON.stringify({ workouts: [{ id: 'existing-workout' }], routines: [{ id: 'existing-routine' }] }),
      gym_stash: 'unsynced-guest-workouts',
      ironlog_before_catalogue_v1: 'legacy-backup',
      'ironlog_cloud_1_gym_state_v1': 'new-cloud-history',
      unrelated: 'untouched',
    })
    const before = [...storage.data]
    const idb = { deleteDatabase: vi.fn(() => { throw new Error('DESTRUCTIVE OPERATION') }) }
    const result = await resetLegacyData({ generation: 'ironlog-cloud-1', storage, idb })
    expect(result).toBe(false)
    expect([...storage.data]).toEqual(before)
    expect(idb.deleteDatabase).not.toHaveBeenCalled()
  })

  it('does not remove IndexedDB databases or native state and media', async () => {
    const storage = store({ gym_state_v1: 'on-device-only' })
    const idb = {
      databases: vi.fn(async () => [{ name: 'opengym-media' }, { name: 'ironlog-cloud-1-media' }]),
      deleteDatabase: vi.fn(() => { throw new Error('DESTRUCTIVE OPERATION') }),
    }
    const loadNative = vi.fn(() => { throw new Error('DESTRUCTIVE OPERATION') })
    expect(await resetLegacyData({ generation: 'ironlog-cloud-1', storage, idb, native: true, loadNative })).toBe(false)
    expect(storage.getItem('gym_state_v1')).toBe('on-device-only')
    expect(idb.deleteDatabase).not.toHaveBeenCalled()
    expect(loadNative).not.toHaveBeenCalled()
  })

  it('is repeatable and never marks data as reset', async () => {
    const storage = store({ gym_state_v1: 'history' })
    expect(await resetLegacyData({ generation: 'ironlog-cloud-1', storage })).toBe(false)
    expect(await resetLegacyData({ generation: 'ironlog-cloud-1', storage })).toBe(false)
    expect(storage.getItem('gym_state_v1')).toBe('history')
    expect(storage.getItem('ironlog_cloud_reset_generation')).toBeNull()
  })
})
