export type ValidAptosName = string & {
  __brand: "ValidAptosName";
};

/**
 * - Only lowercase characters `a-z`, digits `0-9`, or a hyphen `-`
 * - Doesn't start with a hyphen
 * - Doesn't end with a hyphen
 * - At least 3 characters
 * - At most 63 characters
 */
const APTOS_NAME_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

/**
 * Checks to see that an ANS name is valid. This means we can skip API calls to the Aptos Name
 * Service for names that are invalid.
 *
 * The rules used here are taken from the
 * {@link [ANS contract on mainnet](https://explorer.aptoslabs.com/account/0x867ed1f6bf916171b1de3ee92849b8978b7d1b9e0a8cc982a3d19d535dfd9c0c/modules?network=mainnet)}
 *
 * The rules are written in `v2_1_string_validator`:
 *  - Only allow latin lowercase letters, digits, and hyphens
 *  - Hyphens are not allowed at the beginning or end of a string
 *
 * As well as having the `min_domain_length` and `max_domain_length` set to `3` and `63` specified
 * in the
 * {@link [v2_1_config::Config](https://explorer.aptoslabs.com/account/0x867ed1f6bf916171b1de3ee92849b8978b7d1b9e0a8cc982a3d19d535dfd9c0c/resources?network=mainnet)}
 * resource on-chain.
 */
export const isValidAptosName = (input: unknown): input is ValidAptosName =>
  typeof input === "string" && APTOS_NAME_REGEX.test(input);
