# Dibújame Nails Studio — versión 1

Micrositio móvil para reunir enlaces del estudio de uñas. Desarrollado con HTML, CSS y JavaScript puro, sin servicios de pago ni base de datos.

## Ya funciona

- Página responsive, con estilo propio y el **logo original aprobado** en `assets/logo-original.png` (no se ha redibujado ni modificado).
- Enlaces de Instagram y Facebook proporcionados por el negocio.
- Botón de compartir página.
- Diseño apto para pantallas pequeñas y computadoras.
- Enlaces opcionales para agendar por WhatsApp, TikTok y ubicación, que **no se muestran** hasta configurarlos.

## Publicar en GitHub Pages

1. Abre `https://github.com/dibujamenails/dibujame-nails` con la cuenta **dibujamenails**.
2. Descomprime este ZIP en tu computadora.
3. En GitHub, pulsa **Add file → Upload files** (si el repositorio está vacío, verás el enlace **uploading an existing file**).
4. Sube **todo el contenido de la carpeta `dibujame-nails-v1`**, incluidos `index.html` y las carpetas `assets`, `css`, `js`. No subas el ZIP sin extraer.
5. Pulsa **Commit changes**.
6. En **Settings → Pages → Build and deployment**, elige **Deploy from a branch**, rama **main**, directorio **/(root)**; guarda.
7. La dirección prevista será `https://dibujamenails.github.io/dibujame-nails/` una vez que GitHub publique la página.

## Agregar WhatsApp, TikTok o ubicación

Edita `js/config.js` en GitHub y agrega los valores faltantes:

```js
window.DIBUJAME_CONFIG = {
  instagram: 'https://www.instagram.com/dibujame_nails/',
  facebook: 'https://www.facebook.com/profile.php?id=61552756146185',
  whatsapp: '521XXXXXXXXXX', // sustituir por el número VERDADERO, con clave de país
  maps: 'https://maps.app.goo.gl/...',
  tiktok: 'https://www.tiktok.com/@...',
  mensajeCita: 'Hola, vi su página de Dibújame Nails Studio y me gustaría agendar una cita. 💅'
};
```

Solo activa números y enlaces confirmados. No se deben pegar datos ficticios. Al guardar los cambios, GitHub Pages los publicará automáticamente si ya está habilitado.

## Editar apariencia

- Contenido principal: `index.html`
- Colores, diseños y animaciones: `css/styles.css`
- Comportamiento: `js/app.js`
- Redes y contacto: `js/config.js`
- Logo oficial: `assets/logo-original.png`

## Notas

- No incluye pasarela de pagos ni reservas con calendario propio.
- El botón **Agenda tu cita** aparece únicamente cuando se configura un WhatsApp válido. Los enlaces faltantes no aparecen como botones rotos.
- Algunas tipografías se cargan de Google Fonts; si no hay conexión se usan fuentes de respaldo.
