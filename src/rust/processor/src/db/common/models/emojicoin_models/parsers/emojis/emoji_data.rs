use itertools::Itertools;
use once_cell::sync::Lazy;
use serde::Deserialize;
use std::collections::{HashMap, HashSet};

#[derive(Deserialize)]
struct EmojiMap(#[serde(with = "emoji_json")] HashSet<String>);

mod emoji_json {
    use serde::Deserialize;
    use std::collections::HashSet;

    pub fn deserialize<'de, D>(deserializer: D) -> Result<HashSet<String>, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let string_map = HashSet::<String>::deserialize(deserializer)?;
        Ok(string_map)
    }
}

// Where CARGO_MANIFEST_DIR == src/rust/processor/rust/processor.
const EMOJI_JSON: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/src/db/common/models/emojicoin_models/parsers/emojis/symbol-emojis.json"
));

static SYMBOL_EMOJIS: Lazy<HashSet<String>> = Lazy::new(|| {
    let msg = concat!(
        "Should be able to parse the emoji map at ",
        env!("CARGO_MANIFEST_DIR"),
        "/src/db/common/models/emojicoin_models/parsers/emojis/symbol-emojis.json"
    );
    let emoji_map: EmojiMap = serde_json::from_str(EMOJI_JSON).expect(msg);

    HashSet::from_iter(emoji_map.0)
});

static EMOJI_DICTIONARY_BY_NUM_BYTES: Lazy<HashMap<usize, HashSet<Vec<u8>>>> = Lazy::new(|| {
    get_symbol_emojis()
        .iter()
        .map(|e| {
            let emoji_bytes: Vec<u8> = e.as_bytes().to_vec();
            (emoji_bytes.len(), emoji_bytes)
        })
        .into_group_map()
        .into_iter()
        .map(|(length, emojis)| (length, HashSet::from_iter(emojis)))
        .collect()
});

static UNIQUE_SYMBOL_LENGTHS_DESC: Lazy<Vec<usize>> = Lazy::new(|| {
    let mut lengths_desc = EMOJI_DICTIONARY_BY_NUM_BYTES.keys().cloned().collect_vec();
    lengths_desc.sort_by(|a, b| b.cmp(a));
    lengths_desc
});

// Unique, individual emojis that are valid as parts of a full symbol.
pub fn get_symbol_emojis() -> &'static HashSet<String> {
    &SYMBOL_EMOJIS
}

// The various unique lengths that a symbol can be, based on the list of valid symbol emojis.
// Sorted in descending order of length.
pub fn get_sorted_symbol_lengths() -> Vec<usize> {
    UNIQUE_SYMBOL_LENGTHS_DESC.clone()
}

pub fn get_emojis_by_num_bytes(length: usize) -> Option<&'static HashSet<Vec<u8>>> {
    EMOJI_DICTIONARY_BY_NUM_BYTES.get(&length)
}

#[cfg(test)]
pub mod emoji_data_test_helpers {
    use super::{get_emojis_by_num_bytes, get_sorted_symbol_lengths};
    use itertools::Itertools;
    use std::collections::HashMap;

    const MAX_SYMBOL_LENGTH: usize = 10;

    // Retrieve all the valid tuples of symbol emoji lengths.
    // That is, (3,), (3, 3), (3, 3, 3), (3, 3, 4), etc.
    // Only tuples whose sums are under MAX_SYMBOL_LENGTH bytes are returned.
    pub fn get_all_valid_symbol_length_tuples() -> Vec<Vec<usize>> {
        let mut lengths = get_sorted_symbol_lengths().iter().copied().collect_vec();
        lengths.sort();
        let max_elements = MAX_SYMBOL_LENGTH / lengths.iter().min().unwrap();
        let mut res = vec![];

        for i in 1..=max_elements {
            for perm in permutations_with_repetition(&lengths, i) {
                let sum = perm.iter().sum::<usize>();
                if sum <= MAX_SYMBOL_LENGTH {
                    res.push(perm);
                }
            }
        }
        res
    }

    pub fn permutations_with_repetition(elements: &[usize], length: usize) -> Vec<Vec<usize>> {
        if length == 0 {
            return vec![vec![]];
        }
        let mut result = Vec::new();
        for &e in elements {
            for mut v in permutations_with_repetition(elements, length - 1) {
                v.push(e);
                result.push(v);
            }
        }
        result
    }

    /// To calculate all possible `emojicoin-dot-fun` symbols up to a total of 10 bytes, we utilize
    /// a bottoms-up dynamic programming solution- more specifically, a non-recursive solution.
    ///
    /// The `tuples` below refer to the valid combination of various emoji lengths to form a whole
    /// symbol. That is, a tuple of (3, 4, 3) would indicate a symbol with an emoji of length 3, 4,
    /// and 3, in that order. The tuples represent all combinations of 3-byte, 4-byte, and 3-byte
    /// emojis as symbols. The various combinations are fairly trivial to calculate manually, but
    /// this was created with the possibility of a more expansive set of emojis down the road, or
    /// even as an exhaustive set of all emojis to test a more general rust-based emoji pattern
    /// matcher.
    ///
    /// An example of how it works:
    /// If the total valid tuples were (3,), (3, 4), and (3, 4, 5), and we had a dictionary
    /// `emojis` such that `emojis[3] => [...all_3_byte_emojis]`, then we'd process it by
    /// first getting all 3-length symbol emojis, storing them in the `symbols_by_tuple` map below,
    /// then processing (3, 4) and then (3, 4, 5).
    /// In pseudo-code, where we rename `symbols_by_tuple` to `symbols` here for brevity:
    /// ```rust
    /// symbols[(3)] = emojis[3]                         // base case
    /// symbols[(4)] = emojis[4]                         // base case
    /// symbols[(3, 4)] = symbols[(3)] X symbols[(4)]
    /// symbols[(3, 4, 5)] = symbols[(3)] X symbols[(4)] X symbols[(5)]
    /// ```
    /// and so on and so forth...
    ///
    pub fn get_all_possible_symbol_emojis() -> Vec<String> {
        let mut tuples = get_all_valid_symbol_length_tuples();
        // Sort by length, ascending, so we process smaller ones first and build it up.
        // This is a dynamic programming solution, specifically a `bottoms-up` solution that doesn't
        // rely on recursion.
        tuples.sort_by_key(|a| a.len());

        let mut symbols_by_tuple: HashMap<String, Vec<String>> = HashMap::new();
        symbols_by_tuple.insert(to_tuple_string(vec![].as_slice()), vec![]);
        for tuple in tuples {
            // Store 1-emoji tuples immediately, as the base case in our bottoms-up solution.
            // These come from the `symbol-emojis.json` data.
            if tuple.len() == 1 {
                let symbol_length = tuple.first().unwrap().to_owned();
                symbols_by_tuple.insert(
                    symbol_length.to_string(),
                    get_string_emojis_by_bytes(symbol_length),
                );
                continue;
            };

            let (first, rest_of_tuple) = if let Some(split) = tuple.split_first() {
                (split.0, split.1)
            } else {
                continue;
            };

            // If we have a tuple (3, 4, 5):
            //   1. Get all symbols with a byte length of three: (3,).
            //   2. Get all permutations of symbols with constituent emoji lengths (4, 5).
            //   3. Get all permutations of (3,)s with (4, 5)s.
            //   4. Concatenate the result and set it as the entry for (3, 4, 5).
            // For ease of understanding, there is simple python-like pseudocode written.
            // Using the above example, you can imagine (3, 4, 5) is (a, b, c).

            // singles = symbols_by_tuple[(a)]
            let singles = symbols_by_tuple
                .get(&first.to_string())
                .expect("Should exist from the base case.");

            // multiples = symbols_by_tuple[(b, c)]
            let multiples = symbols_by_tuple
                .get(&to_tuple_string(rest_of_tuple))
                .expect("Should exist because we built all tuples bottoms-up.");

            // flattened = [f"{a}{b,c}", f"{a}{c,b}"]
            let mut flattened = vec![];
            for single in singles {
                for multiple in multiples {
                    let mut new_symbol = single.clone();
                    new_symbol.push_str(multiple);
                    flattened.push(new_symbol.clone());
                }
            }
            // symbols_by_tuple[(a, b, c)] = flattened
            symbols_by_tuple.insert(to_tuple_string(tuple.as_slice()), flattened);
        }

        let mut final_flattened: Vec<String> = vec![];
        for tuple_values in symbols_by_tuple.values() {
            final_flattened.extend_from_slice(tuple_values.as_slice());
        }

        final_flattened
    }

    pub fn to_tuple_string(arg: &[usize]) -> String {
        arg.iter().join(", ")
    }

    pub fn get_string_emojis_by_bytes(length: usize) -> Vec<String> {
        let emoji_set_bytes =
            get_emojis_by_num_bytes(length).expect("Should always pass a valid value here");
        let emoji_vec_bytes = emoji_set_bytes
            .iter()
            .map(|v| {
                std::str::from_utf8(v)
                    .expect("Should be all valid")
                    .to_string()
            })
            .collect_vec();
        emoji_vec_bytes
    }
}
