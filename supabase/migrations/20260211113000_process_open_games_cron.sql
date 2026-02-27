-- Schedule hourly sweep to process round locks and final results for open games.
-- Uses CRON_TOKEN from vault via get_runtime_secret().

do $$
declare
  existing_job_id bigint;
begin
  for existing_job_id in
    select jobid
    from cron.job
    where jobname in ('process-open-games-hourly')
  loop
    perform cron.unschedule(existing_job_id);
  end loop;
end
$$;

select
  cron.schedule(
    'process-open-games-hourly',
    '10 * * * *',
    $$
    select
      net.http_post(
        url := 'https://ixgzqkhtyrcvdxsjhvwx.supabase.co/functions/v1/process-open-games',
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
