create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.icps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  industry text not null default '',
  location text not null default '',
  employees text not null default '',
  roles text not null default '',
  keywords text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft','active','paused','completed')),
  audience_size integer not null default 0,
  steps integer not null default 1,
  sent integer not null default 0,
  replies integer not null default 0,
  meetings integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company text not null,
  contact text not null default '',
  value numeric(14,2) not null default 0,
  stage text not null default 'new' check (stage in ('new','qualified','proposal','won','lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact text not null,
  company text not null default '',
  intent text not null default 'Unknown',
  status text not null default 'open' check (status in ('open','human','closed')),
  last_message text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft','active','paused')),
  nodes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists campaigns_workspace_idx on public.campaigns(workspace_id);
create index if not exists opportunities_workspace_idx on public.opportunities(workspace_id);
create index if not exists conversations_workspace_idx on public.conversations(workspace_id);
create index if not exists workflows_workspace_idx on public.workflows(workspace_id);
create index if not exists analytics_workspace_created_idx on public.analytics_events(workspace_id, created_at desc);

alter table public.workspaces enable row level security;
alter table public.icps enable row level security;
alter table public.campaigns enable row level security;
alter table public.opportunities enable row level security;
alter table public.conversations enable row level security;
alter table public.workflows enable row level security;
alter table public.analytics_events enable row level security;

-- Policies are intentionally added with workspace membership left to the auth layer.
-- The application stays local-first until Supabase credentials and membership policies are configured.
