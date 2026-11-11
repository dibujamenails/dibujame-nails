(() => {
  'use strict';
  const config = window.DIBUJAME_CONFIG || {};
  const buttons = document.querySelectorAll('[data-link]');
  const toast = document.getElementById('toast');
  let toastTimeout;

  function alertUser(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toast.hidden = true; }, 3200);
  }
  function normalizeWhatsApp(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 10) return '52' + digits;
    if (digits.length === 13 && digits.startsWith('521')) return '52' + digits.slice(3);
    return digits.startsWith('52') && digits.length === 12 ? digits : '';
  }
  const wa = normalizeWhatsApp(config.whatsapp);
  const agendaMessage = String(config.mensajeCita || 'Hola, me gustaría agendar una cita. 💅');
  const hrefs = {
    whatsapp: wa ? `https://wa.me/${wa}` : '',
    agenda: '', // El calendario crea el enlace tras elegir fecha y hora.
    instagram: config.instagram || '',
    facebook: config.facebook || '',
    tiktok: config.tiktok || '',
    ubicacion: config.maps || ''
  };

  function vibrate() {
    if ('vibrate' in navigator) navigator.vibrate(12);
  }
  function press(el, time = 200) {
    el.classList.add('is-pressed');
    clearTimeout(el._pressTimer);
    el._pressTimer = setTimeout(() => el.classList.remove('is-pressed'), time);
  }

  buttons.forEach(el => {
    const kind = el.dataset.link;
    const href = hrefs[kind];
    if (kind === 'agenda') {
      el.addEventListener('pointerdown', () => { el.classList.add('is-pressed'); vibrate(); });
      el.addEventListener('pointercancel', () => el.classList.remove('is-pressed'));
      el.addEventListener('pointerleave', () => el.classList.remove('is-pressed'));
      el.addEventListener('pointerup', () => press(el, 220));
      el.addEventListener('click', () => { press(el, 220); openAppointment(); });
      return;
    }
    if (href && kind === 'ubicacion' && el.tagName === 'BUTTON') {
      const anchor = document.createElement('a');
      for (const attr of el.attributes) {
        if (attr.name !== 'type' && attr.name !== 'aria-label') anchor.setAttribute(attr.name, attr.value);
      }
      anchor.setAttribute('aria-label', 'Abrir ubicación en Google Maps');
      anchor.innerHTML = el.innerHTML;
      el.replaceWith(anchor);
      el = anchor;
      el.classList.remove('is-unavailable');
      el.querySelector('#mapCaption').textContent = 'Cómo llegar al salón';
    }
    if (el.tagName === 'A') {
      if (href) el.href = href;
      else { el.removeAttribute('href'); el.setAttribute('role', 'button'); el.tabIndex = 0; }
    }
    el.addEventListener('pointerdown', () => { el.classList.add('is-pressed'); vibrate(); });
    el.addEventListener('pointercancel', () => el.classList.remove('is-pressed'));
    el.addEventListener('pointerleave', () => el.classList.remove('is-pressed'));
    el.addEventListener('pointerup', () => press(el, 220));
    el.addEventListener('click', event => {
      if (!href) {
        event.preventDefault();
        press(el, 220);
        alertUser('La ubicación del salón se agregará próximamente.');
        return;
      }
      // Deja sentir el botón antes de abrir el destino. Respeta Ctrl/Cmd+clic.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      press(el, 240);
      setTimeout(() => { window.location.assign(href); }, 180);
    });
    if (!href) el.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); el.click(); }
    });
  });


  // V5: al configurar el backend hay disponibilidad REAL y apartados temporales.
  // Sin backend se conserva la consulta por WhatsApp, sin inventar horarios libres.
  const overlay = document.getElementById('appointmentOverlay');
  const dialog = overlay.querySelector('.appointment-dialog');
  const closeAppointment = document.getElementById('appointmentClose');
  const previousMonth = document.getElementById('previousMonth');
  const nextMonth = document.getElementById('nextMonth');
  const currentMonth = document.getElementById('currentMonth');
  const appointmentDays = document.getElementById('appointmentDays');
  const dateLabel = document.getElementById('selectedDateLabel');
  const appointmentTime = document.getElementById('appointmentTime');
  const availabilityButton = document.getElementById('checkAvailability');
  const appointmentError = document.getElementById('appointmentError');
  const appointmentTrigger = document.querySelector('[data-link="agenda"]');
  const live = document.getElementById('liveAvailability');
  const liveStatus = document.getElementById('liveStatus');
  const slotGrid = document.getElementById('slotGrid');
  const sundayWhatsApp = document.getElementById('sundayWhatsapp');
  const customerFields = document.getElementById('customerFields');
  const nameInput = document.getElementById('customerName');
  const phoneInput = document.getElementById('customerPhone');
  const serviceInput = document.getElementById('serviceNote');
  const consentInput = document.getElementById('consentBooking');
  const hiddenWebsite = document.getElementById('bookingWebsite');
  const hasLive = /^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/appointments\/?$/i.test(config.bookingApiUrl || '');
  const bookingApi = hasLive ? config.bookingApiUrl.replace(/\/$/, '') : '';
  document.getElementById('manualTimeWrapper').hidden = hasLive;
  live.hidden = !hasLive;
  const info = document.getElementById('appointmentInfo');
  if (hasLive) {
    info.innerHTML = 'Lunes a sábado: <strong>8:00–11:00 a. m. y 3:00–6:00 p. m.</strong> Domingos: cita anticipada por WhatsApp. Las solicitudes normales se apartan por 30 minutos y requieren confirmación del salón.';
    availabilityButton.innerHTML = 'Apartar horario y abrir WhatsApp <span aria-hidden="true">↗</span>';
  } else {
    document.querySelector('.appointment-footnote').textContent = 'La agenda automática se está configurando. Por ahora te confirmamos disponibilidad por WhatsApp.';
  }
  let selectedDate = null;
  let displayMonth = null;
  let lastFocused = null;
  let chosenTime = '';
  let latestSlots = [];
  let loading = false;
  let requestId = 0;
  const monthFormatter = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' });
  const dayFormatter = new Intl.DateTimeFormat('es-MX', { weekday:'long',day:'numeric',month:'long',year:'numeric' });
  function todayAtSalon() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', year:'numeric',month:'numeric',day:'numeric' }).formatToParts(new Date());
    const get = kind => Number(parts.find(part => part.type === kind).value);
    return new Date(get('year'),get('month')-1,get('day'));
  }
  function dateKey(date) {
    return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  }
  function updateSubmit() {
    if (!hasLive) {availabilityButton.disabled = !selectedDate;return;}
    const digits = phoneInput.value.replace(/\D/g,'');
    availabilityButton.disabled = loading || !selectedDate || !chosenTime || nameInput.value.trim().length<2 || digits.length!==10 || !consentInput.checked;
  }
  function renderCalendar() {
    const today = todayAtSalon();
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    currentMonth.textContent = monthFormatter.format(displayMonth);
    previousMonth.disabled = (year === today.getFullYear() && month === today.getMonth());
    appointmentDays.replaceChildren();
    const startOffset = (new Date(year,month,1).getDay()+6)%7;
    for (let i=0;i<startOffset;i++) {
      const spacer=document.createElement('span'); spacer.setAttribute('aria-hidden','true'); appointmentDays.append(spacer);
    }
    const total=new Date(year,month+1,0).getDate();
    for (let day=1;day<=total;day++) {
      const date=new Date(year,month,day);
      const button=document.createElement('button');
      button.type='button';button.className='appointment-day';button.textContent=String(day);
      button.setAttribute('aria-label',dayFormatter.format(date));
      button.disabled = date < today;
      if (dateKey(date) === dateKey(today)) button.classList.add('is-today');
      if (selectedDate && dateKey(date) === dateKey(selectedDate)) {
        button.classList.add('selected');button.setAttribute('aria-pressed','true');
      } else button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>{
        selectedDate=date; chosenTime=''; latestSlots=[];
        appointmentError.textContent='';dateLabel.textContent=dayFormatter.format(date);
        renderCalendar(); updateSubmit();
        if (hasLive) loadSlots();
      });
      appointmentDays.append(button);
    }
  }
  function renderSlots() {
    slotGrid.replaceChildren();
    latestSlots.forEach(hour => {
      const b=document.createElement('button');b.type='button';b.textContent=hour;
      b.setAttribute('aria-pressed',String(hour===chosenTime));
      b.addEventListener('click',()=>{chosenTime=hour;renderSlots();updateSubmit();});
      slotGrid.appendChild(b);
    });
  }
  async function callBooking(action, payload) {
    const url = action==='availability' ? `${bookingApi}?action=availability&date=${encodeURIComponent(payload.date)}` : bookingApi;
    const response = await fetch(url, action==='availability' ? {method:'GET',cache:'no-store'} : {
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload})
    });
    const data = await response.json().catch(()=>({error:'Respuesta inválida del servidor'}));
    if (!response.ok) throw Object.assign(new Error(data.error||'Error al contactar la agenda'),{code:data.code||''});
    return data;
  }
  async function loadSlots() {
    if (!selectedDate || !hasLive) return;
    const id=++requestId;
    loading=true;chosenTime='';latestSlots=[];renderSlots();updateSubmit();
    sundayWhatsApp.hidden=true;customerFields.hidden=false;
    liveStatus.textContent='Consultando horarios libres…';
    try {
      const data=await callBooking('availability',{date:dateKey(selectedDate)});
      if(id!==requestId)return;
      latestSlots=data.slots||[];
      const sunday=selectedDate.getDay()===0;
      sundayWhatsApp.hidden=!sunday;
      customerFields.hidden=sunday;
      if(sunday && wa) {
        const message=`Hola, vi la tarjeta digital de Dibújame Nails Studio 💅. Me gustaría solicitar una cita anticipada para el domingo ${dayFormatter.format(selectedDate)}. ¿Tienen algún horario disponible?`;
        sundayWhatsApp.href=`https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
      }
      liveStatus.textContent=data.closed?(data.reason||'Este día no hay servicio'):
        latestSlots.length ? `${latestSlots.length} horario(s) libre(s). Duración estimada: ${data.durationMinutes} minutos.` : 'No quedan horarios disponibles ese día.';
      renderSlots();
    }catch(error){
      if(id!==requestId)return;
      liveStatus.textContent='No pudimos consultar la agenda en este momento. Intenta nuevamente.';
      appointmentError.textContent=error.message;
    }finally {if(id===requestId){loading=false;updateSubmit();}}
  }
  function openAppointment() {
    lastFocused=document.activeElement;
    const today=todayAtSalon();
    displayMonth=new Date((selectedDate||today).getFullYear(),(selectedDate||today).getMonth(),1);
    appointmentError.textContent='';renderCalendar();
    overlay.hidden=false;document.body.classList.add('appointment-open');
    if(hasLive && selectedDate)loadSlots();
    closeAppointment.focus();
  }
  function hideAppointment() {
    overlay.hidden=true;document.body.classList.remove('appointment-open');requestId++;
    (lastFocused||appointmentTrigger).focus();
  }
  closeAppointment.addEventListener('click',hideAppointment);
  overlay.addEventListener('click',event=>{if(event.target===overlay) hideAppointment();});
  document.addEventListener('keydown',event=>{
    if(overlay.hidden)return;
    if(event.key==='Escape'){event.preventDefault();hideAppointment();return;}
    if(event.key==='Tab'){
      const focusable=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled):not([tabindex="-1"]),a[href]')].filter(e=>e.offsetParent!==null);
      if(!focusable.length)return;
      if(event.shiftKey && document.activeElement===focusable[0]){event.preventDefault();focusable.at(-1).focus();}
      else if(!event.shiftKey && document.activeElement===focusable.at(-1)){event.preventDefault();focusable[0].focus();}
    }
  });
  previousMonth.addEventListener('click',()=>{displayMonth=new Date(displayMonth.getFullYear(),displayMonth.getMonth()-1,1);renderCalendar();});
  nextMonth.addEventListener('click',()=>{displayMonth=new Date(displayMonth.getFullYear(),displayMonth.getMonth()+1,1);renderCalendar();});
  for (const input of [nameInput,phoneInput,consentInput]) input.addEventListener('input',updateSubmit);
  availabilityButton.addEventListener('click',async()=>{
    if(!selectedDate){appointmentError.textContent='Selecciona una fecha.';return;}
    if(selectedDate < todayAtSalon()){appointmentError.textContent='Esa fecha ya pasó.';renderCalendar();return;}
    if(!wa){appointmentError.textContent='Falta WhatsApp del salón.';return;}
    const dateText=dayFormatter.format(selectedDate);
    if(hasLive) {
      if(!chosenTime || !latestSlots.includes(chosenTime))return;
      loading=true;updateSubmit();appointmentError.textContent='';
      try {
        const phone=phoneInput.value.replace(/\D/g,'');
        const result=await callBooking('reserve',{date:dateKey(selectedDate),time:chosenTime,
          name:nameInput.value.trim(),phone,service:serviceInput.value.trim(),consent:consentInput.checked,website:hiddenWebsite.value});
        const message=`Hola, soy ${nameInput.value.trim()} 💅. Solicité un horario en Dibújame Nails Studio para el ${dateText} a las ${chosenTime}. Folio: ${result.id.slice(0,8)}. ¿Me confirman mi cita? Sé que el apartado temporal vence en 30 minutos si no se confirma.`;
        window.location.assign(`https://wa.me/${wa}?text=${encodeURIComponent(message)}`);
      }catch(error){
        appointmentError.textContent=error.message;
        if(error.code==='SLOT_TAKEN') await loadSlots();
      }finally{loading=false;updateSubmit();}
      return;
    }
    const time=appointmentTime.value;
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)){
      appointmentError.textContent='Selecciona una hora.';appointmentTime.focus();return;
    }
    const message=`Hola, vi la tarjeta digital de Dibújame Nails Studio 💅. Quisiera saber si tienen disponibilidad para el ${dateText} a las ${time}. ¿Me pueden confirmar si ese horario está libre?`;
    window.location.assign(`https://wa.me/${wa}?text=${encodeURIComponent(message)}`);
  });

  const share = document.getElementById('shareButton');
  share.addEventListener('click', async () => {
    press(share, 240); vibrate();
    const shareData = {title:'Dibújame Nails Studio', text:'¡Mira nuestros diseños y agenda tu cita! 💅', url:window.location.href};
    try {
      if (navigator.share) { await navigator.share(shareData); return; }
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareData.url);
        alertUser('¡Enlace copiado! Ya puedes compartirlo.');
        return;
      }
      alertUser('Comparte este enlace: ' + shareData.url);
    } catch (error) {
      if (error?.name !== 'AbortError') alertUser('Copia la dirección desde tu navegador.');
    }
  });
})();
