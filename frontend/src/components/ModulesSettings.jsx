import { MODULES, GROUPS, PRESETS, isOn, presetOf, applyPreset, setModule } from '../lib/modules.js'
import { t } from '../lib/i18n.js'
import { Section, Row, SelectRow, Switch } from './ui.jsx'

// Services present in this IronLog build. Upstream-only services need their own integration.
export const IRONLOG_MODULE_IDS = ['effort', 'plates', 'strength', 'watch', 'checkin', 'body', 'health', 'motivation', 'coach']
const shown = MODULES.filter(m => IRONLOG_MODULE_IDS.includes(m.id))
export default function ModulesSettings({ S, update }) {
  return <>
    <p className="sect-f">{t('Switch off what you don’t use. Nothing gets deleted: switch it back on and it’s all still there.')}</p>
    <Section>
      <SelectRow icon="slider" iconTint="var(--blue)" title={t('Start from')} value={presetOf(S)}
        options={[...PRESETS.map(p => ({ value: p.id, label: t(p.title) })), { value: 'custom', label: t('Custom') }]}
        onChange={id => { if (id !== 'custom') update(s => applyPreset(s, id)) }} />
    </Section>
    {GROUPS.map(group => <Section key={group.id} title={t(group.title)}>
      {shown.filter(m => m.group === group.id).map(m => <Row key={m.id} icon={m.icon} iconTint={m.tint} title={t(m.title)}>
        <Switch aria-label={t(m.title)} checked={isOn(S, m.id)} onChange={on => update(s => setModule(s, m.id, on))} />
      </Row>)}
    </Section>)}
  </>
}
