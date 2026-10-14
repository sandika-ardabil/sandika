-- Pharmacy Direct Portal Phase 2 Schema & Sample Data
-- For Supabase PostgreSQL (Public Schema)

create extension if not exists pgcrypto;

grant usage on schema public to anon;

create table if not exists public.pharmacy_quotas (
  id uuid primary key default gen_random_uuid(),
  drug_name text not null,
  category text,
  distributor text not null,
  quota_amount text,
  status text default 'فعال',
  release_date text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pharmacy_deadstock_shortages (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('shortage', 'deadstock')),
  pharmacy_name text not null,
  license_no text not null,
  drug_name text not null,
  dosage_form text,
  batch_no text,
  expiry_date text,
  quantity integer not null,
  price numeric(18,2),
  contact_phone text not null,
  city text,
  status text default 'فعال',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pharmacy_complaints (
  id uuid primary key default gen_random_uuid(),
  tracking_code text unique not null,
  pharmacy_name text not null,
  license_no text not null,
  distributor_name text not null,
  complaint_type text not null,
  invoice_no text,
  file_url text,
  description text not null,
  status text default 'ثبت‌شده',
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pharmacy_quotas enable row level security;
alter table public.pharmacy_deadstock_shortages enable row level security;
alter table public.pharmacy_complaints enable row level security;

drop policy if exists quotas_anon_all on public.pharmacy_quotas;
create policy quotas_anon_all on public.pharmacy_quotas for all to anon using (true) with check (true);

drop policy if exists exchange_anon_all on public.pharmacy_deadstock_shortages;
create policy exchange_anon_all on public.pharmacy_deadstock_shortages for all to anon using (true) with check (true);

drop policy if exists complaints_anon_all on public.pharmacy_complaints;
create policy complaints_anon_all on public.pharmacy_complaints for all to anon using (true) with check (true);

grant select, insert, update, delete on public.pharmacy_quotas to anon;
grant select, insert, update, delete on public.pharmacy_deadstock_shortages to anon;
grant select, insert, update, delete on public.pharmacy_complaints to anon;

insert into public.pharmacy_quotas (drug_name, category, distributor, quota_amount, status, release_date, notes)
select 'انسولین گلارژین (لانتوس)', 'انسولین', 'داروپخش', '۳۵ ویال / سهمیه هر داروخانه', 'در حال توزیع', '۱۴۰۳/۰۸/۰۱', 'اولویت با نسخ تاییدشده بیمه'
where not exists (select 1 from public.pharmacy_quotas where drug_name = 'انسولین گلارژین (لانتوس)');

insert into public.pharmacy_quotas (drug_name, category, distributor, quota_amount, status, release_date, notes)
select 'سرم سدیم کلراید ۰.۹٪ ۵۰۰ سی‌سی', 'سرم', 'رازی', '۲۰۰ عدد', 'فعال', '۱۴۰۳/۰۸/۰۵', 'توزیع طبق سرانه مصرف ماهانه'
where not exists (select 1 from public.pharmacy_quotas where drug_name = 'سرم سدیم کلراید ۰.۹٪ ۵۰۰ سی‌سی');

insert into public.pharmacy_quotas (drug_name, category, distributor, quota_amount, status, release_date, notes)
select 'شربت کوآموکسی‌کلاو ۳۱۲', 'آنتی‌بیوتیک‌ها', 'هجرت', '۶۰ شیشه', 'محدود', '۱۴۰۳/۰۸/۱۰', 'کنترل ثبت در سامانه تی‌تک الزامی است'
where not exists (select 1 from public.pharmacy_quotas where drug_name = 'شربت کوآموکسی‌کلاو ۳۱۲');

insert into public.pharmacy_quotas (drug_name, category, distributor, quota_amount, status, release_date, notes)
select 'ویال ایمونوگلوبولین وریدی (IVIG)', 'داروهای خاص', 'اکسیر', '۱۵ عدد', 'سهمیه ویژه', '۱۴۰۳/۰۸/۱۲', 'تحویل صرفاً با ثبت مشخصات بیمار'
where not exists (select 1 from public.pharmacy_quotas where drug_name = 'ویال ایمونوگلوبولین وریدی (IVIG)');

insert into public.pharmacy_deadstock_shortages (type, pharmacy_name, license_no, drug_name, dosage_form, batch_no, expiry_date, quantity, price, contact_phone, city, status)
select 'deadstock', 'داروخانه رازی اردبیل', '۴۴۱۲۰', 'قرص متفورمین ۵۰۰ (جعبه ۱۰۰ تایی)', 'قرص', 'BT-9821', '2025-11-20', 40, 1500000, '04533221100', 'اردبیل', 'فعال'
where not exists (select 1 from public.pharmacy_deadstock_shortages where drug_name = 'قرص متفورمین ۵۰۰ (جعبه ۱۰۰ تایی)');

insert into public.pharmacy_deadstock_shortages (type, pharmacy_name, license_no, drug_name, dosage_form, batch_no, expiry_date, quantity, price, contact_phone, city, status)
select 'shortage', 'داروخانه دکتر کریمی', '۳۹۲۱۰', 'آمپول متوکاربامول ۵۰۰', 'آمپول', null, null, 120, null, '09141512345', 'اردبیل', 'فعال'
where not exists (select 1 from public.pharmacy_deadstock_shortages where drug_name = 'آمپول متوکاربامول ۵۰۰');

insert into public.pharmacy_complaints (tracking_code, pharmacy_name, license_no, distributor_name, complaint_type, invoice_no, description, status)
select 'PH-0308-1001', 'داروخانه شفا', '۱۸۲۴۰', 'پخش البرز', 'سبد اجباری', 'FA-403-882', 'فروش اقلام آنتی‌بیوتیک منوط به خرید مکمل‌های کم‌گردش شده است.', 'در حال بررسی'
where not exists (select 1 from public.pharmacy_complaints where tracking_code = 'PH-0308-1001');
