"use server";

/**
 * Do NOT call this function directly unless you know what you're doing- it's a POST request to
 * the application server just to log to the console.
 */
export const serverLogAction = async (s: string) => {
  console.log(s);
};
