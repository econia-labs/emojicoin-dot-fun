use super::emoji_data::{get_emojis_by_num_bytes, get_sorted_symbol_lengths};
use itertools::Itertools;

// Parses a sequence of bytes to separate symbol emojis as a vector of `String` values.
pub fn symbol_bytes_to_emojis(symbol_bytes: &[u8]) -> Vec<String> {
    let mut remaining = symbol_bytes;
    let mut symbol_emojis = vec![];

    while !remaining.is_empty() {
        // Match by the longest match.
        for length in get_sorted_symbol_lengths() {
            if length > remaining.len() {
                continue;
            }
            let emojis = get_emojis_by_num_bytes(length).unwrap();
            if let Some(emoji_bytes) = emojis.get(&remaining[0..length].to_vec()) {
                let emoji = std::str::from_utf8(emoji_bytes).unwrap().to_string();
                symbol_emojis.push(emoji);
                remaining = &remaining[length..];
                break;
            }
        }
    }

    debug_assert!(
        remaining.is_empty(),
        "There should be 0 bytes left in the symbol bytes vector. There are {:?} bytes remaining.",
        remaining.len(),
    );

    debug_assert_eq!(
        std::str::from_utf8(symbol_bytes).unwrap().to_string(),
        symbol_emojis.iter().join(""),
        "The original symbol bytes do not match the output symbol emojis. Expected {:?}, got {:?}",
        std::str::from_utf8(symbol_bytes).unwrap().to_string(),
        symbol_emojis.iter().join(""),
    );

    symbol_emojis
}
