# Dibújame Nails Studio — Versión 4 (Calendario de solicitud de cita)

Sitio estático de enlaces para GitHub Pages, con calendario interactivo de citas.

## Qué cambia

- **Agenda tu cita** abre un calendario integrado (sin salir de la página).
- El cliente elige fecha y hora; las fechas anteriores a hoy aparecen deshabilitadas.
- Al tocar **Consultar disponibilidad por WhatsApp**, se crea un mensaje con la fecha y la hora seleccionadas para el número `2284045606`.
- **Importante**: es una *solicitud de disponibilidad*, **no una cita confirmada**. El salón debe responder por WhatsApp. No se muestran horarios libres/ocupados reales sin agenda compartida y backend.
- Se conserva el logo y los enlaces de Instagram, Facebook, TikTok y Maps.

## Cómo actualizar en GitHub

En https://github.com/dibujamenails/dibujame-nails sube el **contenido** de esta carpeta con `Add file → Upload files`, reemplazando la versión anterior.

Archivos actualizados: `index.html`, `css/styles.css`, `js/app.js` y este `README.md`. Las imágenes y `js/config.js` se incluyen por comodidad y se conservan sin cambios.

No subas una carpeta `dibujame-nails-v4-calendario` dentro del repositorio: el `index.html` tiene que quedar en la raíz.

Si se ve una versión vieja, recarga sin caché o añade `?v=4` a la dirección del sitio.

## Publicación

GitHub Pages: https://dibujamenails.github.io/dibujame-nails/

No requiere base de datos, registro, cuenta de Google ni pago mensual. Sin plataforma de disponibilidad no es posible bloquear horarios ocupados o confirmar citas automáticamente.
