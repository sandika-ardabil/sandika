-- ============================================================
-- Sandika v61 CMS Master — Supabase Schema
-- Run this file once in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run (idempotent: IF NOT EXISTS / DROP POLICY IF EXISTS).
-- Never put the service_role / secret key in this site's JS files.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- 1) profiles : کاربران کنسول مدیریت ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  fullname    text,
  role        text not null default 'member'
              check (role in ('manager','admin','board','member')),
  status      text not null default 'active'
              check (status in ('active','disabled','pending')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx   on public.profiles(role);
create index if not exists profiles_status_idx on public.profiles(status);

-- ---------- 2) letters : کارتابل نامه‌ها ----------
create table if not exists public.letters (
  id          uuid primary key default gen_random_uuid(),
  number      text not null,
  letter_date date,                       -- یادداشت: date در SQL کلمه کلیدی رزرو است، پس letter_date
  subject     text,
  body        text,
  sender      text,
  receiver    text,
  status      text not null default 'active'
              check (status in ('active','archived')),
  archived    boolean not null default false,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists letters_status_idx on public.letters(status);
create index if not exists letters_date_idx   on public.letters(letter_date desc);

-- ---------- 3) site_settings : تنظیمات سایت / کنسول ----------
create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_by  uuid references public.profiles(id) on delete set null,
  updated_at  timestamptz not null default now()
);

-- ---------- trigger به‌روزرسانی updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_letters_touch on public.letters;
create trigger trg_letters_touch before update on public.letters
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_settings_touch on public.site_settings;
create trigger trg_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ---------- ساخت پروفایل خودکار پس از ثبت‌نام در auth.users ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, fullname, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'fullname', ''),
    'member',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- helper: آیا کاربر جاری مدیر است؟ ----------
create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('manager','admin') and p.status = 'active'
  );
$$;

-- ---------- RLS ----------
alter table public.profiles      enable row level security;
alter table public.letters       enable row level security;
alter table public.site_settings enable row level security;

-- profiles: هر کاربر ردیف خودش را می‌بیند، مدیر همه را
drop policy if exists profiles_select_self   on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (auth.uid() = id or public.is_manager());

drop policy if exists profiles_update_self   on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id or public.is_manager());

drop policy if exists profiles_insert_manager on public.profiles;
create policy profiles_insert_manager on public.profiles
  for insert with check (public.is_manager());

drop policy if exists profiles_delete_manager on public.profiles;
create policy profiles_delete_manager on public.profiles
  for delete using (public.is_manager());

-- letters: فقط کاربران فعالِ واردشده؛ نوشتن برای مدیر و هیئت‌مدیره
drop policy if exists letters_select_auth on public.letters;
create policy letters_select_auth on public.letters
  for select using (auth.role() = 'authenticated');

drop policy if exists letters_write_manager on public.letters;
create policy letters_write_manager on public.letters
  for all using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.status='active' and p.role in ('manager','admin','board'))
  ) with check (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.status='active' and p.role in ('manager','admin','board'))
  );

-- site_settings: خواندن عمومی، نوشتن فقط مدیر
drop policy if exists settings_read_public on public.site_settings;
create policy settings_read_public on public.site_settings
  for select using (true);

drop policy if exists settings_write_manager on public.site_settings;
create policy settings_write_manager on public.site_settings
  for all using (public.is_manager()) with check (public.is_manager());

-- ---------- داده اولیهٔ تنظیمات ----------
insert into public.site_settings (key, value) values
  ('branding', '{"accent":"#00b4d8","siteTitle":"انجمن صنفی شرکت‌های پخش دارو استان اردبیل"}'::jsonb),
  ('access',   '{"defaultRole":"member","requireApproval":true}'::jsonb)
on conflict (key) do nothing;

-- ---------- تبدیل مدیر اول ----------
-- پس از ساخت کاربر در Authentication > Users، یک‌بار اجرا کنید:
-- update public.profiles set role='manager', status='active' where username='admin';

-- ============================================================
-- پایان فایل
-- ============================================================
