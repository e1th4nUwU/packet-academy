import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, CircleHelp, Clipboard, Download, FlaskConical, Home, Menu, Moon, Network, Play, Search, Settings, Sun, TerminalSquare, X } from 'lucide-react'
import { allLessons, modules, packets, quiz, type Lesson as LessonType } from './data'

type View = 'dashboard' | 'catalog' | 'lesson' | 'lab'
type Progress = { completed: string[]; xp: number }
const defaultProgress: Progress = { completed: [], xp: 0 }
const storageKey = 'packet-progress-v3'

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [dark, setDark] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [lessonId, setLessonId] = useState('what-is-wireshark')
  const [progress, setProgress] = useState<Progress>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '') } catch { return defaultProgress }
  })

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(progress)) }, [progress])
  useEffect(() => { window.scrollTo(0, 0) }, [view, lessonId])

  const openLesson = (id: string) => { setLessonId(id); setView('lesson'); setMobileNav(false) }
  const complete = (id: string, xp: number) => setProgress(p => p.completed.includes(id) ? p : { completed: [...p.completed, id], xp: p.xp + xp })
  const lesson = allLessons.find(item => item.id === lessonId) ?? allLessons[0]
  const nextIndex = allLessons.findIndex(item => item.id === lesson.id) + 1
  const nextLesson = allLessons[nextIndex]
  const completeLesson = () => { complete(lesson.id, lesson.xp); if (nextLesson) openLesson(nextLesson.id); else setView('dashboard') }
  const total = allLessons.length
  const percent = Math.round(progress.completed.length / total * 100)

  return <div className={dark ? 'app dark' : 'app'}>
    <aside className={mobileNav ? 'sidebar open' : 'sidebar'}>
      <button className="close-mobile" onClick={() => setMobileNav(false)}><X /></button>
      <button className="brand" onClick={() => setView('dashboard')}><span className="brand-mark"><Network /></span><span>PACKET<br/><b>ACADEMY</b></span></button>
      <nav>
        <NavItem icon={<Home />} label="Campaña" active={view === 'dashboard'} onClick={() => { setView('dashboard'); setMobileNav(false) }} />
        <NavItem icon={<BookOpen />} label="Curso completo" active={view === 'catalog' || view === 'lesson'} badge={String(total)} onClick={() => { setView('catalog'); setMobileNav(false) }} />
        <NavItem icon={<FlaskConical />} label="Laboratorios" active={view === 'lab'} badge="10" onClick={() => { setView('lab'); setMobileNav(false) }} />
        <NavItem icon={<TerminalSquare />} label="Field notes" />
      </nav>
      <div className="sidebar-bottom">
        <div className="rank"><span className="rank-number">{String(Math.floor(progress.xp / 200)).padStart(2, '0')}</span><div><small>RANGO ACTUAL</small><b>{progress.xp < 200 ? 'Packet Cadet' : progress.xp < 600 ? 'Frame Reader' : 'Protocol Analyst'}</b><div className="xp-line"><i style={{width: `${percent}%`}} /></div><em>{progress.completed.length} / {total} lecciones</em></div></div>
        <NavItem icon={<Settings />} label="Configuración" />
      </div>
    </aside>

    <main>
      <header><button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu /></button><button className="command" onClick={() => setView('catalog')}><Search /><span>Busca entre {total} lecciones…</span><kbd>⌘ K</kbd></button><div className="header-actions"><span className="streak"><b>{percent}%</b> completado</span><button className="icon-button" onClick={() => setDark(d => !d)}>{dark ? <Sun /> : <Moon />}</button><span className="avatar">CC</span></div></header>
      {view === 'dashboard' && <Dashboard openLesson={openLesson} setView={setView} progress={progress} percent={percent} />}
      {view === 'catalog' && <Catalog openLesson={openLesson} progress={progress} />}
      {view === 'lesson' && <Lesson lesson={lesson} done={progress.completed.includes(lesson.id)} moduleCompleted={modules.find(m => m.id === lesson.moduleId)?.lessons.filter(l => progress.completed.includes(l.id)).length ?? 0} onComplete={completeLesson} onCatalog={() => setView('catalog')} onSelect={openLesson} />}
      {view === 'lab' && <Lab onComplete={() => complete('lab-retransmission', 150)} done={progress.completed.includes('lab-retransmission')} />}
    </main>
  </div>
}

function NavItem({ icon, label, active, badge, onClick }: { icon: React.ReactNode; label: string; active?: boolean; badge?: string; onClick?: () => void }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span>{badge && <small>{badge}</small>}</button> }

function Dashboard({ openLesson, setView, progress, percent }: { openLesson: (id:string)=>void; setView:(v:View)=>void; progress:Progress; percent:number }) {
  const next = allLessons.find(item => !progress.completed.includes(item.id)) ?? allLessons[0]
  const nextModule = modules.find(m => m.id === next.moduleId) ?? modules[0]
  return <div className="page dashboard">
    <section className="hero"><div className="hero-copy"><span className="eyebrow">// CURSO COMPLETO · DESDE CERO</span><h1>Aprende a ver<br/><em>lo que la red dice.</em></h1><p>Empieza con qué es Wireshark y termina investigando performance e incidentes. {allLessons.length} lecciones, 10 laboratorios y una ruta sin saltos bruscos.</p><div className="hero-actions"><button className="primary" onClick={() => openLesson(next.id)}><Play /> {progress.completed.length ? 'Continuar curso' : 'Empezar desde cero'}</button><button className="secondary" onClick={() => setView('catalog')}>Explorar temario <ArrowRight /></button></div></div>
      <div className="radar-card course-overview"><div className="big-progress"><b>{percent}%</b><span>PROGRESO TOTAL</span></div><div className="radar-stats"><span><small>MÓDULOS</small><b>10</b></span><span><small>LECCIONES</small><b>{allLessons.length}</b></span><span><small>LABS</small><b>10</b></span></div></div></section>
    <section className="continue-card"><div className="lesson-number">{next.number.split('.')[0]}</div><div><span className="eyebrow">{progress.completed.length ? 'SIGUIENTE LECCIÓN' : 'COMIENZA AQUÍ'}</span><h3>{next.title}</h3><p>{next.summary}</p></div><div className="continue-progress"><span><b>{nextModule.lessons.filter(l => progress.completed.includes(l.id)).length}</b> / {nextModule.lessons.length} en este módulo</span><div><i style={{ width: `${nextModule.lessons.filter(l => progress.completed.includes(l.id)).length / nextModule.lessons.length * 100}%` }} /></div><button onClick={() => openLesson(next.id)}><ChevronRight /></button></div></section>
    <div className="section-heading"><div><span className="eyebrow">RUTA COMPLETA</span><h2>De cero a analista de paquetes</h2></div><span>{progress.completed.length} de {allLessons.length} completadas</span></div>
    <section className="module-grid course-grid">{modules.map(module => { const Icon=module.icon; const complete=module.lessons.filter(l=>progress.completed.includes(l.id)).length; return <article className="module-card" key={module.id} onClick={()=>openLesson(module.lessons[0].id)}><div className="module-top"><span>{module.id}</span><Icon /></div><span className="eyebrow">{module.eyebrow}</span><h3>{module.title}</h3><p>{module.description}</p><div className="module-meta"><span>{complete}/{module.lessons.length} lecciones</span><span>Lab · {module.lab}</span></div></article>})}</section>
  </div>
}

function Catalog({ openLesson, progress }: { openLesson:(id:string)=>void; progress:Progress }) {
  const [query,setQuery]=useState('')
  const matches=(lesson:LessonType)=>`${lesson.title} ${lesson.summary}`.toLowerCase().includes(query.toLowerCase())
  return <div className="page catalog-page"><div className="catalog-hero"><span className="eyebrow">PROGRAMA COMPLETO</span><h1>Tu ruta de aprendizaje</h1><p>10 módulos progresivos: fundamentos, captura, protocolos, troubleshooting y forense.</p><label className="catalog-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar: DNS, filtros, TCP, TLS…"/></label></div>
    <div className="curriculum">{modules.map(module=>{const Icon=module.icon;const visible=module.lessons.filter(matches);if(!visible.length)return null;const count=module.lessons.filter(l=>progress.completed.includes(l.id)).length;return <section className="curriculum-module" key={module.id}><div className="curriculum-heading"><span className="module-icon"><Icon/></span><div><span className="eyebrow">MÓDULO {module.id} · {module.eyebrow}</span><h2>{module.title}</h2><p>{module.description}</p></div><span className="module-count">{count}/{module.lessons.length}</span></div><div className="lesson-list">{visible.map(item=><button key={item.id} onClick={()=>openLesson(item.id)} className={progress.completed.includes(item.id)?'done':''}><span className="lesson-status">{progress.completed.includes(item.id)?<Check/>:item.number}</span><span><b>{item.title}</b><small>{item.summary}</small></span><em>{item.minutes} min · {item.xp} XP</em><ChevronRight/></button>)}</div><div className="module-lab"><FlaskConical/><span><small>LABORATORIO DEL MÓDULO</small><b>{module.lab}</b></span></div></section>})}</div>
  </div>
}

function Lesson({ lesson, done, moduleCompleted, onComplete, onCatalog, onSelect }: { lesson: typeof allLessons[number]; done:boolean; moduleCompleted:number; onComplete:()=>void; onCatalog:()=>void; onSelect:(id:string)=>void }) {
  const [copied,setCopied]=useState('')
  const module=modules.find(m=>m.id===lesson.moduleId)!
  const copy=(value:string)=>{navigator.clipboard.writeText(value);setCopied(value);setTimeout(()=>setCopied(''),1200)}
  return <div className="page lesson-page"><button className="back" onClick={onCatalog}><ArrowLeft/> Módulo {module.id} · {module.title}</button><div className="lesson-layout"><article className="lesson-content"><span className="eyebrow">LECCIÓN {lesson.number} · {lesson.minutes} MIN · +{lesson.xp} XP</span><h1>{lesson.title}</h1><p className="lead">{lesson.summary}</p><div className="learning-objectives"><span>OBJETIVOS</span>{lesson.objectives.map(x=><p key={x}><Check/>{x}</p>)}</div>
    {lesson.blocks.map((block,i)=>{
      if(block.type==='text')return <section key={i}>{block.title&&<h2>{block.title}</h2>}<p>{block.body}</p></section>
      if(block.type==='callout')return <div className="callout" key={i}><CircleHelp/><div><b>{block.title}</b><p>{block.body}</p></div></div>
      if(block.type==='code')return <button className="filter-box" key={i} onClick={()=>copy(block.value)}><span><small>{block.label}</small><code>{block.value}</code></span>{copied===block.value?<Check/>:<Clipboard/>}</button>
      return <div className="checklist" key={i}><h3>{block.title}</h3>{block.items.map(x=><p key={x}><Check/>{x}</p>)}</div>
    })}
    <div className="lesson-complete"><button className="primary" onClick={onComplete}>{done?'Siguiente lección':'Marcar completa y continuar'} <ArrowRight/></button><small>{done?'Esta lección ya está completada.':'El progreso se guarda en este navegador.'}</small></div></article>
    <aside className="lesson-index"><span className="eyebrow">MÓDULO {module.id}</span>{module.lessons.map(item=><button key={item.id} onClick={()=>onSelect(item.id)} className={item.id===lesson.id?'active':''}>{item.number} · {item.title}</button>)}<hr/><span className="eyebrow">PROGRESO DEL MÓDULO</span><div className={`circle-progress ${moduleCompleted ? 'complete':''}`}>{Math.round(moduleCompleted/module.lessons.length*100)}%</div><small>{moduleCompleted} de {module.lessons.length} lecciones</small></aside></div></div>
}

function Lab({ onComplete, done }: { onComplete:()=>void; done:boolean }) {
  const [step,setStep]=useState(0);const [selected,setSelected]=useState<number|null>(null);const [answered,setAnswered]=useState<number[]>([]);const [hint,setHint]=useState(false);const current=quiz[step]
  const choose=(i:number)=>{setSelected(i);if(i===current.correct)setAnswered(a=>[...a.filter(x=>x!==step),step])}
  const next=()=>{if(step<quiz.length-1){setStep(s=>s+1);setSelected(null);setHint(false)}else onComplete()}
  return <div className="page lab-page"><div className="lab-header"><div><span className="eyebrow">LAB 05 · TCP BAJO EL MICROSCOPIO</span><h1>La retransmisión impostora</h1><p>Este caso pertenece al módulo 05. Puedes explorarlo ahora, pero la ruta recomienda completar primero los fundamentos.</p></div><div className="lab-score"><b>{answered.length}/{quiz.length}</b><span>evidencias</span></div></div><div className="lab-layout"><section className="packet-panel"><div className="panel-title"><span><i/> incident-05.pcapng</span><span>7 paquetes · muestra didáctica</span></div><div className="packet-head"><span>No.</span><span>Time</span><span>Source → Destination</span><span>Info</span></div>{packets.map(p=><div className={`packet-row ${p.kind}`} key={p.frame}><span>{p.frame}</span><span>{p.time}</span><span>{p.source} → {p.destination}</span><span>{p.info}</span></div>)}<div className="packet-footer"><code>tcp.stream == 0</code><button><Clipboard/></button></div></section><aside className="investigation"><div className="case-tabs"><button className="active">Investigar</button><button>Notas</button></div><span className="eyebrow">EVIDENCIA {step+1} DE {quiz.length}</span><h2>{current.question}</h2><div className="answers">{current.answers.map((a,i)=><button key={a} className={selected===i?(i===current.correct?'correct':'wrong'):''} onClick={()=>choose(i)}><span>{String.fromCharCode(65+i)}</span>{a}{selected===i&&(i===current.correct?<Check/>:<X/>)}</button>)}</div>{selected!==null&&<div className={selected===current.correct?'feedback success':'feedback'}><b>{selected===current.correct?'Evidencia confirmada':'Todavía no'}</b><p>{selected===current.correct?current.explanation:'Mira los tiempos y piensa si TCP podría reaccionar tan rápido.'}</p></div>}<button className="hint" onClick={()=>setHint(h=>!h)}><CircleHelp/> {hint?'Una reacción de TCP necesita retorno o un temporizador.':'Solicitar pista'}</button><button className="primary lab-next" disabled={selected!==current.correct} onClick={next}>{step===quiz.length-1?(done?'Completado':'Cerrar caso · +150 XP'):'Siguiente evidencia'} <ArrowRight/></button></aside></div><div className="lab-tools"><div><Download/><span><b>PCAP de práctica</b><small>Muestra guiada incluida.</small></span></div><div><TerminalSquare/><span><b>Filtro de arranque</b><code>tcp.analysis.retransmission</code></span></div></div></div>
}

export default App
