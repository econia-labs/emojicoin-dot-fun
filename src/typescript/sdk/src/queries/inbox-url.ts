import "server-only";

import { PostgrestClient } from "@supabase/postgrest-js";

if (!process.env.INBOX_URL) {
  throw new Error("The `inbox` endpoint is not defined for server actions.");
}

const authorizationHeaders = process.env.INBOX_JWT_TOKEN ? {
  headers: {
    'X-Serverless-Authorization': `Bearer ${process.env.INBOX_JWT_TOKEN}`,
  }
} : undefined;

export const postgrest = new PostgrestClient(process.env.INBOX_URL!, authorizationHeaders);
