"use server";

import {
  COOKIE_FOR_ACCOUNT_ADDRESS,
  COOKIE_FOR_ACCOUNT_SCHEME,
  COOKIE_FOR_PUBKEY,
  COOKIE_FOR_SIGNATURE,
  COOKIE_LENGTH,
  signingSchemeToString,
} from "./session-info";
import { cookies } from "next/headers";
import { type SigningScheme } from "@aptos-labs/ts-sdk";

export const createSession = (args: {
  pubkey: string;
  signature: string;
  scheme: SigningScheme;
  address: string;
}) => {
  const { pubkey, signature, scheme, address } = args;

  cookies().set(COOKIE_FOR_SIGNATURE, signature, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_LENGTH,
    path: "/",
  });

  cookies().set(COOKIE_FOR_PUBKEY, pubkey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_LENGTH,
    path: "/",
  });

  cookies().set(COOKIE_FOR_ACCOUNT_SCHEME, signingSchemeToString(scheme), {
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
};
