# Helper file for converting all of the data in the Unicode Emoji data files
# to Move-friendly constants.

import json
import os
import pathlib
from typing import Any

import utils.data_parser as data_parser
from data_types.type_defs import EmojiData, QualifiedEmojiData
from utils.git_root import get_git_root

BASE_EMOJIS_URL = "https://unicode.org/Public/emoji/15.1/emoji-test.txt"
ZWJ_EMOJIS_URL = "https://unicode.org/Public/emoji/15.1/emoji-zwj-sequences.txt"
SYMBOL_EMOJI_MOVE_CONSTS_PATH = os.path.join("data", "move-consts-symbol-emojis.txt")
CHAT_EMOJI_MOVE_CONSTS_PATH = os.path.join("data", "move-consts-chat-emojis.txt")
GIT_ROOT = get_git_root(os.getcwd())
BASE_EMOJIS_PATH = os.path.join("data", "base-emojis.json")
ZWJ_EMOJIS_PATH = os.path.join("data", "zwj-emojis.json")
SYMBOL_EMOJIS_ALL_DATA_PATH = os.path.join("data", "symbol-emojis-all-data.json")
CHAT_EMOJIS_PATH = os.path.join("data", "chat-emojis.json")
TYPESCRIPT_PATH_DIR = os.path.join(
    GIT_ROOT,
    "src",
    "typescript",
    "sdk",
    "src",
    "emoji_data",
)
TYPESCRIPT_SYMBOL_EMOJIS_PATH = os.path.join(
    TYPESCRIPT_PATH_DIR,
    "symbol-emojis.json",
)
TYPESCRIPT_CHAT_EMOJIS_PATH = os.path.join(
    TYPESCRIPT_PATH_DIR,
    "chat-emojis.json",
)
TYPESCRIPT_SYMBOL_NAMES_PATH = os.path.join(
    TYPESCRIPT_PATH_DIR,
    "symbol-names.json",
)
TYPESCRIPT_CHAT_NAMES_PATH = os.path.join(
    TYPESCRIPT_PATH_DIR,
    "chat-names.json",
)
RUST_JSON_PATH = os.path.join(
    GIT_ROOT,
    "src",
    "rust",
    "processor",
    "rust",
    "processor",
    "src",
    "db",
    "common",
    "models",
    "emojicoin_models",
    "parsers",
    "emojis",
    "symbol-emojis.json",
)
TAB = " " * 4


def generate_move_code(viable_emojis: dict[str, EmojiData]) -> str:
    # Map the full hex string to its original unicode code point.
    original_unicode_points: dict[str, list[str]] = {}
    for data in viable_emojis.values():
        hex_str = "".join(data["code_points"]["as_hex"])
        original_unicode_points[hex_str] = data["code_points"]["as_unicode"]

    ascii_names_to_hex = data_parser.to_ascii_dict(viable_emojis)

    return_open = f"{TAB*2}vector ["
    # The hex bytes args, the aka vector<vector<u8>> args.
    args_and_comments: list[tuple[str, str]] = []

    for name in sorted(ascii_names_to_hex.keys()):
        fhs = ascii_names_to_hex[name]
        original_unicode = original_unicode_points[fhs]
        comment = f' // {name} [{" ".join(original_unicode)}]'
        hex_value = f'x"{fhs}"'
        arg = f"{TAB*3}{hex_value}, "
        args_and_comments.append((arg, comment))

    # Size all lines of code (up to the comment) to the same length.
    longest_arg = max(len(a) for a, _ in args_and_comments)
    full_args: list[str] = []
    for arg, comment in args_and_comments:
        full_args.append(f"{arg:<{longest_arg}}{comment}")  # noqa E231
    return_close = f"{TAB*2}]"

    # Generate the zeroed hex string. This results in Move code for a vector<u8>
    # with a `0` for each emoji.
    zeroes = ", ".join(["0"] * len(args_and_comments))
    zeroed_hex_str = f"{TAB*2}vector<u8> [ {zeroes} ]"  # noqa E201,E202

    return "\n".join(
        [
            return_open,
            "\n".join(full_args),
            return_close,
            "",
            zeroed_hex_str,
            "",
        ]
    )


# Sort by emoji name first, then flip the key to be the encoded UTF-8 emoji and set the
# value as its name.
def as_emoji_to_name_dict(symbol_emojis: dict[str, EmojiData]) -> dict[str, str]:
    new_data = {k: v["emoji"] for k, v in symbol_emojis.items()}
    sorted_data = sorted(new_data.items(), key=lambda x: x[0])
    return {v: k for k, v in sorted_data}


# Simply return the emojis as a list.
def as_emojis_array(symbol_emojis: dict[str, EmojiData]) -> list[str]:
    data = as_emoji_to_name_dict(symbol_emojis)
    return list(data.keys())


def ensure_write_to_file(data: str | dict[str, Any] | list[str], fp: str):
    fp_obj = pathlib.Path(fp)
    pathlib.Path(fp_obj.parent).mkdir(exist_ok=True)

    with open(fp, "w") as outfile:
        if isinstance(data, str):
            _ = outfile.write(data)
        else:
            json.dump(data, outfile, indent=2)


if __name__ == "__main__":
    base_emoji_dict: dict[str, QualifiedEmojiData]
    zwj_emoji_dict: dict[str, EmojiData]

    if pathlib.Path(BASE_EMOJIS_PATH).exists():
        base_emoji_dict = json.load(open(BASE_EMOJIS_PATH, "r"))
    else:
        base_emoji_dict = data_parser.get_base_emojis(BASE_EMOJIS_URL)
        ensure_write_to_file(base_emoji_dict, BASE_EMOJIS_PATH)

    if pathlib.Path(ZWJ_EMOJIS_PATH).exists():
        zwj_emoji_dict = json.load(open(ZWJ_EMOJIS_PATH, "r"))
    else:
        zwj_emoji_dict = data_parser.get_zwj_emojis(ZWJ_EMOJIS_URL)
        ensure_write_to_file(zwj_emoji_dict, ZWJ_EMOJIS_PATH)

    symbol_emojis, extended_emojis = data_parser.get_viable_emojis(
        base_emoji_dict, zwj_emoji_dict
    )

    # In order to fit our package within the 64 kB limit, we need to omit
    # some of the larger extended emojis.
    data_parser.remove_large_extended_emojis(extended_emojis)

    ensure_write_to_file(symbol_emojis, SYMBOL_EMOJIS_ALL_DATA_PATH)
    typescript_symbol_emojis = as_emoji_to_name_dict(symbol_emojis)
    typescript_chat_emojis = as_emoji_to_name_dict(extended_emojis)
    typescript_symbol_names = {k: None for k in typescript_symbol_emojis.values()}
    typescript_chat_names = {k: None for k in typescript_chat_emojis.values()}
    ensure_write_to_file(typescript_symbol_emojis, TYPESCRIPT_SYMBOL_EMOJIS_PATH)
    ensure_write_to_file(typescript_symbol_names, TYPESCRIPT_SYMBOL_NAMES_PATH)
    ensure_write_to_file(typescript_chat_emojis, TYPESCRIPT_CHAT_EMOJIS_PATH)
    ensure_write_to_file(typescript_chat_names, TYPESCRIPT_CHAT_NAMES_PATH)
    # The rust processor uses the `symbol-emojis.json` data at build time, so if the
    # path for the directory exists, output the data there as well.
    if pathlib.Path(RUST_JSON_PATH).parent.exists():
        rust_data = as_emojis_array(symbol_emojis)
        ensure_write_to_file(rust_data, RUST_JSON_PATH)

    ensure_write_to_file(extended_emojis, CHAT_EMOJIS_PATH)
    generated_code = generate_move_code(symbol_emojis)
    ensure_write_to_file(generated_code, SYMBOL_EMOJI_MOVE_CONSTS_PATH)

    extended_generated_code = generate_move_code(extended_emojis)
    ensure_write_to_file(extended_generated_code, CHAT_EMOJI_MOVE_CONSTS_PATH)
