use bigdecimal::BigDecimal;
use serde::{Deserialize, Serialize};

use crate::util::{deserialize_from_string, serialize_to_string};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ExchangeRate {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote: u64,
}

impl ExchangeRate {
    pub fn price(&self) -> BigDecimal {
        BigDecimal::from(self.quote) / BigDecimal::from(self.base)
    }
}
