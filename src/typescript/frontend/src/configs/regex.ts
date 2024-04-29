const REGEX = {
  includesVariableRegex: new RegExp(/%\S+?%/, "gm"),
  numericInputRegex: /^[0-9]*[.,]?[0-9]*$/,
  onlyNumbers: /^[0-9]*$/,
};

export default REGEX;
