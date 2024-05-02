# cspell:words alnum
# cspell:words príncipe
# cspell:words tomé
# cspell:words unidecode

# Helper file for converting all of the data in the Unicode Emoji data files
# to Move-friendly constants.

import pathlib
import sys
import json

from unidecode import unidecode

import utils.data_parser as data_parser
from data_types.type_defs import EmojiData, QualifiedEmojiData

BASE_EMOJIS_URL = "https://unicode.org/Public/emoji/15.1/emoji-test.txt"
ZWJ_EMOJIS_URL = "https://unicode.org/Public/emoji/15.1/emoji-zwj-sequences.txt"
MOVE_CONSTS_DATA_FILE = "data/move_consts.txt"
AUXILIARY_EMOJIS_DATA_FILE = "data/auxiliary_emojis.json"
BASE_EMOJIS_DATA_FILE = "data/base_emojis.json"
ZWJ_EMOJIS_DATA_FILE = "data/zwj_emojis.json"
TAB = " " * 4


def to_ascii_dict(viable_emojis: dict[str, EmojiData]) -> dict[str, str]:
    """
    Convert all viable emojis to a dictionary where the key is the emoji name
    in its ascii representation and the value is the emoji's hex string.

    We cannot use the original Unicode names as the Move variable names because
    Move code only accepts ascii characters, so we convert them with the
    unidecode library.

    Example:
    ::
    "flag: São Tomé & Príncipe": "f09f87b8f09f87b9"
    ::
    becomes
    ::
    {
        "Flag: Sao Tome & Principe": "f09f87b8f09f87b9",
    }
    """
    emoji_name_to_hex: dict[str, str] = {}
    for name, data in viable_emojis.items():
        ascii_name = unidecode(name)
        ascii_name = ascii_name[0].upper() + ascii_name[1:]
        hex_string = "".join(data["code_points"]["as_hex"])
        if ascii_name in emoji_name_to_hex:
            print(f"ERROR: duplicate constant name: {ascii_name}")
            sys.exit(1)
        emoji_name_to_hex[ascii_name] = hex_string

    return emoji_name_to_hex


def generate_move_code(viable_emojis: dict[str, EmojiData]) -> str:
    # Map the full hex string to its original unicode code point.
    original_unicode_points: dict[str, list[str]] = {}
    for data in viable_emojis.values():
        hex_str = "".join(data["code_points"]["as_hex"])
        original_unicode_points[hex_str] = data["code_points"]["as_unicode"]

    ascii_names_to_hex = to_ascii_dict(viable_emojis)

    return_open = f"{TAB*2}vector<vector<u8>> ["
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

if __name__ == "__main__":
    base_emoji_dict: dict[str, QualifiedEmojiData]
    zwj_emoji_dict: dict[str, EmojiData]

    if pathlib.Path(BASE_EMOJIS_DATA_FILE).exists():
        base_emoji_dict = json.load(open(BASE_EMOJIS_DATA_FILE, 'r'))
    else:
        base_emoji_dict = data_parser.get_base_emojis(BASE_EMOJIS_URL)
        json.dump(base_emoji_dict, open(BASE_EMOJIS_DATA_FILE, 'w'), indent=3)

    if pathlib.Path(ZWJ_EMOJIS_DATA_FILE).exists():
        zwj_emoji_dict = json.load(open(ZWJ_EMOJIS_DATA_FILE, 'r'))
    else:
        zwj_emoji_dict = data_parser.get_zwj_emojis(ZWJ_EMOJIS_URL)
        json.dump(zwj_emoji_dict, open(ZWJ_EMOJIS_DATA_FILE, 'w'), indent=3)

    symbol_emojis, extended_emojis = data_parser.get_viable_emojis(base_emoji_dict, zwj_emoji_dict)

    json.dump(symbol_emojis, open('data/viable_emojis.json', 'w'), indent=3)
    json.dump(extended_emojis, open('data/viable_emojis_extended.json', 'w'), indent=3)

    generated_code = generate_move_code({**symbol_emojis})
    fp = pathlib.Path(MOVE_CONSTS_DATA_FILE)
    pathlib.Path(fp.parent).mkdir(exist_ok=True)

    with open(fp, "w") as outfile:
        _ = outfile.write(generated_code)

    # Generate the extended emoji set Move code.
    extended_generated_code = generate_move_code(extended_emojis)
    extended_fp = pathlib.Path(MOVE_CONSTS_DATA_FILE.replace(".txt", "_extended.txt"))
    pathlib.Path(extended_fp.parent).mkdir(exist_ok=True)
    with open(extended_fp, "w") as outfile:
        _ = outfile.write(extended_generated_code)

    auxiliary_emojis = [
        ''.join(x for x in y["code_points"]['as_hex']) for y in extended_emojis.values()
    ]
    auxiliary_emojis.sort()

    with open(AUXILIARY_EMOJIS_DATA_FILE, "w") as outfile:
        json.dump(auxiliary_emojis, outfile, indent=3)
