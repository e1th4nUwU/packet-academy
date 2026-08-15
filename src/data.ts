import { Activity, Binary, Compass, Filter, Gauge, Globe2, Layers3, Radar, SearchCheck, ShieldCheck } from 'lucide-react'

export type LessonBlock =
  | { type: 'text'; title?: string; body: string }
  | { type: 'callout'; title: string; body: string }
  | { type: 'code'; label: string; value: string }
  | { type: 'checklist'; title: string; items: string[] }

export type Lesson = {
  id: string
  number: string
  title: string
  summary: string
  minutes: number
  xp: number
  objectives: string[]
  blocks: LessonBlock[]
}

export type CourseModule = {
  id: string
  title: string
  eyebrow: string
  description: string
  icon: typeof Compass
  lessons: Lesson[]
  lab?: string
}

const lesson = (id: string, number: string, title: string, summary: string, objectives: string[], blocks?: LessonBlock[], minutes = 12): Lesson => ({
  id, number, title, summary, objectives, minutes, xp: 40,
  blocks: blocks ?? [
    { type: 'text', title: 'Por qué importa', body: summary },
    { type: 'callout', title: 'Mentalidad del analista', body: 'Describe primero lo que observas. Después formula una hipótesis y busca evidencia que pueda refutarla.' },
    { type: 'checklist', title: 'Al terminar podrás', items: objectives },
  ],
})

export const modules: CourseModule[] = [
  {
    id: '01', title: 'Conoce Wireshark', eyebrow: 'Fundamentos', icon: Compass,
    description: 'Qué es, cómo observa la red y cómo preparar un entorno seguro.', lab: 'Tu primera captura',
    lessons: [
      lesson('what-is-wireshark', '01.01', '¿Qué es Wireshark?', 'Wireshark es un analizador de protocolos: captura o abre tráfico y convierte bytes en estructuras que podemos investigar.',
        ['Explicar la diferencia entre capturar y analizar', 'Identificar un caso apropiado para Wireshark', 'Reconocer sus límites'], [
          { type: 'text', title: 'Un microscopio para la red', body: 'Wireshark recibe tramas desde una interfaz o un archivo y aplica disectores: piezas de software que interpretan Ethernet, IP, TCP, DNS, TLS y miles de protocolos. No “arregla Internet” ni adivina la causa; presenta evidencia para que tú construyas una explicación.' },
          { type: 'callout', title: 'Captura ≠ realidad completa', body: 'Un PCAP contiene lo que llegó al punto de observación. Si un paquete no aparece, pudo perderse en la red, quedar fuera del filtro o nunca ser visible desde ese punto.' },
          { type: 'text', title: 'Tres trabajos distintos', body: 'Capturar obtiene paquetes. Diseccionar interpreta sus campos. Analizar relaciona esos campos con tiempo, contexto y comportamiento. Wireshark ayuda muchísimo con los dos primeros; el tercero sigue siendo tu trabajo.' },
          { type: 'checklist', title: 'Wireshark es excelente para', items: ['Validar handshakes y secuencias', 'Medir tiempos entre eventos', 'Inspeccionar protocolos', 'Reconstruir conversaciones', 'Sustentar un reporte con frames concretos'] },
          { type: 'checklist', title: 'Wireshark no puede por sí solo', items: ['Ver tráfico que no cruza el punto de captura', 'Descifrar TLS sin secretos adecuados', 'Probar automáticamente que “la red” es culpable', 'Recuperar paquetes omitidos por una captura saturada'] },
        ], 14),
      lesson('capture-model', '01.02', 'Qué ve —y qué no ve— una captura', 'Tu ubicación, interfaz, offloading, cifrado y filtros determinan el universo observable.',
        ['Definir punto de observación', 'Detectar visibilidad incompleta', 'Separar ausencia de evidencia de evidencia de ausencia'], [
          { type: 'text', title: 'El punto de observación', body: 'Capturar en el cliente muestra la experiencia del cliente. Un SPAN puede mostrar ambos sentidos, duplicarlos o perderlos bajo carga. Una captura en el servidor ofrece otra perspectiva. Dos PCAP simultáneos permiten medir tránsito y localizar pérdida.' },
          { type: 'text', title: 'La analogía de la cámara', body: 'Una cámara en una puerta demuestra quién cruzó esa puerta, no quién entró por otra. De la misma forma, un PCAP solo demuestra lo ocurrido donde y cuando capturaste.' },
          { type: 'callout', title: 'Regla de oro', body: 'Documenta siempre interfaz, ubicación, hora, filtro, snap length y quién inició/detuvo la captura.' },
          { type: 'checklist', title: 'Fuentes de puntos ciegos', items: ['Tráfico conmutado no destinado a tu host', 'Rutas asimétricas', 'VLAN no espejada', 'Capture filter demasiado restrictivo', 'Paquetes descartados por el capturador', 'Cifrado de aplicación'] },
        ], 16),
      lesson('safe-setup', '01.03', 'Instalación, permisos y captura ética', 'Prepara Wireshark sin ejecutar toda la interfaz con privilegios elevados.',
        ['Verificar instalación', 'Entender Dumpcap y permisos', 'Aplicar límites éticos y de privacidad'], [
          { type: 'text', title: 'Separación de privilegios', body: 'Wireshark delega la captura a Dumpcap. En Linux conviene otorgar capacidad al componente de captura o usar el grupo wireshark; no ejecutar toda la GUI como root. Windows usa Npcap y macOS instala un helper de permisos.' },
          { type: 'code', label: 'VERIFICAR HERRAMIENTAS', value: 'wireshark --version\ntshark --version\ndumpcap -D' },
          { type: 'callout', title: 'Privacidad', body: 'Un PCAP puede contener dominios, nombres internos, cookies, tokens, mensajes o credenciales. Captura solamente sistemas autorizados y revisa el archivo antes de compartirlo.' },
          { type: 'checklist', title: 'Checklist del entorno', items: ['Wireshark abre sin privilegios elevados', 'Dumpcap enumera interfaces', 'Existe una carpeta separada para PCAP', 'La hora del sistema está sincronizada', 'Conoces el alcance autorizado'] },
        ], 18),
      lesson('interface-tour', '01.04', 'Tour por la interfaz', 'Domina las tres vistas principales sin perderte entre cientos de campos.',
        ['Usar Packet List, Details y Bytes', 'Personalizar columnas', 'Relacionar selección y resaltado'], [
          { type: 'text', title: 'Tres paneles, una misma evidencia', body: 'Packet List resume cada frame. Packet Details presenta capas y campos disectados. Packet Bytes muestra el contenido original y resalta los bytes correspondientes al campo seleccionado.' },
          { type: 'text', title: 'Navegación eficiente', body: 'Haz clic en un campo para localizar sus bytes; clic derecho permite aplicar ese campo como filtro, agregarlo como columna o copiar su valor. La barra de estado indica paquetes mostrados, descartados y perfil activo.' },
          { type: 'code', label: 'PRIMER DISPLAY FILTER', value: 'dns || tcp.flags.syn == 1' },
          { type: 'checklist', title: 'Personaliza desde el principio', items: ['Columna Delta time displayed', 'Columna TCP stream', 'Resolución de nombres bajo demanda', 'Perfil separado para troubleshooting'] },
        ], 15),
      lesson('first-capture', '01.05', 'Tu primera captura controlada', 'Genera tráfico conocido, captura poco tiempo y verifica cada evento.',
        ['Elegir la interfaz correcta', 'Iniciar/detener una captura', 'Relacionar una acción con sus paquetes'], [
          { type: 'text', title: 'Reduce la incertidumbre', body: 'Empieza una captura, genera una sola acción conocida —por ejemplo una consulta DNS— y deténla. Anota la hora. Un experimento pequeño enseña más que abrir diez minutos de ruido sin contexto.' },
          { type: 'code', label: 'TRÁFICO CONTROLADO', value: 'nslookup example.com\ncurl -I https://example.com' },
          { type: 'code', label: 'FILTRO PARA ENCONTRARLO', value: 'dns.qry.name == "example.com" || tls.handshake.extensions_server_name == "example.com"' },
          { type: 'checklist', title: 'Evidencia que debes localizar', items: ['Consulta DNS', 'Respuesta DNS', 'SYN / SYN-ACK / ACK', 'Client Hello de TLS', 'Nombre SNI si está disponible'] },
        ], 20),
      lesson('pcap-files', '01.06', 'PCAP, PCAPNG y metadatos', 'Aprende qué conserva cada formato y cómo inspeccionarlo antes de abrir archivos grandes.',
        ['Diferenciar PCAP y PCAPNG', 'Usar Capinfos', 'Conservar integridad y contexto'], [
          { type: 'text', title: 'Dos contenedores', body: 'PCAP es simple y ampliamente compatible. PCAPNG admite múltiples interfaces, comentarios, estadísticas y metadatos adicionales. Para trabajos nuevos suele ser la mejor opción.' },
          { type: 'code', label: 'TRIAGE SIN ABRIR LA GUI', value: 'capinfos capture.pcapng\ntshark -r capture.pcapng -q -z io,phs' },
          { type: 'callout', title: 'Preserva el original', body: 'Trabaja sobre una copia, calcula un hash y documenta toda transformación con Editcap o Mergecap.' },
          { type: 'checklist', title: 'Ficha mínima de una captura', items: ['Hash SHA-256', 'Inicio y duración', 'Número de paquetes', 'Interfaces', 'Capture filter y snap length', 'Zona horaria y responsable'] },
        ], 14),
    ],
  },
  {
    id: '02', title: 'Leer paquetes', eyebrow: 'Anatomía', icon: Layers3,
    description: 'De la trama a la aplicación: capas, campos, bytes y tiempo.', lab: 'Autopsia de un paquete',
    lessons: [
      lesson('frame-anatomy','02.01','Anatomía de un frame','Interpreta longitud capturada, longitud en el medio, timestamps y encapsulación.',['Leer metadatos Frame','Detectar truncamiento','Reconocer encapsulación']),
      lesson('ethernet','02.02','Ethernet, MAC y EtherType','Relaciona direcciones L2, tipos y etiquetas con el dominio de captura.',['Leer cabecera Ethernet','Distinguir unicast/broadcast','Identificar EtherType']),
      lesson('vlan-arp','02.03','VLAN y ARP en contexto','Sigue resolución local y etiquetas 802.1Q sin perder la topología.',['Analizar ARP','Leer VLAN ID','Detectar respuestas anómalas']),
      lesson('ip-fields','02.04','IPv4 e IPv6 campo por campo','TTL, Hop Limit, DSCP, fragmentación y siguiente cabecera como evidencia.',['Interpretar TTL','Reconocer fragmentación','Comparar IPv4/IPv6']),
      lesson('transport','02.05','TCP y UDP en la captura','Puertos, checksums, flags y longitud desde la perspectiva del analizador.',['Localizar puertos','Leer flags','Validar longitud']),
      lesson('encapsulation','02.06','Encapsulación sin memorizar OSI','Navega túneles y capas anidadas usando el árbol real del paquete.',['Seguir capas','Detectar túneles','Ubicar payload']),
    ],
  },
  {
    id: '03', title: 'Filtros sin sufrimiento', eyebrow: 'Display & capture', icon: Filter,
    description: 'Encuentra la aguja sin esconder evidencia importante.', lab: 'Cacería de paquetes',
    lessons: [
      lesson('filter-difference','03.01','Capture filter vs. display filter','Uno decide qué se guarda; el otro qué se muestra. Confundirlos destruye evidencia.',['Elegir el filtro correcto','Explicar sintaxis','Evitar pérdidas']),
      lesson('display-basics','03.02','Campos, valores y operadores','Construye expresiones con comparaciones, presencia y lógica booleana.',['Filtrar campos','Combinar condiciones','Negar expresiones']),
      lesson('display-advanced','03.03','Contains, matches, sets y slices','Exprime el lenguaje de filtros sin crear expresiones ilegibles.',['Buscar patrones','Usar conjuntos','Cortar bytes']),
      lesson('capture-bpf','03.04','BPF para capturar con precisión','Reduce volumen por host, red, puerto y protocolo.',['Escribir BPF','Combinar primitivas','Validar alcance']),
      lesson('filter-debug','03.05','Depurar filtros y precedencia','Comprueba qué significa realmente una expresión antes de confiar en ella.',['Usar paréntesis','Detectar campos ausentes','Probar incrementalmente']),
      lesson('filter-library','03.06','Tu biblioteca de filtros','Diseña botones, comentarios y convenciones reutilizables.',['Guardar filtros','Nombrar intención','Crear botones']),
    ],
  },
  {
    id: '04', title: 'Conversaciones y tiempo', eyebrow: 'Workflow', icon: SearchCheck,
    description: 'Triage, endpoints, streams, gráficas y una investigación reproducible.', lab: '¿Quién habló con quién?',
    lessons: [
      lesson('triage','04.01','Triage de un PCAP desconocido','Empieza por alcance, duración, protocolos y participantes; no por paquetes aleatorios.',['Crear inventario','Priorizar flujos','Documentar hipótesis']),
      lesson('endpoints','04.02','Endpoints y Conversations','Convierte millones de paquetes en una lista corta de relaciones.',['Usar estadísticas','Ordenar por bytes','Detectar outliers']),
      lesson('streams','04.03','Follow Stream con contexto','Reconstruye una conversación sin olvidar direcciones ni huecos.',['Seguir streams','Cambiar representación','Reconocer datos faltantes']),
      lesson('time-columns','04.04','Tiempo absoluto, relativo y delta','Elige la referencia temporal adecuada para cada pregunta.',['Configurar columnas','Medir delta','Correlacionar eventos']),
      lesson('graphs','04.05','IO Graphs y Flow Graph','Visualiza ritmo, picos, silencios y secuencia de mensajes.',['Construir gráficas','Aplicar filtros','Interpretar tendencias']),
      lesson('evidence-notes','04.06','Notas y evidencia reproducible','Registra frame, campo, valor, tiempo e interpretación por separado.',['Citar frames','Separar hecho/inferencia','Crear timeline']),
    ],
  },
  {
    id: '05', title: 'TCP bajo el microscopio', eyebrow: 'Deep dive', icon: Activity,
    description: 'Handshake, secuencias, ACK, SACK, ventanas, resets y retransmisiones.', lab: 'La retransmisión impostora',
    lessons: [
      lesson('tcp-handshake','05.01','Handshake y opciones TCP','MSS, scaling, SACK y timestamps negocian el comportamiento futuro.',['Validar handshake','Leer opciones','Detectar negociación incompleta']),
      lesson('seq-ack','05.02','Sequence y ACK sin magia','Sigue rangos de bytes y ACK acumulativos con números relativos y absolutos.',['Calcular rangos','Interpretar ACK','Reconocer gaps']),
      lesson('tcp-analysis','05.03','Cómo razona tcp.analysis','Entiende las heurísticas antes de aceptar etiquetas automáticas.',['Explicar heurísticas','Validar etiquetas','Evitar falsos positivos']),
      lesson('retransmissions','05.04','RTO, Fast Retransmission y Dup ACK','Distingue mecanismos, síntomas y evidencia suficiente.',['Diferenciar retransmisiones','Leer Dup ACK','Usar SACK']),
      lesson('windows','05.05','Ventanas y receptor lento','Window scaling, Window Full, Zero Window y probes.',['Calcular ventana','Identificar receptor limitado','Seguir recuperación']),
      lesson('resets','05.06','FIN, RST y cierres extraños','Determina quién terminó la sesión y bajo qué contexto.',['Seguir teardown','Atribuir RST','Detectar half-close']),
      lesson('tcp-rtt','05.07','RTT y throughput TCP','Relaciona latencia, ventana, pérdida y capacidad real.',['Medir RTT','Estimar BDP','Explicar throughput']),
      lesson('tcp-artifacts','05.08','Cuando la captura miente','Offloading, duplicación y captura asimétrica producen diagnósticos falsos.',['Detectar offloading','Reconocer duplicados','Pedir segunda captura']),
    ],
  },
  {
    id: '06', title: 'Servicios esenciales', eyebrow: 'Protocols', icon: Globe2,
    description: 'DNS, DHCP, ICMP, NTP y los servicios que sostienen todo lo demás.', lab: 'Internet funciona… excepto que no',
    lessons: [
      lesson('dns-flow','06.01','DNS de extremo a extremo','Consultas, respuestas, flags, códigos y tiempos.',['Leer DNS','Medir resolución','Detectar NXDOMAIN']),
      lesson('dns-complex','06.02','CNAME, fallback y resolvers','Reconstruye cadenas, retries y diferencias entre clientes.',['Seguir CNAME','Identificar resolver','Detectar reintentos']),
      lesson('dhcp','06.03','DHCP y configuración dinámica','DORA, opciones, renovaciones y conflictos.',['Seguir DORA','Leer opciones','Detectar fallos']),
      lesson('icmp','06.04','ICMP como señal, no ruido','Errores, PMTUD, unreachable y diagnóstico.',['Interpretar ICMP','Seguir quoted packet','Detectar PMTUD']),
      lesson('ntp','06.05','NTP y por qué el tiempo importa','Evalúa sincronización y evita timelines engañosos.',['Leer NTP','Detectar offset','Correlacionar capturas']),
    ],
  },
  {
    id: '07', title: 'Web y cifrado', eyebrow: 'Application', icon: ShieldCheck,
    description: 'HTTP/1.1, HTTP/2, TLS, certificados, SNI, ALPN y QUIC.', lab: 'La página lenta',
    lessons: [
      lesson('http1','07.01','HTTP/1.1 y tiempos de aplicación','Métodos, estados, headers, cuerpos y keep-alive.',['Seguir HTTP','Medir respuesta','Extraer objetos']),
      lesson('tls-handshake','07.02','TLS handshake visible','Versiones, suites, SNI, ALPN y certificados sin romper cifrado.',['Leer Client Hello','Validar certificado','Identificar ALPN']),
      lesson('tls-decrypt','07.03','Descifrado autorizado con key log','Configura secretos de sesión en un lab propio.',['Usar key log','Configurar Wireshark','Validar descifrado']),
      lesson('http2','07.04','HTTP/2 multiplexado','Streams, frames, headers y concurrencia dentro de una conexión.',['Seguir streams','Leer frames','Detectar bloqueo']),
      lesson('quic','07.05','QUIC y HTTP/3','UDP, connection IDs, TLS integrado y migración.',['Identificar QUIC','Leer handshake','Comparar con TCP']),
      lesson('web-timing','07.06','Descomponer una carga web','DNS + conexión + TLS + servidor + transferencia.',['Crear waterfall','Atribuir demora','Comparar sesiones']),
    ],
  },
  {
    id: '08', title: 'Capturar bien', eyebrow: 'Capture craft', icon: Binary,
    description: 'Endpoints, SPAN, TAP, ring buffers, pérdida y sincronización.', lab: 'El PCAP contaminado',
    lessons: [
      lesson('capture-placement','08.01','Elegir punto de captura','Cliente, servidor, firewall, SPAN o TAP según la hipótesis.',['Elegir ubicación','Predecir visibilidad','Diseñar captura dual']),
      lesson('span-tap','08.02','SPAN vs. TAP','Capacidad, duplicación, drops y fidelidad operacional.',['Comparar técnicas','Detectar oversubscription','Evaluar riesgo']),
      lesson('dumpcap','08.03','Dumpcap y ring buffers','Captura duradera con archivos rotativos y límites seguros.',['Usar ring buffer','Limitar tamaño','Preservar contexto']),
      lesson('capture-loss','08.04','Detectar pérdida del capturador','Distingue packet loss real de dropped packets locales.',['Leer estadísticas','Detectar gaps','Validar recursos']),
      lesson('offloading','08.05','Checksum y segmentation offloading','Reconoce paquetes “imposibles” creados por el host.',['Detectar checksums','Explicar superframes','Ajustar captura']),
      lesson('merge-time','08.06','Fusionar y sincronizar capturas','Combina perspectivas con Mergecap y corrige offsets con cuidado.',['Calcular offset','Usar Editcap','Validar orden']),
    ],
  },
  {
    id: '09', title: 'Performance real', eyebrow: 'Troubleshooting', icon: Gauge,
    description: 'Separa red, cliente y servidor usando tiempos y comportamiento.', lab: 'Todos culpan a la red',
    lessons: [
      lesson('method','09.01','Método de análisis de performance','Define transacción, baseline, síntoma y criterio de éxito.',['Definir unidad','Crear baseline','Medir impacto']),
      lesson('latency-loss','09.02','Latencia, jitter y pérdida','Diferencia métricas y sus efectos sobre TCP y aplicaciones.',['Medir latencia','Identificar jitter','Cuantificar pérdida']),
      lesson('server-time','09.03','Network time vs. server time','Usa request/response para localizar espera de aplicación.',['Separar tiempos','Comparar requests','Sustentar atribución']),
      lesson('mtu','09.04','MTU, MSS, fragmentación y PMTUD','Encuentra black holes y tamaños incompatibles.',['Calcular MSS','Detectar fragmentos','Seguir ICMP']),
      lesson('throughput','09.05','Throughput, ventana y BDP','Explica por qué más bandwidth no siempre significa más velocidad.',['Calcular BDP','Identificar limitante','Leer window scaling']),
      lesson('reporting','09.06','Reporte que resiste preguntas','Conclusión, evidencia, limitaciones y siguiente prueba.',['Redactar hallazgo','Citar evidencia','Declarar límites']),
    ],
  },
  {
    id: '10', title: 'Network forensics', eyebrow: 'Investigation', icon: Radar,
    description: 'Triage, scanning, beaconing, exfiltración y timelines defendibles.', lab: 'Incidente final',
    lessons: [
      lesson('forensic-triage','10.01','Triage forense de red','Preserva evidencia y reduce un PCAP grande a entidades y ventanas útiles.',['Preservar integridad','Crear inventario','Priorizar eventos']),
      lesson('scanning','10.02','Reconnaissance y scanning','Patrones SYN, conexiones fallidas y límites de atribución.',['Detectar scan','Medir patrón','Evitar sobreafirmar']),
      lesson('beaconing','10.03','Beaconing y periodicidad','Busca ritmo, jitter, tamaños y destinos persistentes.',['Medir intervalos','Detectar jitter','Comparar hosts']),
      lesson('dns-tunnel','10.04','DNS sospechoso y tunneling','Longitud, entropía, volumen y comportamiento del dominio.',['Perfilar DNS','Detectar outliers','Validar contexto']),
      lesson('exfil','10.05','Exfiltración y transferencia','Cuantifica dirección, volumen, duración y canal sin asumir intención.',['Medir bytes','Seguir sesión','Distinguir hecho/inferencia']),
      lesson('timeline','10.06','Timeline e informe final','Convierte paquetes en una narrativa cronológica verificable.',['Construir timeline','Correlacionar fuentes','Redactar informe']),
    ],
  },
]

export const allLessons = modules.flatMap(module => module.lessons.map(item => ({ ...item, moduleId: module.id, moduleTitle: module.title })))

export const labs = modules.map((module, index) => ({
  id: `lab-${module.id}`,
  moduleId: module.id,
  number: module.id,
  title: module.lab ?? `Laboratorio ${module.id}`,
  moduleTitle: module.title,
  description: [
    'Genera una consulta DNS y una conexión HTTPS controladas; después demuestra cada etapa dentro de tu propia captura.',
    'Desarma un frame desde sus metadatos hasta el payload y documenta dónde comienza cada capa.',
    'Resuelve una cacería de paquetes usando capture filters y display filters sin perder evidencia.',
    'Reduce un PCAP desconocido a endpoints, conversaciones, streams y una línea temporal.',
    'El NOC reporta pérdida. Decide si la red es culpable o si la captura está mintiendo.',
    'Diagnostica un caso donde la conectividad existe, pero DNS y servicios auxiliares fallan.',
    'Descompón la carga de una página entre DNS, TCP, TLS, servidor y transferencia.',
    'Identifica duplicación, offloading, asimetría y drops dentro de un PCAP contaminado.',
    'Separa tiempo de red, cliente y servidor en una disputa de performance.',
    'Construye un timeline forense y presenta conclusiones con límites y evidencia.',
  ][index],
  difficulty: index < 2 ? 'Fundamentos' : index < 6 ? 'Intermedio' : 'Avanzado',
  available: index === 0 || index === 4,
}))

export const introPackets = [
  { frame: 1, time: '0.000', source: '192.168.1.20', destination: '192.168.1.1', info: 'Standard query A example.com', kind: 'data' },
  { frame: 2, time: '0.018', source: '192.168.1.1', destination: '192.168.1.20', info: 'Standard query response A 93.184.216.34', kind: 'ack' },
  { frame: 3, time: '0.021', source: '192.168.1.20', destination: '93.184.216.34', info: '51544 → 443 [SYN]', kind: 'syn' },
  { frame: 4, time: '0.058', source: '93.184.216.34', destination: '192.168.1.20', info: '443 → 51544 [SYN, ACK]', kind: 'syn' },
  { frame: 5, time: '0.058', source: '192.168.1.20', destination: '93.184.216.34', info: '51544 → 443 [ACK]', kind: 'ack' },
  { frame: 6, time: '0.061', source: '192.168.1.20', destination: '93.184.216.34', info: 'TLS Client Hello (SNI=example.com)', kind: 'data' },
]

export const introQuiz = [
  { question: '¿Qué acción ocurrió primero?', answers: ['El handshake TCP', 'La consulta DNS', 'El Client Hello', 'La respuesta HTTP'], correct: 1, explanation: 'El frame 1 consulta la dirección de example.com antes de intentar la conexión.' },
  { question: '¿Qué frame inicia la conexión TCP?', answers: ['1', '2', '3', '6'], correct: 2, explanation: 'El frame 3 contiene el SYN inicial del cliente hacia el puerto 443.' },
  { question: '¿Qué demuestra el frame 6 aunque TLS esté cifrado?', answers: ['El contenido de la página', 'La contraseña del usuario', 'El hostname indicado mediante SNI', 'La clave privada'], correct: 2, explanation: 'El Client Hello puede exponer SNI y otros metadatos aunque los datos de aplicación estén cifrados.' },
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
  { question: '¿Qué evidencia es más fuerte antes de culpar a la red?', answers: ['El color de Wireshark', 'El contador total', 'Una captura simultánea en otro punto', 'El tamaño del PCAP'], correct: 2, explanation: 'Una segunda captura permite comprobar si los segmentos se duplicaron en tránsito o solo en el punto de observación.' },
  { question: 'El ACK 4381 confirma que…', answers: ['faltan tres segmentos', 'el receptor aceptó bytes hasta 4380', 'el handshake falló', 'TLS está roto'], correct: 1, explanation: 'TCP usa ACK acumulativo: Ack=4381 indica que el siguiente byte esperado es 4381.' },
]
