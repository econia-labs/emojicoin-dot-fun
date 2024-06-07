"use server";

import {
  COOKIE_FOR_PUBKEY,
  COOKIE_FOR_SIGNATURE,
  COOKIE_FOR_ACCOUNT_SCHEME,
  COOKIE_FOR_ACCOUNT_ADDRESS,
} from "components/pages/verify/session-info";
import { type NextRequest } from "next/server";

export const getSessionCookies = async (request: NextRequest) => {
  const pubkey = request.cookies.get(COOKIE_FOR_PUBKEY)?.value;
  const signature = request.cookies.get(COOKIE_FOR_SIGNATURE)?.value;
  const accountScheme = request.cookies.get(COOKIE_FOR_ACCOUNT_SCHEME)?.value;
  const accountAddress = request.cookies.get(COOKIE_FOR_ACCOUNT_ADDRESS)?.value;

  if (!pubkey || !signature || !accountScheme || !accountAddress) {
    return undefined;
  }

  return { pubkey, signature, accountScheme, accountAddress };
};
