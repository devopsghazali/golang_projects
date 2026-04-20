export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://orrozpaelhogpqemngfj.supabase.co'

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_mrF_DYjjMfEYP6aPK-IfUg_4bjYkGlV'

export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'CPAMaster'

export const GOOGLE_DRIVE_LINK = import.meta.env.VITE_GOOGLE_DRIVE_LINK || ''

export const PAYMENT_MODE =
  (import.meta.env.VITE_PAYMENT_MODE || 'live').toLowerCase()

export const isPlaceholderMode = () => PAYMENT_MODE !== 'live'
