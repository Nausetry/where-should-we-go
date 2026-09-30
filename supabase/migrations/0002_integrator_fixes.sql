-- Integrator fixes after the skeptic review.
--   1. A person who was not a member when voting closed cannot join afterward. Joining adds a
--      default vote, which would change a confirmed itinerary. Existing members may still
--      change their display name.
--   2. Invisible and direction-control characters are rejected like control characters, so a
--      value made only of zero-width characters cannot pass as text, and text cannot be reversed.

-- ---------------------------------------------------------------------------
-- 1. join_trip
-- ---------------------------------------------------------------------------

create or replace function public.join_trip(p_trip text, p_voter text, p_name text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_voter text; v_name text;
begin
  if not exists (select 1 from public.trips where id = p_trip) then perform public._fail('trip_not_found'); end if;
  v_voter := public._voter(p_voter);
  v_name := public._txt(jsonb_build_object('n', p_name), 'n', 2, 40, true, 'display_name');
  if public.trip_is_closed(p_trip)
     and not exists (select 1 from public.members where trip_id = p_trip and voter = v_voter) then
    perform public._fail('voting_closed');
  end if;
  insert into public.members (trip_id, voter, display_name)
  values (p_trip, v_voter, v_name)
  on conflict (trip_id, voter) do update set display_name = excluded.display_name;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Invisible characters
-- ---------------------------------------------------------------------------

create or replace function public._txt(p jsonb, p_key text, p_min int, p_max int, p_required boolean, p_label text default null)
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
  if s ~ '[[:cntrl:]]' or s ~ '[­͏؜ᅟᅠ឴឵᠋-᠎​-‏ -‮⁠-⁯ㅤ︀-️﻿ﾠ￹-￼]' then
    perform public._fail('invalid_input', lbl);
  end if;
  s := btrim(regexp_replace(s, '\s+', ' ', 'g'));
  if s = '' then
    if p_required then perform public._fail('invalid_input', lbl); end if;
    return null;
  end if;
  if char_length(s) < p_min or char_length(s) > p_max then perform public._fail('invalid_input', lbl); end if;
  return s;
end $$;

create or replace function public._url(p jsonb, p_key text, p_label text default null) returns text
language plpgsql set search_path = public as $$
declare
  v jsonb := p -> p_key;
  s text;
  lbl text := coalesce(p_label, p_key);
begin
  if v is null or jsonb_typeof(v) = 'null' then return null; end if;
  if jsonb_typeof(v) <> 'string' then perform public._fail('invalid_input', lbl); end if;
  s := p ->> p_key;
  if s ~ '[[:cntrl:]]' or s ~ '[­͏؜ᅟᅠ឴឵᠋-᠎​-‏ -‮⁠-⁯ㅤ︀-️﻿ﾠ￹-￼]' then
    perform public._fail('invalid_input', lbl);
  end if;
  s := btrim(s);
  if s = '' then return null; end if;
  if char_length(s) > 500 or s !~ '^https?://[^[:space:]]+$' then perform public._fail('invalid_input', lbl); end if;
  return s;
end $$;

create or replace function public._voter(p_voter text) returns text
language plpgsql set search_path = public as $$
begin
  if p_voter is null or p_voter <> btrim(p_voter) or p_voter ~ '[[:cntrl:]]'
     or p_voter ~ '[­͏؜ᅟᅠ឴឵᠋-᠎​-‏ -‮⁠-⁯ㅤ︀-️﻿ﾠ￹-￼]'
     or char_length(p_voter) < 8 or char_length(p_voter) > 64 then
    perform public._fail('invalid_input', 'voter');
  end if;
  return p_voter;
end $$;

-- Table rules. NOT VALID keeps any row stored before this change and enforces the rule on every new write.
alter table public.trips add constraint trips_name_invisible
  check (name !~ '[­͏؜ᅟᅠ឴឵᠋-᠎​-‏ -‮⁠-⁯ㅤ︀-️﻿ﾠ￹-￼]') not valid;
alter table public.trips add constraint trips_destination_invisible
  check (destination !~ '[­͏؜ᅟᅠ឴឵᠋-᠎​-‏ -‮⁠-⁯ㅤ︀-️﻿ﾠ￹-￼]') not valid;
alter table public.activities add constraint activities_title_invisible
  check (title !~ '[­͏؜ᅟᅠ឴឵᠋-᠎​-‏ -‮⁠-⁯ㅤ︀-️﻿ﾠ￹-￼]') not valid;
alter table public.activities add constraint activities_description_invisible
  check (description is null or description !~ '[­͏؜ᅟᅠ឴឵᠋-᠎​-‏ -‮⁠-⁯ㅤ︀-️﻿ﾠ￹-￼]') not valid;
alter table public.activities add constraint activities_source_url_invisible
  check (source_url is null or source_url !~ '[­͏؜ᅟᅠ឴឵᠋-᠎​-‏ -‮⁠-⁯ㅤ︀-️﻿ﾠ￹-￼]') not valid;
alter table public.members add constraint members_voter_invisible
  check (voter !~ '[­͏؜ᅟᅠ឴឵᠋-᠎​-‏ -‮⁠-⁯ㅤ︀-️﻿ﾠ￹-￼]') not valid;
alter table public.members add constraint members_display_name_invisible
  check (display_name !~ '[­͏؜ᅟᅠ឴឵᠋-᠎​-‏ -‮⁠-⁯ㅤ︀-️﻿ﾠ￹-￼]') not valid;
alter table public.members add constraint members_email_invisible
  check (email is null or email !~ '[­͏؜ᅟᅠ឴឵᠋-᠎​-‏ -‮⁠-⁯ㅤ︀-️﻿ﾠ￹-￼]') not valid;
alter table public.invites add constraint invites_email_invisible
  check (email !~ '[­͏؜ᅟᅠ឴឵᠋-᠎​-‏ -‮⁠-⁯ㅤ︀-️﻿ﾠ￹-￼]') not valid;

-- create or replace keeps privileges, but restate them so the file stands alone.
grant execute on function public.join_trip(text, text, text) to anon, authenticated, service_role;
