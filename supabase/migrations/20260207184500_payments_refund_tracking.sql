alter table public.payments
  add column if not exists stripe_refund_id text,
  add column if not exists refund_reason text,
  add column if not exists refund_requested_at timestamptz,
  add column if not exists refunded_at timestamptz,
  add column if not exists refunded_amount numeric(10, 2),
  add column if not exists refund_failure_reason text;

create unique index if not exists payments_stripe_refund_id_unique
  on public.payments (stripe_refund_id)
  where stripe_refund_id is not null;
