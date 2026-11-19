import { useState } from 'react'
import WarmupConfig from './WarmupConfig.jsx'
import { Button } from './ui.jsx'
import { t } from '../lib/i18n.js'
import { useUI } from '../store/useUI.js'
function WarmupPlanEditor({st,ex,value,onDone,close}) {
 const [c,setC]=useState(value)
 // IronLog's existing volume model excludes warm-ups. Reflect the effective behavior without
 // rewriting a stored upstream volume preference or changing its actual customized charts.
 return <><h3>{t('Warm-ups')}</h3><WarmupConfig st={{...st,volumeWarmups:false}} ex={ex} c={c} setC={setC}/>
  <Button variant="primary" onClick={()=>{onDone(c);close()}}>{t('Save')}</Button>
  <Button variant="ghost" onClick={close}>{t('Cancel')}</Button></>
}
export function warmupPlanSheet(options) {
 return useUI.getState().openSheet(close=><WarmupPlanEditor {...options} close={close}/> )
}
