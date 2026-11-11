-- DIBÚJAME NAILS STUDIO · Base independiente para agenda
-- Ejecutar SOLO en el proyecto Supabase nuevo del salón.
-- No usar el proyecto FIESTAANUAL26.
-- Ninguna tabla entrega datos personales a clientes anónimos.

create extension if not exists btree_gist;

create table if not exists public.dn_schedule (
  weekday smallint primary key check (weekday between 0 and 6),
  enabled boolean not null default false,
  opens_at time not null default '10:00',
  closes_at time not null default '19:00',
  constraint dn_schedule_hours check (opens_at < closes_at)
);
insert into public.dn_schedule (weekday)
select s from generate_series(0, 6) as s
on conflict (weekday) do nothing;

create table if not exists public.dn_settings (
  id boolean primary key default true check (id = true),
  duration_minutes integer not null default 90 check (duration_minutes in (30, 60, 90, 120, 150, 180)),
  step_minutes integer not null default 30 check (step_minutes in (15, 30, 60)),
  max_days_ahead integer not null default 60 check (max_days_ahead between 7 and 180)
);
insert into public.dn_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.dn_blocked_dates (
  date_blocked date primary key,
  note text not null default '' check (length(note) <= 150)
);

create table if not exists public.dn_bookings (
  id uuid primary key default gen_random_uuid(),
  appointment_date date not null,
  starts_at time not null,
  duration_minutes integer not null check (duration_minutes in (30,60,90,120,150,180)),
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  customer_phone text not null check (customer_phone ~ '^[0-9]{10}$'),
  service_note text not null default '' check (char_length(service_note) <= 150),
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dn_booking_end_of_day check (starts_at + (duration_minutes * interval '1 minute') <= time '23:59:59')
);
-- Evita doble reserva incluso si llegan dos solicitudes a la misma milésima.
-- Nota: los registros pendientes vencidos deben pasar a 'cancelled', como hace la Edge Function.
alter table public.dn_bookings
  add constraint dn_bookings_no_overlap
  exclude using gist (
    (tsrange(appointment_date + starts_at,
             appointment_date + starts_at + (duration_minutes * interval '1 minute'), '[)')) with &&
  ) where (status in ('pending','confirmed'));

create index if not exists dn_bookings_by_date on public.dn_bookings (appointment_date, status);
create index if not exists dn_bookings_by_phone on public.dn_bookings (customer_phone, appointment_date);

create table if not exists public.dn_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- No hay políticas públicas. Solo Edge Function con credenciales secretas puede leer/escribir.
alter table public.dn_schedule enable row level security;
alter table public.dn_settings enable row level security;
alter table public.dn_blocked_dates enable row level security;
alter table public.dn_bookings enable row level security;
alter table public.dn_admins enable row level security;

revoke all on table public.dn_schedule, public.dn_settings, public.dn_blocked_dates,
  public.dn_bookings, public.dn_admins from anon, authenticated;
grant select, insert, update, delete on table public.dn_schedule, public.dn_settings,
  public.dn_blocked_dates, public.dn_bookings, public.dn_admins to service_role;

-- ADMINISTRADORA: una vez creada en Authentication > Users, sustituir este UUID por su ID:
-- insert into public.dn_admins(user_id) values ('00000000-0000-0000-0000-000000000000');
-- Horarios: se configuran desde admin.html; por seguridad todos los días empiezan CERRADOS.
