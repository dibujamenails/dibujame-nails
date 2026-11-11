(() => {
  'use strict';
  const config = window.DIBUJAME_CONFIG || {};
  const grid = document.getElementById('linkGrid');
  const booking = document.getElementById('bookingSlot');
  const cleanPhone = String(config.whatsapp || '').replace(/[^\d]/g, '');
  const toast = document.getElementById('toast');
  let hideTimer;

  const icons = {
    whatsapp: '<path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4z"/><path d="M9 8.5c.5 2.6 2.4 4.5 5 5l1.4-1.2 1.6 1.1c-.4 1.3-1.4 2-2.6 1.9-3-.3-5.8-3.1-6.1-6.1-.1-1.2.6-2.2 1.9-2.6L9 8.5z"/>',
    map: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.7"/>',
    video: '<path d="M9 4v11a3.3 3.3 0 1 1-3.3-3.3"/><path d="M9 5c1 3.5 3 5 6.5 5"/>'
  };
  const svg = (content) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
  const validHttps = (url) => { try { const u = new URL(url); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  const appendLink = ({href, label, sub, tag, icon}) => {
    const safeHref = validHttps(href);
    if (!safeHref || !grid) return;
    const link = document.createElement('a');
    link.className = 'link-card extra-card';
    link.href = safeHref;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `${label}: ${sub}`);
    const top = document.createElement('span'); top.className = 'card-top';
    const t = document.createElement('span'); t.className = 'tag'; t.textContent = tag;
    top.appendChild(t);
    const symbol = document.createElement('span'); symbol.className = 'social-icon';symbol.setAttribute('aria-hidden','true');symbol.innerHTML = svg(icon);
    const bottom = document.createElement('span');bottom.className='card-bottom';
    const names = document.createElement('span');const bold=document.createElement('strong');bold.textContent=label;const small=document.createElement('small');small.textContent=sub;names.append(bold,small);
    const arrow = document.createElement('span');arrow.className='arrow-icon';arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';
    bottom.append(names, arrow);link.append(top,symbol,bottom);grid.appendChild(link);
  };

  if (cleanPhone.length >= 10 && cleanPhone.length <= 15 && booking) {
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(config.mensajeCita || 'Hola, quiero agendar una cita.')}`;
    const link = document.createElement('a');link.className='booking-card';link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Agendar cita por WhatsApp');
    const txt=document.createElement('span');const name=document.createElement('strong');name.textContent='Agenda tu cita';const description=document.createElement('small');description.textContent='Escríbenos por WhatsApp';txt.append(name,description);
    const arrow=document.createElement('span');arrow.className='arrow-icon';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');link.append(txt,arrow);booking.append(link);booking.hidden=false;
  }
  if (validHttps(config.tiktok || '')) appendLink({href:config.tiktok,label:'TikTok',sub:'Mira nuestros videos',tag:'INSPIRACIÓN',icon:icons.video});
  if (validHttps(config.maps || '')) appendLink({href:config.maps,label:'Ubicación',sub:'Cómo llegar',tag:'VISÍTANOS',icon:icons.map});
  const y=document.getElementById('year');if(y)y.textContent=new Date().getFullYear();

  const notify = msg => { if (!toast) return;clearTimeout(hideTimer); toast.textContent=msg;toast.hidden=false;hideTimer=setTimeout(()=>{toast.hidden=true},3300);};
  document.getElementById('shareButton')?.addEventListener('click',async()=>{
    const data={title:'Dibújame Nails Studio',text:'Conoce nuestro estudio de uñas 💅',url:location.href};
    try {
      if(navigator.share){await navigator.share(data);return;}
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(location.href);notify('¡Enlace copiado!');return;}
      notify('Copia la dirección de esta página para compartirla.');
    }catch(err){if(err?.name!=='AbortError')notify('Puedes compartir la URL desde tu navegador.');}
  });
})();
