# cspell:words alnum
# cspell:words codepoint
# cspell:words unidecode

# Helper file for converting all of the data in the Unicode Emoji data files
# to Move-friendly constants.

import re
import string
import sys
from typing import cast

import requests
from unidecode import unidecode

import codepoint
from data_types import (
    CodePointInfo,
    EmojiData,
    QualificationKey,
    Qualifications,
    QualifiedEmojiData,
)

BASE_EMOJIS_URL = "https://unicode.org/Public/emoji/15.1/emoji-test.txt"
ZWJ_EMOJIS_URL = "https://unicode.org/Public/emoji/15.1/emoji-zwj-sequences.txt"

SYMBOL_MAX_BYTES = 10


def format_code_points_for_json(code_points: list[str]) -> CodePointInfo:
    num_bytes = sum([len(codepoint.to_bytes(cp)) for cp in code_points])
    as_hex = [codepoint.to_bytes(cp).hex() for cp in code_points]
    return {
        "num_bytes": num_bytes,
        "as_unicode": code_points,
        "as_hex": as_hex,
    }


def sanitized_lines(data_url: str) -> list[str]:
    data = requests.get(data_url).text.split("\n")
    lines: list[str] = []
    for line in data:
        line = line.strip()
        if len(line) < 1 or line.startswith("#"):
            continue

        # The Unicode code_points are used here so the linter
        # doesn't complain about the characters ‘ and ’.
        line = line.replace(codepoint.to_emoji("2018"), "'")
        line = line.replace(codepoint.to_emoji("2019"), "'")
        line = line.replace("“", '"')
        line = line.replace("”", '"')
        lines.append(line)
    return lines


def get_base_emojis(data_url: str) -> dict[str, QualifiedEmojiData]:
    lines = sanitized_lines(data_url)

    emoji_pattern = r"(.+)"
    version_pattern = r"(E[0-9.]+)"
    name_pattern = r"(.+)"
    comment_pattern = rf"{emoji_pattern}\s+{version_pattern}\s+{name_pattern}"
    comment_regex = re.compile(comment_pattern)

    d: dict[str, QualifiedEmojiData] = {}
    for line in lines:
        semicolon_split = [s.strip() for s in line.split(";")]
        # Order matters for code_points.
        code_points = semicolon_split[0].split(" ")
        comment_split = [s.strip() for s in semicolon_split[1].split("#", 1)]

        qualification_type = cast(QualificationKey, comment_split[0])

        comment = comment_split[1]
        matches = comment_regex.match(comment)
        if matches is None or len(matches.groups()) != 3:
            print(f"ERROR: malformed line: {line}")
            sys.exit(1)
        emoji, version, name = matches.groups()

        if name in d:
            d[name]["qualifications"][qualification_type] = {
                "code_points": format_code_points_for_json(code_points)
            }
        else:
            d[name] = {
                "emoji": emoji,
                "version": version,
                "qualifications": cast(
                    Qualifications,
                    {
                        qualification_type: {
                            "code_points": format_code_points_for_json(code_points)
                        }
                    },
                ),
            }

    return d


def get_zwj_emojis(data_url: str) -> dict[str, EmojiData]:
    lines = sanitized_lines(data_url)

    patterns = [
        # Version.
        r"(E[0-9.]+)",
        # Number of variations.
        r"(\[\d+\])",
        # Emoji.
        r"\((.+)\)",
    ]
    # Note the possibly optional space between version and num_variations.
    comment_pattern = rf"{patterns[0]}\s*{patterns[1]}\s+{patterns[2]}"
    comment_regex = re.compile(comment_pattern)

    d: dict[str, EmojiData] = {}
    for line in lines:
        semicolon_split = [s.strip() for s in line.split(";")]
        # Order matters for code_points.
        code_points = semicolon_split[0].split(" ")
        # Ignore the `RGI_Emoji_ZWJ_Sequence` in the middle,
        # then split by the comment.
        comment_split = [s.strip() for s in semicolon_split[2].split("#", 1)]
        name = comment_split[0]
        comment = comment_split[1]
        matches = comment_regex.match(comment)

        if matches is None or len(matches.groups()) != 3:
            print(f"ERROR: malformed line: {line}")
            sys.exit(1)

        version, _, emoji = matches.groups()

        if name in d:
            print(f"ERROR: duplicate name: {name}")
            sys.exit(1)
        d[name] = cast(
            EmojiData,
            {
                "emoji": emoji,
                "version": version,
                "code_points": format_code_points_for_json(code_points),
            },
        )
    return d


def get_viable_emojis(
    base_emojis: dict[str, QualifiedEmojiData],
    zwj_emojis: dict[str, EmojiData],
    use_minimal_if_necessary: bool = False,
) -> dict[str, EmojiData]:
    """
    Two important distinctions to make for the base emojis:
    1. Fully-qualified emojis have a terminating code_point that isn't
       completely necessary: `FE0F`. This is a variation selector that
       is used to specify that the emoji should be displayed as an emoji.
    2. We can opt in to using unqualified and minimally-qualified emojis
       if the emoji is too large.
    """

    viable_emojis: dict[str, EmojiData] = {}
    all_base_code_points: set[str] = set()
    for name, base_emoji_data in base_emojis.items():
        qualifications = base_emoji_data["qualifications"]
        # To avoid duplicates when iterating over the zwj emojis.
        values = cast(list[dict[str, CodePointInfo]], list(qualifications.values()))
        for q in values:
            all_base_code_points.add("".join(q["code_points"]["as_unicode"]))

        # Sort by the number of bytes in the code_points, ascending.
        keys = qualifications.keys()

        sorted_qualifications = list(
            sorted(
                zip(keys, values),
                key=lambda x: x[1]["code_points"]["num_bytes"],
                reverse=False,
            )
        )

        if sorted_qualifications[-1][1]["code_points"]["num_bytes"] > SYMBOL_MAX_BYTES:
            pass
            # If the biggest emoji is too large and we don't want to try to
            # use another variation with looser qualifications, we continue.
            if not use_minimal_if_necessary:
                continue

        # If the biggest emoji is too large, we can use the minimal
        # qualification type that is still viable.
        # We sort by the number of bytes in the code_points, largest first.
        # Then we pop from the list until we find a viable qualification.
        largest_viable_qualification = None
        while sorted_qualifications:
            _, v = sorted_qualifications.pop()
            if v["code_points"]["num_bytes"] <= SYMBOL_MAX_BYTES:
                largest_viable_qualification = v

        # If any of the qualifications are small enough, we can use them.
        if largest_viable_qualification is not None:
            viable_emojis[name] = {
                "emoji": base_emoji_data["emoji"],
                "version": base_emoji_data["version"],
                "code_points": largest_viable_qualification["code_points"],
            }

    for name, zwj_emoji_data in tuple(zwj_emojis.items()):
        code_points_string = "".join(zwj_emoji_data["code_points"]["as_unicode"])
        # Get rid of duplicates by filtering out zwj emoji sequences that
        # already exist in the base emoji set.
        if name in base_emojis or code_points_string in all_base_code_points:
            continue

        viable_emojis[name] = zwj_emoji_data

    return viable_emojis


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
    base_emoji_dict = get_base_emojis(BASE_EMOJIS_URL)
    zwj_emoji_dict = get_zwj_emojis(ZWJ_EMOJIS_URL)

    viable_emojis = get_viable_emojis(
        base_emoji_dict, zwj_emoji_dict, use_minimal_if_necessary=True
    )

    consts = convert_to_move_const(viable_emojis)
    consts = dict(list(sorted(consts.items(), key=lambda x: x[0])))
    with open("move_consts.txt", "w") as outfile:
        for name, move_string in consts.items():
            _ = outfile.write(f'const {name}: vector<u8> = x"{move_string}";\n')
