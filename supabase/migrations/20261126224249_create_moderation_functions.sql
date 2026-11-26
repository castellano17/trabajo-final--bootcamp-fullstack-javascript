create function public.set_user_role(target_user_id uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select private.current_user_role()) is distinct from 'admin' then
    raise exception 'Only admins can change roles'
      using errcode = 'insufficient_privilege';
  end if;

  if target_user_id = (select auth.uid()) then
    raise exception 'Admins cannot change their own role'
      using errcode = 'insufficient_privilege';
  end if;

  update public.profiles set role = new_role where id = target_user_id;

  if not found then
    raise exception 'User not found'
      using errcode = 'no_data_found';
  end if;
end;
$$;

create function public.set_review_hidden(target_review_id uuid, hidden boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select private.current_user_role()) not in ('moderator', 'admin'), true) then
    raise exception 'Only moderators and admins can hide reviews'
      using errcode = 'insufficient_privilege';
  end if;

  update public.reviews set is_hidden = hidden where id = target_review_id;

  if not found then
    raise exception 'Review not found'
      using errcode = 'no_data_found';
  end if;
end;
$$;

create function public.resolve_report(target_report_id uuid, new_status public.report_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select private.current_user_role()) not in ('moderator', 'admin'), true) then
    raise exception 'Only moderators and admins can resolve reports'
      using errcode = 'insufficient_privilege';
  end if;

  if new_status = 'pending' then
    raise exception 'A report can only be resolved as accepted or rejected'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.reports
  set status = new_status, resolved_by = (select auth.uid()), resolved_at = now()
  where id = target_report_id and status = 'pending';

  if not found then
    raise exception 'Report not found or already resolved'
      using errcode = 'no_data_found';
  end if;
end;
$$;

revoke execute on function public.set_user_role(uuid, public.user_role) from public, anon;
revoke execute on function public.set_review_hidden(uuid, boolean) from public, anon;
revoke execute on function public.resolve_report(uuid, public.report_status) from public, anon;

grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;
grant execute on function public.set_review_hidden(uuid, boolean) to authenticated;
grant execute on function public.resolve_report(uuid, public.report_status) to authenticated;
