import { Component, useLayoutEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ShimmeringText } from '@animate-ui/react/primitives/texts/shimmering'
import { Progress } from '@animate-ui/react/primitives/base-ui/progress'
import MetallicPaint from './vendor/MetallicPaint.jsx'

// React Bits' Prism preset, with the requested color override. The introduction
// is handled by the static first-paint SVG, so the shader can take over immediately.
const prism = {
  color: '#27ff00', density: 6, softness: 0.8, dispersion: 1,
  distortion: 0.4, edgeBend: 0.4, angle: 0, scale: 0.6,
  speed: 1, rotation: 0, mouseTilt: 0.5, intro: false,
}
const lightning = `${import.meta.env.BASE_URL}ironlog-lightning.svg`

function Artwork({ boot }) {
  useLayoutEffect(() => {
    boot.dataset.enhanced = 'true'
    return () => boot.removeAttribute('data-enhanced')
  }, [boot])
  const [painted, setPainted] = useState(false)
  return <div className="boot-stage">
    <div className={'boot-mark' + (painted ? ' painted' : '')}>
      <img className="boot-static-bolt" src={lightning} alt="" />
      <MetallicPaint imageSrc={lightning} {...prism} dpr={1.5} onReady={() => setPainted(true)} onUnavailable={() => setPainted(false)} />
    </div>
    <ShimmeringText className="boot-wordmark" text="IronLog" duration={1.2}
      color="#a1a1aa" shimmeringColor="#ffffff" wave={false} />
    <Progress.Root value={null} className="boot-progress" aria-label="Loading IronLog">
      <Progress.Track className="boot-track"><Progress.Indicator className="boot-indicator" /></Progress.Track>
    </Progress.Root>
  </div>
}

class SafeArtwork extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.boot.removeAttribute('data-enhanced') }
  render() { return this.state.failed ? null : this.props.children }
}

export function mountBoot() {
  const boot = document.getElementById('boot')
  const host = document.getElementById('boot-enhancement')
  if (!boot || !host || boot.classList.contains('out')) return
  const root = createRoot(host)
  boot.addEventListener('ironlog:boot-remove', () => root.unmount(), { once: true })
  root.render(<SafeArtwork boot={boot}><Artwork boot={boot} /></SafeArtwork>)
}
