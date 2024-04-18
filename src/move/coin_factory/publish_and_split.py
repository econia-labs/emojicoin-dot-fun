#!/usr/bin/env python3

import json
import os
import subprocess
from pathlib import Path

COIN_FACTORY = "coin_factory"
PACKAGE_BYTECODE_PATH = "json/build_publish_payload.json"
SYMBOL_PLACEHOLDER = "7abcdef01234578abcdef7"
SPLIT_BYTECODE_PATH = "json/split_bytecode.json"
METADATA_K, CODE_K = "metadata", "code"

SYMBOL_HEX_STRING_GOES_HERE = "bcs_serialized_SYMBOL_VECTOR_U8_HERE"

# Mapping of named addresses to placeholder addresses for generating Move bytecode.
random_addresses = [
    # coin_factory
    "00000000abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef00000000",
    # emojicoin_dot_fun
    "11111111abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef11111111",
]
NAMED_ADDRESSES = {
    COIN_FACTORY: random_addresses[0],
    "emojicoin_dot_fun": random_addresses[1],
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


def compare_contents_and_log(fp: Path, new_data: dict[str, list[str]]) -> None:
    metadata_bytes_changed = False
    module_bytes_changed = False

    if fp.exists():
        old_data = json.load(open(fp))
        assert METADATA_K in new_data and CODE_K in new_data
        metadata_bytes_changed = new_data[METADATA_K] != old_data.get(METADATA_K, [])
        module_bytes_changed = new_data[CODE_K] != old_data.get(CODE_K, [])

    if metadata_bytes_changed:
        print(f"[INFO]: The {METADATA_K} bytecode has changed.")
    else:
        print(f"[INFO]: No changes detected in the {METADATA_K} bytecode.")
    if module_bytes_changed:
        print(f"[INFO]: The {CODE_K} bytecode has changed.")
    else:
        print(f"[INFO]: No changes detected in the {CODE_K} bytecode.")


# To run this script you must:
#  - Have the `aptos` CLI installed
#  - Run this script from the coin factory module directory (where the `Move.toml` is)
if __name__ == "__main__":
    json_path = ensure_parent_directories_exist(PACKAGE_BYTECODE_PATH)
    named_addresses_args = ",".join([f"{k}={v}" for k, v in NAMED_ADDRESSES.items()])
    file_contents_last_updated = os.path.getmtime(PACKAGE_BYTECODE_PATH)
    asdf = subprocess.run(
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
    print()
    print("----------" * 10)
    if file_contents_last_updated == os.path.getmtime(PACKAGE_BYTECODE_PATH):
        print(
            "[ERROR]:",
            f"{PACKAGE_BYTECODE_PATH}",
            "was not updated with new bytecode. Exiting...",
        )
        exit(1)
    else:
        print(
            "[SUCCESS]:",
            "Successfully compiled package.",
            "Replacing relevant bytecode...",
        )

    cli_json_publish_output = json.load(open(json_path))

    metadata: str = cli_json_publish_output["args"][0]["value"]
    len_metadata = len(metadata)
    if metadata.startswith("0x"):
        metadata = metadata[2:]

    metadata_lines = split_and_replace_named_addresses([metadata], NAMED_ADDRESSES)

    bytecode_array: list[str] = cli_json_publish_output["args"][1]["value"]
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

    new_data: dict[str, list[str]] = {
        METADATA_K: metadata_lines,
        CODE_K: bytecode_lines,
    }
    split_bytecode_path = ensure_parent_directories_exist(SPLIT_BYTECODE_PATH)

    compare_contents_and_log(split_bytecode_path, new_data)
    json.dump(new_data, open(split_bytecode_path, "w"), indent=2)

    print(f"[SUCCESS]: Output bytecode contents to {split_bytecode_path}")
