(()=>{'use strict';
  const conf=window.DIBUJAME_CONFIG||{}, api=conf.bookingApiUrl||'', pub=conf.supabasePublishableKey||'';
  const $=id=>document.getElementById(id), message=$('message');
  const safe=(s)=>String(s??'');
  let token=sessionStorage.getItem('dn_admin_session')||'';
  const note=(text)=>message.textContent=text;
  const projectUrl=api.replace(/\/functions\/v1\/appointments\/?$/,'');
  function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node}
  async function post(data){
    const res=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(data)});
    const result=await res.json().catch(()=>({error:'Respuesta no válida'}));
    if(!res.ok)throw new Error(result.error||'No se pudo completar');return result;
  }
  function showLogin(){ $('dashboard').hidden=true;$('loginSection').hidden=false;}
  function showDash(){ $('dashboard').hidden=false;$('loginSection').hidden=true;}
  function bookingRow(b){
    const row=el('div',undefined,'booking'), info=el('div'), actions=el('div',undefined,'actions');
    info.append(el('strong',`${b.appointment_date} · ${safe(b.starts_at).slice(0,5)} — ${b.status==='pending'?'PENDIENTE':b.status==='confirmed'?'CONFIRMADA':'CANCELADA'}`));
    info.append(el('span',`${b.customer_name} · ${b.customer_phone}`));
    info.append(el('small',`${b.service_note||'Sin servicio indicado'} · ${b.duration_minutes} min`));
    if(b.status==='pending'){info.append(el('small',`Vence: ${new Date(b.expires_at).toLocaleString('es-MX')}`));}
    for(const [label,status] of [['Confirmar','confirmed'],['Cancelar','cancelled']]){
      if(status==='confirmed' && b.status!=='pending')continue;
      if(status==='cancelled' && b.status==='cancelled')continue;
      const btn=el('button',label,status==='cancelled'?'secondary':'');
      btn.addEventListener('click',async()=>{if(!confirm(`${label} la cita de ${b.customer_name}?`))return;
        btn.disabled=true;try{await post({action:'admin_booking',id:b.id,status});note('Cita actualizada');await refresh();}catch(e){note(e.message);btn.disabled=false;}});
      actions.append(btn);
    }
    row.append(info,actions);return row;
  }
  const dayNames=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  function scheduleRow(day){
    const row=el('div',undefined,'day-row');
    const enabled=el('input'),start=el('input'),end=el('input'),start2=el('input'),end2=el('input'),save=el('button','Guardar');
    enabled.type='checkbox';enabled.checked=day.enabled;
    for(const item of [start,end,start2,end2]) item.type='time';
    start.value=safe(day.opens_at).slice(0,5);end.value=safe(day.closes_at).slice(0,5);
    start2.value=safe(day.opens_at2).slice(0,5);end2.value=safe(day.closes_at2).slice(0,5);
    row.append(el('strong',dayNames[day.weekday]));
    const active=el('label','');active.append(enabled,document.createTextNode('Reservas web'));
    function field(label, input){const x=el('label',label);x.append(input);return x}
    row.append(active,field('Mañana, desde: ',start),field('hasta: ',end),field('Tarde, desde: ',start2),field('hasta: ',end2),save);
    save.addEventListener('click',async()=>{save.disabled=true;
      try{await post({action:'admin_schedule',weekday:day.weekday,enabled:enabled.checked,opens:start.value,closes:end.value,opens2:start2.value,closes2:end2.value});
        note('Horario guardado');await refresh();}catch(err){note(err.message);save.disabled=false;}
    });
    return row;
  }
  async function refresh(){try{
    const x=await post({action:'admin_list'});showDash();
    const bookings=$('bookings');bookings.replaceChildren(...(x.bookings||[]).map(bookingRow));
    if(!x.bookings?.length)bookings.append(el('p','Todavía no hay solicitudes.'));
    $('schedule').replaceChildren(...(x.schedule||[]).map(scheduleRow));
    $('duration').value=x.settings.duration_minutes;$('step').value=x.settings.step_minutes;
    const blocked=$('blockedList');blocked.replaceChildren();
    for(const b of x.blocked||[]){const row=el('div',undefined,'booking'),txt=el('span',`${b.date_blocked}: ${b.note||'Día cerrado'}`),btn=el('button','Desbloquear','secondary');
      btn.addEventListener('click',async()=>{try{await post({action:'admin_unblock',date:b.date_blocked});note('Día habilitado');await refresh();}catch(err){note(err.message);}});
      row.append(txt,btn);blocked.append(row);}
  }catch(e){note(e.message);if(/autorizado/i.test(e.message)){sessionStorage.removeItem('dn_admin_session');token='';showLogin();}}}
  if(!api||!pub){note('Agenda automática sin conectar. Completa bookingApiUrl y supabasePublishableKey en js/config.js.');return;}
  $('loginForm').addEventListener('submit',async(event)=>{event.preventDefault();
    const button=event.target.querySelector('button');button.disabled=true;
    try{const res=await fetch(`${projectUrl}/auth/v1/token?grant_type=password`,{method:'POST',headers:{'Content-Type':'application/json',apikey:pub},
      body:JSON.stringify({email:$('email').value,password:$('password').value})});const data=await res.json();
      if(!res.ok||!data.access_token)throw new Error('Correo o contraseña incorrectos');
      token=data.access_token;sessionStorage.setItem('dn_admin_session',token);$('password').value='';note('Sesión iniciada');await refresh();
    }catch(e){note(e.message)}finally{button.disabled=false}
  });
  $('logout').addEventListener('click',()=>{sessionStorage.removeItem('dn_admin_session');token='';showLogin();note('Sesión cerrada');});
  $('refresh').addEventListener('click',refresh);
  $('saveSettings').addEventListener('click',async()=>{try{await post({action:'admin_settings',duration:Number($('duration').value),step:Number($('step').value)});note('Duración actualizada');await refresh();}catch(e){note(e.message);}});
  $('sundayBookingForm').addEventListener('submit',async(event)=>{event.preventDefault();
    const btn=event.target.querySelector('button[type=submit]');btn.disabled=true;
    try{
      await post({action:'admin_sunday_booking',date:$('sundayDate').value,time:$('sundayTime').value,
        name:$('sundayName').value.trim(),phone:$('sundayPhone').value.replace(/\D/g,''),service:$('sundayService').value.trim()});
      note('Cita dominical confirmada y registrada.');event.target.reset();await refresh();
    }catch(error){note(error.message);}finally{btn.disabled=false;}
  });
  $('blockDay').addEventListener('click',async()=>{try{await post({action:'admin_block',date:$('blockedDay').value,note:$('blockedReason').value});note('Día bloqueado');await refresh();}catch(e){note(e.message);}});
  if(token)refresh();else showLogin();
})();
