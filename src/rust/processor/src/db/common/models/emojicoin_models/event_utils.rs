use aptos_indexer_processor_sdk::utils::convert::bigdecimal_to_u64;

use super::{
    constants::INITIAL_MARKET_NONCE,
    json_types::{BumpEvent, EventGroup, EventWithMarket, PeriodicStateEvent, StateEvent, TxnInfo},
};

impl EventWithMarket {
    pub fn get_market_id(&self) -> u64 {
        match self {
            EventWithMarket::Chat(event) => bigdecimal_to_u64(&event.market_metadata.market_id),
            EventWithMarket::Swap(event) => bigdecimal_to_u64(&event.market_id),
            EventWithMarket::State(event) => bigdecimal_to_u64(&event.market_metadata.market_id),
            EventWithMarket::Liquidity(event) => bigdecimal_to_u64(&event.market_id),
            EventWithMarket::MarketRegistration(event) => {
                bigdecimal_to_u64(&event.market_metadata.market_id)
            }
            EventWithMarket::PeriodicState(event) => {
                bigdecimal_to_u64(&event.market_metadata.market_id)
            }
        }
    }

    pub fn get_market_nonce(&self) -> u64 {
        match self {
            EventWithMarket::MarketRegistration(_) => INITIAL_MARKET_NONCE,
            EventWithMarket::Chat(event) => bigdecimal_to_u64(&event.emit_market_nonce),
            EventWithMarket::Swap(event) => bigdecimal_to_u64(&event.market_nonce),
            EventWithMarket::State(event) => bigdecimal_to_u64(&event.state_metadata.market_nonce),
            EventWithMarket::Liquidity(event) => bigdecimal_to_u64(&event.market_nonce),
            EventWithMarket::PeriodicState(event) => {
                bigdecimal_to_u64(&event.periodic_state_metadata.emit_market_nonce)
            }
        }
    }
}

// For grouping all events in a single transaction into the various types:
// Each state event has a unique bump nonce, we can use that to group events that trigger state bumps
// with the corresponding emitted StateEvent.
// The following groupings are possible:
// -- ONE market ID and ONE market nonce.
//    - ONE State Event
//    - ONE Bump Event; i.e., one of the following:
//       - Market Registration Event
//       - Chat Event
//       - Swap Event
//       - Liquidity Event
//    - ZERO to SEVEN of the following:
//       - Periodic State Events (1m, 5m, 15m, 30m, 1h, 4h, 1d)
// Note that we have no easy way of knowing for sure which state event triggered a GlobalStateEvent, because it doesn't emit
// the market_id or bump_nonce. This means we can't group GlobalStateEvents with StateEvents in an EventGroup.
#[derive(Debug)]
pub struct EventGroupBuilder {
    pub market_id: u64,
    pub market_nonce: u64,
    pub bump_event: Option<BumpEvent>,
    pub state_event: Option<StateEvent>,
    pub periodic_state_events: Vec<PeriodicStateEvent>,
    pub txn_info: TxnInfo,
}
impl EventGroupBuilder {
    pub fn new(event: EventWithMarket, txn_info: TxnInfo) -> Self {
        let mut builder = Self {
            market_id: event.get_market_id(),
            market_nonce: event.get_market_nonce(),
            bump_event: None,
            state_event: None,
            periodic_state_events: vec![],
            txn_info,
        };

        builder.add_event(event);

        builder
    }

    pub fn add_event(&mut self, event: EventWithMarket) {
        if event.get_market_id() != self.market_id || event.get_market_nonce() != self.market_nonce
        {
            let msg = "EventGroupBuilder can only have one market_id and market_nonce.";
            panic!("{msg} New event: {event:?} Initial event: {self:?}");
        }
        match event {
            EventWithMarket::MarketRegistration(e) => {
                self.add_bump(BumpEvent::MarketRegistration(e))
            }
            EventWithMarket::Chat(e) => self.add_bump(BumpEvent::Chat(e)),
            EventWithMarket::Swap(e) => self.add_bump(BumpEvent::Swap(e)),
            EventWithMarket::Liquidity(e) => self.add_bump(BumpEvent::Liquidity(e)),
            EventWithMarket::State(e) => self.add_state(e.clone()),
            EventWithMarket::PeriodicState(e) => self.add_periodic_state(e.clone()),
        }
    }

    pub fn add_bump(&mut self, bump_event: BumpEvent) {
        if self.bump_event.is_some() {
            panic!("EventGroups can only have one BumpEvent.");
        }
        self.bump_event = Some(bump_event);
    }

    pub fn add_state(&mut self, state_event: StateEvent) {
        if self.state_event.is_some() {
            panic!("EventGroups can only have one StateEvent.");
        }
        self.state_event = Some(state_event);
    }

    pub fn add_periodic_state(&mut self, periodic_state_event: PeriodicStateEvent) {
        if self.periodic_state_events.len() >= 7 {
            let msg = "EventGroups can only have up to seven PeriodicStateEvents.";
            panic!(
                "{} Existing {:?}, attempted to add: {:?}",
                msg, self.periodic_state_events, periodic_state_event
            );
        }
        self.periodic_state_events.push(periodic_state_event);
    }

    pub fn build(self) -> EventGroup {
        let bump_event = self.bump_event.expect("EventGroups must have a BumpEvent.");
        let state_event = self
            .state_event
            .expect("EventGroups must have a StateEvent.");

        EventGroup {
            market_id: self.market_id,
            market_nonce: self.market_nonce,
            bump_event,
            state_event,
            periodic_state_events: self.periodic_state_events,
            txn_info: self.txn_info,
        }
    }
}
