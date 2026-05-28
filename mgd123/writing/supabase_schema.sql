create table if not exists profiles (
  id uuid primary key,
  email text not null,
  display_name text not null,
  role text not null default 'author',
  created_at timestamptz not null default now()
);

create table if not exists novels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  genre text not null default '',
  trope text not null default '',
  target_chapters integer not null default 120,
  words_per_chapter integer not null default 3000,
  premise text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references novels(id) on delete cascade,
  chapter_no integer not null,
  title text not null,
  body text not null default '',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(novel_id, chapter_no)
);

create table if not exists outlines (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references novels(id) on delete cascade,
  kind text not null,
  title text not null,
  range_text text not null default '',
  body text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references novels(id) on delete cascade,
  type text not null,
  name text not null,
  importance text not null default 'normal',
  lifecycle text not null default 'active',
  first_seen text not null default '',
  last_seen text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  body text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists model_configs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  provider text not null,
  model text not null,
  role text not null default '',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid references novels(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  agent text not null,
  status text not null,
  model text not null default '',
  prompt text not null default '',
  output text not null default '',
  trace jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table novels enable row level security;
alter table chapters enable row level security;
alter table outlines enable row level security;
alter table memories enable row level security;
alter table prompts enable row level security;
alter table model_configs enable row level security;
alter table requests enable row level security;
