# cspell:words unidecode
# cspell:words alnum

# Helper file for converting all of the data in the Unicode Emoji data files
# to json files.

import json
import re
import string
import sys

from unidecode import unidecode

import code_point

BASE_EMOJI_DATA_PATH = "data/emoji-test.txt"
VIABLE_EMOJI_JSON_PATH = "data/viable_emojis.json"
ZWJ_EMOJIS_DATA_PATH = "data/emoji-zwj-sequences.txt"

# In bytes.
MAX_SYMBOL_SIZE = 10

DEBUG = False


def debug_print(*args, **kwargs):
    if DEBUG:
        print("[DEBUG]:", *args, **kwargs)


def format_code_points_for_json(code_points: list) -> dict:
    num_bytes = sum([len(code_point.str_to_bytes(cp)) for cp in code_points])
    as_hex = [code_point.str_to_bytes(cp).hex() for cp in code_points]
    return {
        "num_bytes": num_bytes,
        "as_unicode": code_points,
        "as_hex": as_hex,
    }


def sanitized_lines(filename: str) -> list:
    lines = []
    with open(filename) as in_file:
        for line in in_file.readlines():
            line = line.strip()
            if len(line) < 1 or line.startswith("#"):
                continue

            # Replace ‘ and ’ by using unicode code_points
            # so the linter doesn't complain.
            line = line.replace(code_point.str_to_char("2018"), "'")
            line = line.replace(code_point.str_to_char("2019"), "'")
            line = line.replace("“", '"')
            line = line.replace("”", '"')
            lines.append(line)
    return lines


def get_base_emojis(filename: str) -> dict:
    lines = sanitized_lines(filename)

    emoji_pattern = r"(.+)"
    version_pattern = r"(E[0-9.]+)"
    name_pattern = r"(.+)"
    comment_pattern = rf"{emoji_pattern}\s+{version_pattern}\s+{name_pattern}"
    comment_regex = re.compile(comment_pattern)

    d: dict = {}
    for line in lines:
        semicolon_split = [s.strip() for s in line.split(";")]
        # Order matters for code_points.
        code_points = semicolon_split[0].split(" ")
        comment_split = [s.strip() for s in semicolon_split[1].split("#", 1)]

        qualification = comment_split[0]

        comment = comment_split[1]
        matches = comment_regex.match(comment)
        if matches is None or len(matches.groups()) != 3:
            print(f"ERROR: malformed line: {line}")
            sys.exit(1)
            continue
        emoji, version, name = matches.groups()

        emoji_entry = d.get(name, {})
        existing_qualifications = emoji_entry.get("qualifications", {})
        emoji_entry = {
            "emoji": emoji,
            "version": version,
            "qualifications": {
                **existing_qualifications,
                qualification: {
                    "code_points": format_code_points_for_json(code_points)
                },
            },
        }
        d[name] = emoji_entry
    return d


def get_zwj_emojis(filename: str) -> dict:
    lines = sanitized_lines(filename)

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

    d: dict = {}
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
            continue
        version, num_variations, emoji = matches.groups()

        if name in d:
            print(f"ERROR: duplicate name: {name}")
            sys.exit(1)
        d[name] = {
            "emoji": emoji,
            "version": version,
            "code_points": format_code_points_for_json(code_points),
        }
    return d


# Two important distinctions to make for the base emojis:
# 1. Fully-qualified emojis have a terminating code_point that isn't
#    completely necessary: `FE0F`. This is a variation selector that
#    is used to specify that the emoji should be displayed as an emoji.
# 2. We can opt in to using unqualified and minimally-qualified emojis
#    if the emoji is too large.
def get_viable_emojis(
    base_emojis: dict,
    zwj_emojis: dict,
    use_minimal_if_necessary: bool = False,
):
    # Get rid of duplicates by filtering out zwj emoji sequences that
    # already exist in the base emoji set.
    viable_emojis = {}
    all_base_code_points = set()
    for name, data in base_emojis.items():
        qualifications = data["qualifications"]
        # To avoid duplicates when iterating over the zwj emojis.
        for qualification in qualifications.values():
            all_base_code_points.add(
                "".join(qualification["code_points"]["as_unicode"])
            )

        # Sort by the number of bytes in the code_points, ascending.
        qualifications = list(
            sorted(
                qualifications.items(),
                key=lambda x: x[1]["code_points"]["num_bytes"],
                reverse=False,
            )
        )

        biggest_is_too_large = False
        if qualifications[-1][1]["code_points"]["num_bytes"] > MAX_SYMBOL_SIZE:
            biggest_is_too_large = True
            if not use_minimal_if_necessary:
                debug_print(
                    f"'{name}' is too large to be used and "
                    + "`use_minimum_if_necessary` is off."
                )
                continue

        # If the biggest emoji is too large, we can use the minimal
        # qualification type that is still viable.
        # We sort by the number of bytes in the code_points, largest first.
        # Then we pop from the list until we find a viable qualification.
        largest_viable_qualification_type = None
        largest_viable_qualification = None
        while qualifications:
            k, v = qualifications.pop()
            if v["code_points"]["num_bytes"] <= MAX_SYMBOL_SIZE:
                largest_viable_qualification_type = k
                largest_viable_qualification = v

        if largest_viable_qualification is not None:
            if biggest_is_too_large:
                debug_print(
                    "Using minimal qualification for emoji:",
                    name,
                    largest_viable_qualification["code_points"]["num_bytes"],
                )

            viable_emojis[name] = {
                "emoji": data["emoji"],
                "version": data["version"],
                "qualification": largest_viable_qualification_type,
                "zwj": False,
                **largest_viable_qualification,
            }
        else:
            debug_print(f"'{name}' is too large to be used.")

    for name, data in tuple(zwj_emojis.items()):
        code_points = data["code_points"]["as_unicode"]
        if name in base_emojis or "".join(code_points) in all_base_code_points:
            continue

        viable_emojis[name] = {
            "emoji": data["emoji"],
            "version": data["version"],
            "qualification": None,
            "zwj": True,
            **data["code_points"],
        }
    return viable_emojis


# Convert all viable emojis to move constants as hex strings.
def convert_to_move_const(viable_emojis: dict):
    consts = {}
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
    base_emoji_dict = get_base_emojis(BASE_EMOJI_DATA_PATH)
    zwj_emoji_dict = get_zwj_emojis(ZWJ_EMOJIS_DATA_PATH)

    viable_emojis = get_viable_emojis(
        base_emoji_dict, zwj_emoji_dict, use_minimal_if_necessary=True
    )
    json.dump(viable_emojis, open(VIABLE_EMOJI_JSON_PATH, "w"), indent=4)

    consts = convert_to_move_const(viable_emojis)
    with open("move_consts.txt", "w") as outfile:
        for name, move_string in consts.items():
            outfile.write(f'const {name}: vector<u8> = b"{move_string}";\n')

    # viable_emojis = get_viable_emojis()
