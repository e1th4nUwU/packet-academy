# Packet Academy

Academia web interactiva para aprender análisis de tráfico con Wireshark mediante incidentes, evidencia y laboratorios reproducibles. Está pensada para personas que ya conocen redes y quieren profundizar en TCP, captura, rendimiento y forense.

La aplicación incluye actualmente:

- Dashboard de campaña y progreso persistente en el navegador.
- Lección interactiva sobre retransmisiones y artefactos de captura.
- Laboratorio guiado **La retransmisión impostora**.
- Visor didáctico de paquetes, pistas y validación inmediata.
- Diseño responsive para escritorio, tablet y móvil.
- Escenario Docker opcional para generar tráfico local.
- Tema oscuro y claro.

## Requisitos

Para abrir la academia:

- [Node.js](https://nodejs.org/) 18 o posterior.
- npm 9 o posterior.

Para realizar los laboratorios completos también se recomienda:

- [Wireshark](https://www.wireshark.org/download.html), incluyendo TShark y Dumpcap.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) en Windows/macOS, o Docker Engine con el plugin Compose en Linux.
- Git, si quieres clonar y mantener actualizado el proyecto.

Docker no es necesario para navegar las lecciones ni completar los ejercicios incluidos en la interfaz.

## Inicio rápido

```bash
git clone https://github.com/e1th4nUwU/packet-academy.git
cd packet-academy
npm install
npm run dev
```

Abre la dirección que Vite muestre en la terminal, normalmente `http://localhost:5173`.

Para producir una versión optimizada:

```bash
npm run build
npm run preview
```

## Configuración por sistema

### Linux

Instala Node.js desde el repositorio de tu distribución o desde su sitio oficial. En Debian/Ubuntu, Wireshark se puede instalar con:

```bash
sudo apt update
sudo apt install wireshark tshark
```

Durante la instalación puedes permitir capturas a usuarios que no sean `root`. Después agrega tu usuario al grupo correspondiente:

```bash
sudo usermod -aG wireshark "$USER"
```

Cierra sesión y vuelve a entrar para aplicar el cambio. No ejecutes toda la interfaz de Wireshark como `root`.

Para comprobar herramientas:

```bash
chmod +x scripts/check-setup.sh
./scripts/check-setup.sh
```

### Windows

1. Instala Node.js LTS y Git.
2. Instala Wireshark y conserva la opción de instalar **Npcap**.
3. Instala Docker Desktop solamente si usarás escenarios reproducibles.
4. Abre PowerShell dentro del proyecto.

```powershell
npm install
npm run dev
```

Si Wireshark no muestra interfaces, comprueba que Npcap esté instalado y que el servicio se encuentre activo.

### macOS

Con Homebrew:

```bash
brew install node wireshark
brew install --cask docker
npm install
npm run dev
```

Al instalar Wireshark, acepta el componente de permisos de captura si macOS lo solicita. Docker es opcional y debe iniciarse antes de levantar un escenario.

## Ejecutar el escenario local

El primer escenario genera solicitudes HTTP periódicas dentro de una red Docker aislada:

```bash
docker compose -f scenarios/retransmission-impostor/compose.yaml up -d
docker compose -f scenarios/retransmission-impostor/compose.yaml ps
```

Para localizar la interfaz bridge en Linux:

```bash
docker network ls
```

Puedes capturar desde Wireshark o con Dumpcap. Sustituye `<interfaz>` por la interfaz correcta:

```bash
dumpcap -i <interfaz> -w captures/generated/retransmission-impostor.pcapng
```

En Docker Desktop para Windows y macOS, las interfaces bridge viven dentro de la VM. La opción más consistente es capturar dentro del contenedor o usar la interfaz virtual que Docker Desktop exponga. El laboratorio web funciona sin esta captura.

Al terminar:

```bash
docker compose -f scenarios/retransmission-impostor/compose.yaml down
```

## Filtros de arranque

```wireshark
tcp.analysis.retransmission
tcp.analysis.duplicate_ack
tcp.analysis.out_of_order
tcp.flags.reset == 1
tcp.window_size_value == 0
```

Recuerda que los campos `tcp.analysis.*` son inferencias calculadas a partir de lo que aparece en la captura. Son excelentes puntos de partida, pero no sustituyen la validación con sequence numbers, ACK, tiempo y punto de observación.

## Estructura

```text
src/          Aplicación, contenido y estilos
scenarios/    Redes y servicios reproducibles con Docker Compose
captures/     Capturas proporcionadas o generadas localmente
scripts/      Verificación y automatización multiplataforma
```

Las capturas generadas no se versionan para evitar publicar tráfico local por accidente.

## Comandos

| Comando | Función |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Comprueba TypeScript y construye la web |
| `npm run preview` | Sirve localmente el build de producción |
| `npm run lint` | Ejecuta las reglas de calidad |

## Seguridad de captura

- Captura únicamente redes, sistemas y datos para los que tengas autorización.
- Prefiere escenarios locales o de laboratorio.
- Revisa un PCAP antes de compartirlo: puede contener nombres, tokens, consultas DNS, cookies o credenciales.
- No publiques capturas corporativas o personales sin sanitizarlas.
- Usa `editcap` para recortar una captura y conserva siempre el original fuera del repositorio.

## Roadmap

- TCP: SACK, zero window, resets y análisis de RTT.
- Patologías de captura: SPAN duplicado, offloading y asimetría.
- DNS, HTTP/2, TLS y QUIC.
- Performance: network time frente a server time.
- Network forensics y construcción de timelines.
- Integración local controlada con TShark.

## Licencia

MIT. Consulta [LICENSE](LICENSE).
