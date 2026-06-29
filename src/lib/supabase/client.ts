import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "./config";

/**
 * Supabase client for use in Client Components ("use client").
 * Uses only the public publishable key — never the secret key.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
