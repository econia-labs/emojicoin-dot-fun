import "server-only";

import { PostgrestClient } from "@supabase/postgrest-js";

if (!process.env.INBOX_URL) {
  console.warn("Remove this file upon submission of this PR.");
}

const authorizationHeaders = process.env.INBOX_JWT_TOKEN
  ? {
      headers: {
        "X-Serverless-Authorization": `Bearer ${process.env.INBOX_JWT_TOKEN}`,
      },
    }
  : undefined;

export const postgrest = new PostgrestClient(process.env.INBOX_URL!, authorizationHeaders);
