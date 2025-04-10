use super::{
    emoji_data::{
        emoji_data_test_helpers::{get_all_possible_symbol_emojis, permutations_with_repetition},
        get_emojis_by_num_bytes, get_sorted_symbol_lengths,
    },
    parser::symbol_bytes_to_emojis,
};
use itertools::Itertools;

#[test]
fn test_permutations_with_repetition() {
    let numbers = vec![1, 2, 3];
    let res = permutations_with_repetition(&numbers, 3);
    let mut s = String::from("");
    s.push_str("111,211,311,121,");
    s.push_str("221,321,131,231,");
    s.push_str("331,112,212,312,");
    s.push_str("122,222,322,132,");
    s.push_str("232,332,113,213,");
    s.push_str("313,123,223,323,");
    s.push_str("133,233,333");
    assert_eq!(s, res.iter().map(|v| v.iter().join("")).join(","));
}

#[test]
fn test_permutations_with_repetition_of_varying_lengths() {
    let numbers = vec![1, 2, 3];

    let res_1 = permutations_with_repetition(&numbers, 1)
        .iter()
        .map(|v| v.iter().join(""))
        .join(",");
    let res_2 = permutations_with_repetition(&numbers, 2)
        .iter()
        .map(|v| v.iter().join(""))
        .join(",");
    let res_3 = permutations_with_repetition(&numbers, 3)
        .iter()
        .map(|v| v.iter().join(""))
        .join(",");

    let res = [res_1, res_2, res_3].concat();
    let mut s = String::from("");
    s.push_str("1,2,3");
    s.push_str("11,21,31,12,22,32,13,23,33");
    s.push_str("111,211,311,121,");
    s.push_str("221,321,131,231,");
    s.push_str("331,112,212,312,");
    s.push_str("122,222,322,132,");
    s.push_str("232,332,113,213,");
    s.push_str("313,123,223,323,");
    s.push_str("133,233,333");
    assert_eq!(s, res);
}

#[test]
fn test_get_num_possible_symbols() {
    let tuples: Vec<Vec<usize>> = vec![
        vec![3],
        vec![4],
        vec![5],
        vec![6],
        vec![7],
        vec![8],
        vec![10],
        vec![3, 3],
        vec![4, 3],
        vec![5, 3],
        vec![6, 3],
        vec![7, 3],
        vec![3, 4],
        vec![4, 4],
        vec![5, 4],
        vec![6, 4],
        vec![3, 5],
        vec![4, 5],
        vec![5, 5],
        vec![3, 6],
        vec![4, 6],
        vec![3, 7],
        vec![3, 3, 3],
        vec![4, 3, 3],
        vec![3, 4, 3],
        vec![3, 3, 4],
    ];

    let sum = tuples
        .into_iter()
        .map(|tuple| {
            tuple
                .into_iter()
                .map(|val| get_emojis_by_num_bytes(val).unwrap().len())
                .product::<usize>()
        })
        .sum::<usize>();

    let total_possible_symbols = get_all_possible_symbol_emojis().len();

    assert_eq!(sum, total_possible_symbols);
}

// WARNING: This test takes a few minutes to run.
#[test]
fn test_match_all_possible_symbols() {
    let mut lengths_desc = get_sorted_symbol_lengths()
        .clone()
        .into_iter()
        .collect::<Vec<_>>();
    lengths_desc.sort_by(|a, b| b.cmp(a));

    let all_symbols = get_all_possible_symbol_emojis();

    for symbol in all_symbols.into_iter() {
        let symbol_emojis = symbol_bytes_to_emojis(symbol.as_bytes());
        let matched_symbol = symbol_emojis.join("");

        assert_eq!(
            symbol, matched_symbol,
            "Expected {:?}, parsed: {:?}",
            symbol, matched_symbol
        );
    }
}
