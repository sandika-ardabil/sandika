-- Syndicate portal role-based access setup (Supabase / PostgreSQL)
-- Demo credentials are hashed at rest. Browser-only demo login is separate and NOT production auth.
create extension if not exists pgcrypto;
do $$ begin
  create type public.user_roles as enum ('pharmacy','distributor','organization','admin');
exception when duplicate_object then null; end $$;

create table if not exists public.system_users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  role public.user_roles not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.system_users enable row level security;
-- Users can read their own role/profile only; no public/anon table access or client-side password storage.
drop policy if exists "read own profile" on public.system_users;
create policy "read own profile" on public.system_users for select to authenticated using (id = auth.uid());
-- Administrative profile writes should be performed by a trusted service-role backend, never anon clients.

-- For actual Supabase sign-in, create matching auth.users (email = username || '@syndicate.local')
-- via the Supabase dashboard/service-role admin API and set the same UUID below. Passwords are
-- intentionally not inserted here: auth.users credentials must be created by Supabase Auth.
-- Demo roster (passwords shown only in login.html's local presentation fallback):
-- username       demo password  role          display name
-- pharma_shifa   123456         pharmacy      داروخانه دکتر شفائی (HIX: 140288)
-- hejr_ardabil   123456         distributor   شرکت پخش هجرت - شعبه اردبیل
-- fdo_ardabil    123456         organization  معاونت غذا و دارو دانشگاه علوم پزشکی اردبیل
-- admin          admin123       admin         مدیریت انجمن دارویی اردبیل
-- Insert linked profile rows after provisioning auth.users, for example:
-- insert into public.system_users(id,username,display_name,role) values
-- ('<auth-user-uuid>','pharma_shifa','داروخانه دکتر شفائی (HIX: 140288)','pharmacy');
