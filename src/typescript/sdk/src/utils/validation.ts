/**
 * Removes all useless leading zeros.
 * In the case of 0.[0-9]+, the leading zero will not be removed.
 * @param {string} input - The string to process
 * @returns {string} The processed string
 */
export const trimLeadingZeros = (input: string) => {
  // Replace all leading zeros with one zero
  input = input.replace(/^0+/, "0"); // The regex matches all leading 0s.

  if (input.startsWith("0") && !input.startsWith("0.") && input.length > 1) {
    input = input.slice(1);
  }

  return input;
};

/**
 * Removes all leading zeros and transforms "," into ".".
 * .[0-9]+ will be replaced with 0.[0-9]+
 * @param {string} input - The string to process
 * @returns {string} The processed string
 */
export const sanitizeNumber = (input: string) => {
  input = trimLeadingZeros(input.replace(/,/, "."));
  if (input.startsWith(".")) {
    return `0${input}`;
  }
  return input;
};

/**
 * Checks if the input is a number in construction.
 *
 * This facilitates using temporarily invalid numbers that will eventually be valid- aka, they are
 * numbers in construction.
 *
 * For example, to input 0.001, you need to input "0", then "0." (invalid),
 * which should be allowed to reach "0.001".
 *
 * Valid examples:
 * - 0.1
 * - 0
 * - 0.000
 * - .0
 * - 0.
 *
 * Invalid examples:
 * - 0.0.1
 *
 * @param {string} input - The string to test
 * @returns {boolean} True if the input is a number in construction
 */
export const isNumberInConstruction = (input: string) => /^[0-9]*(\.([0-9]*)?)?$/.test(input);

/**
 * Counts the number of digits after the decimal point in a string number.
 * @param {string} input - The numeric string to analyze (e.g., "123.456")
 * @returns {number} The count of digits after the decimal point (e.g., "123.456" returns 3)
 */
export const countDigitsAfterDecimal = (input: string) =>
  /\./.test(input) ? input.split(".")[1].length : 0;
