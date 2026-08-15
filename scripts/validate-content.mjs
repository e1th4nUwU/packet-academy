import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync('src/data.ts', 'utf8')
const lessonIds = [...source.matchAll(/lesson\('([^']+)'/g)].map(match => match[1])
const guideStart = source.indexOf('const guides')
const guideEnd = source.indexOf('const guideBlocks')
const guideSource = source.slice(guideStart, guideEnd)
const guideIds = new Set([...guideSource.matchAll(/^  '([^']+)': \{/gm)].map(match => match[1]))
const inlineIds = new Set([
  'what-is-wireshark','capture-model','safe-setup','interface-tour','first-capture','pcap-files',
  'frame-anatomy','ethernet','vlan-arp','ip-fields','transport','encapsulation',
])
const missing = lessonIds.filter(id => !inlineIds.has(id) && !guideIds.has(id))
if (lessonIds.length !== 61) throw new Error(`Se esperaban 61 lecciones; se encontraron ${lessonIds.length}`)
if (missing.length) throw new Error(`Lecciones sin contenido: ${missing.join(', ')}`)
if (/Contenido en desarrollo|Por qué importa[\s\S]*Mentalidad del analista/.test(source)) throw new Error('Se encontró contenido placeholder')
for (let number = 1; number <= 10; number += 1) {
  const file = path.join('public', 'captures', `lab-${String(number).padStart(2, '0')}.pcap`)
  if (!fs.existsSync(file)) throw new Error(`Falta ${file}`)
  const data = fs.readFileSync(file)
  if (data.length < 24 || data.readUInt32LE(0) !== 0xa1b2c3d4) throw new Error(`PCAP inválido: ${file}`)
}
console.log('✓ 61 lecciones redactadas; 10 PCAP de laboratorio presentes')
