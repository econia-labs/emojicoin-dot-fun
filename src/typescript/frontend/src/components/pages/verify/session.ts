"use server";

import type { AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { isAllowListed } from "lib/utils/allowlist";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "router/routes";

import {
  COOKIE_FOR_ACCOUNT_ADDRESS,
  COOKIE_FOR_HASHED_ADDRESS,
  COOKIE_LENGTH,
} from "./session-info";
import { hashAddress } from "./verify";

export const createSession = async (address: AccountAddressString) => {
  const hashed = await hashAddress(address);

  const allowlisted = await isAllowListed(address);
  if (!allowlisted) {
    return false;
  }

  cookies().set(COOKIE_FOR_HASHED_ADDRESS, hashed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
    maxAge: COOKIE_LENGTH,
    path: "/",
  });

  cookies().set(COOKIE_FOR_ACCOUNT_ADDRESS, address, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
    maxAge: COOKIE_LENGTH,
    path: "/",
  });

  redirect(ROUTES.home);
  return true;
};
