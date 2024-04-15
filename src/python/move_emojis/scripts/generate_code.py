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


def convert_to_move_const(viable_emojis: dict[str, EmojiData]) -> dict[str, str]:
    """
    Convert all viable emojis to move constants as hex strings.

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
            elif char in [":", "-", ",", " ", "'"]:
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


if __name__ == "__main__":
    base_emoji_dict = data_parser.get_base_emojis(BASE_EMOJIS_URL)
    zwj_emoji_dict = data_parser.get_zwj_emojis(ZWJ_EMOJIS_URL)

    viable_emojis = data_parser.get_viable_emojis(
        base_emoji_dict, zwj_emoji_dict, use_minimal_if_necessary=True
    )

    consts = convert_to_move_const(viable_emojis)
    consts = dict(list(sorted(consts.items(), key=lambda x: x[0])))

    move_code = ""
    for name, move_string in consts.items():
        move_code += (
            f'const {name}: vector<u8> = x"{move_string}";\n'  # noqa: E231,E702
        )

    with open(MOVE_CONSTS_DATA_FILE, "w") as outfile:
        _ = outfile.write(move_code)
