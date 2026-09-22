-- Khojau dedicated Supabase schema. Run in a FRESH Khojau-only Supabase project.
-- No fake providers/reviews are seeded — only the 22 canonical categories + plans.

create extension if not exists "pgcrypto";

-- ── categories ──────────────────────────────────────────────
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text not null default '',
  description text,
  created_at timestamptz not null default now()
);

-- ── providers ───────────────────────────────────────────────
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  business_name text not null check (char_length(business_name) between 2 and 120),
  slug text not null unique,
  description text check (description is null or char_length(description) <= 2000),
  category_id uuid references public.categories(id) on delete set null,
  phone text not null,
  whatsapp text,
  email text,
  website text,
  facebook text,
  instagram text,
  city text not null,
  area text,
  address text,
  latitude double precision,
  longitude double precision,
  price_min integer check (price_min is null or price_min >= 0),
  price_max integer check (price_max is null or price_max >= 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified')),
  plan text not null default 'free' check (plan in ('free','featured','premium')),
  logo_url text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists providers_status_idx on public.providers(status);
create index if not exists providers_city_idx on public.providers(city);
create index if not exists providers_category_idx on public.providers(category_id);
create index if not exists providers_search_idx on public.providers using gin (to_tsvector('english', coalesce(business_name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(city,'') || ' ' || coalesce(area,'')));

-- ── services (line items per provider) ──────────────────────
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name text not null,
  price_min integer,
  price_max integer,
  created_at timestamptz not null default now()
);
create index if not exists services_provider_idx on public.services(provider_id);

-- ── hours / images ──────────────────────────────────────────
create table if not exists public.provider_hours (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  unique(provider_id, weekday)
);

create table if not exists public.provider_images (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  url text not null,
  caption text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- ── reports / requests / events / monetization ──────────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  contact text,
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  location text not null,
  description text not null,
  preferred_time text,
  phone text not null,
  status text not null default 'open' check (status in ('open','matched','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  meta jsonb not null default '{}',
  path text,
  created_at timestamptz not null default now()
);
create index if not exists events_event_idx on public.events(event);

create table if not exists public.plans (
  id text primary key,
  name text not null,
  price_monthly_npr integer not null,
  features jsonb not null default '[]'
);

create table if not exists public.provider_subscriptions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  note text
);

-- seed plans + categories (idempotent)
insert into public.plans (id, name, price_monthly_npr, features) values
  ('free','Free',0,'["Basic listing","Phone + WhatsApp CTA"]'),
  ('featured','Featured',299,'["Homepage rotation","Badge","Priority ranking"]'),
  ('premium','Premium',999,'["Top placement","Cover image","Social links"]')
on conflict (id) do nothing;

insert into public.categories (name, slug, icon, description) values
  ('Electrician','electrician','⚡','Wiring, switches, lighting and electrical repair'),
  ('Plumber','plumber','🔧','Leaks, taps, drainage and sanitary work'),
  ('Laptop Repair','laptop-repair','💻','Laptop service, upgrades and data recovery'),
  ('Mobile Repair','mobile-repair','📱','Screen, battery and mobile servicing'),
  ('AC Repair','ac-repair','❄️','AC install, servicing and gas refill'),
  ('Refrigerator Repair','refrigerator-repair','🧊','Fridge cooling and compressor repair'),
  ('Washing Machine Repair','washing-machine-repair','🌀','Washer service and spare parts'),
  ('Mechanic','mechanic','🔩','General mechanical repair help'),
  ('Tutor','tutor','📚','SEE, +2, bachelor and language tutors'),
  ('Photographer','photographer','📷','Events, portraits and product shoots'),
  ('Cleaner','cleaner','🧹','Home and office deep cleaning'),
  ('Painter','painter','🎨','House painting and wall putty'),
  ('Mover','mover','🚚','House shifting and transport'),
  ('Tailor','tailor','🧵','Stitching, fitting and boutiques'),
  ('Makeup Artist','makeup-artist','💄','Bridal and event makeup'),
  ('Car/Bike Service','car-bike-service','🏍️','Servicing, wash and roadside help'),
  ('Internet Technician','internet-technician','🌐','Router, cabling and ISP support'),
  ('Home Appliance Repair','home-appliance-repair','🔌','TV, microwave, fan and small appliances'),
  ('Construction Worker','construction-worker','🏗️','Mason, carpenter and labour help'),
  ('Graphic Designer','graphic-designer','🖌️','Logos, banners and social media design'),
  ('Video Editor','video-editor','🎬','Reels, wedding and YouTube editing'),
  ('Other','other','➕','Other local services')
on conflict (slug) do nothing;

-- ── RLS ─────────────────────────────────────────────────────
alter table public.categories enable row level security;
alter table public.providers enable row level security;
alter table public.services enable row level security;
alter table public.provider_hours enable row level security;
alter table public.provider_images enable row level security;
alter table public.reports enable row level security;
alter table public.service_requests enable row level security;
alter table public.events enable row level security;
alter table public.plans enable row level security;
alter table public.provider_subscriptions enable row level security;

-- public read: approved providers + related + categories/plans
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);
drop policy if exists "public read plans" on public.plans;
create policy "public read plans" on public.plans for select using (true);
drop policy if exists "public read approved providers" on public.providers;
create policy "public read approved providers" on public.providers for select using (status = 'approved');
drop policy if exists "public read services" on public.services;
create policy "public read services" on public.services for select using (
  exists (select 1 from public.providers p where p.id = services.provider_id and p.status = 'approved')
);
drop policy if exists "public read hours" on public.provider_hours;
create policy "public read hours" on public.provider_hours for select using (
  exists (select 1 from public.providers p where p.id = provider_hours.provider_id and p.status = 'approved')
);
drop policy if exists "public read images" on public.provider_images;
create policy "public read images" on public.provider_images for select using (
  exists (select 1 from public.providers p where p.id = provider_images.provider_id and p.status = 'approved')
);

-- owners manage own listings
drop policy if exists "owners insert own" on public.providers;
create policy "owners insert own" on public.providers for insert with check (auth.uid() = owner_id);
drop policy if exists "owners read own" on public.providers;
create policy "owners read own" on public.providers for select using (auth.uid() = owner_id);
drop policy if exists "owners update own pending" on public.providers;
create policy "owners update own pending" on public.providers for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- anonymous inserts for reports / requests / events (rate-limit in app / edge)
drop policy if exists "anyone can report" on public.reports;
create policy "anyone can report" on public.reports for insert with check (true);
drop policy if exists "anyone can request service" on public.service_requests;
create policy "anyone can request service" on public.service_requests for insert with check (true);
drop policy if exists "anyone can log events" on public.events;
create policy "anyone can log events" on public.events for insert with check (true);

-- storage: provider-images bucket (create in dashboard) with 2MB limit enforced in app
-- insert into storage.buckets (id, name, public) values ('provider-images','provider-images', true) on conflict (id) do nothing;
