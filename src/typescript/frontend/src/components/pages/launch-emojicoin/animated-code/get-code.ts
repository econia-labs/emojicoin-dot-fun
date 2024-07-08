import { truncateAddress } from "@sdk/utils";
import { prettifyHex } from "lib/utils/prettify-hex";

export type CodeObjectType = ReturnType<typeof getCode>;

const blue = (s: string) => [s, "text-ec-blue"];
const yellow = (s: string) => [s, "text-yellow-300"];
const green = (s: string) => [s, "text-green"];
const lightBlue = (s: string) => [s, "text-blue"];
const gray = (s: string) => [s, "text-light-gray"];
const emerald = (s: string) => [s, "text-emerald-500"];
const constant = (s: string) => [s, "text-light-gray font-bold"];
const func = emerald;
const paren = blue;

export const getCode = (address: `0x${string}`, emojis: string[]) =>
  ({
    publicEntryFun: gray("public entry fun "),
    registerMarket: func("register_market"),
    parenOpen: paren("("),
    registrant: "registrant: ",
    address: yellow(prettifyHex(truncateAddress(address))),
    comma: ",",
    emojisField: "emoji_bytes: ",
    bytes: yellow(prettifyHex(new TextEncoder().encode(emojis.join("")))),
    comma2: ",",
    parenClose: paren(")"),
    acquires: gray(" acquires "),
    acquiresValues: lightBlue("Market, Registry, RegistryAddress"),
    leftBrace: blue(" {"),
    comment1: green("// Verify well-formed emoji bytes."),
    let2: gray("let "),
    emojiBytes: "emoji_bytes",
    equals: " = ",
    getVerifiedBytes: func("get_verified_bytes"),
    parenOpen2: paren("("),
    getVerifiedBytesArgs: "registry, emojis",
    parenClose2: paren(")"),
    semicolon2: ";",
    comment2: green("// Verify the market is not already registered."),
    let3: gray("let "),
    notRegistered: "not_registered = ",
    checkMarkets: func("!check_markets"),
    parenMarketsL: paren("("),
    emojiBytes2: "emoji_bytes",
    parenMarketsR: paren(")"),
    semicolon3: ";",
    assert: func("assert!"),
    parenOpen4: paren("("),
    notRegistered2: "not_registered",
    comma4: ", ",
    eAlreadyRegistered: constant("E_ALREADY_REGISTERED"),
    parenClose4: paren(")"),
    semicolon4: ";",
    comment3: green("// Publish the coin types."),
    let4: gray("let "),
    parenOpen5: paren("("),
    hexCodeReturn: "metadata, bytecode",
    parenClose5: paren(")"),
    equals2: " = ",
    hexCodes: "hex_codes::",
    getPublishCode: func("get_publish_code"),
    parenOpen6: paren("("),
    marketAddress: "market_address",
    parenClose6: paren(")"),
    semicolon5: ";",
    codeModule: "code::",
    publishPackageTxn: func("publish_package_txn"),
    parenOpen7: paren("("),
    registry: "&registry, ",
    metadata: "metadata, ",
    vector: yellow("vector"),
    bracket1: paren("["),
    moduleBytecode2: "bytecode",
    bracket2: paren("],"),
    parenClose7: paren(")"),
    semicolon6: ";",
    rightBrace: blue("}"),
  }) as const;

export const getAllSpanTextInCode = (code: CodeObjectType) => {
  return Object.values(code)
    .map((value) => (Array.isArray(value) ? value[0] : value))
    .join("");
};
