-- ════════════════════════════════════════════════
-- BAVLY PORTFOLIO — Supabase Schema
-- Run this once in: Supabase Dashboard → SQL Editor → New Query
-- ════════════════════════════════════════════════

-- ── DESIGN ──
create table if not exists design (
  id          text primary key,
  title       text not null,
  category    text,
  description text,
  image       text,
  date        text,
  featured    boolean default false,
  tags        jsonb default '[]',
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

-- ── VIDEO ──
create table if not exists video (
  id          text primary key,
  title       text not null,
  category    text,
  description text,
  embed_url   text,
  thumbnail   text,
  duration    text,
  date        text,
  featured    boolean default false,
  tags        jsonb default '[]',
  links       jsonb default '[]',
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

-- ── VIOLIN ──
create table if not exists violin (
  id          text primary key,
  title       text not null,
  composer    text,
  type        text,
  description text,
  media_url   text,
  date        text,
  featured    boolean default false,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

-- ── PROJECTS ──
create table if not exists projects (
  id           text primary key,
  title        text not null,
  subtitle     text,
  icon         text,
  status       text default 'complete',
  status_label text,
  description  text,
  tech_stack   jsonb default '[]',
  features     jsonb default '[]',
  links        jsonb default '{}',
  images       jsonb default '[]',
  pdfs         jsonb default '[]',
  extra_links  jsonb default '[]',
  date         text,
  featured     boolean default false,
  sort_order   integer default 0,
  created_at   timestamptz default now()
);

-- ── COMPETITIONS ──
create table if not exists competitions (
  id          text primary key,
  title       text not null,
  scope       text,
  icon        text,
  year        text,
  outcome     text,
  description text,
  learned     text,
  featured    boolean default false,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

-- ── BLOG ──
create table if not exists blog (
  id          text primary key,
  title       text not null,
  category    text,
  date        text,
  excerpt     text,
  content     text,
  featured    boolean default false,
  tags        jsonb default '[]',
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

-- ════════════════════════════════════════════════
-- ENABLE PUBLIC READ (anon can read everything)
-- Admin writes are protected by your PIN in the browser
-- ════════════════════════════════════════════════

alter table design       enable row level security;
alter table video        enable row level security;
alter table violin       enable row level security;
alter table projects     enable row level security;
alter table competitions enable row level security;
alter table blog         enable row level security;

-- Allow anon (public visitors) to READ all rows
create policy "Public read design"       on design       for select using (true);
create policy "Public read video"        on video        for select using (true);
create policy "Public read violin"       on violin       for select using (true);
create policy "Public read projects"     on projects     for select using (true);
create policy "Public read competitions" on competitions for select using (true);
create policy "Public read blog"         on blog         for select using (true);

-- Allow anon to INSERT, UPDATE, DELETE (admin panel is PIN-protected in the browser)
create policy "Anon write design"       on design       for all using (true) with check (true);
create policy "Anon write video"        on video        for all using (true) with check (true);
create policy "Anon write violin"       on violin       for all using (true) with check (true);
create policy "Anon write projects"     on projects     for all using (true) with check (true);
create policy "Anon write competitions" on competitions for all using (true) with check (true);
create policy "Anon write blog"         on blog         for all using (true) with check (true);

-- ════════════════════════════════════════════════
-- OPTIONAL: Seed data (delete if you want a clean start)
-- ════════════════════════════════════════════════

insert into design (id, title, category, description, date, featured, tags) values
  ('d1', 'Sunday Service Post',      'Social Posts',    'Weekly Sunday service announcement post.',  '2025-01-10', true,  '["Church","Instagram"]'),
  ('d2', 'Easter Event Banner',      'Event Graphics',  'Banner for Easter celebration event.',      '2025-03-28', false, '["Church","Holiday"]'),
  ('d3', 'Weekly Verse Graphic',     'Typography',      'Scripture typography post.',                '2025-02-14', false, '["Typography","Faith"]'),
  ('d4', 'Youth Group Announcement', 'Announcements',   'Youth group weekly announcement.',          '2025-04-05', false, '["Church","Youth"]'),
  ('d5', 'Christmas Celebration Post','Event Graphics', 'Christmas celebration social media post.',  '2024-12-20', true,  '["Holiday","Church"]'),
  ('d6', 'Baptism Ceremony Graphic', 'Social Posts',    'Baptism ceremony announcement.',            '2025-05-01', false, '["Church","Ceremony"]')
on conflict (id) do nothing;

insert into video (id, title, category, description, duration, date, featured, tags, links) values
  ('v1', 'Easter Sunday Recap',   'Church Event', 'A cinematic recap of the Easter celebration.',           '3:24', '2025-03-30', true,  '["Church","Cinematic"]', '[]'),
  ('v2', 'Youth Camp Highlights', 'Event Recap',  'Fast-paced highlights from the annual youth camp.',      '2:10', '2025-07-15', false, '["Church","Youth"]',     '[]'),
  ('v3', 'Christmas Service Film','Short Film',   'A short cinematic film covering the Christmas service.', '5:40', '2024-12-25', false, '["Cinematic","Church"]', '[]')
on conflict (id) do nothing;

insert into violin (id, title, composer, type, description, date, featured) values
  ('vn1', 'Canon in D — Pachelbel', 'Johann Pachelbel',  'Performance',  'Performed at a church ceremony. Arranged for solo violin.',           '2025-02-14', true),
  ('vn2', 'Czardas',                'Vittorio Monti',    'Recital',      'High-energy performance featuring the dramatic tempo shifts.',        '2025-05-10', false),
  ('vn3', 'Ave Maria',              'Franz Schubert',    'Church Music', 'Played during a church ceremony.',                                    '2025-01-01', false)
on conflict (id) do nothing;

insert into competitions (id, title, scope, icon, year, outcome, description, learned) values
  ('c1', 'ICEF — International Competition', 'International · Innovation', '🏆', '2024', 'Participant',
   'Submitted and presented the Alzheimer Support Mobile Application.',
   'Presenting a technical project to judges sharpened my ability to communicate engineering decisions clearly.'),
  ('c2', 'NASA Space Apps Challenge',        'Global · Hackathon',        '🚀', '2024', 'Participant',
   'Participated in one of the world''s largest annual hackathons organized by NASA.',
   'High-pressure engineering builds a different instinct — prioritization, scoping, and delivering something functional.')
on conflict (id) do nothing;

insert into blog (id, title, category, date, excerpt, content, featured, tags) values
  ('b1', 'How I built the Church Points System', 'Engineering', '2025-04-10',
   'A walkthrough of the architecture decisions, database design, and deployment challenges.',
   '<p>When I started building the Church Points System, I had one goal: make it actually work in a real environment.</p>',
   true, '["Engineering","Web Dev","Church"]'),
  ('b2', 'What NASA Space Apps taught me about pressure', 'Competitions', '2025-03-05',
   'Competing in a global hackathon with a hard deadline forces you to make decisions differently.',
   '<p>The hardest part of Space Apps is not the technical problem — it is deciding what to cut.</p>',
   false, '["Hackathon","Mindset","NASA"]')
on conflict (id) do nothing;

insert into projects (id, title, subtitle, icon, status, status_label, description, tech_stack, features, links, date, featured) values
  ('p1', 'Church Points & Card Management System', 'Full-Stack Web Platform', '⚙️', 'live', 'Live & Deployed',
   'A complete points management system for a church community.',
   '["HTML/CSS/JS","Database","Backend","Deployment"]',
   '["Designed system architecture and database structure from scratch","Frontend interface and backend logic","Physical card identification with digital tracking"]',
   '{"github":"","live":"","demo":""}', '2024-12-01', true),
  ('p2', 'Alzheimer Support Application', 'MIT App Inventor · Mobile', '🧠', 'complete', 'ICEF Submission',
   'A multi-feature mobile application for Alzheimer patients and caregivers.',
   '["MIT App Inventor","Algorithm Design","Mobile UI"]',
   '["Reminder and scheduling functionality","Memory assistance tools","Multi-screen structured interface"]',
   '{"github":"","live":"","demo":""}', '2024-10-15', true)
on conflict (id) do nothing;
