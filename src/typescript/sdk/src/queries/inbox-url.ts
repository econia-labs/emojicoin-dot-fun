import "server-only";

import { PostgrestClient } from "@supabase/postgrest-js";

if (!process.env.INBOX_URL) {
  throw new Error("The `inbox` endpoint is not defined for server actions.");
}
export const postgrest = new PostgrestClient(process.env.INBOX_URL!);
