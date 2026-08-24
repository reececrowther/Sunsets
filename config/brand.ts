// Single place to update when the final brand name is chosen.
// Set NEXT_PUBLIC_BRAND_NAME in .env.local to override without a code change.
export const APP_NAME = process.env.NEXT_PUBLIC_BRAND_NAME ?? 'SunsetScore'
export const APP_TAGLINE = "Will tonight's sunset be worth chasing?"
export const APP_DESCRIPTION =
  'A 0–100 score for every UK sunset — based on cloud layers, atmosphere, and visibility. Know before you go.'
