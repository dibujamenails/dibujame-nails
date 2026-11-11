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
    agenda: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(agendaMessage)}` : '',
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
