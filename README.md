# Dibújame Nails Studio — V7: agenda separada por turnos + administración útil

## Lo nuevo

- La tarjeta muestra **Turno de mañana (8 a 11)** y **Turno de tarde (3 a 6)** como dos grupos visibles, incluso si uno no tiene huecos libres.
- Panel renovado `admin.html` con **Agenda**, **Nueva cita**, **Horarios**, **Cerrar fechas**.
- Contadores de citas pendientes, confirmadas y citas de hoy.
- Filtros por fecha/estado, botones Confirmar/Cancelar y contacto WhatsApp para avisar a la clienta.
- La administradora puede registrar citas **manualmente cualquier día**, incluidos domingos previamente acordados; no se permiten empalmes.
- Los horarios semanales, sus **dos turnos independientes**, duración, bloqueos y desbloqueos se administran en el panel.

## Ya conectado

- Supabase separado `aysavnnkhxzvkusvcjcm`, función `appointments` versión 5.
- Lunes a sábado: 08:00–11:00 y 15:00–18:00 (America/Mexico_City).
- Domingo: solo acordando por WhatsApp. No hay reservas públicas automáticas.
- Por defecto cada cita dura 90 minutos y se ofrecen inicios cada 30 minutos. Cambiable desde panel.
- Apartados públicos caducan a 30 minutos si no se confirman.

## Publicación

Subir los archivos y carpetas de este ZIP en la raíz de `main` de `https://github.com/dibujamenails/dibujame-nails`, sobrescribiendo V6. GitHub Pages publicará V7.
- Página: `https://dibujamenails.github.io/dibujame-nails/`
- Panel: `https://dibujamenails.github.io/dibujame-nails/admin.html`
- **No ejecutar SQL ni crear otra cuenta administradora**: el servidor ya está configurado.

## Pruebas recomendadas

1. Abrir el calendario para un día hábil y revisar los dos grupos Mañana/Tarde.
2. Entrar al panel; verificar Agenda y los dos turnos por día en Horarios.
3. Agregar una cita manual de prueba; confirmar que desaparezcan de los disponibles las horas que se empalman.
4. Cancelar la prueba; verificar que el horario se libere.
5. Probar el domingo; debe redirigir a solicitud por WhatsApp sin ofrecer reservas web.

**Pendiente:** realizar una prueba de punta a punta en el sitio desplegado. Esta versión no envía mensajes WhatsApp automáticamente; solo abre mensajes prellenados. Recomendable añadir CAPTCHA o verificación telefónica antes de manejar un alto volumen para reducir solicitudes falsas.
