-- Ensure football sync cron jobs send CRON_TOKEN bearer auth.
-- Existing projects already applied earlier cron migrations without this header.

do $$
declare
  existing_job_id bigint;
begin
  for existing_job_id in
    select jobid
    from cron.job
    where jobname in ('sync-fixtures-daily', 'sync-results-daily')
  loop
    perform cron.unschedule(existing_job_id);
  end loop;
end
$$;

select
  cron.schedule(
    'sync-fixtures-daily',
    '0 6 * * *',
    $$
    select
      net.http_post(
        url := 'https://ixgzqkhtyrcvdxsjhvwx.supabase.co/functions/v1/sync-fixtures',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || public.get_runtime_secret('CRON_TOKEN')
        ),
        body := '{}'::jsonb
      );
    $$
  );

select
  cron.schedule(
    'sync-results-daily',
    '0 23 * * *',
    $$
    select
      net.http_post(
        url := 'https://ixgzqkhtyrcvdxsjhvwx.supabase.co/functions/v1/sync-results',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || public.get_runtime_secret('CRON_TOKEN')
        ),
        body := '{}'::jsonb
      );
    $$
  );
