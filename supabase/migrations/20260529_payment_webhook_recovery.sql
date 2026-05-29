-- Treat successful Razorpay webhook rows as verified sales.
-- Older webhook code stored successful payments as "captured", and dashboard
-- totals only counted "verified".

update public.course_purchases
set
  status = 'verified',
  purchased_at = coalesce(purchased_at, updated_at, created_at, timezone('utc', now())),
  delivered_at = coalesce(delivered_at, purchased_at, updated_at, created_at, timezone('utc', now()))
where status = 'captured'
   or gateway_response->>'event' = 'payment.captured'
   or gateway_response->>'status' = 'captured';
