import { Activity, Binary, Crosshair, Gauge, LockKeyhole, Radar, ShieldCheck } from 'lucide-react'

export const modules = [
  { id: '01', title: 'Flujo de investigación', eyebrow: 'Workflow', description: 'De síntoma ambiguo a evidencia defendible.', lessons: 4, minutes: 42, icon: Crosshair, state: 'active' },
  { id: '02', title: 'TCP bajo presión', eyebrow: 'Deep dive', description: 'ACK, SACK, ventanas, resets y retransmisiones.', lessons: 7, minutes: 95, icon: Activity, state: 'active' },
  { id: '03', title: 'La captura miente', eyebrow: 'Capture craft', description: 'Offloading, SPAN, asimetría y packet loss.', lessons: 6, minutes: 80, icon: Binary, state: 'next' },
  { id: '04', title: 'Performance', eyebrow: 'Troubleshooting', description: 'Latencia, throughput y tiempos de aplicación.', lessons: 8, minutes: 110, icon: Gauge, state: 'locked' },
  { id: '05', title: 'Network forensics', eyebrow: 'Investigation', description: 'Beaconing, DNS tunneling y timelines.', lessons: 9, minutes: 135, icon: Radar, state: 'locked' },
]

export const packets = [
  { frame: 41, time: '0.000', source: '10.20.0.8', destination: '10.20.0.21', info: '51944 → 443 [SYN] Seq=0 Win=64240', kind: 'syn' },
  { frame: 42, time: '0.021', source: '10.20.0.21', destination: '10.20.0.8', info: '443 → 51944 [SYN, ACK] Seq=0 Ack=1', kind: 'syn' },
  { frame: 43, time: '0.021', source: '10.20.0.8', destination: '10.20.0.21', info: '51944 → 443 [ACK] Seq=1 Ack=1', kind: 'ack' },
  { frame: 51, time: '0.035', source: '10.20.0.8', destination: '10.20.0.21', info: 'TLS Application Data Len=1460 Seq=1', kind: 'data' },
  { frame: 52, time: '0.035', source: '10.20.0.8', destination: '10.20.0.21', info: '[TCP Retransmission] Seq=1 Len=1460', kind: 'warn' },
  { frame: 53, time: '0.036', source: '10.20.0.8', destination: '10.20.0.21', info: '[TCP Retransmission] Seq=1461 Len=1460', kind: 'warn' },
  { frame: 54, time: '0.036', source: '10.20.0.21', destination: '10.20.0.8', info: '443 → 51944 [ACK] Ack=4381', kind: 'ack' },
]

export const quiz = [
  { question: '¿Qué detalle contradice una retransmisión causada por RTO?', answers: ['El puerto destino es 443', 'Ocurre solo 0.0004 s después', 'El receptor anuncia una ventana', 'El segmento contiene TLS'], correct: 1, explanation: 'Un RTO no expira en 0.4 ms. La cercanía temporal apunta a duplicación/offloading o al punto de captura.' },
  { question: '¿Qué evidencia es más fuerte antes de culpar a la red?', answers: ['El color negro de Wireshark', 'El contador total de paquetes', 'Una captura simultánea en otro punto', 'El tamaño del archivo PCAP'], correct: 2, explanation: 'Una segunda captura permite comprobar si los segmentos se duplicaron en tránsito o únicamente en el punto de observación.' },
  { question: 'El ACK 4381 confirma que…', answers: ['faltan exactamente tres segmentos', 'el receptor aceptó bytes hasta 4380', 'el handshake falló', 'TLS está roto'], correct: 1, explanation: 'TCP usa ACK acumulativo: Ack=4381 indica que el siguiente byte esperado es 4381.' },
]

export const badges = [
  { icon: ShieldCheck, label: 'Evidence first' },
  { icon: Activity, label: 'TCP apprentice' },
  { icon: LockKeyhole, label: 'PCAP whisperer' },
]
