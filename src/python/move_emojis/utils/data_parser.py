# cspell:words codepoint

# Helper file for converting all of the data in the Unicode Emoji data files
# to Move-friendly constants.

import re
import sys
from typing import cast

import requests

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
) -> dict[str, EmojiData]:
    """
    Aggregates and deduplicates all emojis that are fully qualified.
    """

    viable_emojis: dict[str, EmojiData] = {}
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
        if fully_qualified["code_points"]["num_bytes"] > SYMBOL_MAX_BYTES:
            continue

        viable_emojis[name] = {
            "emoji": base_emoji_data["emoji"],
            "version": base_emoji_data["version"],
            "code_points": qualifications["fully_qualified"]["code_points"],
        }

    for name, zwj_emoji_data in tuple(zwj_emojis.items()):
        code_points_string = "".join(zwj_emoji_data["code_points"]["as_unicode"])
        # Get rid of duplicates by filtering out zwj emoji sequences that
        # already exist in the base emoji set.
        if name in base_emojis or code_points_string in all_base_code_points:
            continue

        viable_emojis[name] = zwj_emoji_data

    return viable_emojis
