// Stripe client — stub for MVP.
// The schema (subscriptions table, stripe_customer_id on users) is already in place.
// Uncomment and implement when adding Phase 2 subscriptions.

// import Stripe from 'stripe'
//
// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2024-12-18.acacia',
//   typescript: true,
// })

export const STRIPE_PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? '',
} as const
