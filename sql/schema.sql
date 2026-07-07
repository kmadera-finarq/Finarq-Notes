-- Esquema para "Espacio de equipo"
-- Ejecuta este archivo completo en Supabase: Dashboard > SQL Editor > New query

create extension if not exists "pgcrypto";

-- ---------- Tablas ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_color int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  primary key (group_id, profile_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  ticket text not null,
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  description text not null default '',
  assignee_id uuid references public.profiles(id) on delete set null,
  priority text not null default 'media' check (priority in ('baja','media','alta')),
  status text not null default 'todo' check (status in ('todo','doing','done')),
  due_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists tasks_group_id_idx on public.tasks(group_id);
create index if not exists group_members_profile_id_idx on public.group_members(profile_id);

-- ---------- Perfil automático al iniciar sesión ----------

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    (select count(*)::int from public.profiles)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Ticket automático (TSK-001, TSK-002, ...) ----------

create or replace function public.set_ticket()
returns trigger as $$
declare
  next_num int;
begin
  if new.ticket is null or new.ticket = '' then
    select coalesce(max((regexp_match(ticket, 'TSK-(\d+)'))[1]::int), 0) + 1
    into next_num
    from public.tasks;
    new.ticket := 'TSK-' || lpad(next_num::text, 3, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_set_ticket on public.tasks;
create trigger tasks_set_ticket
  before insert on public.tasks
  for each row execute procedure public.set_ticket();

-- ---------- RLS ----------
-- Herramienta interna de equipo: cualquier persona autenticada puede ver y
-- colaborar en todo (igual que la versión de artefacto). Ajusta estas
-- políticas si necesitas permisos más estrictos por grupo.

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.tasks enable row level security;

create policy "profiles: leer todo el equipo" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles: actualizar el propio" on public.profiles
  for update using (auth.uid() = id);

create policy "groups: leer" on public.groups
  for select using (auth.role() = 'authenticated');
create policy "groups: crear" on public.groups
  for insert with check (auth.role() = 'authenticated');
create policy "groups: actualizar" on public.groups
  for update using (auth.role() = 'authenticated');
create policy "groups: borrar" on public.groups
  for delete using (auth.role() = 'authenticated');

create policy "group_members: leer" on public.group_members
  for select using (auth.role() = 'authenticated');
create policy "group_members: insertar" on public.group_members
  for insert with check (auth.role() = 'authenticated');
create policy "group_members: borrar" on public.group_members
  for delete using (auth.role() = 'authenticated');

create policy "tasks: leer" on public.tasks
  for select using (auth.role() = 'authenticated');
create policy "tasks: crear" on public.tasks
  for insert with check (auth.role() = 'authenticated');
create policy "tasks: actualizar" on public.tasks
  for update using (auth.role() = 'authenticated');
create policy "tasks: borrar" on public.tasks
  for delete using (auth.role() = 'authenticated');

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.groups;
alter publication supabase_realtime add table public.group_members;
