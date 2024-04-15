def unicode_to_emoji(code_point: str) -> str:
    """
    Convert a code_point to a character.
    Example:
    >>> unicode_to_emoji('1F600')
    '😀'
    """
    return chr(int(code_point, 16))


def unicode_to_bytes(code_point: str) -> bytes:
    """
    Convert a code_point to a byte array.
    Example:
    >>> unicode_to_bytes('1F600')
    b'\xf0\x9f\x98\x80'
    """
    return unicode_to_emoji(code_point).encode("utf-8")


def unicode_to_hex_str(code_point: str) -> str:
    """
    Convert a code_point to a hex string.
    Example:
    >>> unicode_to_hex_str('1F600')
    'f09f9880'
    """
    return unicode_to_bytes(code_point).hex()


def decode_to_emoji(hex_string: str | bytes) -> str:
    """
    Convert a hex string to a character.
    Example:
    >>> decode_to_emoji('f09f9880')
    '😀'
    """
    if type(hex_string) == str:
        return bytes.fromhex(hex_string).decode("utf-8")
    if isinstance(hex_string, bytes):
        return hex_string.decode("utf-8")
    raise ValueError("Invalid type for hex_string")
