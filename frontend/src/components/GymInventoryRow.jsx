import { useStore } from '../store/useStore.js'
import { activeGym, gymsOf, copyInventory } from '../lib/gym-inventory.js'
import { Row, SelectRow } from './ui.jsx'
import { t } from '../lib/i18n.js'

export default function GymInventoryRow({ kind, exId = null }) {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const gym = activeGym(S)
  if (!gym) return null
  const others = gymsOf(S).filter(g => g.id !== gym.id)
  return <div className="list" style={{ marginBottom: 12 }}>
    <Row icon="house" title={t('Active profile')} value={gym.name} />
    {others.length > 0 && <SelectRow title={t('Copy from')} value="" options={[
      { value: '', label: t('Choose') }, ...others.map(g => ({ value: g.id, label: g.name })),
    ]} onChange={id => { if (id) update(s => copyInventory(s, id, kind, { exId })) }} />}
  </div>
}
