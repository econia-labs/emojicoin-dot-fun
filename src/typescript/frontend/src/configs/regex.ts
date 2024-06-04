const REGEX = {
  includesVariableRegex: new RegExp(/%\S+?%/, "gm"),
  numericInputRegex: /^\d*[.,]?\d*$/,
  onlyNumbers: /^\d*$/,
};

export default REGEX;
