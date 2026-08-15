import { Activity, Binary, Compass, Filter, Gauge, Globe2, Layers3, Radar, SearchCheck, ShieldCheck } from 'lucide-react'

export type LessonBlock =
  | { type: 'text'; title?: string; body: string }
  | { type: 'callout'; title: string; body: string }
  | { type: 'code'; label: string; value: string }
  | { type: 'download'; label: string; body: string; href: string; meta: string }
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
  draft: boolean
}

export type CourseModule = {
  id: string
  title: string
  eyebrow: string
  description: string
  icon: typeof Compass
  lessons: Lesson[]
  lab?: string
  status: 'ready' | 'development'
}

type LessonGuide = { concept: string; method: string; code: string; warning: string; practice: string[] }
const guides: Record<string, LessonGuide> = {
  'filter-difference': {
    concept: 'Un capture filter se evalúa antes de guardar y usa sintaxis BPF; todo lo que excluye desaparece. Un display filter se aplica después sobre campos disectados y nunca modifica el archivo. Por eso conviene capturar amplio y filtrar al investigar, salvo que volumen o privacidad exijan limitar.',
    method: 'Formula primero el alcance en lenguaje natural. Para captura tradúcelo a host, net, port y protocolo; para visualización usa nombres de campo como ip.addr o tcp.flags.syn. Prueba el BPF con una captura corta y conserva el texto exacto en tus notas.',
    code: 'Capture: host 192.0.2.10 and port 443\nDisplay: ip.addr == 192.0.2.10 && tcp.port == 443',
    warning: 'Escribir tcp.port == 443 en el cuadro de capture filter falla; escribir port 443 en display filter también. Las gramáticas no son intercambiables.',
    practice: ['Localiza ambos cuadros en Wireshark', 'Explica qué evidencia perdería port 53', 'Aplica un display filter y confirma que el total capturado no cambia'],
  },
  'display-basics': {
    concept: 'Los display filters operan sobre campos tipados: direcciones, enteros, booleanos, texto y bytes. Un nombre solo comprueba presencia; las comparaciones usan ==, !=, > y <. and/or/not combinan condiciones y los paréntesis hacen explícita la intención.',
    method: 'Construye de izquierda a derecha: empieza con el protocolo, añade un host, después una condición concreta. Observa la barra verde/roja y el contador displayed. Usa clic derecho → Apply as Filter para descubrir el nombre exacto de un campo.',
    code: 'dns\nip.addr == 192.0.2.10\ntcp.flags.syn == 1 && tcp.flags.ack == 0\n!(arp || icmp)',
    warning: 'ip.addr != 192.0.2.10 puede sorprender: un paquete tiene origen y destino. Para excluir por completo usa !(ip.addr == 192.0.2.10).',
    practice: ['Muestra solo DNS de la captura incluida', 'Aísla el SYN inicial', 'Combina DNS o TLS con paréntesis'],
  },
  'display-advanced': {
    concept: 'contains busca un valor dentro de texto, bytes o campos repetidos; matches usa expresiones regulares; in compara contra un conjunto; slices extraen rangos. Estas herramientas reducen filtros largos, pero pueden costar CPU en archivos grandes.',
    method: 'Prefiere igualdad cuando conoces el valor. Usa contains para fragmentos simples, matches con (?i) para texto sin distinguir mayúsculas y slices cuando la posición del byte sea parte del protocolo. Valida cada subexpresión por separado.',
    code: 'dns.qry.name contains "example"\nhttp.host matches "(?i)\\.example$"\ntcp.port in {80 443 8080}\nip.src[0:2] == c0:00',
    warning: 'Una regex que encuentra texto no demuestra semántica maliciosa. Documenta el campo y contexto, no solo la coincidencia.',
    practice: ['Convierte tres comparaciones de puerto en un set', 'Busca example en DNS', 'Inspecciona los dos primeros bytes de una IPv4'],
  },
  'capture-bpf': {
    concept: 'BPF trabaja con offsets y primitivas disponibles al capturador. host incluye origen o destino; src/dst restringen dirección; net acepta prefijo; portrange cubre rangos. and, or y not definen el alcance antes de escribir disco.',
    method: 'Calcula el peor volumen, conserva protocolos auxiliares y prueba durante 10 segundos. Para una aplicación web, capturar solo port 443 ocultaría DNS e ICMP; incluye los canales necesarios para responder la pregunta.',
    code: 'host 192.0.2.10\nnet 192.0.2.0/24 and not broadcast\n(host 192.0.2.10 and port 443) or port 53 or icmp\ntcp portrange 8000-8100',
    warning: 'Un capture filter perfecto para una hipótesis puede destruir evidencia que habría refutado esa hipótesis.',
    practice: ['Diseña BPF para DNS+HTTPS de un host', 'Explica por qué incluir ICMP', 'Haz una captura breve y revisa el contador dropped'],
  },
  'filter-debug': {
    concept: 'Los errores vienen de precedencia, campos ausentes, valores con tipo incorrecto o semántica any/all en campos repetidos. La barra valida sintaxis, no que el filtro responda tu pregunta.',
    method: 'Parte la expresión. Cuenta resultados de A, luego B y finalmente A && B. Usa Statistics → Protocol Hierarchy para saber si el campo puede existir. Añade paréntesis incluso cuando conozcas la precedencia.',
    code: '(dns || tls) && ip.addr == 192.0.2.10\ntcp.flags.syn == 1 && tcp.flags.ack == 0\nframe matches "(?i)example"',
    warning: 'Cero resultados puede significar “no ocurrió”, “no fue capturado”, “no se disectó” o “el filtro está mal”. Distingue esas posibilidades.',
    practice: ['Prueba cada cláusula por separado', 'Compara displayed antes/después', 'Escribe una frase que describa exactamente el filtro'],
  },
  'filter-library': {
    concept: 'Una biblioteca útil guarda intención, no trucos aislados. Organiza filtros por triage, TCP, servicios, seguridad y entorno; usa nombres legibles y evita direcciones específicas salvo en plantillas.',
    method: 'Crea botones desde la barra de display filter, exporta perfiles y registra ejemplo, propósito y limitación. Mantén una versión corta para uso diario y otra comentada en el repositorio.',
    code: 'SYN inicial: tcp.flags.syn == 1 && tcp.flags.ack == 0\nErrores DNS: dns.flags.response == 1 && dns.flags.rcode != 0\nResets: tcp.flags.reset == 1',
    warning: 'Un filtro copiado de Internet puede usar campos obsoletos o responder otra pregunta. Valídalo contra tu versión y protocolo.',
    practice: ['Crea tres botones de filtro', 'Nombra cada uno por intención', 'Anota una limitación por filtro'],
  },
  'triage': {
    concept: 'Triage es reducir incertidumbre antes de perseguir un paquete. Empieza con metadatos, duración, interfaces, protocolos, endpoints y conversaciones; después prioriza por volumen, frecuencia, errores o relación con el síntoma.',
    method: 'Ejecuta Capinfos, Protocol Hierarchy, Endpoints y Conversations en ese orden. Anota top talkers, servicios y ventanas temporales. Solo entonces formula dos o tres hipótesis comprobables.',
    code: 'capinfos capture.pcapng\ntshark -r capture.pcapng -q -z io,phs\ntshark -r capture.pcapng -q -z endpoints,ip -z conv,tcp',
    warning: 'Abrir un archivo grande y seguir el primer stream llamativo introduce sesgo. El orden de triage debe ser repetible.',
    practice: ['Registra inicio, fin y paquetes', 'Lista cinco endpoints', 'Formula una hipótesis y qué la refutaría'],
  },
  'endpoints': {
    concept: 'Endpoints agrega participantes individuales; Conversations agrupa pares y direcciones. Bytes A→B y B→A muestran asimetría, mientras duración y paquetes ayudan a distinguir sesiones cortas, transferencias y chatter.',
    method: 'Filtra al protocolo relevante antes de abrir estadísticas o usa Limit to display filter. Ordena por bytes, paquetes y duración. Resuelve nombres después de conservar IP originales.',
    code: 'tshark -r capture.pcapng -q -z endpoints,ip\ntshark -r capture.pcapng -q -z conv,tcp',
    warning: 'Muchos bytes no significan anomalía; backups y CDN suelen dominar. Compara contra función, horario y baseline.',
    practice: ['Encuentra top talker', 'Compara ambas direcciones', 'Aísla una conversación con Apply as Filter'],
  },
  'streams': {
    concept: 'Follow Stream reensambla datos de una conversación y colorea direcciones. Es una vista derivada: huecos de captura, retransmisiones y cifrado limitan lo reconstruido.',
    method: 'Selecciona un paquete, Follow TCP/UDP/HTTP Stream, identifica cliente/servidor y cambia entre ASCII, hex y raw. Conserva el número tcp.stream para volver al contexto temporal.',
    code: 'tcp.stream == 0\nudp.stream == 0\ntcp.stream eq ${tcp.stream}',
    warning: 'Un stream legible puede contener secretos. No exportes contenido sin autorización y sanitización.',
    practice: ['Sigue el stream TCP de la muestra', 'Cambia a hex dump', 'Regresa al frame del Client Hello'],
  },
  'time-columns': {
    concept: 'Absolute time correlaciona fuentes; relative time mide desde el inicio; delta mide separación. Delta displayed cambia con el filtro, delta captured no. Elegir la referencia incorrecta produce conclusiones temporales falsas.',
    method: 'Configura columnas UTC, Seconds Since Beginning y Delta time displayed. Marca un frame como Time Reference para medir una transacción sin alterar timestamps originales.',
    code: 'frame.time\nframe.time_epoch\nframe.time_relative\nframe.time_delta\nframe.time_delta_displayed',
    warning: 'Dos hosts con relojes desincronizados no pueden compararse solo por timestamp. Busca eventos compartidos para calcular offset.',
    practice: ['Mide DNS request→response', 'Mide SYN→SYN/ACK', 'Explica por qué delta displayed cambia al filtrar'],
  },
  'graphs': {
    concept: 'IO Graph representa valores por intervalos; Flow Graph muestra secuencia entre participantes. Uno revela ritmo y picos, el otro causalidad y orden de mensajes.',
    method: 'Define tick interval acorde al fenómeno, aplica filtros por serie y elige Packets, Bytes o un campo agregado. En Flow Graph limita primero a una conversación para evitar ruido.',
    code: 'Serie 1: tcp.stream == 0\nY field: SUM(tcp.len)\nFlow: Statistics → Flow Graph → Displayed packets',
    warning: 'El tamaño del bucket puede ocultar microbursts o exagerar ruido. Repite con varias escalas.',
    practice: ['Grafica bytes por 100 ms', 'Compara DNS y TCP', 'Genera un Flow Graph del handshake'],
  },
  'evidence-notes': {
    concept: 'Una nota sólida separa observación, interpretación y conclusión. Cita frame, tiempo, campo y valor; declara el punto de captura y las alternativas que no puedes excluir.',
    method: 'Usa una tabla: timestamp, frame, actor, evento, evidencia, interpretación. Mantén filtros y comandos reproducibles. Termina cada hallazgo con impacto y siguiente prueba.',
    code: 'Hecho: frame 4, tcp.flags=0x012, delta=37 ms\nInferencia: el servidor respondió al SYN\nLímite: solo existe captura del cliente',
    warning: '“Wireshark dice retransmission” no es evidencia suficiente. La evidencia son secuencias, tiempos y frames observados.',
    practice: ['Redacta un hecho sin adjetivos', 'Añade una inferencia separada', 'Declara una limitación'],
  },
  'tcp-handshake': {
    concept: 'SYN, SYN/ACK y ACK sincronizan espacios de secuencia y negocian MSS, Window Scale, SACK Permitted y timestamps. Las opciones solo pueden negociarse en SYN; si falta un sentido, Wireshark puede calcular mal valores posteriores.',
    method: 'Filtra SYN, agrupa por stream y compara opciones en ambos lados. MSS limita payload recibido, no MTU completa. Window Scale anunciado por un host escala la ventana que ese host recibirá.',
    code: 'tcp.flags.syn == 1\ntcp.options.mss_val\ntcp.options.wscale.shift\ntcp.options.sack_perm == 1',
    warning: 'Un SYN retransmitido no prueba que el servidor esté caído; firewall, ruta, captura asimétrica o respuesta perdida producen el mismo síntoma local.',
    practice: ['Encuentra los tres frames', 'Compara opciones', 'Calcula RTT inicial aproximado'],
  },
  'seq-ack': {
    concept: 'Sequence identifica el primer byte del segmento; Len define su rango; ACK indica el siguiente byte esperado. Wireshark muestra números relativos para legibilidad, pero el principio es idéntico con números absolutos.',
    method: 'Para cada segmento escribe Seq…Seq+Len−1. Busca el ACK acumulativo que avanza al siguiente byte. Usa SACK para identificar rangos recibidos fuera de orden.',
    code: 'tcp.seq\ntcp.len\ntcp.nxtseq\ntcp.ack\ntcp.options.sack_le',
    warning: 'ACK no identifica necesariamente un único segmento; puede confirmar varios bytes acumulativamente.',
    practice: ['Calcula rango de tres segmentos', 'Predice ACK siguiente', 'Distingue ACK duplicado de ACK acumulativo'],
  },
  'tcp-analysis': {
    concept: 'tcp.analysis.* son heurísticas mantenidas por stream a partir de paquetes observados. Wireshark infiere retransmission, lost segment, out-of-order y duplicate ACK sin conocer el estado real de endpoints o red.',
    method: 'Usa la etiqueta para localizar candidatos, luego valida sequence range, tiempo, ACK/SACK y punto de captura. Desactiva relative sequence numbers solo si necesitas correlación externa.',
    code: 'tcp.analysis.flags\ntcp.analysis.retransmission\ntcp.analysis.out_of_order\ntcp.analysis.lost_segment',
    warning: 'Una captura iniciada a mitad de sesión o con paquetes faltantes contamina el estado del analizador.',
    practice: ['Abre Expert Information', 'Valida una etiqueta manualmente', 'Escribe dos causas alternativas'],
  },
  'retransmissions': {
    concept: 'RTO ocurre tras un temporizador sin ACK; Fast Retransmission suele seguir Dup ACK; SACK informa bloques recibidos. Out-of-order puede ser reordenamiento real o efecto de captura.',
    method: 'Mide tiempo desde original, cuenta ACK duplicados y lee SACK. Confirma que original y repetición cubren el mismo rango. Busca avance posterior del ACK.',
    code: 'tcp.analysis.retransmission || tcp.analysis.fast_retransmission || tcp.analysis.duplicate_ack\ntcp.options.sack',
    warning: 'No calcules “porcentaje de pérdida” contando etiquetas de retransmission sin deduplicar rangos y validar visibilidad.',
    practice: ['Clasifica RTO vs fast', 'Identifica rango repetido', 'Comprueba recuperación con ACK'],
  },
  'windows': {
    concept: 'La receiver window indica bytes adicionales que el receptor puede aceptar. Window Scale multiplica el valor de 16 bits. Window Full señala que el emisor alcanzó el límite; Zero Window que el receptor anuncia cero.',
    method: 'Añade calculated window size como columna, identifica quién anuncia la ventana y correlaciona con ritmo de ACK. Sigue Zero Window Probe y Window Update.',
    code: 'tcp.window_size\ntcp.analysis.window_full\ntcp.analysis.zero_window\ntcp.analysis.zero_window_probe',
    warning: 'Una ventana pequeña puede ser normal al final de una transferencia. Busca persistencia e impacto.',
    practice: ['Identifica receptor', 'Grafica ventana', 'Distingue red lenta de aplicación receptora lenta'],
  },
  'resets': {
    concept: 'FIN cierra una dirección de forma ordenada; RST aborta estado inmediatamente. Un half-close permite que un lado termine de enviar mientras aún recibe.',
    method: 'Localiza primer FIN/RST, identifica emisor y observa paquetes previos: solicitud completa, puerto cerrado, timeout de aplicación o datos después del cierre.',
    code: 'tcp.flags.fin == 1\ntcp.flags.reset == 1\ntcp.completeness',
    warning: 'La IP que envía RST no prueba quién decidió cerrarlo; un intermediario puede inyectar resets.',
    practice: ['Reconstruye teardown', 'Cuenta FIN por sentido', 'Describe contexto previo a RST'],
  },
  'tcp-rtt': {
    concept: 'RTT es tiempo ida/vuelta observado, no latencia unidireccional. Throughput depende de RTT, pérdida, ventana, congestion control y aplicación. BDP aproxima bytes necesarios en vuelo para llenar el camino.',
    method: 'Usa tcp.analysis.ack_rtt, RTT Graph y Bytes in Flight. Calcula BDP=bandwidth×RTT y compara con ventana efectiva.',
    code: 'tcp.analysis.ack_rtt\ntcp.analysis.bytes_in_flight\ntcp.window_size\nStatistics → TCP Stream Graphs → Round Trip Time',
    warning: 'Handshake RTT incluye comportamiento de endpoints y ubicación de captura; no es una medición pura de cada enlace.',
    practice: ['Mide RTT mediano', 'Calcula BDP', 'Identifica limitante plausible'],
  },
  'tcp-artifacts': {
    concept: 'TSO/GSO crean segmentos gigantes antes de salir; GRO/LRO combinan recepción; checksum offload deja checksums pendientes; SPAN puede duplicar o perder. Todo altera la representación sin alterar necesariamente la red.',
    method: 'Busca tamaños mayores al MSS, duplicados con timestamps casi idénticos, checksums incorrectos solo en salida y ACK que confirman bytes “ausentes”. Compara otro punto.',
    code: 'tcp.checksum.status == 0\nframe.len > 1514\ntcp.analysis.retransmission',
    warning: 'Corrige primero la calidad de evidencia antes de diagnosticar el comportamiento TCP.',
    practice: ['Lista indicios de offload', 'Distingue duplicado de RTO', 'Diseña captura dual'],
  },
  'dns-flow': {
    concept: 'DNS relaciona transaction ID, pregunta, tipo y respuesta. Flags indican query/response, recursion, truncamiento y rcode. El tiempo se mide entre request y response correspondiente.',
    method: 'Filtra dns, agrega dns.qry.name y dns.time como columnas, agrupa por dns.id y revisa respuestas sin solicitud o consultas sin respuesta.',
    code: 'dns\ndns.flags.response == 0\ndns.flags.rcode != 0\ndns.time > 0.5',
    warning: 'NXDOMAIN puede ser resultado válido de una aplicación; interpreta volumen, nombre y contexto.',
    practice: ['Relaciona query/response', 'Lee A y AAAA', 'Mide dns.time'],
  },
  'dns-complex': {
    concept: 'Una resolución puede incluir CNAME, múltiples A/AAAA, búsquedas paralelas, retries por UDP y fallback a TCP. El resolver observado no siempre es el autoritativo final.',
    method: 'Sigue dns.id junto con cliente/servidor, expande Answers y reconstruye CNAME hasta dirección. Busca mismas preguntas repetidas y bit TC.',
    code: 'dns.cname\ndns.flags.truncated == 1\ndns.retransmission\ntcp.port == 53',
    warning: 'IDs DNS se reutilizan; combina ID con endpoints, transporte y ventana temporal.',
    practice: ['Dibuja cadena CNAME', 'Detecta retry', 'Identifica resolver consultado'],
  },
  'dhcp': {
    concept: 'DHCPv4 usa Discover, Offer, Request y ACK, además de renew/rebind. Las opciones transportan lease, gateway, DNS, subnet y server identifier.',
    method: 'Filtra dhcp, ordena por transaction ID y message type, compara offered IP con requested IP y verifica opciones críticas.',
    code: 'dhcp\ndhcp.id\ndhcp.option.dhcp == 1\ndhcp.option.dhcp_server_id\ndhcp.option.requested_ip_address',
    warning: 'Offer múltiple no es necesariamente rogue DHCP; confirma qué servidor acepta el cliente y si está autorizado.',
    practice: ['Reconstruye DORA', 'Extrae lease y gateway', 'Detecta NAK'],
  },
  'icmp': {
    concept: 'ICMP informa condiciones de IP: echo, unreachable, time exceeded, redirect y packet too big. Muchos errores incluyen parte del paquete original, permitiendo identificar el flujo afectado.',
    method: 'Expande ICMP, lee type/code y quoted packet. Correlaciona con la solicitud original y verifica quién originó el mensaje.',
    code: 'icmp || icmpv6\nicmp.type == 3\nicmp.type == 11\nicmpv6.type == 2',
    warning: 'Bloquear todo ICMP rompe diagnóstico y PMTUD. Ausencia de ICMP tampoco prueba ausencia de error.',
    practice: ['Interpreta type/code', 'Localiza paquete citado', 'Relaciona con traceroute o PMTUD'],
  },
  'ntp': {
    concept: 'NTP intercambia cuatro timestamps para estimar offset y delay. Stratum describe distancia lógica a la referencia, no calidad por sí sola. Leap indicator y reference ID agregan contexto.',
    method: 'Filtra ntp, compara origin/receive/transmit y revisa request/response. Para correlacionar PCAPs usa eventos compartidos además del reloj.',
    code: 'ntp\nntp.stratum\nntp.rootdelay\nntp.flags.li',
    warning: 'Un PCAP refleja el reloj del capturador; NTP observado no corrige retroactivamente timestamps.',
    practice: ['Identifica cliente/servidor', 'Lee stratum', 'Explica impacto de offset en timeline'],
  },
}

Object.assign(guides, {
  'http1': {
    concept: 'HTTP/1.1 intercambia requests y responses dentro de conexiones persistentes. Método, URI, Host, status, headers y body describen la transacción; el tiempo entre último byte del request y primer byte de response aproxima espera del servidor desde ese punto.',
    method: 'Filtra http, relaciona http.request_in/http.response_in y sigue el stream. Separa tiempo de conexión, request→response y transferencia. Usa Export Objects solo con datos autorizados.',
    code: 'http.request\nhttp.response\nhttp.response.code >= 400\nhttp.time > 1\nhttp.request_in || http.response_in',
    warning: 'HTTP sobre TLS no será visible sin secretos de sesión. No interpretes “solo TLS” como ausencia de HTTP.',
    practice: ['Relaciona request y response', 'Mide server think time', 'Identifica keep-alive'],
  },
  'tls-handshake': {
    concept: 'TLS negocia versión, cipher suite y parámetros. Client Hello puede mostrar SNI y ALPN; Server Hello elige valores. El certificado autentica identidad mediante cadena y vigencia, pero TLS 1.3 cifra más partes del handshake.',
    method: 'Filtra tls.handshake, expande extensiones y sigue un stream. Compara supported_versions con versión seleccionada, ALPN con protocolo posterior y nombres SAN del certificado con el host esperado.',
    code: 'tls.handshake.type == 1\ntls.handshake.extensions_server_name\ntls.handshake.extensions_alpn_str\ntls.handshake.ciphersuite',
    warning: 'SNI visible no demuestra qué recurso se solicitó ni qué datos se intercambiaron.',
    practice: ['Lee SNI de la muestra', 'Identifica versión ofrecida', 'Explica qué permanece cifrado'],
  },
  'tls-decrypt': {
    concept: 'Navegadores pueden registrar secretos de sesión mediante SSLKEYLOGFILE. Wireshark usa esos secretos con el PCAP para descifrar sesiones propias; no necesita ni debe recibir la clave privada del servidor para TLS moderno.',
    method: 'Define SSLKEYLOGFILE antes de iniciar el navegador, genera tráfico de laboratorio, configura Preferences → Protocols → TLS → (Pre)-Master-Secret log filename y verifica que aparezca HTTP.',
    code: 'Linux/macOS: export SSLKEYLOGFILE="$PWD/tls-keys.log"\nPowerShell: $env:SSLKEYLOGFILE="$PWD\\tls-keys.log"\nFilter: tls && !http',
    warning: 'El key log permite leer sesiones capturadas. Protégelo como secreto, no lo subas al repo y elimínalo al terminar.',
    practice: ['Usa un perfil de navegador de lab', 'Confirma Client Hello antes de descifrar', 'Verifica HTTP después de cargar secretos'],
  },
  'http2': {
    concept: 'HTTP/2 multiplexa streams lógicos dentro de una conexión TCP usando frames HEADERS, DATA, SETTINGS, WINDOW_UPDATE y RST_STREAM. Stream ID separa transacciones que comparten el mismo transporte.',
    method: 'Con TLS descifrado, filtra http2, agrega streamid y type como columnas y sigue un stream HTTP/2. Distingue límites de flujo HTTP/2 de la ventana TCP.',
    code: 'http2\nhttp2.streamid == 3\nhttp2.type == 0\nhttp2.type == 3\nhttp2.window_size_increment',
    warning: 'Un TCP stream no equivale a una sola petición HTTP/2; medir request/response sin stream ID mezcla transacciones.',
    practice: ['Cuenta streams', 'Relaciona HEADERS/DATA', 'Busca RST_STREAM'],
  },
  'quic': {
    concept: 'QUIC combina transporte y TLS sobre UDP, usa connection IDs y soporta migración. Los packet numbers están protegidos; una conexión puede sobrevivir cambios de IP. HTTP/3 viaja como streams QUIC.',
    method: 'Filtra quic, identifica Initial por versión y connection ID, observa Retry y handshake. Para detalle HTTP/3 carga secretos TLS del cliente.',
    code: 'quic\nquic.long.packet_type == 0\nquic.version\nquic.dcid\nhttp3',
    warning: 'UDP/443 no garantiza QUIC y ausencia de SYN no significa conexión inexistente.',
    practice: ['Identifica Initial', 'Compara connection IDs', 'Describe diferencia frente a TCP+TLS'],
  },
  'web-timing': {
    concept: 'Una carga web suma resolución DNS, establecimiento TCP o QUIC, handshake TLS, espera del servidor y transferencia. Varias conexiones y recursos en paralelo impiden atribuir todo al primer request.',
    method: 'Crea una línea temporal por hostname y conexión. Marca DNS query/response, SYN/SYN-ACK, Client/Server Hello, request, primer response byte y último byte. Compara una transacción lenta con una rápida.',
    code: 'dns || tcp.flags.syn == 1 || tls.handshake || http || http2 || quic\nframe.time_relative',
    warning: 'Time to first byte alto puede incluir servidor, proxy, cola o pérdida previa. Declara qué observas y dónde.',
    practice: ['Construye waterfall manual', 'Calcula cinco intervalos', 'Localiza el mayor contribuyente'],
  },
  'capture-placement': {
    concept: 'El punto ideal depende de la hipótesis. Cliente muestra experiencia del usuario; servidor separa llegada y procesamiento; firewall confirma tránsito; TAP ofrece fidelidad; SPAN ofrece conveniencia con límites.',
    method: 'Dibuja ruta, marca NAT, túneles y balanceadores, y predice direcciones/cabeceras visibles en cada punto. Si buscas pérdida, captura simultáneamente antes y después del segmento sospechoso.',
    code: 'Checklist: ubicación, interfaz, dirección, VLAN, NAT, reloj, filtro, snaplen\ndumpcap -D',
    warning: 'Mover el punto cambia la evidencia. No compares contadores sin considerar encapsulación, offload y reloj.',
    practice: ['Elige punto para DNS lento', 'Elige dos puntos para pérdida', 'Predice efecto de NAT'],
  },
  'span-tap': {
    concept: 'SPAN copia tráfico mediante switch y puede sufrir oversubscription, duplicación o cambios de timing. TAP replica físicamente y suele preservar mejor errores y carga, pero requiere hardware e instalación.',
    method: 'Calcula ancho agregado de fuentes frente al puerto monitor, define direcciones y VLAN, valida con contadores y prueba tráfico conocido. Documenta modelo/configuración del switch.',
    code: 'Validar: capinfos capture.pcapng\nBuscar duplicados: editcap -D 5 capture.pcapng dedup.pcapng',
    warning: 'Que un paquete falte en SPAN no prueba que faltó en el enlace productivo.',
    practice: ['Calcula riesgo 2x10G→1G', 'Lista fuentes de duplicado', 'Diseña validación del SPAN'],
  },
  'dumpcap': {
    concept: 'Dumpcap es el motor de captura de Wireshark y reduce sobrecarga al escribir sin disección completa. Ring buffers rotan archivos por tamaño o tiempo para capturas prolongadas.',
    method: 'Enumera interfaces, fija snaplen, tamaño y cantidad de archivos, escribe en volumen con espacio suficiente y monitorea dropped packets. Prueba recuperación antes del incidente.',
    code: 'dumpcap -D\ndumpcap -i 1 -b duration:300 -b files:12 -w ring.pcapng\ndumpcap -i 1 -s 256 -b filesize:100000 -b files:20 -w ring.pcapng',
    warning: 'Ring buffer sobrescribe evidencia antigua. Dimensiona ventana según cuánto tardan en reportar el problema.',
    practice: ['Diseña buffer de una hora', 'Calcula almacenamiento', 'Comprueba archivos rotados'],
  },
  'capture-loss': {
    concept: 'El capturador puede descartar por CPU, disco, buffer o volumen. PCAPNG puede registrar drop count; Dumpcap reporta paquetes recibidos y descartados. Gaps TCP también pueden sugerir pérdida de captura, no solo de red.',
    method: 'Revisa salida de captura, capinfos, estadísticas de interfaz y secuencias. Reduce disección, aumenta buffer, usa filtro BPF o cambia hardware/punto.',
    code: 'capinfos capture.pcapng\ndumpcap -i 1 -B 64 -w capture.pcapng\ntcp.analysis.lost_segment',
    warning: 'No mezcles “dropped by capture” con packet loss de producción; son fenómenos distintos.',
    practice: ['Busca drop counters', 'Explica gap confirmado por ACK', 'Propón mitigación'],
  },
  'offloading': {
    concept: 'Checksum offload, TSO/GSO y GRO/LRO trasladan trabajo entre sistema y NIC. Una captura en host puede mostrar checksum pendiente, segmentos mayores al MTU o paquetes agregados que nunca existieron así en el cable.',
    method: 'Compara entrada/salida, tamaño contra MSS y ubicación. Captura en TAP u otro host para validar. Desactivar offload solo en laboratorio y entendiendo impacto.',
    code: 'tcp.checksum.status == 0\nframe.len > 1514\nethtool -k eth0',
    warning: 'No reportes corrupción o jumbo frames solo por una captura local.',
    practice: ['Identifica síntoma por offload', 'Compara con MSS', 'Escribe prueba confirmatoria'],
  },
  'merge-time': {
    concept: 'Mergecap combina archivos por timestamp; Editcap puede aplicar time shift. Para alinear capturas busca el mismo evento observable en ambas y calcula offset, idealmente con varios puntos.',
    method: 'Preserva originales y hashes, normaliza zona horaria solo en presentación, calcula offset con SYN/ACK o payload único, aplica shift a copia y valida inicio/fin.',
    code: 'mergecap -w merged.pcapng client.pcapng server.pcapng\neditcap -t 0.237 server.pcapng server-shifted.pcapng',
    warning: 'Un offset constante no corrige drift de reloj durante capturas largas.',
    practice: ['Encuentra evento compartido', 'Calcula offset', 'Valida tres eventos separados'],
  },
  'method': {
    concept: 'Performance exige definir transacción, síntoma, baseline y criterio de éxito. “Está lento” se convierte en intervalos observables: resolución, conexión, request, respuesta y transferencia.',
    method: 'Escribe pregunta y ventana temporal, identifica flujo, mide cada fase y compara contra sesión sana. Prioriza el intervalo dominante y diseña una prueba que aísle componente.',
    code: 'Plantilla: inicio → DNS → conexión → TLS → request → first byte → last byte\nframe.time_relative',
    warning: 'Promedios ocultan colas y percentiles. Conserva distribución y ejemplos concretos.',
    practice: ['Define una transacción', 'Elige baseline', 'Formula criterio de éxito'],
  },
  'latency-loss': {
    concept: 'Latencia es demora; jitter es variación; pérdida obliga recuperación o tolerancia. TCP transforma pérdida en retransmisión y reducción de envío; voz/video pueden mostrar gaps sin recuperación.',
    method: 'Mide RTT por flujo, grafica distribución, valida secuencias faltantes y retransmisiones. Separa pérdida de red, captura y aplicación.',
    code: 'tcp.analysis.ack_rtt\ntcp.analysis.retransmission\nrtp.analysis.flags\nStatistics → IO Graph',
    warning: 'Ping sano no invalida pérdida en otro camino, QoS o tamaño de paquete.',
    practice: ['Calcula mediana/p95 RTT', 'Valida un rango perdido', 'Distingue jitter de pérdida'],
  },
  'server-time': {
    concept: 'Si el request completo llega y la respuesta tarda en comenzar sin retransmisiones relevantes, el intervalo observado se atribuye al lado servidor/aplicación desde ese punto. Network time incluye entrega y ACK; server time sigue siendo una inferencia delimitada.',
    method: 'Marca último byte del request, primer byte de response y retransmisiones entre ambos. Compara múltiples transacciones y una captura del servidor si existe.',
    code: 'http.time\nhttp.request_in\nhttp.response_in\ntcp.analysis.retransmission',
    warning: 'Proxy, load balancer o cola pueden estar “del lado servidor” sin ser el proceso final.',
    practice: ['Mide request→first byte', 'Descarta pérdida', 'Redacta conclusión con límite'],
  },
  'mtu': {
    concept: 'MTU limita paquete IP; MSS limita payload TCP. PMTUD usa DF y mensajes ICMP para ajustar tamaño. Un black hole ocurre cuando paquetes grandes se descartan y el ICMP necesario no llega.',
    method: 'Lee MSS del SYN, tamaños IP, DF, fragmentos e ICMP too big/fragmentation needed. Busca patrón: pequeños funcionan, grandes se retransmiten.',
    code: 'tcp.options.mss_val\nip.flags.df == 1\nip.flags.mf == 1 || ip.frag_offset > 0\nicmp.type == 3 && icmp.code == 4\nicmpv6.type == 2',
    warning: 'MSS anunciado no prueba MTU del camino completo; túneles pueden reducirla después.',
    practice: ['Calcula MSS esperado', 'Busca ICMP citado', 'Describe black-hole signature'],
  },
  'throughput': {
    concept: 'Throughput útil depende de capacidad, RTT, pérdida, congestion window, receive window y patrón de aplicación. BDP indica bytes necesarios en vuelo; una ventana menor limita aunque el enlace tenga capacidad.',
    method: 'Grafica bytes por segundo y bytes in flight, mide RTT y ventana, calcula BDP, observa pausas de aplicación y retransmisiones.',
    code: 'tcp.analysis.bytes_in_flight\ntcp.window_size\ntcp.len\nStatistics → TCP Stream Graphs → Throughput',
    warning: 'Velocidad de enlace no equivale a throughput de una sola sesión.',
    practice: ['Calcula BDP', 'Compara ventana efectiva', 'Identifica pausas del emisor'],
  },
  'reporting': {
    concept: 'Un reporte útil contiene síntoma, alcance, método, hallazgos, evidencia, conclusión, limitaciones y próxima acción. Cada afirmación debe poder reproducirse con frames o comandos.',
    method: 'Lidera con impacto y causa sustentada, incluye timeline mínimo y tabla de evidencia. Distingue confirmado, probable y no evaluable.',
    code: 'Hallazgo → evidencia → interpretación → impacto → límite → siguiente prueba',
    warning: 'Capturas bonitas sin pregunta ni conclusión no son un diagnóstico.',
    practice: ['Cita tres frames', 'Declara una limitación', 'Propón prueba falsable'],
  },
  'forensic-triage': {
    concept: 'Triage forense preserva integridad y reduce volumen sin alterar el original. Parte de hash, alcance y tiempo; después inventaría protocolos, hosts, nombres y conversaciones.',
    method: 'Calcula hash, trabaja sobre copia, ejecuta Capinfos/TShark, extrae indicadores a una tabla y prioriza ventanas alrededor de alertas.',
    code: 'sha256sum incident.pcapng\ncapinfos incident.pcapng\ntshark -r incident.pcapng -q -z io,phs -z endpoints,ip',
    warning: 'Una dirección o dominio “raro” no es malicioso sin contexto y corroboración.',
    practice: ['Preserva hash', 'Crea inventario', 'Prioriza tres entidades'],
  },
  'scanning': {
    concept: 'Scanning produce patrones de intentos hacia muchos puertos/hosts, respuestas RST, SYN/ACK o silencio. La forma depende de técnica, rate y filtrado.',
    method: 'Cuenta SYN iniciales por origen/destino, diversidad de puertos y ratio de respuestas. Construye ventana temporal y compara actividad legítima.',
    code: 'tcp.flags.syn == 1 && tcp.flags.ack == 0\ntcp.flags.reset == 1\nicmp.type == 3',
    warning: 'Monitoreo, inventario y health checks pueden parecer scanning. Atribuye intención solo con contexto.',
    practice: ['Cuenta puertos únicos', 'Clasifica respuestas', 'Describe patrón temporal'],
  },
  'beaconing': {
    concept: 'Beaconing son conexiones periódicas o casi periódicas hacia un destino. Malware introduce jitter; software legítimo también actualiza y telemetría. Intervalo, tamaño, destino y duración forman el perfil.',
    method: 'Filtra par origen/destino, exporta timestamps, calcula deltas y grafica. Compara varios hosts y resuelve dominio/certificado.',
    code: 'tshark -r incident.pcapng -Y "ip.addr==192.0.2.10" -T fields -e frame.time_epoch -e ip.dst -e tcp.len',
    warning: 'Periodicidad es indicador, no veredicto. Busca corroboración de proceso, DNS y contenido.',
    practice: ['Calcula deltas', 'Mide jitter', 'Compara tamaños'],
  },
  'dns-tunnel': {
    concept: 'Tunneling DNS puede usar labels largos, alta entropía, tipos inusuales, volumen o respuestas consistentes. CDN, DKIM y tracking también producen nombres largos.',
    method: 'Perfila consultas por cliente/dominio, longitud, tasa, NXDOMAIN y bytes por dirección. Agrupa por dominio registrable y compara baseline.',
    code: 'dns.qry.name.len > 60\ndns.flags.rcode == 3\ndns.qry.type in {16 10}\ndns.count.labels > 8',
    warning: 'Longitud o entropía aislada genera falsos positivos; combina múltiples señales.',
    practice: ['Ordena por longitud', 'Cuenta subdominios únicos', 'Estima dirección de datos'],
  },
  'exfil': {
    concept: 'Exfiltración se investiga midiendo destino, dirección, volumen, duración, horario y canal. Cifrado impide ver contenido pero no elimina metadatos.',
    method: 'Usa Conversations, bytes A→B/B→A, IO Graph y timeline. Compara con función del host y baseline, y correlaciona DNS/TLS.',
    code: 'tshark -r incident.pcapng -q -z conv,tcp\ntls.handshake.extensions_server_name\nframe.time_relative',
    warning: 'Upload grande puede ser backup legítimo. Reporta transferencia observada y evidencia adicional, no intención inventada.',
    practice: ['Cuantifica bytes salientes', 'Identifica destino', 'Declara hipótesis alternativa'],
  },
  'timeline': {
    concept: 'Timeline convierte paquetes en eventos verificables: resolución, conexión, autenticación, transferencia y cierre. Une fuentes por timestamps normalizados y entidades.',
    method: 'Selecciona frames clave, exporta UTC/epoch, actor, acción y evidencia. Correlaciona logs sin ocultar offsets y separa hecho de inferencia.',
    code: 'tshark -r incident.pcapng -T fields -e frame.number -e frame.time_epoch -e ip.src -e ip.dst -e _ws.col.Info',
    warning: 'No llenes huecos narrativos con certeza. Marca desconocido y propone la evidencia necesaria.',
    practice: ['Crea cinco eventos', 'Cita frame por evento', 'Redacta conclusión y límites'],
  },
})

const guideBlocks = (id: string): LessonBlock[] => {
  const guide = guides[id]
  if (!guide) throw new Error(`La lección ${id} no tiene contenido redactado`)
  return [
    { type: 'text', title: 'Concepto', body: guide.concept },
    { type: 'text', title: 'Método de análisis', body: guide.method },
    { type: 'code', label: 'CAMPOS, FILTROS O COMANDOS', value: guide.code },
    { type: 'callout', title: 'Cuidado con esta conclusión', body: guide.warning },
    { type: 'checklist', title: 'Práctica guiada', items: guide.practice },
  ]
}

const lesson = (id: string, number: string, title: string, summary: string, objectives: string[], blocks?: LessonBlock[], minutes = 12): Lesson => ({
  id, number, title, summary, objectives, minutes, xp: 40,
  draft: !blocks && !guides[id],
  blocks: blocks ?? guideBlocks(id),
})

export const modules: CourseModule[] = [
  {
    id: '01', title: 'Conoce Wireshark', eyebrow: 'Fundamentos', icon: Compass,
    description: 'Qué es, cómo observa la red y cómo preparar un entorno seguro.', lab: 'Tu primera captura',
    status: 'ready',
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
      lesson('interface-tour', '01.04', 'Tour por la interfaz', 'Ubica los controles y aprende a elegir la interfaz correcta antes de capturar.',
        ['Usar Packet List, Details y Bytes', 'Elegir una interfaz', 'Relacionar selección y resaltado'], [
          { type: 'text', title: 'Tres paneles, una misma evidencia', body: 'Packet List resume cada frame. Packet Details presenta capas y campos disectados. Packet Bytes muestra el contenido original y resalta los bytes correspondientes al campo seleccionado.' },
          { type: 'text', title: 'La pantalla inicial: ¿qué interfaz elijo?', body: 'Elige la interfaz por la que sale tu tráfico: normalmente Wi-Fi si estás conectado inalámbricamente o Ethernet si usas cable. La gráfica pequeña que se mueve junto al nombre confirma actividad. Loopback sirve únicamente para servicios en tu propia computadora; “any” existe en Linux y mezcla varias interfaces.' },
          { type: 'code', label: 'IDENTIFICA LA RUTA ACTIVA SEGÚN TU SISTEMA', value: 'Linux:   ip route get 1.1.1.1\nWindows: Get-NetRoute -DestinationPrefix 0.0.0.0/0\nmacOS:   route get default' },
          { type: 'callout', title: 'Para la siguiente lección', body: 'No necesitas capturar tráfico real si todavía no tienes permisos. La lección 5 incluye un PCAP sintético descargable y una ruta opcional para crear el tuyo.' },
          { type: 'checklist', title: 'Ubica estos controles', items: ['Aleta azul: iniciar captura', 'Cuadro rojo: detener captura', 'Barra superior: display filter', 'Packet List, Packet Details y Packet Bytes', 'File → Open y File → Save As'] },
        ], 15),
      lesson('first-capture', '01.05', 'Tu primera captura controlada', 'Abre la captura incluida o genera una propia siguiendo pasos exactos.',
        ['Abrir el PCAP incluido', 'Elegir la interfaz correcta', 'Iniciar, detener y guardar una captura'], [
          { type: 'download', label: 'OPCIÓN A · RECOMENDADA PARA EMPEZAR', body: 'Captura sintética de seis paquetes. No contiene tráfico local ni datos personales.', href: '/captures/module-01-first-capture.pcap', meta: 'PCAP · 6 paquetes · SHA-256 03946b9a…7614' },
          { type: 'text', title: 'Abre el archivo incluido', body: 'Pulsa Descargar PCAP, abre Wireshark y selecciona File → Open. Elige module-01-first-capture.pcap. Debes ver dos paquetes DNS, un handshake TCP de tres paquetes y un TLS Client Hello. Con esto puedes completar el ejercicio sin capturar nada de tu equipo.' },
          { type: 'text', title: 'Opción B: genera tu propia captura', body: 'En la pantalla inicial, haz doble clic en Wi-Fi o Ethernet —la interfaz cuya gráfica muestre actividad—. Deja vacío el campo capture filter. Cuando comience la captura, abre otra terminal, ejecuta los comandos siguientes, vuelve a Wireshark y pulsa el cuadro rojo.' },
          { type: 'code', label: 'GENERA DOS ACCIONES CONOCIDAS', value: 'nslookup example.com\ncurl -I https://example.com' },
          { type: 'text', title: 'Encuentra y guarda el resultado', body: 'Pega el filtro de abajo en la barra superior y presiona Enter. Después usa File → Save As, selecciona PCAPNG y guarda el archivo como module-01-my-capture.pcapng fuera del repositorio. Si no aparecen paquetes, vuelve a la pantalla inicial y prueba la otra interfaz con actividad.' },
          { type: 'code', label: 'DISPLAY FILTER — NO ES CAPTURE FILTER', value: 'dns.qry.name == "example.com" || tls.handshake.extensions_server_name == "example.com"' },
          { type: 'checklist', title: 'Evidencia que debes localizar', items: ['Consulta DNS del cliente', 'Respuesta DNS con una dirección', 'SYN / SYN-ACK / ACK hacia 443', 'Client Hello de TLS', 'example.com dentro del campo SNI'] },
          { type: 'callout', title: 'La captura propia es opcional', body: 'La ruta principal usa el PCAP incluido. Capturar en tu equipo solo sirve para practicar los controles de la interfaz.' },
        ], 24),
      lesson('pcap-files', '01.06', 'PCAP, PCAPNG y metadatos', 'Continúa con el archivo de la lección 5 y aprende a preservarlo e inspeccionarlo.',
        ['Diferenciar PCAP y PCAPNG', 'Usar Capinfos sobre un archivo concreto', 'Conservar integridad y contexto'], [
          { type: 'text', title: 'Continúa con el mismo archivo', body: 'Usa module-01-first-capture.pcap si elegiste la descarga, o module-01-my-capture.pcapng si hiciste tu captura. No necesitas obtener un tercer archivo.' },
          { type: 'text', title: 'Dos contenedores', body: 'PCAP es simple y ampliamente compatible. PCAPNG admite múltiples interfaces, comentarios, estadísticas y metadatos adicionales. Para capturas nuevas suele ser la mejor opción; el ejemplo incluido usa PCAP para máxima compatibilidad.' },
          { type: 'code', label: 'TRIAGE DEL ARCHIVO INCLUIDO — DESDE LA RAÍZ DEL PROYECTO', value: 'capinfos public/captures/module-01-first-capture.pcap\ntshark -r public/captures/module-01-first-capture.pcap -q -z io,phs' },
          { type: 'callout', title: 'Preserva el original', body: 'Trabaja sobre una copia, calcula un hash y documenta toda transformación. Las capturas propias permanecen ignoradas por Git para evitar publicarlas por accidente.' },
          { type: 'checklist', title: 'Ficha mínima de una captura', items: ['Origen: sintética incluida o propia', 'Hash SHA-256', 'Inicio y duración', 'Número de paquetes', 'Interfaz y capture filter', 'Zona horaria y responsable'] },
        ], 16),
    ],
  },
  {
    id: '02', title: 'Leer paquetes', eyebrow: 'Anatomía', icon: Layers3,
    description: 'De la trama a la aplicación: capas, campos, bytes y tiempo.', lab: 'Autopsia de un paquete',
    status: 'ready',
    lessons: [
      lesson('frame-anatomy','02.01','Anatomía de un frame','Interpreta longitud capturada, longitud en el medio, timestamps y encapsulación.',
        ['Leer metadatos Frame','Detectar truncamiento','Reconocer encapsulación'],[
          { type: 'download', label: 'ARCHIVO DE TRABAJO · REUTILIZAMOS EL MÓDULO 1', body: 'Usaremos la misma muestra segura para aprender a leer cada capa. No necesitas otra captura.', href: '/captures/module-01-first-capture.pcap', meta: 'PCAP · 6 paquetes · sintético' },
          { type: 'text', title: 'Frame no es sinónimo de paquete', body: 'Wireshark llama Frame al registro capturado completo. Dentro puede existir una trama Ethernet, un paquete IP, un segmento TCP y datos TLS. La sección Frame describe la observación: cuándo llegó, cuánto medía, cuánto se guardó y con qué encapsulación fue interpretada.' },
          { type: 'text', title: 'Longitud en el medio vs. longitud capturada', body: 'Frame length es el tamaño reportado del frame original. Capture length es lo que el capturador conservó. Si capture length es menor, hubo truncamiento deliberado por snap length o una limitación de captura; los protocolos superiores pueden quedar incompletos.' },
          { type: 'code', label: 'CAMPOS Y FILTRO DE TRUNCAMIENTO', value: 'frame.number\nframe.time_relative\nframe.time_delta_displayed\nframe.len\nframe.cap_len\nframe.cap_len < frame.len' },
          { type: 'text', title: 'El tiempo depende de la pregunta', body: 'Arrival Time sirve para correlacionar con logs. Time since beginning facilita una línea temporal. Delta time displayed mide separación entre paquetes visibles después del filtro; no necesariamente entre paquetes consecutivos del archivo.' },
          { type: 'checklist', title: 'Práctica con el frame 6', items: ['Expande Frame y anota arrival time', 'Compara 168 bytes en wire y capturados', 'Confirma encapsulación Ethernet', 'Observa los protocolos listados', 'Agrega frame.time_delta_displayed como columna'] },
        ],18),
      lesson('ethernet','02.02','Ethernet, MAC y EtherType','Relaciona direcciones L2, tipos y etiquetas con el dominio de captura.',
        ['Leer cabecera Ethernet','Distinguir unicast, multicast y broadcast','Identificar EtherType'],[
          { type: 'text', title: 'La cabecera que entrega localmente', body: 'Ethernet II comienza con MAC destino, MAC origen y EtherType. Las MAC solo tienen significado dentro del dominio de capa 2 actual: al cruzar un router, las direcciones Ethernet cambian aunque las IP extremo a extremo normalmente permanezcan.' },
          { type: 'text', title: 'Individual, grupal y local', body: 'El bit menos significativo del primer octeto indica individual o group address; broadcast usa ff:ff:ff:ff:ff:ff. El siguiente bit distingue direcciones universalmente administradas de direcciones locales. La muestra usa MAC locales 02:00:00:00:00:10 y 02:00:00:00:00:01 para no representar hardware real.' },
          { type: 'code', label: 'FILTROS ETHERNET ÚTILES', value: 'eth.addr == 02:00:00:00:00:10\neth.dst == ff:ff:ff:ff:ff:ff\neth.dst.ig == 1\neth.src.lg == 1\neth.type == 0x0800' },
          { type: 'callout', title: 'No atribuyas identidad a una MAC', body: 'Virtualización, privacidad, spoofing y cambios de segmento hacen que una MAC no identifique por sí sola a una persona o dispositivo físico.' },
          { type: 'checklist', title: 'Práctica con la muestra', items: ['Comprueba que los seis frames usan Ethernet II', 'Identifica qué MAC representa al cliente', 'Observa que el gateway es el vecino L2 aunque la IP destino sea remota', 'Confirma EtherType 0x0800 para IPv4'] },
        ],17),
      lesson('vlan-arp','02.03','VLAN y ARP en contexto','Sigue resolución local y etiquetas 802.1Q sin perder la topología.',
        ['Analizar ARP','Leer VLAN ID','Detectar respuestas anómalas'],[
          { type: 'text', title: 'ARP responde una pregunta local', body: 'Antes de enviar IPv4 dentro de una LAN, el host necesita una MAC para el siguiente salto. Si el destino es local pregunta por la MAC del destino; si es remoto pregunta por la MAC del default gateway. ARP no cruza routers.' },
          { type: 'code', label: 'FILTROS ARP', value: 'arp\narp.opcode == 1\narp.opcode == 2\narp.duplicate-address-detected\narp.src.proto_ipv4 == arp.dst.proto_ipv4' },
          { type: 'text', title: 'Dónde aparece 802.1Q', body: 'Una etiqueta VLAN se inserta entre las MAC y el EtherType original. Incluye PCP, DEI y un VLAN ID de 12 bits. Si capturas en un endpoint es normal no verla: el switch o el driver pueden agregarla o retirarla fuera de tu punto de observación.' },
          { type: 'code', label: 'FILTROS VLAN', value: 'vlan\nvlan.id == 20\nvlan.priority >= 5\neth.type == 0x8100' },
          { type: 'callout', title: 'La muestra del módulo no contiene ARP/VLAN', body: 'Esto es intencional y está declarado: los ejemplos interactivos llegarán con Lab 02. No interpretes la ausencia de etiquetas como prueba de que la red no usa VLAN.' },
          { type: 'checklist', title: 'Método de análisis', items: ['Define si la IP destino es local o remota', 'Predice por qué IP debería preguntar ARP', 'Relaciona request y reply', 'Comprueba consistencia IP–MAC', 'Documenta si el punto de captura puede ver tags'] },
        ],18),
      lesson('ip-fields','02.04','IPv4 e IPv6 campo por campo','TTL, Hop Limit, DSCP, fragmentación y siguiente cabecera como evidencia.',
        ['Interpretar TTL y Hop Limit','Reconocer fragmentación','Comparar IPv4 e IPv6'],[
          { type: 'text', title: 'Direcciones y longitud', body: 'IPv4 declara header length y total length; IPv6 usa un encabezado base fijo y payload length. Comprueba que el protocolo indicado —TCP, UDP, ICMP o una extension header— coincida con lo que Wireshark disecta después.' },
          { type: 'text', title: 'TTL no es distancia exacta', body: 'Cada router reduce TTL o Hop Limit. Puedes inferir cambios de camino comparando valores consistentes del mismo emisor, pero no conoces el valor inicial con certeza y diferentes sistemas eligen valores iniciales distintos.' },
          { type: 'code', label: 'FILTROS IP PARA LA MUESTRA Y FUTUROS LABS', value: 'ip.addr == 192.0.2.10\nip.ttl < 10\nip.flags.mf == 1 || ip.frag_offset > 0\nipv6\nipv6.hlim < 10' },
          { type: 'text', title: 'Fragmentación', body: 'IPv4 puede fragmentarse en tránsito salvo que DF esté activo. En IPv6 solo el origen fragmenta mediante una extension header. Wireshark puede reensamblar para análisis, pero conserva referencias a los fragmentos originales.' },
          { type: 'checklist', title: 'Práctica con los frames 1 y 3', items: ['Compara IP origen y destino', 'Encuentra total length', 'Confirma TTL 64', 'Comprueba DF activo', 'Relaciona Protocol 17 con UDP y Protocol 6 con TCP'] },
        ],20),
      lesson('transport','02.05','TCP y UDP en la captura','Puertos, checksums, flags y longitud desde la perspectiva del analizador.',
        ['Localizar puertos','Leer flags','Validar longitud'],[
          { type: 'text', title: 'Dos modelos de transporte', body: 'UDP entrega datagramas sin handshake ni confiabilidad integrada. TCP mantiene una secuencia de bytes, confirma recepción y controla flujo. Los puertos identifican endpoints de transporte, no aplicaciones de manera infalible.' },
          { type: 'text', title: 'Lee la conversación en ambas direcciones', body: 'Una conversación queda definida por protocolo, IP y puerto de ambos lados. En la muestra, UDP 53000→53 transporta la consulta DNS; TCP 51544→443 inicia una conexión. El puerto efímero pertenece al cliente en este caso, no por regla universal.' },
          { type: 'code', label: 'FILTROS DE TRANSPORTE', value: 'udp.port == 53\ntcp.port == 443\ntcp.flags.syn == 1\ntcp.flags.syn == 1 && tcp.flags.ack == 0\ntcp.len > 0' },
          { type: 'callout', title: 'Checksum incorrecto puede ser una ilusión', body: 'En una captura tomada en el host, checksum offloading puede hacer que Wireshark vea el paquete antes de que la NIC calcule el checksum. Correlaciona el punto de captura antes de diagnosticar corrupción.' },
          { type: 'checklist', title: 'Práctica con los frames 3–6', items: ['Reconstruye SYN, SYN/ACK y ACK', 'Identifica los puertos cliente/servidor', 'Comprueba que solo el frame 6 tiene TCP payload', 'Relaciona PSH/ACK con datos TLS', 'Observa números de secuencia relativos'] },
        ],20),
      lesson('encapsulation','02.06','Encapsulación sin memorizar OSI','Navega túneles y capas anidadas usando el árbol real del paquete.',
        ['Seguir capas','Detectar túneles','Ubicar payload'],[
          { type: 'text', title: 'Lee de afuera hacia adentro', body: 'En lugar de recitar capas, sigue el árbol de Wireshark: Frame → Ethernet → IP → TCP → TLS. Cada protocolo usa un campo para indicar qué viene después. Los bytes resaltados permiten comprobar exactamente dónde empieza y termina cada cabecera.' },
          { type: 'code', label: 'INVENTARIO DE CAPAS', value: 'frame.protocols\neth.type\nip.proto\nipv6.nxt\ntcp.port\n_ws.col.protocol' },
          { type: 'text', title: 'Cuando aparecen más capas', body: 'GRE, VXLAN, IPsec, MPLS y VPN añaden encapsulación. Podrías ver Ethernet/IP/UDP/VXLAN/Ethernet/IP/TCP: dos redes completas dentro del mismo frame. Identifica siempre outer headers, tunnel identifier e inner headers.' },
          { type: 'callout', title: 'El protocolo más alto no cuenta toda la historia', body: 'Que la columna Protocol diga TLS no elimina Ethernet, IP y TCP. Solo resume el disector más específico alcanzado.' },
          { type: 'checklist', title: 'Cierre del módulo con el frame 6', items: ['Escribe la pila completa en orden', 'Selecciona SNI y localiza sus bytes', 'Identifica qué campo enlaza IP con TCP', 'Identifica qué puerto lleva a TLS', 'Explica qué cambiaría al cruzar un router'] },
        ],18),
    ],
  },
  {
    id: '03', title: 'Filtros sin sufrimiento', eyebrow: 'Display & capture', icon: Filter,
    description: 'Encuentra la aguja sin esconder evidencia importante.', lab: 'Cacería de paquetes',
    status: 'ready',
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
    status: 'ready',
    lessons: [
      lesson('triage','04.01','Triage de un PCAP desconocido','Aprende el método de triage que aplicarás cuando el módulo proporcione su captura de práctica.',['Crear inventario','Priorizar flujos','Documentar hipótesis']),
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
    status: 'ready',
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
    status: 'ready',
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
    status: 'ready',
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
    status: 'ready',
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
    status: 'ready',
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
    status: 'ready',
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
export const availableLessons = allLessons.filter(item => !item.draft)

export const labs = modules.map((module, index) => ({
  id: `lab-${module.id}`,
  moduleId: module.id,
  number: module.id,
  title: module.lab ?? `Laboratorio ${module.id}`,
  moduleTitle: module.title,
  description: [
    'Usa el PCAP sintético incluido —o genera uno opcional— y demuestra cada etapa de DNS, TCP y TLS.',
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
  available: true,
}))

export const introPackets = [
  { frame: 1, time: '0.000', source: '192.0.2.10', destination: '192.0.2.53', info: 'Standard query A example.com', kind: 'data' },
  { frame: 2, time: '0.018', source: '192.0.2.53', destination: '192.0.2.10', info: 'Standard query response A 93.184.216.34', kind: 'ack' },
  { frame: 3, time: '0.021', source: '192.0.2.10', destination: '93.184.216.34', info: '51544 → 443 [SYN]', kind: 'syn' },
  { frame: 4, time: '0.058', source: '93.184.216.34', destination: '192.0.2.10', info: '443 → 51544 [SYN, ACK]', kind: 'syn' },
  { frame: 5, time: '0.058', source: '192.0.2.10', destination: '93.184.216.34', info: '51544 → 443 [ACK]', kind: 'ack' },
  { frame: 6, time: '0.061', source: '192.0.2.10', destination: '93.184.216.34', info: 'TLS Client Hello (SNI=example.com)', kind: 'data' },
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


export const labCases: Record<string, {
  filter: string
  hint: string
  packets: typeof packets
  questions: typeof quiz
}> = {
  'lab-01': { filter: 'dns || tcp.flags.syn == 1 || tls.handshake.type == 1', hint: 'Ordena por tiempo: resolución, conexión y después TLS.', packets: introPackets, questions: introQuiz },
  'lab-02': {
    filter: 'arp || vlan || ip || tcp', hint: 'Sigue cada encapsulación desde Ethernet hacia adentro.',
    packets: [
      { frame: 1,time:'0.000',source:'02:00:00:00:00:20',destination:'ff:ff:ff:ff:ff:ff',info:'ARP Who has 192.0.2.1? Tell 192.0.2.20',kind:'data' },
      { frame: 2,time:'0.002',source:'02:00:00:00:00:01',destination:'02:00:00:00:00:20',info:'ARP 192.0.2.1 is at 02:00:00:00:00:01',kind:'ack' },
      { frame: 3,time:'0.010',source:'192.0.2.20',destination:'198.51.100.10',info:'802.1Q VLAN 20 · TCP 51000 → 443 [SYN] TTL=64',kind:'syn' },
      { frame: 4,time:'0.042',source:'198.51.100.10',destination:'192.0.2.20',info:'802.1Q VLAN 20 · TCP 443 → 51000 [SYN, ACK] TTL=55',kind:'syn' },
      { frame: 5,time:'0.042',source:'192.0.2.20',destination:'198.51.100.10',info:'802.1Q VLAN 20 · TCP 51000 → 443 [ACK]',kind:'ack' },
    ],
    questions: [
      { question:'¿Por qué el cliente pregunta por 192.0.2.1 y no por la IP remota?',answers:['Porque es el DNS','Porque es su siguiente salto','Porque TCP exige ARP remoto','Porque VLAN 20 cambia IP'],correct:1,explanation:'El destino está fuera de la red local; Ethernet necesita la MAC del default gateway.' },
      { question:'¿Qué campo separa lógicamente estos frames de otras VLAN?',answers:['TTL 64','Puerto 443','VLAN ID 20','MAC broadcast'],correct:2,explanation:'La etiqueta 802.1Q contiene VLAN ID 20.' },
      { question:'¿Qué cambia normalmente al cruzar un router?',answers:['IP origen final','Puerto TCP','MAC de siguiente salto','SNI'],correct:2,explanation:'Las cabeceras Ethernet se reescriben por segmento; las IP suelen mantenerse salvo NAT.' },
    ],
  },
  'lab-03': {
    filter: '(dns || tcp || http) && ip.addr == 192.0.2.30', hint: 'Primero traduce la pregunta a protocolo, host y condición.',
    packets: [
      {frame:1,time:'0.000',source:'192.0.2.30',destination:'192.0.2.53',info:'DNS query A portal.example',kind:'data'},
      {frame:2,time:'0.015',source:'192.0.2.53',destination:'192.0.2.30',info:'DNS response A 198.51.100.30',kind:'ack'},
      {frame:3,time:'0.020',source:'192.0.2.40',destination:'203.0.113.8',info:'Unrelated TCP 53000 → 22 [SYN]',kind:'syn'},
      {frame:4,time:'0.030',source:'192.0.2.30',destination:'198.51.100.30',info:'TCP 52000 → 80 [SYN]',kind:'syn'},
      {frame:5,time:'0.061',source:'198.51.100.30',destination:'192.0.2.30',info:'TCP 80 → 52000 [SYN, ACK]',kind:'syn'},
      {frame:6,time:'0.070',source:'192.0.2.30',destination:'198.51.100.30',info:'HTTP GET /status Host: portal.example',kind:'data'},
      {frame:7,time:'0.093',source:'198.51.100.30',destination:'192.0.2.30',info:'HTTP/1.1 503 Service Unavailable',kind:'warn'},
    ],
    questions: [
      {question:'¿Qué display filter conserva DNS, TCP y HTTP solo del cliente?',answers:['port 80','ip.addr == 192.0.2.30 && (dns || tcp || http)','host 192.0.2.30','tcp.port == 53'],correct:1,explanation:'Usa campos de display filter y paréntesis para limitar los tres protocolos al host.'},
      {question:'¿Qué frame demuestra el error de aplicación?',answers:['2','3','6','7'],correct:3,explanation:'El status HTTP 503 aparece en el frame 7.'},
      {question:'¿Cuál expresión sería capture filter equivalente aproximada?',answers:['ip.addr == 192.0.2.30','host 192.0.2.30 and (port 53 or port 80)','dns.qry.name','tcp.flags.syn == 1'],correct:1,explanation:'BPF usa host/port, no nombres de campos Wireshark.'},
    ],
  },
  'lab-04': {
    filter:'ip.addr == 192.0.2.50', hint:'Reduce primero a endpoints y luego a una conversación.',
    packets:[
      {frame:1,time:'0.000',source:'192.0.2.50',destination:'192.0.2.53',info:'DNS query api.example',kind:'data'},
      {frame:2,time:'0.012',source:'192.0.2.53',destination:'192.0.2.50',info:'DNS response 198.51.100.50',kind:'ack'},
      {frame:3,time:'0.020',source:'192.0.2.50',destination:'198.51.100.50',info:'TCP stream 0 SYN',kind:'syn'},
      {frame:4,time:'0.052',source:'198.51.100.50',destination:'192.0.2.50',info:'TCP stream 0 SYN, ACK',kind:'syn'},
      {frame:5,time:'0.070',source:'192.0.2.50',destination:'203.0.113.60',info:'TCP stream 1 SYN',kind:'syn'},
      {frame:6,time:'0.400',source:'198.51.100.50',destination:'192.0.2.50',info:'TCP stream 0 Application Data Len=4096',kind:'data'},
    ],
    questions:[
      {question:'¿Cuántas conversaciones TCP inicia el cliente?',answers:['Una','Dos','Tres','Cuatro'],correct:1,explanation:'Los streams 0 y 1 representan dos pares TCP distintos.'},
      {question:'¿Qué stream contiene la mayor transferencia visible?',answers:['DNS','TCP stream 0','TCP stream 1','No se puede observar'],correct:1,explanation:'Stream 0 muestra 4096 bytes de datos; stream 1 solo un SYN.'},
      {question:'¿Qué intervalo aproxima espera antes de los datos del stream 0?',answers:['12 ms','20 ms','348 ms','400 s'],correct:2,explanation:'Desde SYN/ACK en 0.052 hasta datos en 0.400 transcurren 348 ms.'},
    ],
  },
  'lab-05': { filter:'tcp.stream == 0', hint:'Compara secuencia, ACK y delta antes de aceptar la etiqueta.', packets, questions:quiz },
  'lab-06': {
    filter:'dns || icmp',hint:'Separa fallo de resolución de fallo de conectividad IP.',
    packets:[
      {frame:1,time:'0.000',source:'192.0.2.60',destination:'192.0.2.53',info:'DNS query A intranet.example',kind:'data'},
      {frame:2,time:'0.030',source:'192.0.2.53',destination:'192.0.2.60',info:'DNS response NXDOMAIN',kind:'warn'},
      {frame:3,time:'1.000',source:'192.0.2.60',destination:'192.0.2.53',info:'DNS query AAAA intranet.example',kind:'data'},
      {frame:4,time:'1.031',source:'192.0.2.53',destination:'192.0.2.60',info:'DNS response NXDOMAIN',kind:'warn'},
      {frame:5,time:'2.000',source:'192.0.2.60',destination:'198.51.100.1',info:'ICMP Echo request',kind:'data'},
      {frame:6,time:'2.025',source:'198.51.100.1',destination:'192.0.2.60',info:'ICMP Echo reply',kind:'ack'},
    ],
    questions:[
      {question:'¿Qué servicio falla según la evidencia?',answers:['Conectividad IP','DNS para ese nombre','DHCP','NTP'],correct:1,explanation:'A y AAAA responden NXDOMAIN mientras ICMP confirma conectividad IP.'},
      {question:'¿Cuánto tarda aproximadamente cada respuesta DNS?',answers:['3 s','1 s','30 ms','No responde'],correct:2,explanation:'Los pares 1→2 y 3→4 muestran cerca de 30 ms.'},
      {question:'¿Qué conclusión es defendible?',answers:['Internet está caído','El servidor web rechaza TCP','El nombre no existe según el resolver observado','ICMP está bloqueado'],correct:2,explanation:'Eso es exactamente lo que sustentan los rcodes observados.'},
    ],
  },
  'lab-07': {
    filter:'dns || tcp.flags.syn == 1 || http',hint:'Divide la carga en DNS, conexión, request y espera del servidor.',
    packets:[
      {frame:1,time:'0.000',source:'192.0.2.70',destination:'192.0.2.53',info:'DNS query slow.example',kind:'data'},
      {frame:2,time:'0.020',source:'192.0.2.53',destination:'192.0.2.70',info:'DNS response 198.51.100.70',kind:'ack'},
      {frame:3,time:'0.022',source:'192.0.2.70',destination:'198.51.100.70',info:'TCP 57000 → 80 [SYN]',kind:'syn'},
      {frame:4,time:'0.062',source:'198.51.100.70',destination:'192.0.2.70',info:'TCP 80 → 57000 [SYN, ACK]',kind:'syn'},
      {frame:5,time:'0.140',source:'192.0.2.70',destination:'198.51.100.70',info:'HTTP GET /dashboard Host: slow.example',kind:'data'},
      {frame:6,time:'2.640',source:'198.51.100.70',destination:'192.0.2.70',info:'HTTP 200 OK · first response byte',kind:'warn'},
    ],
    questions:[
      {question:'¿Qué fase domina el tiempo?',answers:['DNS 20 ms','TCP 40 ms','Espera request→response 2.5 s','Transferencia 20 ms'],correct:2,explanation:'La espera después del GET representa 2.5 segundos.'},
      {question:'¿Qué frame contiene la solicitud que inicia la operación?',answers:['1','3','5','6'],correct:2,explanation:'El frame 5 contiene GET /dashboard; desde ahí medimos hasta la respuesta.'},
      {question:'¿Qué componente es el principal sospechoso, con límites?',answers:['Resolver','Camino TCP','Lado servidor/aplicación','Cliente antes de DNS'],correct:2,explanation:'La gran espera ocurre después del request; puede incluir servidor, proxy o cola.'},
    ],
  },
  'lab-08': {
    filter:'tcp.analysis.flags || tcp.checksum.status == 0 || frame.len > 1514',hint:'Pregunta si los paquetes observados podrían existir así en el cable.',
    packets:[
      {frame:1,time:'0.000000',source:'192.0.2.80',destination:'198.51.100.80',info:'TCP Len=8760 [Checksum incorrect] · host capture',kind:'warn'},
      {frame:2,time:'0.000120',source:'192.0.2.80',destination:'198.51.100.80',info:'TCP Retransmission Seq=1 Len=1460',kind:'warn'},
      {frame:3,time:'0.000121',source:'192.0.2.80',destination:'198.51.100.80',info:'TCP Retransmission Seq=1461 Len=1460',kind:'warn'},
      {frame:4,time:'0.030000',source:'198.51.100.80',destination:'192.0.2.80',info:'ACK 8761',kind:'ack'},
      {frame:5,time:'0.030001',source:'198.51.100.80',destination:'192.0.2.80',info:'Duplicate mirrored ACK 8761',kind:'warn'},
    ],
    questions:[
      {question:'¿Qué sugiere Len=8760 en captura del host?',answers:['MTU real 9000 confirmado','Posible TSO/GSO','DNS tunneling','Zero Window'],correct:1,explanation:'Un supersegmento local puede existir antes de segmentación por NIC.'},
      {question:'¿Por qué 120 µs contradice un RTO normal?',answers:['Es demasiado rápido','Es demasiado lento','No existe ACK','Usa TLS'],correct:0,explanation:'TCP no esperaría un temporizador de retransmisión tan corto.'},
      {question:'¿Qué prueba pedirías?',answers:['Otro color rule','Captura en TAP u otro punto','Más resolución DNS','Desactivar TLS'],correct:1,explanation:'Otro punto permite distinguir comportamiento en cable de artefacto local/SPAN.'},
    ],
  },
  'lab-09': {
    filter:'tcp.stream == 0 || http',hint:'Mide request completo, primer byte y transferencia por separado.',
    packets:[
      {frame:1,time:'0.000',source:'192.0.2.90',destination:'198.51.100.90',info:'HTTP POST /report · request begins',kind:'data'},
      {frame:2,time:'0.080',source:'192.0.2.90',destination:'198.51.100.90',info:'HTTP request final segment',kind:'data'},
      {frame:3,time:'0.110',source:'198.51.100.90',destination:'192.0.2.90',info:'ACK request complete',kind:'ack'},
      {frame:4,time:'3.580',source:'198.51.100.90',destination:'192.0.2.90',info:'HTTP 200 OK · first byte',kind:'warn'},
      {frame:5,time:'3.620',source:'198.51.100.90',destination:'192.0.2.90',info:'HTTP response final segment',kind:'data'},
    ],
    questions:[
      {question:'¿Cuánto tarda el lado servidor observado en iniciar respuesta?',answers:['30 ms','80 ms','3.5 s','40 ms'],correct:2,explanation:'Desde request completo en 0.080 hasta first byte en 3.580 hay 3.5 s.'},
      {question:'¿Cuánto dura aproximadamente la transferencia de respuesta?',answers:['40 ms','3.5 s','110 ms','No termina'],correct:0,explanation:'Primer byte 3.580 y final 3.620: cerca de 40 ms.'},
      {question:'¿Qué conclusión está mejor sustentada?',answers:['Bandwidth insuficiente','Demora principal antes del primer byte','DNS lento','Packet loss 30%'],correct:1,explanation:'La espera domina; transferencia y ACK son relativamente rápidos.'},
    ],
  },
  'lab-10': {
    filter:'dns || (tcp.flags.syn == 1 && tcp.flags.ack == 0)',hint:'Construye timeline y busca periodicidad antes de etiquetar.',
    packets:[
      {frame:1,time:'0.000',source:'192.0.2.100',destination:'192.0.2.53',info:'DNS A cdn-update.example',kind:'data'},
      {frame:2,time:'0.020',source:'192.0.2.53',destination:'192.0.2.100',info:'DNS response 203.0.113.100',kind:'ack'},
      {frame:3,time:'1.000',source:'192.0.2.100',destination:'203.0.113.100',info:'TCP SYN → 443 · connection 1',kind:'syn'},
      {frame:4,time:'61.400',source:'192.0.2.100',destination:'203.0.113.100',info:'TCP SYN → 443 · connection 2',kind:'syn'},
      {frame:5,time:'120.700',source:'192.0.2.100',destination:'203.0.113.100',info:'TCP SYN → 443 · connection 3',kind:'syn'},
      {frame:6,time:'181.200',source:'192.0.2.100',destination:'203.0.113.100',info:'TCP SYN → 443 · connection 4',kind:'syn'},
    ],
    questions:[
      {question:'¿Qué patrón temporal aparece?',answers:['Exactamente 1 s','Aproximadamente 60 s con jitter','Una sola conexión','Transferencia continua'],correct:1,explanation:'Los intervalos rondan 59–60.5 segundos.'},
      {question:'¿Qué es hecho y no inferencia?',answers:['Es malware','Es C2','El host inicia cuatro conexiones periódicas','El dominio roba datos'],correct:2,explanation:'La periodicidad observada es un hecho; intención requiere corroboración.'},
      {question:'¿Qué siguiente evidencia aporta más?',answers:['Cambiar colores','Proceso responsable y certificado/dominio','Solo ping','Borrar el PCAP'],correct:1,explanation:'Correlacionar proceso, DNS y TLS ayuda a distinguir software legítimo de actividad maliciosa.'},
    ],
  },
}
