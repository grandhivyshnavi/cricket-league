-- PLACEHOLDER DATA for local development / previews only.
-- Team names, venues and fixtures are illustrative; replace them through
-- the admin panel (or delete this data) before launch.

insert into public.teams (id, name, short_name, city, color) values
  ('00000000-0000-4000-a000-000000000001', 'Godavari Titans',    'GT', 'Rajahmundry',   '#f59e0b'),
  ('00000000-0000-4000-a000-000000000002', 'Vizag Warriors',     'VW', 'Visakhapatnam', '#06b6d4'),
  ('00000000-0000-4000-a000-000000000003', 'Rajahmundry Royals', 'RR', 'Rajahmundry',   '#8b5cf6'),
  ('00000000-0000-4000-a000-000000000004', 'Vijayawada Lions',   'VL', 'Vijayawada',    '#10b981'),
  ('00000000-0000-4000-a000-000000000005', 'Krishna Kings',      'KK', 'Machilipatnam', '#3b82f6'),
  ('00000000-0000-4000-a000-000000000006', 'Guntur Chargers',    'GC', 'Guntur',        '#ef4444'),
  ('00000000-0000-4000-a000-000000000007', 'Nellore Hawks',      'NH', 'Nellore',       '#f97316'),
  ('00000000-0000-4000-a000-000000000008', 'Kakinada Blasters',  'KB', 'Kakinada',      '#ec4899')
on conflict do nothing;

insert into public.matches (team1_id, team2_id, scheduled_at, venue) values
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000005', '2027-01-10 15:30+05:30', 'Godavari Grounds, Rajahmundry'),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000006', '2027-01-10 19:30+05:30', 'Coastal Cricket Ground, Visakhapatnam'),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000007', '2027-01-11 15:30+05:30', 'Godavari Grounds, Rajahmundry'),
  ('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000008', '2027-01-11 19:30+05:30', 'Riverside Oval, Vijayawada');

update public.tournament_settings set
  tagline = 'Season 2027 · Sankranthi Edition',
  description = 'The festive-season cricket showdown. Top local sides, floodlit fixtures and a championship trophy — experience every six, wicket and victory this Sankranthi.',
  start_date = '2027-01-10',
  end_date = '2027-01-16',
  prize_pool = '₹5L'
where id = 1;
