import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, CircleHelp, Clipboard, Download, FlaskConical, Home, Menu, Moon, Network, Play, Search, Settings, Sun, TerminalSquare, X } from 'lucide-react'
import { badges, modules, packets, quiz } from './data'

type View = 'dashboard' | 'lesson' | 'lab'
type Progress = { completed: string[]; xp: number }

const defaultProgress: Progress = { completed: [], xp: 120 }

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [dark, setDark] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [progress, setProgress] = useState<Progress>(() => {
    try { return JSON.parse(localStorage.getItem('packet-progress') || '') } catch { return defaultProgress }
  })

  useEffect(() => localStorage.setItem('packet-progress', JSON.stringify(progress)), [progress])
  useEffect(() => window.scrollTo(0, 0), [view])

  const complete = (id: string, xp: number) => setProgress(p => p.completed.includes(id) ? p : { completed: [...p.completed, id], xp: p.xp + xp })

  return <div className={dark ? 'app dark' : 'app'}>
    <aside className={mobileNav ? 'sidebar open' : 'sidebar'}>
      <button className="close-mobile" onClick={() => setMobileNav(false)}><X /></button>
      <button className="brand" onClick={() => setView('dashboard')}><span className="brand-mark"><Network /></span><span>PACKET<br/><b>ACADEMY</b></span></button>
      <nav>
        <NavItem icon={<Home />} label="Campaña" active={view === 'dashboard'} onClick={() => { setView('dashboard'); setMobileNav(false) }} />
        <NavItem icon={<BookOpen />} label="Lecciones" active={view === 'lesson'} onClick={() => { setView('lesson'); setMobileNav(false) }} />
        <NavItem icon={<FlaskConical />} label="Laboratorios" active={view === 'lab'} badge="01" onClick={() => { setView('lab'); setMobileNav(false) }} />
        <NavItem icon={<TerminalSquare />} label="Field notes" />
      </nav>
      <div className="sidebar-bottom">
        <div className="rank"><span className="rank-number">03</span><div><small>RANGO ACTUAL</small><b>Packet Scout</b><div className="xp-line"><i style={{width: `${Math.min(100, progress.xp / 5)}%`}} /></div><em>{progress.xp} / 500 XP</em></div></div>
        <NavItem icon={<Settings />} label="Configuración" />
      </div>
    </aside>

    <main>
      <header>
        <button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu /></button>
        <div className="command"><Search /><span>Busca filtros, conceptos o labs…</span><kbd>⌘ K</kbd></div>
        <div className="header-actions"><span className="streak">⚡ <b>4</b> días</span><button className="icon-button" onClick={() => setDark(d => !d)}>{dark ? <Sun /> : <Moon />}</button><span className="avatar">CC</span></div>
      </header>
      {view === 'dashboard' && <Dashboard setView={setView} progress={progress} />}
      {view === 'lesson' && <Lesson onComplete={() => { complete('tcp-truth', 80); setView('lab') }} done={progress.completed.includes('tcp-truth')} />}
      {view === 'lab' && <Lab onComplete={() => complete('lab-retransmission', 150)} done={progress.completed.includes('lab-retransmission')} />}
    </main>
  </div>
}

function NavItem({ icon, label, active, badge, onClick }: { icon: React.ReactNode; label: string; active?: boolean; badge?: string; onClick?: () => void }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span>{badge && <small>{badge}</small>}</button>
}

function Dashboard({ setView, progress }: { setView: (v: View) => void; progress: Progress }) {
  return <div className="page dashboard">
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow">// SESIÓN ACTIVA · TRACK 01</span><h1>Lee la red.<br/><em>Encuentra la verdad.</em></h1><p>No adivines qué pasó. Reconstrúyelo paquete por paquete y defiende cada conclusión con evidencia.</p><div className="hero-actions"><button className="primary" onClick={() => setView('lesson')}><Play /> Continuar misión</button><button className="secondary" onClick={() => setView('lab')}>Abrir laboratorio <ArrowRight /></button></div></div>
      <div className="radar-card"><div className="radar"><span className="sweep"/><i className="dot one"/><i className="dot two"/><i className="dot three"/><Network /></div><div className="live"><i/> CAPTURE READY</div><div className="radar-stats"><span><small>PAQUETES</small><b>12,847</b></span><span><small>PROTOCOLOS</small><b>18</b></span><span><small>ANOMALÍAS</small><b className="amber">03</b></span></div></div>
    </section>

    <section className="continue-card"><div className="lesson-number">02</div><div><span className="eyebrow">CONTINUAR DONDE LO DEJASTE</span><h3>TCP bajo presión</h3><p>Retransmission ≠ packet loss. Aprende a reconocer cuando la captura te está engañando.</p></div><div className="continue-progress"><span><b>3</b> / 7 lecciones</span><div><i /></div><button onClick={() => setView('lesson')}><ChevronRight /></button></div></section>

    <div className="section-heading"><div><span className="eyebrow">RUTA DE APRENDIZAJE</span><h2>Tu campaña</h2></div><span>{progress.completed.length} hitos completados</span></div>
    <section className="module-grid">{modules.map((module, index) => { const Icon = module.icon; return <article className={`module-card ${module.state}`} key={module.id} onClick={() => module.state !== 'locked' && setView(index === 1 ? 'lesson' : 'lab')}><div className="module-top"><span>{module.id}</span><Icon /></div><span className="eyebrow">{module.eyebrow}</span><h3>{module.title}</h3><p>{module.description}</p><div className="module-meta"><span>{module.lessons} lecciones</span><span>~{module.minutes} min</span></div>{module.state === 'locked' && <div className="locked-label">Bloqueado</div>}</article>})}</section>

    <section className="lower-grid"><div><div className="section-heading"><div><span className="eyebrow">LOGROS</span><h2>Insignias de campo</h2></div></div><div className="badges">{badges.map(({icon: Icon, label}, i) => <div className={i === 2 ? 'badge locked' : 'badge'} key={label}><span><Icon /></span><b>{label}</b></div>)}</div></div><div className="daily"><span className="eyebrow">RETO RÁPIDO · +25 XP</span><h3>¿Qué filtro usarías?</h3><p>Encuentra SYN enviados que nunca recibieron un SYN/ACK.</p><code>tcp.flags.syn == 1</code><button onClick={() => setView('lab')}>Resolver reto <ArrowRight /></button></div></section>
  </div>
}

function Lesson({ onComplete, done }: { onComplete: () => void; done: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText('tcp.analysis.retransmission'); setCopied(true); setTimeout(() => setCopied(false), 1200) }
  return <div className="page lesson-page">
    <button className="back" onClick={() => history.back()}><ArrowLeft /> Módulo 02 · TCP bajo presión</button>
    <div className="lesson-layout"><article className="lesson-content"><span className="eyebrow">LECCIÓN 04 · 12 MIN</span><h1>Wireshark no siempre dice la verdad</h1><p className="lead">La etiqueta <code>TCP Retransmission</code> es una inferencia basada únicamente en lo que Wireshark alcanzó a observar.</p>
      <div className="callout"><CircleHelp /><div><b>Principio del analista</b><p>Una etiqueta de análisis es una pista, no una conclusión. Pregunta siempre: “¿desde dónde fue tomada esta captura?”</p></div></div>
      <h2>El problema del punto de observación</h2><p>Wireshark mantiene estado por flujo. Si observa el mismo rango de secuencia dos veces, marca la segunda aparición como retransmisión. Pero no sabe si el segmento se perdió, fue duplicado por un SPAN o apareció dos veces debido al offloading del host.</p>
      <div className="flow-diagram"><div><span>CLIENTE</span><b>10.20.0.8</b></div><div className="flow-lines"><i><small>Seq=1 Len=1460</small>→</i><i className="warning"><small>Seq=1 Len=1460</small>→</i></div><div><span>SERVIDOR</span><b>10.20.0.21</b></div></div>
      <h2>Usa el tiempo como evidencia</h2><p>Una repetición a cientos de microsegundos del original rara vez puede deberse a un RTO. Correlaciona delta time, ACK acumulativo y, si existe, una captura en otro punto.</p>
      <button className="filter-box" onClick={copy}><span><small>DISPLAY FILTER</small><code>tcp.analysis.retransmission</code></span>{copied ? <Check /> : <Clipboard />}</button>
      <div className="checklist"><h3>Antes de declarar packet loss</h3>{['Comprueba el delta entre original y supuesto reenvío','Busca ACK acumulativos y SACK','Descarta duplicación del SPAN','Considera checksum y segmentation offloading','Compara otro punto de captura'].map(x => <p key={x}><Check />{x}</p>)}</div>
      <button className="primary lesson-next" onClick={onComplete}>{done ? 'Reabrir laboratorio' : 'Completar y abrir laboratorio'} <ArrowRight /></button>
    </article><aside className="lesson-index"><span className="eyebrow">EN ESTA LECCIÓN</span><a className="active">La etiqueta es una hipótesis</a><a>Punto de observación</a><a>Tiempo como evidencia</a><a>Checklist del analista</a><hr/><span className="eyebrow">TU PROGRESO</span><div className="circle-progress">57%</div><small>4 de 7 lecciones</small></aside></div>
  </div>
}

function Lab({ onComplete, done }: { onComplete: () => void; done: boolean }) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState<number[]>([])
  const [hint, setHint] = useState(false)
  const current = quiz[step]
  const choose = (i: number) => { setSelected(i); if (i === current.correct) setAnswered(a => [...a.filter(x => x !== step), step]) }
  const next = () => { if (step < quiz.length - 1) { setStep(s => s + 1); setSelected(null); setHint(false) } else { onComplete() } }
  return <div className="page lab-page"><div className="lab-header"><div><span className="eyebrow">LAB 01 · DIFICULTAD INTERMEDIA</span><h1>La retransmisión impostora</h1><p>El NOC reporta 30% de pérdida. Tu misión es decidir si la red es culpable.</p></div><div className="lab-score"><b>{answered.length}/{quiz.length}</b><span>evidencias</span></div></div>
    <div className="lab-layout"><section className="packet-panel"><div className="panel-title"><span><i/> incident-01.pcapng</span><span>7 paquetes · muestra didáctica</span></div><div className="packet-head"><span>No.</span><span>Time</span><span>Source → Destination</span><span>Info</span></div>{packets.map(p => <div className={`packet-row ${p.kind}`} key={p.frame}><span>{p.frame}</span><span>{p.time}</span><span>{p.source} → {p.destination}</span><span>{p.info}</span></div>)}<div className="packet-footer"><code>tcp.stream == 0</code><button><Clipboard /></button></div></section>
      <aside className="investigation"><div className="case-tabs"><button className="active">Investigar</button><button>Notas</button></div><span className="eyebrow">EVIDENCIA {step + 1} DE {quiz.length}</span><h2>{current.question}</h2><div className="answers">{current.answers.map((a, i) => <button key={a} className={selected === i ? (i === current.correct ? 'correct' : 'wrong') : ''} onClick={() => choose(i)}><span>{String.fromCharCode(65+i)}</span>{a}{selected === i && (i === current.correct ? <Check /> : <X />)}</button>)}</div>{selected !== null && <div className={selected === current.correct ? 'feedback success' : 'feedback'}><b>{selected === current.correct ? 'Evidencia confirmada' : 'Todavía no'}</b><p>{selected === current.correct ? current.explanation : 'Mira los tiempos y piensa si TCP podría reaccionar tan rápido.'}</p></div>}
        <button className="hint" onClick={() => setHint(h => !h)}><CircleHelp /> {hint ? 'Una reacción de TCP necesita información de retorno o un temporizador.' : 'Solicitar pista'}</button><button className="primary lab-next" disabled={selected !== current.correct} onClick={next}>{step === quiz.length - 1 ? (done ? 'Completado' : 'Cerrar caso · +150 XP') : 'Siguiente evidencia'} <ArrowRight /></button>
      </aside></div>
    <div className="lab-tools"><div><Download/><span><b>PCAP de práctica</b><small>La muestra completa se incorporará en el siguiente caso generado.</small></span></div><div><TerminalSquare/><span><b>Filtro de arranque</b><code>tcp.analysis.retransmission || tcp.analysis.duplicate_ack</code></span></div></div>
  </div>
}

export default App
