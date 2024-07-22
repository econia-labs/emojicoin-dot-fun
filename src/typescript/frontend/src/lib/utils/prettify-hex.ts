/**
 * Removes all instances of `0x` except for the first one, then lowercases the `x` and replaces
 * the rest of the bytes with their uppercase equivalent.
 *
 * If the input is a Uint8Array, it will be converted to the equivalently formatted hex string.
 *
 * @param hex - The hex string to prettify.
 */
export const prettifyHex = (hex: `0x${string}` | Uint8Array) => {
  const normalized = typeof hex === "string" ? hex : Buffer.from(hex).toString("hex");
  return `0x${normalized.replace(/0x/g, "").toUpperCase()}`;
};
