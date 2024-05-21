# Helper file for converting all of the data in the Unicode Emoji data files
# to Move-friendly constants.

import json
import pathlib
from typing import Any

import utils.data_parser as data_parser
from data_types.type_defs import EmojiData, QualifiedEmojiData

BASE_EMOJIS_URL = "https://unicode.org/Public/emoji/15.1/emoji-test.txt"
ZWJ_EMOJIS_URL = "https://unicode.org/Public/emoji/15.1/emoji-zwj-sequences.txt"
SYMBOL_EMOJI_MOVE_CONSTS_FILE = "data/move-consts-symbol-emojis.txt"
CHAT_EMOJI_MOVE_CONSTS_FILE = "data/move-consts-chat-emojis.txt"
BASE_EMOJIS_FILE = "data/base-emojis.json"
ZWJ_EMOJIS_FILE = "data/zwj-emojis.json"
SYMBOL_EMOJIS_FILE = "data/symbol-emojis.json"
CHAT_EMOJIS_FILE = "data/chat-emojis.json"
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


def ensure_write_to_file(data: str | dict[str, Any], fp_str: str, indent: int = 3):
    fp = pathlib.Path(fp_str)
    pathlib.Path(fp.parent).mkdir(exist_ok=True)

    with open(fp_str, "w") as outfile:
        if isinstance(data, str):
            _ = outfile.write(data)
        else:
            json.dump(data, outfile, indent=indent)


if __name__ == "__main__":
    base_emoji_dict: dict[str, QualifiedEmojiData]
    zwj_emoji_dict: dict[str, EmojiData]

    if pathlib.Path(BASE_EMOJIS_FILE).exists():
        base_emoji_dict = json.load(open(BASE_EMOJIS_FILE, "r"))
    else:
        base_emoji_dict = data_parser.get_base_emojis(BASE_EMOJIS_URL)
        ensure_write_to_file(base_emoji_dict, BASE_EMOJIS_FILE)

    if pathlib.Path(ZWJ_EMOJIS_FILE).exists():
        zwj_emoji_dict = json.load(open(ZWJ_EMOJIS_FILE, "r"))
    else:
        zwj_emoji_dict = data_parser.get_zwj_emojis(ZWJ_EMOJIS_URL)
        ensure_write_to_file(zwj_emoji_dict, ZWJ_EMOJIS_FILE)

    symbol_emojis, extended_emojis = data_parser.get_viable_emojis(
        base_emoji_dict, zwj_emoji_dict
    )

    # In order to fit our package within the 64 kB limit, we need to omit
    # some of the larger extended emojis.
    data_parser.remove_large_extended_emojis(extended_emojis)

    ensure_write_to_file(symbol_emojis, SYMBOL_EMOJIS_FILE)
    ensure_write_to_file(extended_emojis, CHAT_EMOJIS_FILE)

    generated_code = generate_move_code(symbol_emojis)
    ensure_write_to_file(generated_code, SYMBOL_EMOJI_MOVE_CONSTS_FILE)

    extended_generated_code = generate_move_code(extended_emojis)
    ensure_write_to_file(extended_generated_code, CHAT_EMOJI_MOVE_CONSTS_FILE)
