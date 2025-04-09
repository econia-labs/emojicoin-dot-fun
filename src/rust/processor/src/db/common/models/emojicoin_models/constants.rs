use super::enums::Period;
use lazy_static::lazy_static;
use std::num::NonZeroU64;

const SWAP: &str = "::emojicoin_dot_fun::Swap";
const CHAT: &str = "::emojicoin_dot_fun::Chat";
const MARKET_REGISTRATION: &str = "::emojicoin_dot_fun::MarketRegistration";
const PERIODIC_STATE: &str = "::emojicoin_dot_fun::PeriodicState";
const STATE: &str = "::emojicoin_dot_fun::State";
const GLOBAL_STATE: &str = "::emojicoin_dot_fun::GlobalState";
const LIQUIDITY: &str = "::emojicoin_dot_fun::Liquidity";
const MARKET: &str = "::emojicoin_dot_fun::Market";
const ARENA_MELEE: &str = "::emojicoin_arena::Melee";
const ARENA_ENTER: &str = "::emojicoin_arena::Enter";
const ARENA_EXIT: &str = "::emojicoin_arena::Exit";
const ARENA_SWAP: &str = "::emojicoin_arena::Swap";
const ARENA_VAULT_BALANCE_UPDATE: &str = "::emojicoin_arena::VaultBalanceUpdate";

pub const CANDLESTICK_DECIMALS: NonZeroU64 = NonZeroU64::new(16).unwrap();
pub const NORMAL_CANDLESTICK_PERIODS: [Period; 8] = [
    Period::FifteenSeconds,
    Period::OneMinute,
    Period::FiveMinutes,
    Period::FifteenMinutes,
    Period::ThirtyMinutes,
    Period::OneHour,
    Period::FourHours,
    Period::OneDay,
];
pub const ARENA_CANDLESTICK_PERIODS: [Period; 6] = [
    Period::FifteenSeconds,
    Period::OneMinute,
    Period::FiveMinutes,
    Period::FifteenMinutes,
    Period::ThirtyMinutes,
    Period::OneHour,
];

lazy_static! {
    pub static ref MODULE_ADDRESS: String = std::env::var("EMOJICOIN_MODULE_ADDRESS")
        .expect("EMOJICOIN_MODULE_ADDRESS must be set.")
        .to_owned();
    pub static ref ARENA_MODULE_ADDRESS: Option<String> =
        std::env::var("EMOJICOIN_ARENA_MODULE_ADDRESS")
            .ok()
            .to_owned();
    pub static ref SWAP_EVENT: String = MODULE_ADDRESS.to_owned() + SWAP;
    pub static ref CHAT_EVENT: String = MODULE_ADDRESS.to_owned() + CHAT;
    pub static ref MARKET_REGISTRATION_EVENT: String =
        MODULE_ADDRESS.to_owned() + MARKET_REGISTRATION;
    pub static ref PERIODIC_STATE_EVENT: String = MODULE_ADDRESS.to_owned() + PERIODIC_STATE;
    pub static ref STATE_EVENT: String = MODULE_ADDRESS.to_owned() + STATE;
    pub static ref GLOBAL_STATE_EVENT: String = MODULE_ADDRESS.to_owned() + GLOBAL_STATE;
    pub static ref LIQUIDITY_EVENT: String = MODULE_ADDRESS.to_owned() + LIQUIDITY;
    pub static ref MARKET_RESOURCE: String = MODULE_ADDRESS.to_owned() + MARKET;
    pub static ref ARENA_MELEE_EVENT: Option<String> =
        ARENA_MODULE_ADDRESS.to_owned().map(|a| a + ARENA_MELEE);
    pub static ref ARENA_ENTER_EVENT: Option<String> =
        ARENA_MODULE_ADDRESS.to_owned().map(|a| a + ARENA_ENTER);
    pub static ref ARENA_EXIT_EVENT: Option<String> =
        ARENA_MODULE_ADDRESS.to_owned().map(|a| a + ARENA_EXIT);
    pub static ref ARENA_SWAP_EVENT: Option<String> =
        ARENA_MODULE_ADDRESS.to_owned().map(|a| a + ARENA_SWAP);
    pub static ref ARENA_VAULT_BALANCE_UPDATE_EVENT: Option<String> = ARENA_MODULE_ADDRESS
        .to_owned()
        .map(|a| a + ARENA_VAULT_BALANCE_UPDATE);
}

// When a market is first registered, the market_nonce field is emitted in the resulting events as 1.
pub const INITIAL_MARKET_NONCE: u64 = 1;

#[cfg(test)]
mod tests {
    use crate::utils::util::standardize_address;

    #[test]
    fn ensure_contract_address_is_standardized() {
        if standardize_address(env!("EMOJICOIN_MODULE_ADDRESS")) != env!("EMOJICOIN_MODULE_ADDRESS")
        {
            panic!(
                "The non-standardized contract address: {} is invalid because it doesn't match the standardized address: {}",
                env!("EMOJICOIN_MODULE_ADDRESS"),
                standardize_address(env!("EMOJICOIN_MODULE_ADDRESS"))
            );
        }
    }
}
