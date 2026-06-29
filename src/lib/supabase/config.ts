/**
 * Central Supabase connection config.
 *
 * Supports both the new publishable key naming
 * (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) and the legacy anon key
 * (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), preferring the publishable key.
 * Both are public, browser-safe keys. The secret/service-role key is
 * NEVER referenced here so it can never leak into client bundles.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
