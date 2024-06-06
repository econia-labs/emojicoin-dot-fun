import "server-only";

let REVALIDATION_TIME: number;

if (process.env.REVALIDATION_TIME) {
  REVALIDATION_TIME = Number(process.env.REVALIDATION_TIME);
} else {
  if (process.env.NODE) throw new Error("Environment variable REVALIDATION_TIME is undefined.");
}

export { REVALIDATION_TIME };
