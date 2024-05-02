# cspell:words alnum
# cspell:words codepoint
# cspell:words príncipe
# cspell:words tomé
# cspell:words unidecode

# Helper file for converting all of the data in the Unicode Emoji data files
# to Move-friendly constants.

import re
import sys
from typing import cast

import requests
from unidecode import unidecode

from data_types.type_defs import (
    CodePointInfo,
    EmojiData,
    QualificationKey,
    Qualifications,
    QualifiedEmojiData,
)
from utils import codepoint

SYMBOL_MAX_BYTES = 10


def format_code_points_for_json(code_points: list[str]) -> CodePointInfo:
    num_bytes = sum([len(codepoint.unicode_to_bytes(cp)) for cp in code_points])
    as_hex = [codepoint.unicode_to_bytes(cp).hex() for cp in code_points]
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
        line = line.replace(codepoint.unicode_to_emoji("2018"), "'")
        line = line.replace(codepoint.unicode_to_emoji("2019"), "'")
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
        qualification_string = comment_split[0].replace("-", "_")

        qualification_type = cast(QualificationKey, qualification_string)

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
) -> tuple[dict[str, EmojiData], dict[str, EmojiData]]:
    """
    Aggregates and deduplicates all emojis that are fully qualified.

    Returns a tuple of two dictionaries:
    - The first contains all fully qualified emojis less than or equal to 10 bytes.
    - The second contains all fully qualified emojis that are greater than 10 bytes.
    """

    symbol_viable_emojis: dict[str, EmojiData] = {}
    extended_viable_emojis: dict[str, EmojiData] = {}
    all_base_code_points: set[str] = set()
    for name, base_emoji_data in base_emojis.items():
        qualifications = base_emoji_data["qualifications"]
        # To avoid duplicates when iterating over the zwj emojis.
        values = cast(list[dict[str, CodePointInfo]], list(qualifications.values()))
        for q in values:
            all_base_code_points.add("".join(q["code_points"]["as_unicode"]))

        if "fully_qualified" not in qualifications:
            continue
        fully_qualified = qualifications["fully_qualified"]

        data: EmojiData = {
            "emoji": base_emoji_data["emoji"],
            "version": base_emoji_data["version"],
            "code_points": qualifications["fully_qualified"]["code_points"],
        }

        if fully_qualified["code_points"]["num_bytes"] > SYMBOL_MAX_BYTES:
            extended_viable_emojis[name] = data
        else:
            symbol_viable_emojis[name] = data

    for name, zwj_emoji_data in tuple(zwj_emojis.items()):
        code_points_string = "".join(zwj_emoji_data["code_points"]["as_unicode"])
        # Get rid of duplicates by filtering out zwj emoji sequences that
        # already exist in the base emoji set.
        if name in base_emojis or code_points_string in all_base_code_points:
            continue

        if zwj_emoji_data["code_points"]["num_bytes"] > SYMBOL_MAX_BYTES:
            extended_viable_emojis[name] = zwj_emoji_data
        else:
            symbol_viable_emojis[name] = zwj_emoji_data

    return (symbol_viable_emojis, extended_viable_emojis)


def remove_large_extended_emojis(extended_emojis: dict[str, EmojiData]):
    """
    Modifies the `extended_emojis` dict by removing the largest emojis in order to
    keep the total size of the Move code under the package byte size limit.

    Note that we do not remove any emojis that are valid symbol emojis.

    Also note that the base variations of these emojis all still exist, either as a
    symbol emoji or a chat emoji as long as they are under their respective byte limits.
    """
    largest_emojis = [
        "couple with heart",
        "kiss",
        "men holding hands",
        "people holding hands",
        "women and man holding hands",
        "women holding hands",
    ]

    # Get the keys for emojis that have a matching name and are larger than 20 bytes.
    keys = filter(
        lambda n: any(n.startswith(pre) for pre in largest_emojis)
        and extended_emojis[n]["code_points"]["num_bytes"] > 20,
        list(extended_emojis.keys()),
    )

    for k in keys:
        del extended_emojis[k]


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
