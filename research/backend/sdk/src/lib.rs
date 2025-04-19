use arena::events::ArenaEvent;
use emojicoin::events::EmojicoinEvent;
use favorites::events::Favorite;
use serde::{Deserialize, Serialize};
use util::Addresses;

pub mod arena;
pub mod consts;
pub mod emojicoin;
pub mod favorites;
pub mod scn;
pub mod util;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum Event {
    Arena(ArenaEvent),
    Emojicoin(EmojicoinEvent),
    Favorites(Favorite),
}

impl Event {
    pub fn from_with_addresses(
        event: aptos_protos::transaction::v1::Event,
        addresses: &Addresses,
    ) -> Result<Option<Self>, serde_json::Error> {
        let Some((address, rest)) = event.type_str.split_once("::") else {
            return Ok(None);
        };
        let Some((module, event_type)) = rest.split_once("::") else {
            return Ok(None);
        };

        let event = if addresses
            .emojicoin_dot_fun
            .as_ref()
            .is_some_and(|a| a == address)
            && module == emojicoin::MODULE_NAME
        {
            let event = match event_type {
                "GlobalState" => {
                    let event =
                        serde_json::de::from_str::<emojicoin::events::GlobalState>(&event.data)?;
                    EmojicoinEvent::GlobalState(event)
                }
                "State" => {
                    let event = serde_json::de::from_str::<emojicoin::events::State>(&event.data)?;
                    EmojicoinEvent::State(event)
                }
                "PeriodicState" => {
                    let event =
                        serde_json::de::from_str::<emojicoin::events::PeriodicState>(&event.data)?;
                    EmojicoinEvent::PeriodicState(event)
                }
                "MarketRegistration" => {
                    let event = serde_json::de::from_str::<emojicoin::events::MarketRegistration>(
                        &event.data,
                    )?;
                    EmojicoinEvent::MarketRegistration(event)
                }
                "Swap" => {
                    let event = serde_json::de::from_str::<emojicoin::events::Swap>(&event.data)?;
                    EmojicoinEvent::Swap(event)
                }
                "Chat" => {
                    let event = serde_json::de::from_str::<emojicoin::events::Chat>(&event.data)?;
                    EmojicoinEvent::Chat(event)
                }
                "Liquidity" => {
                    let event =
                        serde_json::de::from_str::<emojicoin::events::Liquidity>(&event.data)?;
                    EmojicoinEvent::Liquidity(event)
                }
                _ => {
                    return Ok(None);
                }
            };
            Event::Emojicoin(event)
        } else if addresses.arena.as_ref().is_some_and(|a| a == address)
            && module == arena::MODULE_NAME
        {
            let event = match event_type {
                "Melee" => {
                    let event = serde_json::de::from_str::<arena::events::Melee>(&event.data)?;
                    ArenaEvent::Melee(event)
                }
                "Enter" => {
                    let event = serde_json::de::from_str::<arena::events::Enter>(&event.data)?;
                    ArenaEvent::Enter(event)
                }
                "Exit" => {
                    let event = serde_json::de::from_str::<arena::events::Exit>(&event.data)?;
                    ArenaEvent::Exit(event)
                }
                "Swap" => {
                    let event = serde_json::de::from_str::<arena::events::Swap>(&event.data)?;
                    ArenaEvent::Swap(event)
                }
                "VaultBalanceUpdate" => {
                    let event =
                        serde_json::de::from_str::<arena::events::VaultBalanceUpdate>(&event.data)?;
                    ArenaEvent::VaultBalanceUpdate(event)
                }
                _ => {
                    return Ok(None);
                }
            };
            Event::Arena(event)
        } else if addresses.favorites.as_ref().is_some_and(|a| a == address)
            && module == favorites::MODULE_NAME
        {
            let event = match event_type {
                "Favorite" => serde_json::de::from_str::<favorites::events::Favorite>(&event.data)?,
                _ => {
                    return Ok(None);
                }
            };
            Event::Favorites(event)
        } else {
            return Ok(None);
        };
        Ok(Some(event))
    }
}
