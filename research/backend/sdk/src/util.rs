use std::str::FromStr;

use bigdecimal::BigDecimal;
use serde::{Deserialize, Deserializer, Serializer};
use serde_json::{Value, json};

#[derive(Clone)]
pub struct Addresses {
    pub emojicoin_dot_fun: Option<String>,
    pub arena: Option<String>,
    pub favorites: Option<String>,
}

impl Addresses {
    pub fn contains(&self, address: &String) -> bool {
        self.emojicoin_dot_fun
            .as_ref()
            .is_some_and(|a| a == address)
            || self.arena.as_ref().is_some_and(|a| a == address)
            || self.favorites.as_ref().is_some_and(|a| a == address)
    }
}

pub fn unq64(q64: u128) -> BigDecimal {
    BigDecimal::from(q64) / 2u128.pow(64)
}

/// Serialize to string from type T
pub fn serialize_to_string<S, T>(element: &T, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
    T: std::fmt::Display,
{
    s.serialize_str(&element.to_string())
}

/// Deserialize from string to type T
pub fn deserialize_from_string<'de, D, T>(deserializer: D) -> Result<T, D::Error>
where
    D: Deserializer<'de>,
    T: FromStr,
    <T as FromStr>::Err: std::fmt::Display,
{
    use serde::de::Error;

    let s = <String>::deserialize(deserializer)?;
    s.parse::<T>().map_err(D::Error::custom)
}

pub fn serialize_bytes_to_string<S>(element: &Vec<u8>, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let mut res = String::from("0x");
    for byte in element {
        res = format!("{res}{byte:x}");
    }
    s.serialize_str(&res)
}

pub fn deserialize_bytes_from_string<'de, D>(deserializer: D) -> Result<Vec<u8>, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::Error;

    let s = <String>::deserialize(deserializer)?;

    let (_0x, bytes) = s
        .split_at_checked(2)
        .ok_or_else(|| D::Error::custom("Invalid bytes input."))?;
    if bytes.len() % 2 != 0 {
        return Err(D::Error::custom("Invalid bytes input."));
    }

    let mut res = vec![];
    let mut prev_char = '_';
    for (index, char) in bytes.chars().enumerate() {
        if index % 2 == 0 {
            prev_char = char;
        } else {
            let byte =
                u8::from_str_radix(&format!("{prev_char}{char}"), 16).map_err(D::Error::custom)?;
            res.push(byte);
        }
    }

    Ok(res)
}

pub fn serialize_to_aggregator<S, T>(element: &T, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
    T: std::fmt::Display,
{
    let aggregator = json!({
        "value": element.to_string(),
    });
    s.serialize_str(&aggregator.to_string())
}

pub fn deserialize_from_aggregator<'de, D, T>(deserializer: D) -> Result<T, D::Error>
where
    D: Deserializer<'de>,
    T: FromStr,
    <T as FromStr>::Err: std::fmt::Display,
{
    use serde::de::Error;

    let aggregator = <Value>::deserialize(deserializer)?;

    let err = || D::Error::custom("Invalid JSON for aggregator.");
    let value = aggregator.get("value").ok_or_else(err)?;
    value
        .as_str()
        .ok_or_else(err)?
        .parse::<T>()
        .map_err(D::Error::custom)
}
