#!/usr/bin/env python3

import json
import subprocess

MODULE_NAME = "coin_factory"
JSON_FILE_PATH = "build_publish_payload.json"
SYMBOL_PLACEHOLDER = "99887766554433221100ffeeddccbbaa00112233445566778899aabbccddeeff"
MODULE_ADDRESS_PLACEHOLDER = (
    "ffeeddccbbaa99887766554433221100aabbccddeeff00112233445566778899"
)
BYTECODE_JSON_FILE = "bytecode.json"

SYMBOL_HEX_STRING_GOES_HERE = "bcs_serialized_SYMBOL_VECTOR_U8_HERE"
MODULE_ADDRESS_HEX_STRING_GOES_HERE = "bcs_serialized_MODULE_ADDRESS_HERE"


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


# To run this script you must:
#  - Have the `aptos` CLI installed
#  - Run this script from the coin factory module directory (where the `Move.toml` is)
if __name__ == "__main__":
    _ = subprocess.run(
        [
            "aptos",
            "move",
            "build-publish-payload",
            "--json-output-file",
            JSON_FILE_PATH,
            "--named-addresses",
            f"{MODULE_NAME}={MODULE_ADDRESS_PLACEHOLDER}",
            "--assume-yes",
        ]
    )

    d = json.load(open(JSON_FILE_PATH))

    metadata = d["args"][0]["value"]
    if metadata.startswith("0x"):
        metadata = metadata[2:]

    bytecode_array = d["args"][1]["value"]
    assert len(bytecode_array) == 1
    bytecode = bytecode_array[0]
    if bytecode.startswith("0x"):
        bytecode = bytecode[2:]

    assert SYMBOL_PLACEHOLDER not in metadata
    assert MODULE_ADDRESS_PLACEHOLDER not in metadata

    assert SYMBOL_PLACEHOLDER in bytecode
    assert MODULE_ADDRESS_PLACEHOLDER in bytecode

    # The vector<u8> byte length is prepended to the actual symbol value
    # in the bytecode. We need to remove/replace this value when publishing as well.
    symbol_len_bytes_as_hex = hex(len(bytes.fromhex(SYMBOL_PLACEHOLDER)))[2:]

    sym_bytecode = f"{symbol_len_bytes_as_hex}{SYMBOL_PLACEHOLDER}"
    sym_msg = SYMBOL_HEX_STRING_GOES_HERE

    bytecode_replaced = split_and_replace(bytecode, sym_bytecode, sym_msg)

    # Addresses are always 32 bytes, so we don't need to remove or replace the length.
    addr_bytecode = MODULE_ADDRESS_PLACEHOLDER
    addr_msg = MODULE_ADDRESS_HEX_STRING_GOES_HERE

    lines: list[str] = []
    for s2 in bytecode_replaced:
        if addr_bytecode in s2:
            s2_replaced = split_and_replace(s2, addr_bytecode, addr_msg)
            lines.extend(s2_replaced)
        else:
            lines.append(s2)

    d = {
        "metadata": metadata,
        "bytecode": lines,
    }
    json.dump(d, open(BYTECODE_JSON_FILE, "w"), indent=2)

    print(f"Output bytecode contents to {BYTECODE_JSON_FILE}")
