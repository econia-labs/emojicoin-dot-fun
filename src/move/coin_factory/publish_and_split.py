#!/usr/bin/env python3

import json
import os
import subprocess
from pathlib import Path

FLAG_ADDRESS = "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
MARKET_NAMED_ADDRESS = "market_address"
COIN_FACTORY_NAMED_ADDRESS = "coin_factory"
PACKAGE_BYTECODE_PATH = "json/build_publish_payload.json"
SPLIT_BYTECODE_PATH = "json/split_bytecode.json"
METADATA_K, CODE_K = "metadata", "code"

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
                f"Interpolate the BCS encoding of address @{named_addr} here.",
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
    try:
        file_contents_last_updated = os.path.getmtime(PACKAGE_BYTECODE_PATH)
    except FileNotFoundError:
        file_contents_last_updated = 0
    asdf = subprocess.run(
        [
            "aptos",
            "move",
            "build-publish-payload",
            "--json-output-file",
            json_path,
            "--named-addresses",
            f"{COIN_FACTORY_NAMED_ADDRESS}={FLAG_ADDRESS}",
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

    bytecode_array: list[str] = cli_json_publish_output["args"][1]["value"]
    assert len(bytecode_array) == 1
    bytecode = bytecode_array[0]
    len_bytecode = len(bytecode_array[0])
    if bytecode.startswith("0x"):
        bytecode = bytecode[2:]

    assert FLAG_ADDRESS not in metadata

    bytecode_lines = split_and_replace_named_addresses([bytecode], {MARKET_NAMED_ADDRESS: FLAG_ADDRESS})

    new_data = {
        METADATA_K: metadata,
        CODE_K: bytecode_lines,
    }
    split_bytecode_path = ensure_parent_directories_exist(SPLIT_BYTECODE_PATH)

    compare_contents_and_log(split_bytecode_path, new_data)
    json.dump(new_data, open(split_bytecode_path, "w"), indent=2)

    print(f"[SUCCESS]: Output bytecode contents to {split_bytecode_path}")
