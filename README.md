# Ya configurado en Supabase — Dibújame Nails Studio

**Backend creado y desplegado el 11 de noviembre de 2026.**

- Proyecto independiente: `aysavnnkhxzvkusvcjcm`
- Función `appointments` activa.
- Cinco tablas creadas con RLS activado y lectura pública denegada.
- `js/config.js` ya contiene la URL de la función y la clave **publicable**, no secreta.
- Horarios de atención: TODOS CERRADOS hasta que se configure el panel.

**NO ejecutes de nuevo** `supabase/sql/01_agenda.sql`: la base ya existe.

## Lo que falta para abrir las citas

1. En Supabase del proyecto NUEVO, entra a Authentication → Users → Add user.
2. Crea una cuenta de acceso para la administradora (usa un correo de ella y contraseña robusta; no compartas la contraseña en este chat).
3. Copia su `User ID` UUID.
4. En SQL Editor del proyecto NUEVO, ejecuta:
   `insert into public.dn_admins(user_id) values ('UUID_REAL_DE_LA_ADMINISTRADORA');`
   Sustituye el valor entre comillas.
5. Sube este ZIP descomprimido (el CONTENIDO, no la carpeta contenedora) al repositorio GitHub `dibujamenails/dibujame-nails`.
6. Abre `https://dibujamenails.github.io/dibujame-nails/admin.html`, inicia sesión, configura días y horas reales.
7. Prueba una solicitud y la confirmación/cancelación de la cita desde el panel antes de ofrecer el servicio al público.

**La reserva solo se confirma cuando lo indique la administradora.**
WhatsApp abre un mensaje prellenado: la clienta todavía debe presionar Enviar.

## Nota de seguridad
La función pública permite solicitar apartados y requiere protección adicional ante abuso a gran escala (CAPTCHA o comprobación por teléfono); mantén los horarios cerrados hasta finalizar la configuración y las pruebas.

---

# Dibújame Nails Studio — V5, agenda con disponibilidad real

La tarjeta digital mantiene su logo aprobado, sus botones de WhatsApp, Instagram, Facebook, TikTok y Maps, y un calendario para agendar. **El calendario automático NO estará activo hasta conectar un proyecto Supabase NUEVO y SEPARADO de FIESTAANUAL26.** Hasta entonces conserva la consulta manual por WhatsApp de la versión 4.

## Qué hará al activar el backend

1. La clienta elige fecha y ve únicamente horarios libres consultados en la base de datos.
2. Selecciona uno, escribe nombre, celular y opcionalmente el servicio, y acepta el aviso.
3. Supabase aparta ese horario por **30 minutos** como `pending`. Una restricción `EXCLUDE` en Postgres impide superponer reservas, aunque dos clientas hagan clic simultáneamente.
4. Se abre WhatsApp (2284045606) con la solicitud y folio; **la clienta debe pulsar Enviar**. Un enlace `wa.me` NO envía mensajes automáticamente.
5. La administradora entra a `admin.html` y confirma o cancela el apartado. Confirmado queda ocupado; cancelado vuelve a estar libre. Pendientes sin confirmar caducan al cumplirse 30 minutos y se liberan al siguiente acceso a la agenda.
6. En el panel también se activan días de atención, horas semanales, duración estimada (30–180 min), intervalo de salida (15/30/60 minutos) y días bloqueados.

El backend usa zona horaria `America/Mexico_City` y solo permite citas futuras dentro de 60 días, inicialmente. **Por seguridad, todos los días del calendario comienzan cerrados**: el propietario debe indicar su horario real en el panel antes de permitir reservas. La duración inicial es **90 minutos, provisional**.

## Instalación, sin usar los proyectos de otros negocios

**A. Base de datos nueva:**

1. En Supabase crea un **nuevo proyecto exclusivo** llamado `dibujame-nails` en la organización que elijas. No reutilices la base `FIESTAANUAL26`.
2. Abre `SQL Editor` en ese nuevo proyecto y ejecuta el contenido completo de `supabase/sql/01_agenda.sql` **una sola vez**.
3. Verifica en el editor que existan las tablas `dn_schedule`, `dn_settings`, `dn_blocked_dates`, `dn_bookings`, `dn_admins`; sus políticas RLS no permiten lecturas anónimas.

**B. Publicar la función:**

1. En Supabase abre `Edge Functions` y crea `appointments`. Pega el contenido de `supabase/functions/appointments/index.ts`, o despliégalo mediante CLI si ya la usas.
2. Configura esa función como **pública: desactivar `Verify JWT`**, ya que la autorización de administradores se valida dentro de su código. El código permite únicamente orígenes del sitio GitHub Pages y `localhost` para navegadores; eso no es un sustituto de autenticación.
3. Verifica que Supabase exponga a la función las variables automáticas `SUPABASE_URL`, `SUPABASE_SECRET_KEYS` y `SUPABASE_PUBLISHABLE_KEYS` (o variables heredadas `_SERVICE_ROLE_KEY` / `_ANON_KEY`), **nunca** pegues la clave `service_role` en el sitio GitHub.
4. Deberás obtener una URL parecida a `https://TU-PROYECTO.supabase.co/functions/v1/appointments`.

**C. Cuenta privada de la administradora:**

1. Supabase > `Authentication` > `Users` > `Add user`. Crea una cuenta con correo y contraseña para la dueña/administradora. Desactiva el registro público de usuarios si no lo necesitas.
2. Copia el UUID **User ID** de la cuenta creada.
3. Ejecuta en el SQL Editor **del proyecto nuevo**:
   ```sql
   insert into public.dn_admins(user_id) values ('UUID_REAL_DE_LA_ADMINISTRADORA');
   ```
4. Entra a `https://dibujamenails.github.io/dibujame-nails/admin.html`, inicia sesión y configura horario y duración. Hasta hacer esto, la agenda no ofrecerá espacios.

**D. Conectar el frontend:**

1. Abre `js/config.js` y modifica solo los valores `bookingApiUrl` y `supabasePublishableKey` con la URL y **clave PUBLICABLE** del nuevo proyecto. Una clave `sb_publishable_...` es válida para el navegador; una `service_role` o `sb_secret_...` jamás lo es.
2. Sube `index.html`, `aviso-privacidad.html`, `admin.html`, `css/`, `js/`, `assets/` a la **raíz** de https://github.com/dibujamenails/dibujame-nails (reemplazando los anteriores).
3. Abre la web y prueba que un primer apartado retire el horario y los traslapados de la lista. En `admin.html`, confirma y después cancela una cita de prueba. Verifica que reaparezca al cancelarla.
4. Revisa/complete el aviso de privacidad, procedimiento contra citas falsas y reglas de negocio antes de promocionar el calendario público.

## Seguridad y límites de esta versión

- GitHub Pages es estático, no puede saber por sí solo si hay horarios ocupados.
- El servicio gratuito de Supabase puede tener límites, pausa por inactividad o cargos si cambias de plan; revisa el plan antes de crear el proyecto.
- Las tablas contienen teléfonos y nombres: **RLS habilitado**, roles públicos sin lectura ni escritura directa. Solo Edge Function usa la clave secreta, dentro del backend.
- Los administradores necesitan autenticarse y estar autorizados en `dn_admins`.
- Los clientes no pueden cancelar citas directamente; solo la administradora.
- Para limitar solicitudes falsas en producción, conviene añadir un CAPTCHA, verificación de teléfono o depósito. Esta versión incluye campo antispam y límite básico de tres citas activas por número, pero **no protege por completo contra el abuso**.
- Los apartados temporales solo son solicitudes; la cita NO está confirmada sin aprobación de la administradora.
- Una API en modo público puede ser llamada fuera del navegador: CORS **no** impide clientes automáticos. Es necesario endurecer controles antispam antes de uso público intenso.
- No se envían WhatsApps solos: WhatsApp abre un texto y el usuario lo envía.

## Archivos clave

- `index.html`: la tarjeta digital y el calendario.
- `js/app.js`: interfaz y disponibilidad (manual sin conexión, automática con conexión).
- `js/config.js`: redes sociales y URL de Supabase, clave publicable (NO secretos).
- `css/styles.css`: botones y calendario.
- `admin.html` / `js/admin.js`: panel privado para confirmar, cancelar, días y horarios.
- `supabase/sql/01_agenda.sql`: tablas protegidas y exclusión de dobles reservas.
- `supabase/functions/appointments/index.ts`: API segura del backend y verificación de administrador.
- `aviso-privacidad.html`: texto informativo **pendiente de revisión** por el negocio.

**No subas `.env`, claves secretas, ni identificaciones de clientes a GitHub.**
