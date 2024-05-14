"use client";

import { t } from "context/language-context";
import { type ErrorResult } from "./types";

// TODO: check do we need axios error handlers is we will use GraphQL
// If we will use it put strings from translate functions into vocabulary
export const isErrorResult = (result: unknown): result is ErrorResult => {
  return (
    typeof result === "object" &&
    result !== null &&
    "isError" in result &&
    (result as Record<string, unknown>).isError === true
  );
};

export const replaceWithNewErrorMessages = (error: unknown) => {
  if ((error as { code: string })?.code === "ERR_NETWORK") {
    return `${t("Server is not responding.")} ${t("Check the internet connection and try again.")}`;
  } else if ((error as { code: string })?.code === "ECONNABORTED") {
    return `${t("Your request exceeded the time limit for processing.")} ${t(
      "Check the internet connection and try again.",
    )}`;
  } else return (error as { message: string }).message;
};
