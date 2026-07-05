import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "payment-proofs";

/**
 * Uploads a proof file to the private payment-proofs bucket using the
 * service-role client (server-only). Returns the stored object path.
 */
export async function uploadProof(
  memberId: string,
  file: File,
): Promise<string> {
  const supabase = createAdminClient();
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  const path = `${memberId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Proof upload failed: ${error.message}`);
  return path;
}

/** Creates a short-lived signed URL to view a private proof file. */
export async function getProofSignedUrl(
  path: string,
  expiresIn = 600,
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function removeProof(path: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.storage.from(BUCKET).remove([path]);
}
