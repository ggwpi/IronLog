import { Component, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ShimmeringText } from '@animate-ui/react/primitives/texts/shimmering'
import MetallicPaint from './vendor/MetallicPaint.jsx'

// React Bits Prism preset, with the selected color. Reveal only after the
// image has been processed and the shader has rendered its first frame.
const prism = {
  color: '#27ff00', density: 6, softness: 0.8, dispersion: 1,
  distortion: 0.4, edgeBend: 0.4, angle: 0, scale: 0.6,
  speed: 1, rotation: 0, mouseTilt: 0.5, intro: false,
}
const lightning = `${import.meta.env.BASE_URL}ironlog-lightning.svg`

function Artwork() {
  const [ready, setReady] = useState(false)
  return <div className={'boot-stage' + (ready ? ' ready' : '')}>
    <div className="boot-mark">
      <MetallicPaint imageSrc={lightning} {...prism} dpr={1.5}
        onReady={() => setReady(true)} onUnavailable={() => setReady(false)} />
    </div>
    <ShimmeringText className="boot-wordmark" text="IronLog" duration={1.2}
      color="#a1a1aa" shimmeringColor="#ffffff" wave={false} />
  </div>
}

class SafeArtwork extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

export function mountBoot() {
  const boot = document.getElementById('boot')
  const host = document.getElementById('boot-enhancement')
  if (!boot || !host || boot.classList.contains('out')) return
  const root = createRoot(host)
  boot.addEventListener('ironlog:boot-remove', () => root.unmount(), { once: true })
  root.render(<SafeArtwork><Artwork /></SafeArtwork>)
}
