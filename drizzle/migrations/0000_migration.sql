create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- First account to sign up becomes admin; later accounts get no access until an admin grants it.
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users
for each row execute function public.handle_new_user_role();

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text,
  company_name text,
  contact_info text,
  service_date date,
  service_types text[] not null default '{}',
  service_other text,
  ratings jsonb not null default '{}'::jsonb,
  open_answers jsonb not null default '{}'::jsonb,
  follow_up boolean,
  contact_methods text[] not null default '{}',
  contact_other text,
  contacted boolean not null default false,
  resolved boolean not null default false
);
grant insert on public.survey_responses to anon, authenticated;
grant select, update, delete on public.survey_responses to authenticated;
grant all on public.survey_responses to service_role;
alter table public.survey_responses enable row level security;

create policy "Anyone can submit" on public.survey_responses for insert to anon, authenticated
  with check (contacted = false and resolved = false);
create policy "Admins read" on public.survey_responses for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update" on public.survey_responses for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete" on public.survey_responses for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.get_public_stats()
returns json language sql stable security definer set search_path = public
as $$
  select json_build_object(
    'responses', count(*),
    'avg_rating', (select avg((v)::numeric) from public.survey_responses r2, jsonb_each_text(r2.ratings) as e(k, v)),
    'follow_ups', count(*) filter (where follow_up is true)
  ) from public.survey_responses
$$;
grant execute on function public.get_public_stats() to anon, authenticated;