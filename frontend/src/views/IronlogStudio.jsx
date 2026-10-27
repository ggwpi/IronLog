import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import './ironlog-studio.css'

const DAYS = [
  { day: 'Mon', date: 26, state: 'done' },
  { day: 'Tue', date: 27, state: 'done' },
  { day: 'Wed', date: 28, state: 'today' },
  { day: 'Thu', date: 29, state: 'planned' },
  { day: 'Fri', date: 30, state: 'planned' },
  { day: 'Sat', date: 31 },
  { day: 'Sun', date: 1 },
]

const VARIATIONS = [
  { id: 'precision', number: '01', name: 'Precision', note: 'Quiet · technical · focused' },
  { id: 'kinetic', number: '02', name: 'Kinetic', note: 'Athletic · bold · energetic' },
  { id: 'atelier', number: '03', name: 'Atelier', note: 'Warm · editorial · refined' },
]

function LabSwitcher({ active, onChange }) {
  return <header className="studio-switcher">
    <div className="studio-brand"><span className="studio-mark"><Icon name="dumbbell" /></span><span>IronLog <b>Design Lab</b></span></div>
    <div className="studio-options" role="tablist" aria-label="Home page design variations">
      {VARIATIONS.map(item => <button key={item.id} type="button" role="tab" aria-selected={active === item.id} className={active === item.id ? 'active' : ''} onClick={() => onChange(item.id)}>
        <span>{item.number}</span><span><b>{item.name}</b><small>{item.note}</small></span>
      </button>)}
    </div>
  </header>
}

function WeekStrip({ selected, setSelected }) {
  return <section className="studio-week" aria-labelledby="studio-week-label">
    <div className="studio-week-head">
      <button type="button" aria-label="Previous week"><Icon name="chevronLeft" /></button>
      <span id="studio-week-label">This week</span>
      <button type="button" aria-label="Next week"><Icon name="chevronRight" /></button>
    </div>
    <div className="studio-days">
      {DAYS.map((item, index) => <button type="button" key={`${item.day}-${item.date}`} className={`${item.state || ''} ${selected === index ? 'selected' : ''}`} onClick={() => setSelected(index)} aria-label={`${item.day} ${item.date}${item.state ? `, ${item.state}` : ''}`}>
        <span>{item.day}</span><b>{item.date}</b><i aria-hidden="true" />
      </button>)}
    </div>
  </section>
}

function TodaySession({ started, setStarted }) {
  return <section className="studio-session" aria-labelledby="studio-today-label">
    <button type="button" className="studio-session-main" onClick={() => setStarted(value => !value)}>
      <span className="studio-session-icon"><Icon name={started ? 'play' : 'dumbbell'} /></span>
      <span className="studio-session-copy"><small id="studio-today-label">Today</small><strong>{started ? 'Upper Strength (in progress)' : 'Upper Strength'}</strong><span>6 exercises · about 52 min</span></span>
      <span className="studio-start">{started ? 'Resume' : 'Start'} <Icon name="chevronRight" /></span>
    </button>
    <button type="button" className="studio-alternate"><Icon name="swap" /> Choose a different workout</button>
  </section>
}

function CheckIn() {
  return <button type="button" className="studio-checkin">
    <span className="studio-checkin-icon"><Icon name="qr" /></span>
    <span><small>At the gym</small><strong>Check in</strong></span>
    <span className="studio-checkin-action">Open pass <Icon name="chevronRight" /></span>
  </button>
}

function WeightCard({ logged, setLogged }) {
  return <section className="studio-weight" aria-labelledby="studio-weight-heading">
    <div className="studio-weight-head"><div><small>Tracking</small><h2 id="studio-weight-heading">Body weight</h2></div><div className="studio-weight-actions"><button type="button"><Icon name="target" /> 82.0</button><button type="button" onClick={() => setLogged(true)}><Icon name="plus" /> {logged ? 'Logged' : 'Log'}</button></div></div>
    <div className="studio-weight-reading"><strong>{logged ? '84.0' : '84.2'}<span> kg</span></strong><span className="studio-delta"><Icon name="arrowDown" /> {logged ? '0.2' : '0.4'}</span><time>Today</time></div>
    <div className="studio-goal"><Icon name="target" /><span>Goal 82.0 kg · {logged ? '2.0' : '2.2'} kg to lose</span></div>
    <div className="studio-chart" aria-label="Body weight trend over the last 30 days">
      <svg viewBox="0 0 500 128" role="img" aria-hidden="true" preserveAspectRatio="none">
        <defs><linearGradient id="studio-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".22"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
        <path className="grid" d="M0 20H500M0 64H500M0 108H500" />
        <path className="area" d="M0 35 C45 38 58 49 94 45 S145 55 180 58 S230 54 268 70 S320 72 353 84 S410 76 448 94 S480 90 500 98 L500 128 L0 128Z" />
        <path className="line" d="M0 35 C45 38 58 49 94 45 S145 55 180 58 S230 54 268 70 S320 72 353 84 S410 76 448 94 S480 90 500 98" />
        <circle cx="500" cy="98" r="4" />
      </svg>
    </div>
    <button type="button" className="studio-all">All weigh-ins <Icon name="chevronRight" /></button>
  </section>
}

function StreakCard() {
  return <button type="button" className="studio-streak">
    <span className="studio-streak-icon"><Icon name="flame" /></span>
    <span><strong>6 week streak</strong><small>2 / 4 this week · 38 workouts total</small></span>
    <span className="studio-streak-progress" aria-label="2 of 4 workouts this week"><i /><i /><i /><i /></span>
    <Icon name="calendar" />
  </button>
}

function StudioTabBar({ started, activeTab, setActiveTab }) {
  const tabs = [['home', 'Home'], ['calendar', 'Plan'], ['play', started ? 'Resume' : 'Start'], ['chart', 'Stats'], ['dumbbell', 'Exercises']]
  return <nav className="studio-tabs" aria-label="Primary navigation">
    {tabs.map(([icon, label]) => <button type="button" key={label} className={`${activeTab === label ? 'active' : ''} ${label === 'Start' || label === 'Resume' ? 'primary' : ''}`} onClick={() => setActiveTab(label)} aria-current={activeTab === label ? 'page' : undefined}><span><Icon name={icon} /></span><small>{label}</small></button>)}
  </nav>
}

function HomePrototype({ variation }) {
  const [selectedDay, setSelectedDay] = useState(2)
  const [started, setStarted] = useState(false)
  const [logged, setLogged] = useState(false)
  const [activeTab, setActiveTab] = useState('Home')

  return <div className={`studio-canvas studio-${variation}`}>
    <main className="studio-phone">
      <div className="studio-home-head">
        <div><span className="studio-eyebrow">Wednesday, October 28</span><h1>Hi Alex</h1><p>Ready for your next session?</p></div>
        <button type="button" aria-label="Settings"><Icon name="gear" /></button>
      </div>
      <WeekStrip selected={selectedDay} setSelected={setSelectedDay} />
      <TodaySession started={started} setStarted={setStarted} />
      <CheckIn />
      <WeightCard logged={logged} setLogged={setLogged} />
      <StreakCard />
      <StudioTabBar started={started} activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  </div>
}

export default function IronlogStudio() {
  const [variation, setVariation] = useState('precision')
  const current = VARIATIONS.find(item => item.id === variation)
  return <div className="ironlog-studio">
    <LabSwitcher active={variation} onChange={setVariation} />
    <div className="studio-caption"><span>Home exploration</span><strong>{current.number} — {current.name}</strong><span>Structure preserved · Visual system in progress</span></div>
    <HomePrototype key={variation} variation={variation} />
  </div>
}
