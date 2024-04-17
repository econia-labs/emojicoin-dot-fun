# cspell:words alnum
# cspell:words unidecode

# Helper file for converting all of the data in the Unicode Emoji data files
# to Move-friendly constants.

import string
import sys

from unidecode import unidecode

import utils.data_parser as data_parser
from data_types.type_defs import EmojiData

BASE_EMOJIS_URL = "https://unicode.org/Public/emoji/15.1/emoji-test.txt"
ZWJ_EMOJIS_URL = "https://unicode.org/Public/emoji/15.1/emoji-zwj-sequences.txt"
MOVE_CONSTS_DATA_FILE = "data/move_consts.txt"
TAB = " " * 4


def to_human_readable(viable_emojis: dict[str, EmojiData]) -> dict[str, str]:
    """
    Convert all viable emojis to a dictionary of human readable names as the key
    and their hex string representations as the value.

    Returns a dictionary of the form:
    ::
        {
            "FLAG_UNITED_ARAB_EMIRATES": "f09f87a6f09f87aa",
            ...
        }

    As defined by `the data files at
    unicode.org<https://unicode.org/Public/emoji/latest/emoji-test.txt>`__,
    the emoji with the name `flag: United Arab Emirates` has the code points
    `1F1E6 1F1EA`.

    In Move, we can define this as a constant:

    `const FLAG_UNITED_ARAB_EMIRATES: vector<u8> = x\"f09f87a6f09f87aa\";`
    ::
    """
    consts: dict[str, str] = {}
    for name, data in viable_emojis.items():
        sanitized_name = ""

        # Replace characters with characters that are allowed in
        # Move variable names.
        for char in name:
            if char.isalnum() or char == "_":
                sanitized_name += char
            elif char in [":", "-", ",", " "]:
                sanitized_name += "_"
            elif char == "#":
                sanitized_name += "POUND"
            elif char == "*":
                sanitized_name += "ASTERISK"

        words = []
        if " " in sanitized_name:
            words = sanitized_name.split(" ")
        else:
            words = [sanitized_name]

        alnum_words = filter(lambda x: x.replace("_", "").isalnum(), words)
        const_name = "_".join([w.upper() for w in alnum_words])

        # Get rid of multiple underscores.
        split_underscore = filter(lambda x: len(x) > 0, const_name.split("_"))
        const_name = "_".join(split_underscore)

        if const_name and const_name[0] in string.digits:
            const_name = f"EMOJI_{const_name}"
        if len(const_name) == 0:
            print(f"ERROR: invalid constant name: {name} => {const_name}")
            sys.exit(1)
        move_string = "".join(data["code_points"]["as_hex"])
        if const_name in consts:
            print(f"ERROR: duplicate constant name: {const_name}")
            sys.exit(1)
        const_name = unidecode(const_name)
        consts[const_name] = move_string

    return consts


def generate_move_code(viable_emojis: dict[str, EmojiData]) -> str:
    # Map the full hex string to its original unicode code point.
    original_unicode_points: dict[str, list[str]] = {}
    for data in viable_emojis.values():
        hex_str = "".join(data["code_points"]["as_hex"])
        original_unicode_points[hex_str] = data["code_points"]["as_unicode"]

    consts = to_human_readable(viable_emojis)
    consts = dict(list(sorted(consts.items(), key=lambda x: x[0])))
    consts_reverse_dict = {v: k for k, v in consts.items()}
    hex_strings = list(consts.values())

    return_open = f"{TAB*2}vector<vector<u8>> ["
    # The hex bytes args, the aka vector<vector<u8>> args.
    args_and_comments: list[tuple[str, str]] = []
    for fhs in hex_strings:
        # Lookup the const name by its full hex string and split it into
        # words by the underscore.
        name_split = consts_reverse_dict[fhs].split("_")
        # Convert the name to lowercase, then capitalize the first letter.
        name = " ".join([s.lower() for s in name_split]).capitalize()
        original_unicode = original_unicode_points[fhs]
        comment = f' // {name}, {" ".join(original_unicode)}.'
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
    base_emoji_dict = data_parser.get_base_emojis(BASE_EMOJIS_URL)
    zwj_emoji_dict = data_parser.get_zwj_emojis(ZWJ_EMOJIS_URL)
    viable_emojis = data_parser.get_viable_emojis(base_emoji_dict, zwj_emoji_dict)

    generated_code = generate_move_code(viable_emojis)

    with open(MOVE_CONSTS_DATA_FILE, "w") as outfile:
        _ = outfile.write(generated_code)
