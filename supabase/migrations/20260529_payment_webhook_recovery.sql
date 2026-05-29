-- Treat successful Razorpay webhook rows as verified sales.
-- Older webhook code stored successful payments as "captured", and dashboard
-- totals only counted "verified".

update public.course_purchases
set
  status = 'verified',
  purchased_at = coalesce(purchased_at, updated_at, created_at, timezone('utc', now())),
  delivered_at = coalesce(delivered_at, purchased_at, updated_at, created_at, timezone('utc', now()))
where status = 'captured'
   or (
     status = 'processed'
     and (
       gateway_response->>'event' in ('payment.captured', 'order.paid')
       or gateway_response->>'status' in ('captured', 'paid')
       or gateway_response #>> '{payload,payment,entity,status}' = 'captured'
       or gateway_response #>> '{payload,order,entity,status}' = 'paid'
     )
   )
   or gateway_response->>'event' = 'payment.captured'
   or gateway_response->>'event' = 'order.paid'
   or gateway_response->>'status' = 'captured';
