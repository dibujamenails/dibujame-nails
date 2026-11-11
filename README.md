# Dibújame Nails Studio — Tarjeta digital V2

Sitio de una sola pantalla visual diseñado para celular con accesos táctiles a WhatsApp, citas, Instagram, Facebook, TikTok y ubicación. **No es una página tipo revista o un catálogo**; es una tarjeta de enlaces interactiva, siguiendo el boceto aprobado.

## Actualizar tu GitHub

Repositorio: https://github.com/dibujamenails/dibujame-nails

1. Descomprime `dibujame-nails-v2.zip`.
2. En el repositorio, usa **Add file → Upload files**.
3. Sube **el contenido** de la carpeta descomprimida: `index.html`, `css/`, `js/`, `assets/` y este README.
4. Confirma el commit sobre `main`. Los archivos del mismo nombre deben reemplazarse, no duplicarse dentro de una subcarpeta `dibujame-nails-v2/`.
5. GitHub Pages ya está configurado desde `main` / `(root)`. Si sigue habilitado, publicará la actualización automáticamente.
6. Abre https://dibujamenails.github.io/dibujame-nails/ y recarga sin caché si sigues viendo la versión anterior.

## Configuración

Edita **`js/config.js`**. Instagram y Facebook ya tienen enlaces reales. WhatsApp, TikTok y Maps están vacíos a propósito. Mientras estén sin configurar, al tocarlos aparece un mensaje de «Próximamente» y **no se inventan rutas**.

El botón «Agenda tu Cita» enviará un mensaje preescrito por WhatsApp tan pronto se configure el número.

## Archivos

- `index.html`: página y áreas táctiles sobre las tarjetas de la imagen
- `css/styles.css`: diseño adaptable y zonas táctiles
- `js/app.js`: apertura de enlaces, compartir y mensaje pendiente
- `js/config.js`: enlaces del negocio
- `assets/tarjeta-digital.webp`: composición visual aprobada para la portada
- `assets/logo-original.png`: logo original completo para redes y metadatos
- `assets/favicon.svg`: ícono de pestaña

### Sobre la versión visual

Esta versión coloca áreas de enlace reales sobre cada botón del diseño para obtener una apariencia muy cercana al boceto. Por ello, el texto visible pertenece a la imagen y los textos alternativos accesibles están en HTML. Para futuras variaciones frecuentes del diseño se recomendará reconstruir la composición completamente con elementos HTML editables.
