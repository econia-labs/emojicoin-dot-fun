function isPlaywrightTest() {
  return (
    process.env.PLAYWRIGHT_TEST_BASE_URL !== undefined ||
    process.env.TEST_WORKER_INDEX !== undefined
  );
}

function isTest() {
  return process.env.NODE_ENV === "test" || isPlaywrightTest();
}

if (!isTest()) {
  require("server-only");
}

if (typeof process.env.EMOJICOIN_INDEXER_URL === "undefined") {
  throw new Error("The indexer processor url must be defined.");
} else {
  try {
    const urlString = process.env.EMOJICOIN_INDEXER_URL;
    const res = new URL(urlString);
    if (urlString.endsWith("/")) {
      throw new Error("Do not end the EMOJICOIN_INDEXER_URL with a trailing slash.");
    }
    if (typeof res.toString() !== "string") {
      throw new Error(`Invalid URL: ${process.env.EMOJICOIN_INDEXER_URL}`);
    }
  } catch (e) {
    console.error(e);
    throw new Error(`Invalid URL: ${process.env.EMOJICOIN_INDEXER_URL}`);
  }
}
export const { EMOJICOIN_INDEXER_URL } = process.env;

export const FETCH_DEBUG = process.env.FETCH_DEBUG === "true";
export const FETCH_DEBUG_VERBOSE = process.env.FETCH_DEBUG_VERBOSE === "true";
