export type ValidAptosName = string & {
  __brand: "ValidAptosName";
};

const APTOS_NAME_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

/**
 * Checks to see that an ANS name is valid. This means we can skip API calls to the Aptos Name
 * Service for names that are invalid.
 *
 * The rules used here are taken from the
 * {@link [ANS contract on mainnet](https://explorer.aptoslabs.com/account/0x867ed1f6bf916171b1de3ee92849b8978b7d1b9e0a8cc982a3d19d535dfd9c0c/modules?network=mainnet)}
 */
export const isValidAptosName = (input: unknown): input is ValidAptosName =>
  typeof input === "string" && APTOS_NAME_REGEX.test(input);
