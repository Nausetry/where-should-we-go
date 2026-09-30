-- A trip must always have something to confirm. The last activity of a trip cannot be removed,
-- so the default pick and the itinerary are never empty. Deleting the whole trip is unaffected.

create or replace function public.remove_activity(p_activity uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_trip text; v_votes int; v_count int;
begin
  select trip_id into v_trip from public.activities where id = p_activity;
  if not found then perform public._fail('activity_not_found'); end if;
  if public.trip_is_closed(v_trip) then perform public._fail('voting_closed'); end if;
  select count(*) into v_count from public.activities where trip_id = v_trip;
  if v_count <= 1 then perform public._fail('invalid_input', 'last_activity'); end if;
  select count(*) into v_votes from public.votes where activity_id = p_activity;
  delete from public.activities where id = p_activity;
  update public.trips
     set default_activity_id = (select a.id from public.activities a where a.trip_id = v_trip order by a.seq limit 1)
   where id = v_trip and default_activity_id is null;
  return v_votes;
end $$;

grant execute on function public.remove_activity(uuid) to anon, authenticated, service_role;
