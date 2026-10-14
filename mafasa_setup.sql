-- =====================================================================
-- mafasa_setup.sql
-- Supabase migration for: mafasa_requests
-- سامانه صدور گواهی عدم مانع (آنلاین) انجمن شرکت‌های پخش دارو و مکمل‌های انسانی استان اردبیل
-- کمیسیون ماده ۲۰ دانشگاه علوم پزشکی اردبیل
-- Engine: PostgreSQL 15+ (Supabase compatible)
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Table definition
-- ---------------------------------------------------------------------
create table if not exists public.mafasa_requests (
    id                uuid primary key default gen_random_uuid(),
    tracking_code     text not null unique,
    request_type      text not null check (request_type in (
                          'تأسیس', 'ابطال پروانه', 'جابجایی',
                          'تغییر مسئول فنی', 'انتقال سهمیه')),
    pharmacy_name     text not null,
    owner_name        text not null,
    national_id       varchar(10) not null check (national_id ~ '^[0-9]{10}$'),
    phone             text,
    address           text,
    license_number    text,
    status            text not null default 'در انتظار بررسی'
                      check (status in ('در انتظار بررسی', 'در حال بررسی', 'تأیید شده', 'رد شده')),
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

comment on table  public.mafasa_requests is 'درخواست‌های گواهی عدم مانع انجمن پخش دارو استان اردبیل';
comment on column public.mafasa_requests.tracking_code is 'کد رهگیری یکتا با فرمت MAF-YYMM-XXXX';
comment on column public.mafasa_requests.request_type is 'نوع درخواست: تأسیس / ابطال پروانه / جابجایی / تغییر مسئول فنی / انتقال سهمیه';
comment on column public.mafasa_requests.national_id is 'کد ملی ۱۰ رقمی متقاضی';
comment on column public.mafasa_requests.status is 'وضعیت بررسی درخواست';

-- ---------------------------------------------------------------------
-- 2) Indexes
-- ---------------------------------------------------------------------
create index if not exists idx_mafasa_requests_tracking_code
    on public.mafasa_requests (tracking_code);
create index if not exists idx_mafasa_requests_national_id
    on public.mafasa_requests (national_id);
create index if not exists idx_mafasa_requests_status
    on public.mafasa_requests (status);
create index if not exists idx_mafasa_requests_created_at
    on public.mafasa_requests (created_at desc);

-- ---------------------------------------------------------------------
-- 3) Automatic updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.mafasa_set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_mafasa_requests_updated_at on public.mafasa_requests;
create trigger trg_mafasa_requests_updated_at
    before update on public.mafasa_requests
    for each row execute function public.mafasa_set_updated_at();

-- ---------------------------------------------------------------------
-- 4) Row Level Security (RLS)
--    - anon can INSERT new requests (from public form)
--    - anon can SELECT by tracking_code or national_id (tracking lookup)
--    - no UPDATE/DELETE for anon
-- ---------------------------------------------------------------------
alter table public.mafasa_requests enable row level security;

drop policy if exists "anon can insert requests" on public.mafasa_requests;
create policy "anon can insert requests"
    on public.mafasa_requests
    for insert
    to anon
    with check (true);

drop policy if exists "anon can track own request" on public.mafasa_requests;
create policy "anon can track own request"
    on public.mafasa_requests
    for select
    to anon
    using (true);

-- ---------------------------------------------------------------------
-- 5) Server-side tracking code generator (helper, RPC)
--    Example call from client:
--      POST {SUPABASE_URL}/rest/v1/rpc/mafasa_new_tracking_code
-- ---------------------------------------------------------------------
create or replace function public.mafasa_new_tracking_code()
returns text
language plpgsql
as $$
declare
    code text;
begin
    code := 'MAF-' || to_char(now(), 'YYMM') || '-' ||
            lpad((floor(random() * 10000))::int::text, 4, '0');
    while exists (select 1 from public.mafasa_requests where tracking_code = code) loop
        code := 'MAF-' || to_char(now(), 'YYMM') || '-' ||
                lpad((floor(random() * 10000))::int::text, 4, '0');
    end loop;
    return code;
end;
$$;

-- End of migration
