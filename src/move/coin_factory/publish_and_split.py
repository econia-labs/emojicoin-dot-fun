#!/usr/bin/env python3
# cspell:words beeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeef
# cspell:words f00000000000000000000000000000000000000000000000000000000000000d

import json
import subprocess
from pathlib import Path

COIN_FACTORY = "coin_factory"
JSON_FILE_PATH = "json/build_publish_payload.json"
SYMBOL_PLACEHOLDER = "7abcdef01234578abcdef7"
BYTECODE_JSON_FILE = "json/split_bytecode.json"

SYMBOL_HEX_STRING_GOES_HERE = "bcs_serialized_SYMBOL_VECTOR_U8_HERE"

# Mapping of named addresses to placeholder addresses for generating Move bytecode.
random_addresses = [
    # coin_factory
    "beeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeef",
    # lp_coin_manager
    "f00000000000000000000000000000000000000000000000000000000000000d",
]
NAMED_ADDRESSES = {
    COIN_FACTORY: random_addresses[0],
    "lp_coin_manager": random_addresses[1],
}


def ensure_parent_directories_exist(s: str) -> Path:
    fp = Path(s)
    Path(fp.parent).mkdir(exist_ok=True)

    return fp


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
    json_path = ensure_parent_directories_exist(JSON_FILE_PATH)
    named_addresses_args = ",".join([f"{k}={v}" for k, v in NAMED_ADDRESSES.items()])
    _ = subprocess.run(
        [
            "aptos",
            "move",
            "build-publish-payload",
            "--json-output-file",
            json_path,
            "--named-addresses",
            named_addresses_args,
            "--assume-yes",
            "--included-artifacts=none",
        ],
    )

    d = json.load(open(json_path))

    metadata: str = d["args"][0]["value"]
    len_metadata = len(metadata)
    if metadata.startswith("0x"):
        metadata = metadata[2:]

    metadata_lines = split_and_replace_named_addresses([metadata], NAMED_ADDRESSES)

    bytecode_array: list[str] = d["args"][1]["value"]
    assert len(bytecode_array) == 1
    bytecode = bytecode_array[0]
    len_bytecode = len(bytecode_array[0])
    if bytecode.startswith("0x"):
        bytecode = bytecode[2:]

    assert SYMBOL_PLACEHOLDER not in metadata

    assert NAMED_ADDRESSES[COIN_FACTORY] not in metadata
    assert NAMED_ADDRESSES[COIN_FACTORY] in bytecode

    # The vector<u8> byte length is prepended to the actual symbol value
    # in the bytecode. We need to remove/replace this value when publishing as well.
    symbol_len_bytes_as_hex = hex(len(bytes.fromhex(SYMBOL_PLACEHOLDER)))[2:].zfill(2)
    # It's a vector of vectors, so we need to serialize the bytes following it as
    # if it's a vector of u8s, meaning we prepend the entire length of the inner vector.
    # plus the one byte for the byte denoting the length of the inner vector.
    outer_vector_bytes_as_hex = hex(int(symbol_len_bytes_as_hex, 16) + 1)[2:].zfill(2)

    sym_bytecode = (
        f"{outer_vector_bytes_as_hex}{symbol_len_bytes_as_hex}{SYMBOL_PLACEHOLDER}"
    )
    sym_msg = SYMBOL_HEX_STRING_GOES_HERE

    bytecode_lines = split_and_replace(bytecode, sym_bytecode, sym_msg)
    bytecode_lines = split_and_replace_named_addresses(bytecode_lines, NAMED_ADDRESSES)

    d = {
        "metadata": metadata_lines,
        "bytecode": bytecode_lines,
    }
    bytecode_json_path = ensure_parent_directories_exist(BYTECODE_JSON_FILE)
    json.dump(d, open(bytecode_json_path, "w"), indent=2)

    print(f"[SUCCESS]: Output bytecode contents to {bytecode_json_path}")
