-- ShipMate MVP Supabase Schema (Hardened - Service Role Only)
-- All browser direct access is blocked. Cloudflare backend accesses via service-role key.

-- Clean up any legacy tables/policies
drop table if exists triage_events cascade;
drop table if exists members cascade;
drop table if exists sprint_rooms cascade;

-- 1. Sprint Rooms Table
create table sprint_rooms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  hackathon_name text not null,
  sprint_start timestamptz not null default now(),
  deadline timestamptz not null,
  github_repo_url text not null,
  figma_url text,
  figma_file_key text,
  inactivity_threshold_hours integer default 6 not null,
  lead_key_hash text not null,
  is_demo boolean default false not null
);

-- 2. Members Table (up to 4 teammates per room)
create table members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references sprint_rooms(id) on delete cascade not null,
  github_handle text not null,
  role_label text,
  is_designer boolean default false not null,
  figma_handle text,
  aliases jsonb default '[]'::jsonb not null,
  triage_status text default 'none' not null check (triage_status in ('none', 'fallback_api', 'cut_scope', 'snoozed')),
  snoozed_until timestamptz,
  triage_note text,
  created_at timestamptz default now() not null
);

-- 3. Triage Events (Append-only audit trail for Proof-of-Ship Manifest)
create table triage_events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade not null,
  room_id uuid references sprint_rooms(id) on delete cascade not null,
  action text not null,
  note text,
  created_at timestamptz default now() not null
);

-- Indices for performance
create index idx_sprint_rooms_lead_key_hash on sprint_rooms(lead_key_hash);
create index idx_members_room_id on members(room_id);
create index idx_members_github_handle on members(github_handle);
create index idx_triage_events_room_id on triage_events(room_id);
create index idx_triage_events_created_at on triage_events(created_at);

-- Enable RLS with ZERO anon policies
-- Only service_role key (used by Cloudflare Functions / Worker) can access tables.
alter table sprint_rooms enable row level security;
alter table members enable row level security;
alter table triage_events enable row level security;

-- Do NOT add any policies for 'anon' or 'authenticated' roles.
-- Service role automatically bypasses RLS in Postgres/Supabase.
