-- Run via SQL Editor or an authenticated database tool. All fixtures are rolled back.
begin;
insert into office_private.allowed_admins(email) values('office-test@example.invalid');
insert into auth.users(id,email,email_confirmed_at) values('00000000-0000-4000-8000-000000000111','office-test@example.invalid',now());
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000111","role":"authenticated"}',true);
do $$ declare r jsonb; begin
 if not public.office_access() then raise exception 'Administrator access failed';end if;
 r=public.office_save('customers','verification-only-customer','{"name":"Verification"}'::jsonb,null);
 r=public.office_save('jobs','verification-only-job','{"status":"Scheduled","customerId":"verification-only-customer"}'::jsonb,null);
 if not exists(select 1 from public.office_records where body->>'sourceId'='verification-only-job' and body->>'department'='Dispatch') then raise exception 'Department handoff failed';end if;
 r=public.office_save('compliance','verification-only-worksheet','{"title":"Verification"}'::jsonb,null);
 begin
 perform public.office_save('compliance','verification-only-worksheet','{}'::jsonb,0);
 raise exception 'Stale update allowed';
 exception when others then if sqlerrm='Stale update allowed' then raise;end if;end;
end $$;
reset role;
insert into auth.users(id,email,email_confirmed_at) values('00000000-0000-4000-8000-000000000112','outsider@example.invalid',now());
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000112","role":"authenticated"}',true);
do $$ begin
 if public.office_access() then raise exception 'Outsider access allowed';end if;
 if exists(select 1 from public.office_records) then raise exception 'Outsider could read';end if;
 begin perform public.office_save('customers','outsider-only-record','{}'::jsonb,null);raise exception 'Outsider write allowed';exception when others then if sqlerrm='Outsider write allowed' then raise;end if;end;
end $$;
reset role;
update auth.users set email_confirmed_at=null where id='00000000-0000-4000-8000-000000000111';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000111","role":"authenticated"}',true);
do $$ begin if public.office_access() then raise exception 'Unverified account allowed';end if;end $$;
rollback;
