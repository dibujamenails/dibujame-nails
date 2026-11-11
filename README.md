# Dibújame Nails Studio — V6, horario dividido + domingos especiales

**Proyecto exclusivo**: `aysavnnkhxzvkusvcjcm` (Supabase).  
**Sitio**: https://dibujamenails.github.io/dibujame-nails/  
**Panel privado**: https://dibujamenails.github.io/dibujame-nails/admin.html  
**Función remota**: `appointments` V4, desplegada y activa.

## Horarios ya configurados en la base de datos

- **Lunes a sábado:** 08:00–11:00 y 15:00–18:00, zona horaria America/Mexico_City.
- **Domingos:** sin reservas automáticas. El calendario ofrece solicitar una cita dominical anticipada por WhatsApp.
- Los turnos son independientes y los servicios no pueden ocupar el descanso entre ambos.
- **Duración provisional:** 90 minutos por cita, con opciones de inicio cada 30 minutos. Es modificable en el panel.
- La cita se aparta temporalmente durante 30 minutos; solo queda confirmada si la administradora la aprueba.
- El salón puede registrar en el panel una cita dominical **ya acordada**. La base de datos impide el empalme con otras citas.
- El sistema no manda WhatsApp automáticamente: prepara un mensaje; la clienta debe tocar «Enviar».

## Lo que ya quedó realizado

1. Se creó el proyecto Supabase independiente del de Joyería AMOR.
2. Se crearon cinco tablas con RLS y sin acceso directo para usuarios públicos.
3. Se registró y comprobó la cuenta administradora suministrada por el propietario.
4. Se añadieron los dos turnos al esquema, se guardaron los horarios y se desplegó la función `appointments` V4.
5. `js/config.js` ya lleva la dirección pública de la API y su **clave publicable**, sin secretos.

## Publicar estos cambios en GitHub Pages

1. Descomprime el ZIP V6.
2. En https://github.com/dibujamenails/dibujame-nails usa **Add file → Upload files** y sube el **contenido** del ZIP a la raíz de `main`, reemplazando los archivos existentes.
3. Confirma con **Commit changes** y comprueba la publicación de GitHub Pages.
4. Entra al panel privado `admin.html` con el correo y la contraseña creados previamente en Supabase. No es necesario volver a dar de alta a la administradora.
5. Comprueba los dos turnos de lunes a sábado y el domingo cerrado. Prueba una solicitud para un día entre semana, confírmala o cancélala y verifica que se actualice la disponibilidad.
6. Para una cita **dominical** acordada por WhatsApp, usa «Citas especiales de domingo» dentro del panel.

**NO vuelvas a ejecutar** `supabase/sql/01_agenda.sql` ni `supabase/sql/02_horarios_dobles.sql`. Los dos cambios ya se aplicaron a la base real. Los SQL se incluyen únicamente como referencia técnica.

## Pruebas y límites

- Se comprobó que el esquema tiene dos turnos y que los horarios calculados nunca ocupan el descanso; la función remota figura activa.
- Los archivos HTML y JavaScript se validaron localmente. Hace falta una prueba completa desde la página publicada, incluyendo la confirmación y la cancelación, antes de anunciar la agenda como definitiva.
- La función pública permite solicitudes de apartado, pero **faltan controles robustos contra abuso** (por ejemplo, CAPTCHA o verificación de teléfono). La validación por navegador y el límite de tres citas por número no bastan para frenar ataques automatizados.
- La disponibilidad de domingos se gestiona exclusivamente con el salón; la clienta no puede autoconfirmarse un domingo.
- La información del salón y los contactos permanecen separados de otros proyectos.
