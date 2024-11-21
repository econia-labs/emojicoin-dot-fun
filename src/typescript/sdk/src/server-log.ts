"use server";

// Don't print server logs if we're on the production build, since each invocation of this
// function (the server action) is a POST request.
const inProduction = process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

export const serverLog = async (s: string) => {
  if (!inProduction) {
    /* eslint-disable-next-line no-console */
    console.log(s);
  }
};
