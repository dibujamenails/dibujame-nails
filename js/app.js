(() => {
  'use strict';
  const config = window.DIBUJAME_CONFIG || {};
  const hrefs = {
    instagram: config.instagram || 'https://www.instagram.com/dibujame_nails/',
    facebook: config.facebook || 'https://www.facebook.com/profile.php?id=61552756146185',
    tiktok: config.tiktok || '',
    ubicacion: config.maps || ''
  };
  const rawNumber = String(config.whatsapp || '').replace(/[^0-9]/g, '');
  // Números mexicanos de 10 dígitos se convierten a formato internacional +52.
  let waNumber = rawNumber.length === 10 ? `52${rawNumber}` : rawNumber;
  if (waNumber.length === 13 && waNumber.startsWith('521')) waNumber = '52' + waNumber.slice(3);
  const waValid = /^\d{11,15}$/.test(waNumber);
  const defaultMessage = config.mensajeCita || 'Hola, vi su página de Dibújame Nails Studio y me gustaría agendar una cita. 💅';
  if (waValid) {
    hrefs.whatsapp = `https://wa.me/${waNumber}`;
    hrefs.agenda = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultMessage)}`;
  } else {
    hrefs.whatsapp = '';
    hrefs.agenda = '';
  }
  const pending = {
    whatsapp: 'Próximamente: contacto por WhatsApp.',
    agenda: 'Próximamente: agenda de citas por WhatsApp.',
    tiktok: 'Próximamente: nuestro TikTok.',
    ubicacion: 'Próximamente: nuestra ubicación.'
  };
  const toast = document.getElementById('statusToast');
  let hideToken;
  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(hideToken);
    hideToken = setTimeout(() => {toast.hidden=true;}, 3400);
  }
  Object.entries(hrefs).forEach(([name, href]) => {
    const anchor = document.querySelector(`[data-action="${name}"]`);
    if (!anchor) return;
    if (href) {
      anchor.href = href;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    } else {
      anchor.removeAttribute('href');
      anchor.setAttribute('aria-label',`${anchor.getAttribute('aria-label')}. Enlace pendiente de configurar.`);
      anchor.addEventListener('click', (e) => {e.preventDefault(); showToast(pending[name] || 'Enlace disponible próximamente.');});
      anchor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();showToast(pending[name] || 'Enlace disponible próximamente.');}
      });
      anchor.tabIndex=0;
      anchor.setAttribute('role','button');
    }
  });
  document.getElementById('shareBtn').addEventListener('click', async () => {
    const data = {title: 'Dibújame Nails Studio', text:'Conéctate con Dibújame Nails Studio 💅',url:location.href};
    try {
      if (navigator.share) {await navigator.share(data);return;}
      if (navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(location.href);showToast('¡Enlace copiado!');return;}
      showToast('Comparte esta dirección: ' + location.href);
    } catch(error) {
      if (error && error.name !== 'AbortError') showToast('No se pudo compartir. Copia la URL del navegador.');
    }
  });
})();
