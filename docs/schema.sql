-- ShipMate MVP Supabase Schema

-- 1. Sprint Rooms Table
create table if not exists sprint_rooms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  hackathon_name text not null,
  deadline timestamptz not null,
  github_repo_url text not null,
  figma_url text,
  inactivity_threshold_hours integer default 6
);

-- 2. Members Table (4 teammates per room)
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references sprint_rooms(id) on delete cascade not null,
  github_handle text not null,
  role_label text,
  triage_status text default 'none' check (triage_status in ('none', 'fallback_api', 'cut_scope', 'snoozed')),
  snoozed_until timestamptz,
  triage_note text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table sprint_rooms enable row level security;
alter table members enable row level security;

-- Anonymous public policies for MVP zero-login access
create policy "Allow public read access to sprint_rooms" on sprint_rooms for select using (true);
create policy "Allow public insert access to sprint_rooms" on sprint_rooms for insert with check (true);
create policy "Allow public update access to sprint_rooms" on sprint_rooms for update using (true);

create policy "Allow public read access to members" on members for select using (true);
create policy "Allow public insert access to members" on members for insert with check (true);
create policy "Allow public update access to members" on members for update using (true);
create policy "Allow public delete access to members" on members for delete using (true);

-- Indices for performance
create index if not exists idx_members_room_id on members(room_id);
create index if not exists idx_members_github_handle on members(github_handle);
