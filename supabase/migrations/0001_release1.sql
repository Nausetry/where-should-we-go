-- Release 1 schema for Where Should We Go. Open access by decision D4; Release 2 replaces the policies.
-- Writes go through the security definer functions below. Tables grant select only.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.trips (
  id text primary key
    constraint trips_id_format check (id ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$'),
  name text not null
    constraint trips_name_rule check (name = btrim(name) and char_length(name) between 3 and 60 and name !~ '[[:cntrl:]]'),
  destination text not null
    constraint trips_destination_rule check (destination = btrim(destination) and char_length(destination) between 2 and 60 and destination !~ '[[:cntrl:]]'),
  start_date date not null,
  end_date date not null,
  itinerary_size int not null
    constraint trips_itinerary_size_rule check (itinerary_size between 1 and 30),
  voting_deadline timestamptz not null,
  status text not null default 'open'
    constraint trips_status_rule check (status in ('open', 'closed')),
  closed_at timestamptz,
  default_activity_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint trips_dates_order check (end_date >= start_date),
  constraint trips_closed_at_rule check (status = 'closed' or closed_at is null)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  trip_id text not null references public.trips (id) on delete cascade,
  title text not null
    constraint activities_title_rule check (title = btrim(title) and char_length(title) between 3 and 80 and title !~ '[[:cntrl:]]'),
  description text
    constraint activities_description_rule check (
      description is null
      or (description = btrim(description) and char_length(description) between 1 and 140 and description !~ '[[:cntrl:]]')),
  source_url text
    constraint activities_source_url_rule check (
      source_url is null
      or (char_length(source_url) <= 500 and source_url ~ '^https?://[^[:space:]]+$' and source_url !~ '[[:cntrl:]]')),
  created_at timestamptz not null default clock_timestamp(),
  constraint activities_id_trip_unique unique (id, trip_id)
);
create index activities_trip_seq_idx on public.activities (trip_id, seq);

-- The default pick must be an activity of the same trip. Removing it nulls only the pick column.
alter table public.trips
  add constraint trips_default_activity_fk
  foreign key (default_activity_id, id) references public.activities (id, trip_id)
  on delete set null (default_activity_id);

create table public.members (
  trip_id text not null references public.trips (id) on delete cascade,
  voter text not null
    constraint members_voter_rule check (voter = btrim(voter) and char_length(voter) between 8 and 64 and voter !~ '[[:cntrl:]]'),
  display_name text not null
    constraint members_display_name_rule check (display_name = btrim(display_name) and char_length(display_name) between 2 and 40 and display_name !~ '[[:cntrl:]]'),
  role text not null default 'member'
    constraint members_role_rule check (role in ('organizer', 'member')),
  email text
    constraint members_email_rule check (
      email is null
      or (email = lower(btrim(email)) and char_length(email) between 3 and 254 and email !~ '[[:cntrl:]]')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, voter)
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null,
  activity_id uuid not null,
  voter text not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint votes_one_per_person unique (activity_id, voter),
  constraint votes_activity_fk foreign key (activity_id, trip_id)
    references public.activities (id, trip_id) on delete cascade,
  constraint votes_member_fk foreign key (trip_id, voter)
    references public.members (trip_id, voter) on delete cascade
);
create index votes_trip_voter_idx on public.votes (trip_id, voter);

-- Release 2 table, created now so the shape is fixed. No access is granted in Release 1.
create table public.invites (
  trip_id text not null references public.trips (id) on delete cascade,
  email text not null
    constraint invites_email_rule check (email = lower(btrim(email)) and char_length(email) between 3 and 254 and email !~ '[[:cntrl:]]'),
  role text not null default 'member'
    constraint invites_role_rule check (role in ('organizer', 'member')),
  created_at timestamptz not null default now(),
  primary key (trip_id, email)
);

-- ---------------------------------------------------------------------------
-- Internal helpers (not callable by clients)
-- ---------------------------------------------------------------------------

create function public._fail(p_code text, p_detail text default null) returns void
language plpgsql set search_path = public as $$
begin
  raise exception '%', p_code || coalesce(': ' || p_detail, '');
end $$;

-- Trimmed, space-collapsed text from a JSON object key. Raises invalid_input on any problem.
create function public._txt(p jsonb, p_key text, p_min int, p_max int, p_required boolean, p_label text default null)
returns text
language plpgsql set search_path = public as $$
declare
  v jsonb := p -> p_key;
  s text;
  lbl text := coalesce(p_label, p_key);
begin
  if v is null or jsonb_typeof(v) = 'null' then
    if p_required then perform public._fail('invalid_input', lbl); end if;
    return null;
  end if;
  if jsonb_typeof(v) <> 'string' then perform public._fail('invalid_input', lbl); end if;
  s := p ->> p_key;
  if s ~ '[[:cntrl:]]' then perform public._fail('invalid_input', lbl); end if;
  s := btrim(regexp_replace(s, '\s+', ' ', 'g'));
  if s = '' then
    if p_required then perform public._fail('invalid_input', lbl); end if;
    return null;
  end if;
  if char_length(s) < p_min or char_length(s) > p_max then perform public._fail('invalid_input', lbl); end if;
  return s;
end $$;

create function public._url(p jsonb, p_key text, p_label text default null) returns text
language plpgsql set search_path = public as $$
declare
  v jsonb := p -> p_key;
  s text;
  lbl text := coalesce(p_label, p_key);
begin
  if v is null or jsonb_typeof(v) = 'null' then return null; end if;
  if jsonb_typeof(v) <> 'string' then perform public._fail('invalid_input', lbl); end if;
  s := p ->> p_key;
  if s ~ '[[:cntrl:]]' then perform public._fail('invalid_input', lbl); end if;
  s := btrim(s);
  if s = '' then return null; end if;
  if char_length(s) > 500 or s !~ '^https?://[^[:space:]]+$' then perform public._fail('invalid_input', lbl); end if;
  return s;
end $$;

create function public._date(p jsonb, p_key text) returns date
language plpgsql set search_path = public as $$
declare
  v jsonb := p -> p_key;
  s text;
begin
  if v is null or jsonb_typeof(v) <> 'string' then perform public._fail('invalid_input', p_key); end if;
  s := btrim(p ->> p_key);
  if s !~ '^\d{4}-\d{2}-\d{2}$' then perform public._fail('invalid_input', p_key); end if;
  begin
    return s::date;
  exception when others then
    perform public._fail('invalid_input', p_key);
  end;
  return null;
end $$;

create function public._ts(p jsonb, p_key text) returns timestamptz
language plpgsql set search_path = public as $$
declare
  v jsonb := p -> p_key;
  s text;
begin
  if v is null or jsonb_typeof(v) <> 'string' then perform public._fail('invalid_input', p_key); end if;
  s := btrim(p ->> p_key);
  if s !~ '^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}' then perform public._fail('invalid_input', p_key); end if;
  begin
    return s::timestamptz;
  exception when others then
    perform public._fail('invalid_input', p_key);
  end;
  return null;
end $$;

create function public._int(p jsonb, p_key text, p_min int, p_max int) returns int
language plpgsql set search_path = public as $$
declare
  v jsonb := p -> p_key;
  n numeric;
begin
  if v is null then perform public._fail('invalid_input', p_key); end if;
  if jsonb_typeof(v) = 'number' then
    n := (p ->> p_key)::numeric;
  elsif jsonb_typeof(v) = 'string' and btrim(p ->> p_key) ~ '^\d{1,4}$' then
    n := btrim(p ->> p_key)::numeric;
  else
    perform public._fail('invalid_input', p_key);
  end if;
  if n <> trunc(n) or n < p_min or n > p_max then perform public._fail('invalid_input', p_key); end if;
  return n::int;
end $$;

create function public._voter(p_voter text) returns text
language plpgsql set search_path = public as $$
begin
  if p_voter is null or p_voter <> btrim(p_voter) or p_voter ~ '[[:cntrl:]]'
     or char_length(p_voter) < 8 or char_length(p_voter) > 64 then
    perform public._fail('invalid_input', 'voter');
  end if;
  return p_voter;
end $$;

create function public._object(p jsonb) returns void
language plpgsql set search_path = public as $$
begin
  if p is null or jsonb_typeof(p) <> 'object' then perform public._fail('invalid_input', 'payload'); end if;
end $$;

-- 8 random characters from the look-alike-free alphabet, using unbiased random bytes.
create function public._new_trip_id() returns text
language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  out text;
  raw bytea;
  b int;
  i int;
begin
  loop
    out := '';
    while char_length(out) < 8 loop
      raw := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
      -- bytes 6 and 8 carry fixed version bits, so skip them; drop values that would bias the modulo
      for i in 0..15 loop
        continue when i in (6, 8);
        b := get_byte(raw, i);
        if b < 248 and char_length(out) < 8 then
          out := out || substr(alphabet, (b % 31) + 1, 1);
        end if;
      end loop;
    end loop;
    exit when not exists (select 1 from public.trips where id = out);
  end loop;
  return out;
end $$;

-- ---------------------------------------------------------------------------
-- Effective status
-- ---------------------------------------------------------------------------

create function public.trip_is_closed(p_trip text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select t.status = 'closed' or now() >= t.voting_deadline from public.trips t where t.id = p_trip), false)
$$;

-- Blocks any change to votes or activities of a closed trip. A trip that no longer exists
-- (cascade from delete_trip) is allowed through.
create function public.trg_block_closed() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_trip text := coalesce(new.trip_id, old.trip_id);
  t record;
begin
  select status, voting_deadline into t from public.trips where id = v_trip;
  if not found then
    return coalesce(new, old);
  end if;
  if t.status = 'closed' or now() >= t.voting_deadline then
    perform public._fail('voting_closed');
  end if;
  return coalesce(new, old);
end $$;

create function public.trg_limit_activities() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  perform 1 from public.trips where id = new.trip_id for update;
  select count(*) into n from public.activities where trip_id = new.trip_id;
  if n >= 30 then
    perform public._fail('too_many_activities', 'a trip holds at most 30 activities');
  end if;
  return new;
end $$;

create trigger a_block_closed before insert or update or delete on public.votes
  for each row execute function public.trg_block_closed();
create trigger a_block_closed before insert or update or delete on public.activities
  for each row execute function public.trg_block_closed();
create trigger b_limit_activities before insert on public.activities
  for each row execute function public.trg_limit_activities();

-- ---------------------------------------------------------------------------
-- Views: the decision rule, written once
-- ---------------------------------------------------------------------------

-- Internal building block: per trip, effective status, effective default pick, member counts.
create view public.trip_basis with (security_invoker = true) as
select
  t.id as trip_id,
  t.itinerary_size,
  public.trip_is_closed(t.id) as is_closed,
  coalesce(
    (select a.id from public.activities a where a.id = t.default_activity_id and a.trip_id = t.id),
    (select a.id from public.activities a where a.trip_id = t.id order by a.seq limit 1)
  ) as default_activity_id,
  (select count(*) from public.members m where m.trip_id = t.id)::int as member_count,
  (select count(*) from public.members m
     where m.trip_id = t.id and exists (select 1 from public.votes v where v.trip_id = m.trip_id and v.voter = m.voter))::int as voted_count
from public.trips t;

create view public.trip_standing with (security_invoker = true) as
with calc as (
  select
    a.trip_id, a.id as activity_id, a.seq, a.title, a.description, a.source_url,
    b.itinerary_size,
    (a.id = b.default_activity_id) as is_default_pick,
    (select count(*) from public.votes v where v.activity_id = a.id)::int as cast_votes,
    case when a.id = b.default_activity_id and b.is_closed then b.member_count - b.voted_count else 0 end as default_votes
  from public.activities a
  join public.trip_basis b on b.trip_id = a.trip_id
),
ranked as (
  select c.*,
    (c.cast_votes + c.default_votes) as total_votes,
    row_number() over (partition by c.trip_id order by (c.cast_votes + c.default_votes) desc, c.is_default_pick desc, c.seq asc)::int as rank
  from calc c
)
select
  trip_id, activity_id, seq, title, description, source_url,
  rank, cast_votes, default_votes, total_votes, is_default_pick,
  (rank <= itinerary_size) as in_itinerary
from ranked;

create view public.trip_summary with (security_invoker = true) as
select
  t.id as trip_id,
  t.name,
  t.destination,
  t.start_date,
  t.end_date,
  (t.end_date - t.start_date + 1)::int as day_count,
  t.itinerary_size,
  t.voting_deadline,
  t.status,
  case when b.is_closed then 'closed' else 'open' end as effective_status,
  case
    when t.status = 'closed' then t.closed_at
    when b.is_closed then t.voting_deadline
    else null
  end as closed_at,
  b.member_count,
  b.voted_count,
  (b.member_count - b.voted_count) as not_voted_count,
  (select count(*) from public.votes v where v.trip_id = t.id)::int as cast_votes_total,
  coalesce((select sum(s.default_votes) from public.trip_standing s where s.trip_id = t.id), 0)::int as default_votes_total,
  (select count(*) from public.activities a where a.trip_id = t.id)::int as activity_count,
  exists (
    select 1
    from public.trip_standing s1
    join public.trip_standing s2 on s2.trip_id = s1.trip_id and s2.rank = s1.rank + 1
    where s1.trip_id = t.id and s1.rank = t.itinerary_size and s1.total_votes = s2.total_votes
  ) as tie_broken,
  b.default_activity_id,
  now() as as_of
from public.trips t
join public.trip_basis b on b.trip_id = t.id;

create view public.trip_voters with (security_invoker = true) as
select v.trip_id, v.activity_id, v.voter, m.display_name, v.created_at as voted_at
from public.votes v
join public.members m on m.trip_id = v.trip_id and m.voter = v.voter;

create view public.trip_members with (security_invoker = true) as
select
  m.trip_id, m.voter, m.display_name, m.role, m.joined_at,
  exists (select 1 from public.votes v where v.trip_id = m.trip_id and v.voter = m.voter) as has_voted
from public.members m;

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

create function public.create_trip(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_name text; v_dest text; v_start date; v_end date; v_deadline timestamptz; v_size int;
  v_org text; v_voter text; v_id text; v_acts jsonb; v_n int; a jsonb; i int;
  v_title text; v_desc text; v_url text; v_aid uuid; v_first uuid;
begin
  perform public._object(p);
  v_name := public._txt(p, 'name', 3, 60, true);
  v_dest := public._txt(p, 'destination', 2, 60, true);
  v_start := public._date(p, 'start_date');
  v_end := public._date(p, 'end_date');
  if v_end < v_start then perform public._fail('invalid_input', 'end_date'); end if;
  v_deadline := public._ts(p, 'voting_deadline');
  v_size := public._int(p, 'itinerary_size', 1, 30);
  v_org := public._txt(p, 'organizer_name', 2, 40, true);
  v_voter := public._voter(p ->> 'voter');
  v_acts := p -> 'activities';
  if v_acts is null or jsonb_typeof(v_acts) <> 'array' then perform public._fail('invalid_input', 'activities'); end if;
  v_n := jsonb_array_length(v_acts);
  if v_n < 3 or v_n > 10 then perform public._fail('invalid_input', 'activities'); end if;
  for i in 0 .. v_n - 1 loop
    a := v_acts -> i;
    if jsonb_typeof(a) <> 'object' then perform public._fail('invalid_input', format('activities[%s]', i)); end if;
    perform public._txt(a, 'title', 3, 80, true, format('activities[%s].title', i));
    perform public._txt(a, 'description', 1, 140, false, format('activities[%s].description', i));
    perform public._url(a, 'source_url', format('activities[%s].source_url', i));
  end loop;
  if now() >= v_deadline then perform public._fail('deadline_passed'); end if;

  v_id := public._new_trip_id();
  insert into public.trips (id, name, destination, start_date, end_date, itinerary_size, voting_deadline)
  values (v_id, v_name, v_dest, v_start, v_end, v_size, v_deadline);

  for i in 0 .. v_n - 1 loop
    a := v_acts -> i;
    v_title := public._txt(a, 'title', 3, 80, true, format('activities[%s].title', i));
    v_desc := public._txt(a, 'description', 1, 140, false, format('activities[%s].description', i));
    v_url := public._url(a, 'source_url', format('activities[%s].source_url', i));
    insert into public.activities (trip_id, title, description, source_url)
    values (v_id, v_title, v_desc, v_url) returning id into v_aid;
    if v_first is null then v_first := v_aid; end if;
  end loop;

  insert into public.members (trip_id, voter, display_name, role) values (v_id, v_voter, v_org, 'organizer');
  update public.trips set default_activity_id = v_first where id = v_id;
  return v_id;
end $$;

create function public.join_trip(p_trip text, p_voter text, p_name text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_voter text; v_name text;
begin
  if not exists (select 1 from public.trips where id = p_trip) then perform public._fail('trip_not_found'); end if;
  v_voter := public._voter(p_voter);
  v_name := public._txt(jsonb_build_object('n', p_name), 'n', 2, 40, true, 'display_name');
  insert into public.members (trip_id, voter, display_name)
  values (p_trip, v_voter, v_name)
  on conflict (trip_id, voter) do update set display_name = excluded.display_name;
end $$;

create function public.set_vote(p_trip text, p_activity uuid, p_voter text, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.trips where id = p_trip) then perform public._fail('trip_not_found'); end if;
  if p_on is null then perform public._fail('invalid_input', 'on'); end if;
  if p_voter is null or not exists (select 1 from public.members where trip_id = p_trip and voter = p_voter) then
    perform public._fail('not_a_member');
  end if;
  if public.trip_is_closed(p_trip) then perform public._fail('voting_closed'); end if;
  if p_activity is null or not exists (select 1 from public.activities where id = p_activity and trip_id = p_trip) then
    perform public._fail('activity_not_found');
  end if;
  if p_on then
    insert into public.votes (trip_id, activity_id, voter) values (p_trip, p_activity, p_voter)
    on conflict (activity_id, voter) do nothing;
  else
    delete from public.votes where activity_id = p_activity and voter = p_voter;
  end if;
end $$;

create function public.add_activity(p_trip text, p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_title text; v_desc text; v_url text; v_id uuid;
begin
  if not exists (select 1 from public.trips where id = p_trip) then perform public._fail('trip_not_found'); end if;
  perform public._object(p);
  v_title := public._txt(p, 'title', 3, 80, true);
  v_desc := public._txt(p, 'description', 1, 140, false);
  v_url := public._url(p, 'source_url');
  if public.trip_is_closed(p_trip) then perform public._fail('voting_closed'); end if;
  insert into public.activities (trip_id, title, description, source_url)
  values (p_trip, v_title, v_desc, v_url) returning id into v_id;
  update public.trips set default_activity_id = v_id where id = p_trip and default_activity_id is null;
  return v_id;
end $$;

-- Replaces title, description, and source link with the values given (absent description or link clears it).
create function public.update_activity(p_activity uuid, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_trip text; v_title text; v_desc text; v_url text;
begin
  select trip_id into v_trip from public.activities where id = p_activity;
  if not found then perform public._fail('activity_not_found'); end if;
  perform public._object(p);
  v_title := public._txt(p, 'title', 3, 80, true);
  v_desc := public._txt(p, 'description', 1, 140, false);
  v_url := public._url(p, 'source_url');
  if public.trip_is_closed(v_trip) then perform public._fail('voting_closed'); end if;
  update public.activities set title = v_title, description = v_desc, source_url = v_url where id = p_activity;
end $$;

create function public.remove_activity(p_activity uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_trip text; v_votes int;
begin
  select trip_id into v_trip from public.activities where id = p_activity;
  if not found then perform public._fail('activity_not_found'); end if;
  if public.trip_is_closed(v_trip) then perform public._fail('voting_closed'); end if;
  select count(*) into v_votes from public.votes where activity_id = p_activity;
  delete from public.activities where id = p_activity;
  update public.trips
     set default_activity_id = (select a.id from public.activities a where a.trip_id = v_trip order by a.seq limit 1)
   where id = v_trip and default_activity_id is null;
  return v_votes;
end $$;

create function public.update_trip(p_trip text, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  t public.trips;
  v_name text; v_dest text; v_start date; v_end date; v_deadline timestamptz; v_size int;
begin
  select * into t from public.trips where id = p_trip for update;
  if not found then perform public._fail('trip_not_found'); end if;
  perform public._object(p);
  v_name := case when p ? 'name' then public._txt(p, 'name', 3, 60, true) else t.name end;
  v_dest := case when p ? 'destination' then public._txt(p, 'destination', 2, 60, true) else t.destination end;
  v_start := case when p ? 'start_date' then public._date(p, 'start_date') else t.start_date end;
  v_end := case when p ? 'end_date' then public._date(p, 'end_date') else t.end_date end;
  v_size := case when p ? 'itinerary_size' then public._int(p, 'itinerary_size', 1, 30) else t.itinerary_size end;
  v_deadline := case when p ? 'voting_deadline' then public._ts(p, 'voting_deadline') else t.voting_deadline end;
  if v_end < v_start then perform public._fail('invalid_input', 'end_date'); end if;
  if public.trip_is_closed(p_trip) then perform public._fail('voting_closed'); end if;
  if p ? 'voting_deadline' and now() >= v_deadline then perform public._fail('deadline_passed'); end if;
  update public.trips
     set name = v_name, destination = v_dest, start_date = v_start, end_date = v_end,
         itinerary_size = v_size, voting_deadline = v_deadline
   where id = p_trip;
end $$;

create function public.set_default_pick(p_trip text, p_activity uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.trips where id = p_trip) then perform public._fail('trip_not_found'); end if;
  if p_activity is null or not exists (select 1 from public.activities where id = p_activity and trip_id = p_trip) then
    perform public._fail('activity_not_found');
  end if;
  if public.trip_is_closed(p_trip) then perform public._fail('voting_closed'); end if;
  update public.trips set default_activity_id = p_activity where id = p_trip;
end $$;

create function public.close_trip(p_trip text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.trips where id = p_trip) then perform public._fail('trip_not_found'); end if;
  update public.trips set status = 'closed', closed_at = now() where id = p_trip and status <> 'closed';
end $$;

create function public.reopen_trip(p_trip text, p_deadline timestamptz default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  t public.trips;
begin
  select * into t from public.trips where id = p_trip for update;
  if not found then perform public._fail('trip_not_found'); end if;
  if p_deadline is not null then
    if now() >= p_deadline then perform public._fail('deadline_passed'); end if;
  elsif now() >= t.voting_deadline then
    perform public._fail('deadline_passed', 'choose a new deadline');
  end if;
  update public.trips
     set status = 'open', closed_at = null, voting_deadline = coalesce(p_deadline, voting_deadline)
   where id = p_trip;
end $$;

create function public.delete_trip(p_trip text, p_confirm_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  t public.trips; a int; v int; m int;
begin
  select * into t from public.trips where id = p_trip for update;
  if not found then perform public._fail('trip_not_found'); end if;
  if p_confirm_name is null or p_confirm_name <> t.name then perform public._fail('name_mismatch'); end if;
  select count(*) into a from public.activities where trip_id = p_trip;
  select count(*) into v from public.votes where trip_id = p_trip;
  select count(*) into m from public.members where trip_id = p_trip;
  delete from public.trips where id = p_trip;
  return jsonb_build_object('activities', a, 'votes', v, 'members', m);
end $$;

-- ---------------------------------------------------------------------------
-- Row level security (open in Release 1) and grants
-- ---------------------------------------------------------------------------

alter table public.trips enable row level security;
alter table public.activities enable row level security;
alter table public.members enable row level security;
alter table public.votes enable row level security;
alter table public.invites enable row level security;

create policy r1_read_trips on public.trips for select to anon, authenticated using (true);
create policy r1_read_activities on public.activities for select to anon, authenticated using (true);
create policy r1_read_members on public.members for select to anon, authenticated using (true);
create policy r1_read_votes on public.votes for select to anon, authenticated using (true);

revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;

grant select on public.trips, public.activities, public.members, public.votes to anon, authenticated;
grant select on public.trip_summary, public.trip_standing, public.trip_voters, public.trip_members, public.trip_basis
  to anon, authenticated;

grant execute on function
  public.trip_is_closed(text),
  public.create_trip(jsonb),
  public.join_trip(text, text, text),
  public.set_vote(text, uuid, text, boolean),
  public.add_activity(text, jsonb),
  public.update_activity(uuid, jsonb),
  public.remove_activity(uuid),
  public.update_trip(text, jsonb),
  public.set_default_pick(text, uuid),
  public.close_trip(text),
  public.reopen_trip(text, timestamptz),
  public.delete_trip(text, text)
  to anon, authenticated, service_role;

grant all on all tables in schema public to service_role;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.votes replica identity full;
alter table public.activities replica identity full;
alter table public.members replica identity full;
alter table public.trips replica identity full;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['votes', 'activities', 'members', 'trips'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;
