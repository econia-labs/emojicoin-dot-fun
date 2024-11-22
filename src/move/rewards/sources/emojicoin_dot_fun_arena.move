module rewards::emojicoin_dot_fun_arena {

    use emojicoin_dot_fun::emojicoin_dot_fun::{Self, MarketView};
    use std::option::{Self, Option};

    struct Melee {
        markets: vector<address>,
        start_time: u64,
        n_participants: u64,
        market_views_at_start: vector<MarketView>,
        market_views_at_end: Option<vector<MarketView>>
    }
}
