import { serverLogAction } from "./server-log";

const inProduction = process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

export const serverLog = (s: string) => {
  // Don't print server logs if we're on the production build, since each invocation of this
  // function (the server action) is a POST request.
  if (inProduction) {
    return;
  }
  serverLogAction(s);
};
