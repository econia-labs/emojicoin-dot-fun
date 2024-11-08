"use server";

import { headers } from "next/headers";
import { isUserGeoblocked } from "utils/geolocation";

export async function isUserGeoblockedServerAction() {
  return await isUserGeoblocked(headers().get("x-real-ip"));
}
