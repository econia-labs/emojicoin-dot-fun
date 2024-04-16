from typing import Literal, TypedDict

QualificationKey = Literal["unqualified", "minimally_qualified", "fully_qualified"]


class CodePointInfo(TypedDict):
    num_bytes: int
    as_unicode: list[str]
    as_hex: list[str]


class Qualifications(TypedDict, total=False):
    unqualified: dict[str, CodePointInfo]
    minimally_qualified: dict[str, CodePointInfo]
    fully_qualified: dict[str, CodePointInfo]


class QualifiedEmojiData(TypedDict):
    emoji: str
    version: str
    qualifications: Qualifications


class EmojiData(TypedDict):
    emoji: str
    version: str
    code_points: CodePointInfo
