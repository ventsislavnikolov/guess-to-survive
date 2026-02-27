-- Schedule 24-hour pick reminder emails (hourly sweep).
-- Requires `vault` secret CRON_TOKEN to exist; fetched via get_runtime_secret().

do $$
declare
  existing_job_id bigint;
begin
  for existing_job_id in
    select jobid
    from cron.job
    where jobname in ('round-reminders-hourly')
  loop
    perform cron.unschedule(existing_job_id);
  end loop;
end
$$;

select
  cron.schedule(
    'round-reminders-hourly',
    '0 * * * *',
    $$
    select
      net.http_post(
        url := 'https://ixgzqkhtyrcvdxsjhvwx.supabase.co/functions/v1/send-round-reminders',
        headers := jsonb_build_object(
          'Content-Type',
          'application/json',
          'Authorization',
          'Bearer ' || public.get_runtime_secret('CRON_TOKEN')
        ),
        body := '{}'::jsonb
      );
    $$
  );

