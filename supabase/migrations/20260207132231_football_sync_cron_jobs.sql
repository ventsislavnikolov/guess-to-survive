-- Schedule football-data synchronization jobs.
-- Requires pg_cron + pg_net extensions.

create extension if not exists pg_cron;
create extension if not exists pg_net;

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
        url := 'https://jsfsbvkhffyybytasytm.supabase.co/functions/v1/sync-fixtures',
        headers := '{"Content-Type":"application/json"}'::jsonb,
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
        url := 'https://jsfsbvkhffyybytasytm.supabase.co/functions/v1/sync-results',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := '{}'::jsonb
      );
    $$
  );
