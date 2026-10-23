// Activation is a deployment setting, so an unconfigured preview cannot erase data.
export const BACKEND_GENERATION = import.meta.env.VITE_BACKEND_GENERATION || ''
export const CLOUD_GENERATION = 'ironlog-cloud-1'
const scoped = key => BACKEND_GENERATION === CLOUD_GENERATION ? 'ironlog_cloud_1_' + key : key
// The new store cannot read legacy writes from an older tab still running old code.
export const cloudStorage = {
  getItem: key => globalThis.localStorage.getItem(scoped(key)),
  setItem: (key,value) => globalThis.localStorage.setItem(scoped(key),value),
  removeItem: key => globalThis.localStorage.removeItem(scoped(key))
}
