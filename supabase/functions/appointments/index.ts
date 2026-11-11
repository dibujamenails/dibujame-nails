// Supabase Edge Function · Dibújame Nails Studio
// Publicar con Verify JWT = OFF: la autorización administrativa se comprueba aquí.
// No publicar claves secretas en GitHub ni en js/config.js.
import { createClient } from 'npm:@supabase/supabase-js@2.112.3';

const SITE = 'https://dibujamenails.github.io';
const TZ = 'America/Mexico_City';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
const publicKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}');
const serviceKey = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const publicKey = publicKeys.default || Deno.env.get('SUPABASE_ANON_KEY') || '';
if (!supabaseUrl || !serviceKey || !publicKey) console.error('Faltan credenciales internas Supabase');
const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
const auth = createClient(supabaseUrl, publicKey, { auth: { persistSession: false } });

function cors(req: Request): Record<string,string> {
  const origin = req.headers.get('origin');
  const ok = !origin || origin === SITE || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    'Access-Control-Allow-Origin': ok && origin ? origin : SITE,
    'Access-Control-Allow-Headers': 'content-type,authorization,apikey',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
  };
}
function reply(req: Request, value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { ...cors(req), 'Content-Type': 'application/json; charset=utf-8' } });
}
function minutes(time: string) { const [h,m] = time.slice(0,5).split(':').map(Number); return h*60+m; }
function hm(n: number) { return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`; }
function salonNow() {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
  const get=(type:string)=>parts.find(p=>p.type===type)?.value||'00';
  return { date:`${get('year')}-${get('month')}-${get('day')}`, minute:Number(get('hour'))*60+Number(get('minute')) };
}
function validDate(s: unknown, maxDays: number) {
  if(typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  if(!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10)!==s) return false;
  const today=salonNow().date;
  return s>=today && (Date.parse(s+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/(86400000) <= maxDays;
}
async function must<T>(promise: PromiseLike<{data:T|null,error:any}>):Promise<T> {
  const {data,error}=await promise;
  if(error) { console.error(error.code || error.message); throw new Error('DATABASE_ERROR'); }
  return data as T;
}
async function cleanExpired() {
  const {error}=await db.from('dn_bookings').update({status:'cancelled',updated_at:new Date().toISOString()})
    .eq('status','pending').lt('expires_at',new Date().toISOString());
  if(error) throw new Error('CLEANUP_ERROR');
}
async function settings() {
  return await must(db.from('dn_settings').select('duration_minutes,step_minutes,max_days_ahead').eq('id',true).single());
}
type Slot = {start:string};
async function availability(date: string) {
  const setup:any=await settings();
  if(!validDate(date,setup.max_days_ahead)) return { slots:[], closed:true, reason:'Fecha no disponible', durationMinutes:setup.duration_minutes };
  await cleanExpired();
  const weekday=new Date(`${date}T12:00:00Z`).getUTCDay();
  const schedule:any=await must(db.from('dn_schedule').select('enabled,opens_at,closes_at').eq('weekday',weekday).single());
  if(!schedule.enabled) return {slots:[],closed:true,reason:'El estudio no atiende ese día',durationMinutes:setup.duration_minutes};
  const blocks:any[]=await must(db.from('dn_blocked_dates').select('date_blocked').eq('date_blocked',date));
  if(blocks.length) return {slots:[],closed:true,reason:'Fecha bloqueada',durationMinutes:setup.duration_minutes};
  const taken:any[]=await must(db.from('dn_bookings').select('starts_at,duration_minutes').eq('appointment_date',date).in('status',['pending','confirmed']));
  const now=salonNow(); const values:string[]=[];
  const start=minutes(schedule.opens_at), end=minutes(schedule.closes_at);
  for(let t=start; t+setup.duration_minutes<=end; t+=setup.step_minutes) {
    if(date===now.date && t<now.minute+60)continue;
    if(taken.some(b=> t < minutes(b.starts_at)+b.duration_minutes && t+setup.duration_minutes > minutes(b.starts_at))) continue;
    values.push(hm(t));
  }
  return {slots:values,closed:false,durationMinutes:setup.duration_minutes};
}
async function isAdmin(req:Request) {
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  if(!token)return false;
  const {data,error}=await auth.auth.getUser(token);
  if(error || !data.user?.id)return false;
  const {data:records,error:dbError}=await db.from('dn_admins').select('user_id').eq('user_id',data.user.id).limit(1);
  return !dbError && !!records?.length;
}
function safeText(v:any,max=80) {return typeof v==='string'?v.trim().slice(0,max+1):'';}

Deno.serve(async (req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(req)});
  const origin=req.headers.get('origin');
  if(origin && origin!==SITE && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))return reply(req,{error:'Origen no autorizado'},403);
  try {
    if(!supabaseUrl || !serviceKey || !publicKey) return reply(req,{error:'Servidor no configurado'},503);
    const url=new URL(req.url);
    if(req.method==='GET'){
      if(url.searchParams.get('action')!=='availability')return reply(req,{error:'Ruta no encontrada'},404);
      const date=url.searchParams.get('date')||'';
      return reply(req,await availability(date));
    }
    if(req.method!=='POST')return reply(req,{error:'Método no permitido'},405);
    const body=await req.json().catch(()=>({}));
    const action=safeText(body.action,30);
    if(action==='reserve') {
      if(body.website) return reply(req,{error:'Solicitud inválida'},400); // honeypot
      const name=safeText(body.name), phone=String(body.phone||'').replace(/\D/g,''),date=safeText(body.date,10),time=safeText(body.time,5);
      const service=safeText(body.service,150);
      if(name.length<2||name.length>80||!/^\d{10}$/.test(phone)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||!body.consent)
        return reply(req,{error:'Revisa nombre, teléfono, horario y autorización de contacto'},400);
      const found=await availability(date);
      if(!found.slots.includes(time))return reply(req,{error:'Ese horario ya no está disponible. Elige otro.',code:'SLOT_TAKEN'},409);
      const upcoming:any[]=await must(db.from('dn_bookings').select('id').eq('customer_phone',phone).in('status',['pending','confirmed']).gte('appointment_date',salonNow().date).limit(3));
      if(upcoming.length>=3) return reply(req,{error:'Para solicitar más citas comunícate directamente por WhatsApp.'},429);
      const expiration=new Date(Date.now()+30*60*1000).toISOString();
      const {data,error}=await db.from('dn_bookings').insert({appointment_date:date,starts_at:time+':00',duration_minutes:found.durationMinutes,
        customer_name:name,customer_phone:phone,service_note:service,status:'pending',expires_at:expiration}).select('id').single();
      if(error){if(error.code==='23P01'||error.code==='23505')return reply(req,{error:'Ese horario acaba de ocuparse. Elige otro.',code:'SLOT_TAKEN'},409);
        console.error(error.code);return reply(req,{error:'No se pudo registrar la solicitud'},500);}
      return reply(req,{status:'pending',id:data.id,expiresAt:expiration,date,time});
    }
    // Todas las acciones administrativas usan cuenta autenticada + whitelist de usuarios autorizados.
    if(!await isAdmin(req))return reply(req,{error:'No autorizado'},401);
    await cleanExpired();
    if(action==='admin_list'){
      const rows=await must(db.from('dn_bookings').select('id,appointment_date,starts_at,duration_minutes,customer_name,customer_phone,service_note,status,expires_at,created_at')
        .gte('appointment_date',salonNow().date).order('appointment_date',{ascending:true}).order('starts_at',{ascending:true}).limit(250));
      const schedule=await must(db.from('dn_schedule').select('*').order('weekday'));
      const blocked=await must(db.from('dn_blocked_dates').select('*').gte('date_blocked',salonNow().date).order('date_blocked').limit(100));
      return reply(req,{bookings:rows,schedule,blocked,settings:await settings()});
    }
    if(action==='admin_booking'){
      const id=safeText(body.id,50), status=safeText(body.status,20);
      if(!/^[a-f0-9-]{36}$/i.test(id)||!['confirmed','cancelled'].includes(status)) return reply(req,{error:'Datos inválidos'},400);
      const {data,error}=await db.from('dn_bookings').update({status,updated_at:new Date().toISOString()})
        .eq('id',id).in('status',['pending','confirmed']).select('id').maybeSingle();
      if(error)return reply(req,{error:'No se pudo actualizar la cita'},400);
      if(!data)return reply(req,{error:'La cita ya venció o fue cancelada'},409);
      return reply(req,{ok:true});
    }
    if(action==='admin_schedule'){
      const weekday=Number(body.weekday),opens=safeText(body.opens,5),closes=safeText(body.closes,5);
      const regex=/^([01]\d|2[0-3]):[0-5]\d$/;
      if(!Number.isInteger(weekday)||weekday<0||weekday>6||!regex.test(opens)||!regex.test(closes)||minutes(opens)>=minutes(closes))return reply(req,{error:'Horario inválido'},400);
      const {error}=await db.from('dn_schedule').upsert({weekday,opens_at:opens,closes_at:closes,enabled:!!body.enabled});
      if(error)return reply(req,{error:'Error al actualizar horario'},400);
      return reply(req,{ok:true});
    }
    if(action==='admin_settings'){
      const dur=Number(body.duration),step=Number(body.step);
      if(![30,60,90,120,150,180].includes(dur)||![15,30,60].includes(step))return reply(req,{error:'Configuración inválida'},400);
      const {error}=await db.from('dn_settings').update({duration_minutes:dur,step_minutes:step}).eq('id',true);
      if(error)return reply(req,{error:'No se pudo cambiar la duración'},400);
      return reply(req,{ok:true});
    }
    if(action==='admin_block'){
      const date=safeText(body.date,10);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return reply(req,{error:'Fecha inválida'},400);
      const {error}=await db.from('dn_blocked_dates').upsert({date_blocked:date,note:safeText(body.note,150)});
      if(error)return reply(req,{error:'No se pudo bloquear el día'},400);
      return reply(req,{ok:true});
    }
    if(action==='admin_unblock'){
      const date=safeText(body.date,10);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return reply(req,{error:'Fecha inválida'},400);
      const {error}=await db.from('dn_blocked_dates').delete().eq('date_blocked',date);
      if(error)return reply(req,{error:'No se pudo desbloquear el día'},400);
      return reply(req,{ok:true});
    }
    return reply(req,{error:'Acción no encontrada'},404);
  }catch(error){console.error('appointment error', error instanceof Error?error.message:String(error));return reply(req,{error:'Error interno, intenta nuevamente'},500);}
});
