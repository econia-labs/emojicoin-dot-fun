def str_to_char(code_point: str) -> str:
    """
    Convert a code_point to a character.
    Example:
    >>> str_to_char('1F600')
    '😀'
    """
    return chr(int(code_point, 16))


def str_to_bytes(code_point: str) -> bytes:
    """
    Convert a code_point to a byte array.
    Example:
    >>> str_to_bytes('1F600')
    b'\xf0\x9f\x98\x80'
    """
    return str_to_char(code_point).encode("utf-8")


def str_to_hex_string(code_point: str) -> str:
    """
    Convert a code_point to a hex string.
    Example:
    >>> str_to_hex_string('1F600')
    'f09f9880'
    """
    return str_to_bytes(code_point).hex()
