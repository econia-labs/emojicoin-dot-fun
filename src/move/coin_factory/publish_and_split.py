#!/usr/bin/env python3

import json
import subprocess

COIN_FACTORY = "coin_factory"
JSON_FILE_PATH = "build_publish_payload.json"
SYMBOL_PLACEHOLDER = "99887766554433221100ffeeddccbbaa00112233445566778899aabbccddeeff"
BYTECODE_JSON_FILE = "bytecode.json"

SYMBOL_HEX_STRING_GOES_HERE = "bcs_serialized_SYMBOL_VECTOR_U8_HERE"

# Mapping of named addresses to placeholder addresses for generating Move bytecode.
# Note these values are completely random hex values, generated with:
# from random import randint
# ''.join(hex(randint(0, 255))[2:].zfill(2) for x in range(32))
random_addresses = [
    "d821750d56947cc65fe313eb14feb72a03c1fc9d740a0ae31710251173dc6517",
    "771ea88fe30c3525dd4d4b95e8cd67f956ddc1f2774f19b4c404115299894e52",
    "c859f297cd4bed0704b235a7d61c1e0ca7d8ae3627990ff2534fdf1ea051a885",
]
NAMED_ADDRESSES = {
    COIN_FACTORY: random_addresses.pop(),
    "emojicoin_dot_fun": random_addresses.pop(),
    "fee_receiver": random_addresses.pop(),
}


# Splits a string into a list of strings, replacing the delimiter with the replacement.
def split_and_replace(input_string: str, delimiter: str, replacement: str) -> list[str]:
    if delimiter not in input_string:
        return [input_string]
    spl = input_string.split(delimiter)
    replaced: list[str] = []
    # Join the splitted string with the replacement.
    for s1 in spl[:1]:
        replaced.extend([s1, replacement])
    # Add the last part of the split, since this was a manual join.
    replaced.append(spl[-1])
    return replaced


def split_and_replace_named_addresses(
    lines_to_replace: list[str], named_addresses: dict[str, str]
) -> list[str]:
    for named_addr, addr in named_addresses.items():
        lines: list[str] = []
        for spl in lines_to_replace:
            spl_replaced = split_and_replace(
                spl,
                addr,
                f"@{named_addr}: interpolate the BCS-serialized address here...",
            )
            lines.extend(spl_replaced)
        lines_to_replace = lines.copy()
    return lines_to_replace


# To run this script you must:
#  - Have the `aptos` CLI installed
#  - Run this script from the coin factory module directory (where the `Move.toml` is)
if __name__ == "__main__":
    named_addresses_args = ",".join([f"{k}={v}" for k, v in NAMED_ADDRESSES.items()])
    _ = subprocess.run(
        [
            "aptos",
            "move",
            "build-publish-payload",
            "--json-output-file",
            JSON_FILE_PATH,
            "--named-addresses",
            named_addresses_args,
            "--assume-yes",
        ],
        stdout=subprocess.DEVNULL,
    )

    d = json.load(open(JSON_FILE_PATH))

    metadata: str = d["args"][0]["value"]
    if metadata.startswith("0x"):
        metadata = metadata[2:]

    metadata_lines = split_and_replace_named_addresses([metadata], NAMED_ADDRESSES)

    bytecode_array: list[str] = d["args"][1]["value"]
    assert len(bytecode_array) == 1
    bytecode = bytecode_array[0]
    if bytecode.startswith("0x"):
        bytecode = bytecode[2:]

    assert SYMBOL_PLACEHOLDER not in metadata

    assert NAMED_ADDRESSES[COIN_FACTORY] not in metadata
    assert NAMED_ADDRESSES[COIN_FACTORY] in bytecode

    # The vector<u8> byte length is prepended to the actual symbol value
    # in the bytecode. We need to remove/replace this value when publishing as well.
    symbol_len_bytes_as_hex = hex(len(bytes.fromhex(SYMBOL_PLACEHOLDER)))[2:]

    sym_bytecode = f"{symbol_len_bytes_as_hex}{SYMBOL_PLACEHOLDER}"
    sym_msg = SYMBOL_HEX_STRING_GOES_HERE

    bytecode_lines = split_and_replace(bytecode, sym_bytecode, sym_msg)
    bytecode_lines = split_and_replace_named_addresses(bytecode_lines, NAMED_ADDRESSES)

    d = {
        "metadata": metadata_lines,
        "bytecode": bytecode_lines,
    }
    json.dump(d, open(BYTECODE_JSON_FILE, "w"), indent=2)

    print(f"[SUCCESS]: Output bytecode contents to {BYTECODE_JSON_FILE}")
