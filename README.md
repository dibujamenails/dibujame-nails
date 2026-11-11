# Dibújame Nails Studio — Versión 3.1 (botones reales + ubicación)

La tarjeta digital ahora está construida con **elementos HTML y CSS interactivos**; ya no es una imagen con áreas invisibles encima. Conserva el logo aprobado y tiene animación de presión, relieve, colores rosa-vino y dorado y diseño para celular. La vibración ligera se activa únicamente cuando el dispositivo/navegador la soporta (muchos iPhone no lo hacen).

## Enlaces configurados

- WhatsApp: `https://wa.me/522284045606` (número proporcionado: 2284045606).
- Agenda: abre WhatsApp con un mensaje preparado. **No es un sistema de calendario ni reserva automática**.
- Instagram: https://www.instagram.com/dibujame_nails/
- Facebook: https://www.facebook.com/profile.php?id=61552756146185
- TikTok: https://www.tiktok.com/@bonitatunailsx (conserva el usuario publicado aunque el negocio se llame Dibújame).
- Ubicación: https://www.google.com/maps?q=19.556879,-96.916771 (abre Google Maps con las coordenadas proporcionadas).

Puedes editar los enlaces directamente en `js/config.js`.

## Actualizar GitHub Pages

Repositorio: https://github.com/dibujamenails/dibujame-nails

1. Descomprime el ZIP.
2. En GitHub abre **Add file → Upload files** en la rama `main` y carga los **contenidos** de esta carpeta (`index.html`, `css/`, `js/`, `assets/`, `README.md`), no el ZIP ni una subcarpeta que los envuelva.
3. Reemplaza los archivos de igual nombre y confirma el cambio con **Commit changes**.
4. GitHub Pages ya estaba activado en `main` y `/ (root)`, así que debería publicar la nueva versión. Abre https://dibujamenails.github.io/dibujame-nails/.
5. Si continúa la versión anterior, recarga sin caché. Los archivos llevan `?v=3.1` en sus referencias para evitar el caché viejo.

El archivo viejo `assets/tarjeta-digital.webp` ya **no se utiliza**; puedes borrarlo de GitHub si lo deseas, sin afectar a la nueva tarjeta.

## Estructura

- `index.html`: logo, botones HTML, SVG de iconos y contenido
- `css/styles.css`: diseño táctil, sombras, transiciones y versión móvil
- `js/config.js`: enlaces y mensaje de WhatsApp
- `js/app.js`: enlace de cita, animación de pulsación, compartir y mensajes
- `assets/logo-original.png`: logo aprobado sin alteraciones
- `assets/favicon.svg`: ícono del navegador

No requiere framework, base de datos, servidor especial ni pagos; funciona con GitHub Pages.
