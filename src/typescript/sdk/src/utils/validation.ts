// Remove all useless leading zeros.
//
// In the case of 0.[0-9]+, the leading zero will not be removed.
export const trimLeadingZeros = (input: string) => {
  // Replace all leading zeros with one zero
  input = input.replace(/^0+/, "0"); // The regex matches all leading 0s.

  if (input.startsWith("0") && !input.startsWith("0.") && input.length > 1) {
    input = input.slice(1);
  }

  return input;
};

// Remove all leading zeros and transform "," in ".".
//
// .[0-9]+ will be replaced with 0.[0-9]+
export const sanitizeNumber = (input: string) => {
  input = trimLeadingZeros(input.replace(/,/, "."));
  if (input.startsWith(".")) {
    return `0${input}`;
  }
  return input;
};

// Return true if input is a number in construction.
//
// This is used to allow the input of invalid numbers, if they are what needs
// to be inputted to create a valid number.
//
// For example, in order to input 0.001, you first need to input 0, then 0. which
// is an invalid number, but we do not want to forbid inputting that since it
// will prevent the user from inputting 0.001.
//
// We define a number in construction as a number that leads to the construction
// of a valid number.
//
// A number in construction can be:
// - 0.1
// - 0
// - 0.000
// - .0
// - 0.
//
// It cannot be:
// - 0.0.1
//
// Regex explenation:
// n digits, then maybe (a dot, then maybe (m digits))
export const isNumberInContstruction = (input: string) => /^[0-9]*(\.([0-9]*)?)?$/.test(input);

// Return the number of decimals that input has.
//
// If there is a dot, we count the number of elements past the dot, else we
// return 0.
//
// The regex tests if there is a dot in the string.
export const numberOfDecimals = (input: string) =>
  /\./.test(input) ? input.split(".")[1].length : 0;
