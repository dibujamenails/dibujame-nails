(()=>{'use strict';
const c=window.DIBUJAME_CONFIG||{}, api=(c.bookingApiUrl||'').replace(/\/$/,''),pub=c.supabasePublishableKey||'';
const $=id=>document.getElementById(id),msg=$('message');
const base=api.replace(/\/functions\/v1\/appointments\/?$/,'');
const get=id=>$(id)?.value||'';
let access=sessionStorage.getItem('dn_access')||'', refreshToken=sessionStorage.getItem('dn_refresh')||'';
let bookings=[];
const note=t=>{msg.textContent=t;};
function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
function session(data){ access=data.access_token||'';refreshToken=data.refresh_token||refreshToken;sessionStorage.setItem('dn_access',access);sessionStorage.setItem('dn_refresh',refreshToken);}
function clearSession(){access='';refreshToken='';sessionStorage.removeItem('dn_access');sessionStorage.removeItem('dn_refresh');}
async function renew(){if(!refreshToken)return false;const r=await fetch(`${base}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{'Content-Type':'application/json',apikey:pub},body:JSON.stringify({refresh_token:refreshToken})});if(!r.ok)return false;session(await r.json());return !!access;}
async function post(data,retry=true){const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${access}`},body:JSON.stringify(data)});
 if(r.status===401&&retry&&await renew())return post(data,false);
 const result=await r.json().catch(()=>({error:'Respuesta no válida'}));if(!r.ok)throw new Error(result.error||`Error ${r.status}`);return result;
}
function showLogin(){ $('dashboard').hidden=true;$('loginSection').hidden=false;}
function showDashboard(){ $('dashboard').hidden=false;$('loginSection').hidden=true;}
const names=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
function toTime(t){return String(t||'').slice(0,5)}
function showTime(t){const [h,m]=toTime(t).split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'a. m.':'p. m.'}`}
function todayKey(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=k=>parts.find(p=>p.type===k)?.value||'00';return `${get('year')}-${get('month')}-${get('day')}`;}
function prettyDate(d){return new Date(d+'T12:00:00').toLocaleDateString('es-MX',{weekday:'short',day:'numeric',month:'short'});}
function whatsapp(b){const digits=String(b.customer_phone||'').replace(/\D/g,'');const status=b.status==='confirmed'?'está confirmada':'está pendiente de confirmación';const message=`Hola ${b.customer_name}, te escribimos de Dibújame Nails Studio 💅. Tu cita para el ${b.appointment_date} a las ${showTime(b.starts_at)} ${status}. ¡Gracias!`;
 const a=node('a','WhatsApp ↗');a.href=`https://wa.me/52${digits}?text=${encodeURIComponent(message)}`;a.target='_blank';a.rel='noopener noreferrer';return a;}
function bookingRow(b){
 const e=node('article',undefined,'booking'),info=node('div',undefined,'info'),actions=node('div',undefined,'actions');
 const title=node('strong',`${prettyDate(b.appointment_date)} · ${showTime(b.starts_at)} · ${b.customer_name}`);
 const status=node('span',b.status==='pending'?'Pendiente':b.status==='confirmed'?'Confirmada':'Cancelada','status '+b.status);
 info.append(title,status,node('span',`Tel. ${b.customer_phone} · ${b.duration_minutes} minutos`));
 info.append(node('small',b.service_note||'Servicio por especificar'));
 if(b.status==='pending')info.append(node('small',`El apartado vence ${new Date(b.expires_at).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})}`));
 if(b.status==='pending'){
  const btn=node('button','✓ Confirmar','confirm');btn.addEventListener('click',()=>change(b,'confirmed',btn));actions.append(btn);
 }
 if(b.status!=='cancelled'){
  const btn=node('button','Cancelar','cancel');btn.addEventListener('click',()=>change(b,'cancelled',btn));actions.append(btn,whatsapp(b));
 }
 e.append(info,actions);return e;
}
async function change(b,status,btn){if(!confirm(`${status==='confirmed'?'Confirmar':'Cancelar'} la cita de ${b.customer_name}?`))return;
 btn.disabled=true;try{await post({action:'admin_booking',id:b.id,status});note(status==='confirmed'?'Cita confirmada. Abre WhatsApp desde su ficha para avisar a la clienta.':'Cita cancelada. Horario liberado.');await refresh();}catch(e){note(e.message);btn.disabled=false;}}
function renderBookings(){const dest=$('bookings');dest.replaceChildren();const st=get('filterStatus'),date=get('filterDate');
 const rows=bookings.filter(b=>(st==='all'||(st==='active'?b.status!=='cancelled':b.status===st))&&(!date||b.appointment_date===date));
 rows.forEach(b=>dest.append(bookingRow(b)));
 if(!rows.length)dest.append(node('p','Todavía no hay citas con estos filtros. Cuando llegue la primera solicitud aparecerá aquí.','no-data'));
}
function field(title,value){const lab=node('label',title),input=node('input');input.type='time';input.value=toTime(value);lab.append(input);return {lab,input};}
function scheduleRow(day){const box=node('article',undefined,'day-card'),header=node('div',undefined,'day-top');
 header.append(node('strong',names[day.weekday]));const toggle=node('label','Reservas web');const check=node('input');check.type='checkbox';check.checked=!!day.enabled;if(day.weekday===0){check.disabled=true;check.checked=false;toggle.title='Los domingos solo con cita acordada';}toggle.append(check);header.append(toggle);box.append(header);
 const shifts=node('div',undefined,'shifts');const f1=node('div',undefined,'shift'),f2=node('div',undefined,'shift');
 f1.append(node('strong','☀ Turno de mañana'));f2.append(node('strong','✦ Turno de tarde'));
 const a=field('Desde',day.opens_at),b=field('Hasta',day.closes_at),d=field('Desde',day.opens_at2),f=field('Hasta',day.closes_at2);
 const times1=node('div',undefined,'times'),times2=node('div',undefined,'times');times1.append(a.lab,b.lab);times2.append(d.lab,f.lab);f1.append(times1);f2.append(times2);shifts.append(f1,f2);box.append(shifts);
 if(day.weekday===0)box.append(node('p','Domingo: solo citas especiales registradas desde «Nueva cita».','hint'));
 else {const btn=node('button','Guardar horario','primary');box.append(btn);btn.addEventListener('click',async()=>{
  btn.disabled=true;try{await post({action:'admin_schedule',weekday:day.weekday,enabled:check.checked,opens:a.input.value,closes:b.input.value,opens2:d.input.value,closes2:f.input.value});note(`Horario del ${names[day.weekday].toLowerCase()} guardado.`);await refresh();}catch(e){note(e.message);}finally{btn.disabled=false;}
 });}
 return box;
}
async function refresh(){try{const data=await post({action:'admin_list'});showDashboard();bookings=data.bookings||[];
 const active=bookings.filter(b=>b.status!=='cancelled');$('countPending').textContent=active.filter(b=>b.status==='pending').length;$('countConfirmed').textContent=active.filter(b=>b.status==='confirmed').length;$('countToday').textContent=active.filter(b=>b.appointment_date===todayKey()).length;
 renderBookings();$('schedule').replaceChildren(...(data.schedule||[]).map(scheduleRow));
 $('duration').value=data.settings.duration_minutes;$('step').value=data.settings.step_minutes;
 const blocked=$('blockedList');blocked.replaceChildren();for(const b of data.blocked||[]){const e=node('div',undefined,'blocked-item'),label=node('span',`${prettyDate(b.date_blocked)} · ${b.note||'Día cerrado'}`),btn=node('button','Desbloquear','ghost');
 btn.addEventListener('click',async()=>{try{await post({action:'admin_unblock',date:b.date_blocked});note('Fecha desbloqueada.');await refresh();}catch(e){note(e.message);}});e.append(label,btn);blocked.append(e);}
 if(!data.blocked?.length)blocked.append(node('p','No hay días bloqueados.','no-data'));
 }catch(e){note(e.message);if(/autorizado|401|token/i.test(e.message)){clearSession();showLogin();}}}
function tab(value){document.querySelectorAll('[data-tab]').forEach(b=>{const selected=b.dataset.tab===value;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
 for(const id of ['agenda','nueva','horarios','cierres'])$('panel-'+id).hidden=id!==value;}
if(!api||!pub){note('Falta conectar la agenda. Revisa js/config.js.');return;}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;
 try{const r=await fetch(`${base}/auth/v1/token?grant_type=password`,{method:'POST',headers:{'Content-Type':'application/json',apikey:pub},body:JSON.stringify({email:get('email'),password:get('password')})});const data=await r.json();if(!r.ok||!data.access_token)throw Error('Correo o contraseña incorrectos');session(data);$('password').value='';note('Sesión iniciada');await refresh();}
 catch(err){note(err.message)}finally{btn.disabled=false;}
});
$('logout').addEventListener('click',()=>{clearSession();showLogin();note('Sesión cerrada.');});
$('refresh').addEventListener('click',refresh);$('agendaRefresh').addEventListener('click',refresh);
for(const b of document.querySelectorAll('[data-tab]'))b.addEventListener('click',()=>tab(b.dataset.tab));
$('filterStatus').addEventListener('change',renderBookings);$('filterDate').addEventListener('change',renderBookings);
$('clearFilters').addEventListener('click',()=>{$('filterDate').value='';$('filterStatus').value='active';renderBookings();});
$('manualBookingForm').addEventListener('submit',async e=>{e.preventDefault();const btn=e.target.querySelector('button[type=submit]');btn.disabled=true;
 try{await post({action:'admin_manual_booking',date:get('manualDate'),time:get('manualTime'),name:get('manualName').trim(),phone:get('manualPhone').replace(/\D/g,''),service:get('manualService').trim()});
 note('Cita registrada y confirmada. Puedes avisarle por WhatsApp desde la agenda.');e.target.reset();await refresh();tab('agenda');}catch(err){note(err.message)}finally{btn.disabled=false;}
});
$('saveSettings').addEventListener('click',async()=>{try{await post({action:'admin_settings',duration:Number(get('duration')),step:Number(get('step'))});note('Duración actualizada.');await refresh();}catch(err){note(err.message);}});
$('blockDay').addEventListener('click',async()=>{try{if(!get('blockedDay'))throw Error('Selecciona una fecha.');await post({action:'admin_block',date:get('blockedDay'),note:get('blockedReason').trim()});note('Fecha bloqueada. Recuerda cancelar manualmente las citas ya registradas.');await refresh();}catch(err){note(err.message);}});
if(access)refresh();else showLogin();
})();
