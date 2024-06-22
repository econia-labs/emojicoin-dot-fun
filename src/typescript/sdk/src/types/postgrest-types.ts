// So we don't have to install postgrest to the frontend, we can just export the types from the SDK.
import { type PostgrestError as PGE } from "@supabase/postgrest-js";

export type PostgrestError = PGE;
