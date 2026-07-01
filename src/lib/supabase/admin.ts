import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/**
 * Server-only Supabase client using the SECRET (service-role) key.
 *
 * It bypasses Row Level Security, so it must ONLY be used inside server
 * code (Server Components / Server Actions) that has already verified the
 * caller is an admin (e.g. via `requireAdmin()`).
 *
 * The `import "server-only"` above makes the build fail if this file is ever
 * imported into a Client Component, so the secret key can never reach the
 * browser bundle.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not set.");
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
