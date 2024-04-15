def to_emoji(code_point: str) -> str:
    """
    Convert a code_point to a character.
    Example:
    >>> str_to_char('1F600')
    '😀'
    """
    return chr(int(code_point, 16))


def to_bytes(code_point: str) -> bytes:
    """
    Convert a code_point to a byte array.
    Example:
    >>> str_to_bytes('1F600')
    b'\xf0\x9f\x98\x80'
    """
    return to_emoji(code_point).encode("utf-8")


def to_hex_str(code_point: str) -> str:
    """
    Convert a code_point to a hex string.
    Example:
    >>> str_to_hex_string('1F600')
    'f09f9880'
    """
    return to_bytes(code_point).hex()
