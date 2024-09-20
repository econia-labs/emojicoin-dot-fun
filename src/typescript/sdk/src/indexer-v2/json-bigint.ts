import parse from "json-bigint";

const JSON_BIGINT = parse({
  alwaysParseAsBig: true,
  useNativeBigInt: true,
  protoAction: "ignore",
  constructorAction: "ignore",
});
export default JSON_BIGINT;
