import { t } from "context/language-context";
import { ErrorResult } from "./types";
import { LOCAL_STORAGE_KEYS } from "configs";

const locale = localStorage.getItem(LOCAL_STORAGE_KEYS.language);
const translate = t(locale);
// TODO check do we need axios error handlers is we will use GraphQL
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
    return `${translate("Server is not responding.")} ${translate("Check the internet connection and try again.")}`;
  } else if ((error as { code: string })?.code === "ECONNABORTED") {
    return `${translate("Your request exceeded the time limit for processing.")} ${translate(
      "Check the internet connection and try again.",
    )}`;
  } else return (error as { message: string }).message;
};
