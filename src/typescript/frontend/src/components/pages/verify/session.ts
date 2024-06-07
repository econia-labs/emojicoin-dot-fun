"use server";

import {
  COOKIE_FOR_ACCOUNT_ADDRESS,
  COOKIE_FOR_HASHED_ADDRESS,
  COOKIE_LENGTH,
} from "./session-info";
import { cookies } from "next/headers";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { hashAddress } from "./verify";
import { isAllowListed } from "lib/utils/allowlist";
import { redirect } from "next/navigation";
import { ROUTES } from "router/routes";

export const createSession = async (address: AccountAddressString) => {
  const hashed = await hashAddress(address);

  const allowlisted = await isAllowListed(address);
  if (!allowlisted) {
    return null;
  }

  cookies().set(COOKIE_FOR_HASHED_ADDRESS, hashed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_LENGTH,
    path: "/",
  });

  cookies().set(COOKIE_FOR_ACCOUNT_ADDRESS, address, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_LENGTH,
    path: "/",
  });

  redirect(ROUTES.home);

  return {
    address,
    hashed,
  };
};
