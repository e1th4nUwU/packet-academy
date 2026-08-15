# Capturas sintéticas del curso

Los archivos `lab-01.pcap` a `lab-10.pcap` se generan con `scripts/generate-course-pcaps.py`. Usan rangos reservados para documentación y nunca capturan interfaces locales.

`module-01-first-capture.pcap` se conserva por compatibilidad con la primera lección y se genera con `scripts/generate-lab01-pcap.py`.

Para regenerar y validar:

```bash
python3 scripts/generate-course-pcaps.py
npm run validate:content
```
