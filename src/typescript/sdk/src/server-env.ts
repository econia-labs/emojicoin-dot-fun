if (typeof process.env.EMOJICOIN_INDEXER_URL === "undefined") {
  throw new Error("The indexer processor url must be defined.");
} else {
  try {
    const res = new URL(process.env.EMOJICOIN_INDEXER_URL);
    if (typeof res.toString() !== "string") {
      throw new Error(`Invalid URL: ${process.env.EMOJICOIN_INDEXER_URL}`);
    }
  } catch (e) {
    throw new Error(`Invalid URL: ${process.env.EMOJICOIN_INDEXER_URL}`);
  }
}
export const { EMOJICOIN_INDEXER_URL } = process.env;
