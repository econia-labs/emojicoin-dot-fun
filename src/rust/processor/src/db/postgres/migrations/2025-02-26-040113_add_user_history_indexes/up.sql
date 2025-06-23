-- Your SQL goes here

ALTER TABLE chat_events
    ADD COLUMN event_index BIGINT NOT NULL;
ALTER TABLE market_registration_events
    ADD COLUMN event_index BIGINT NOT NULL;
    
-- Why use "sender" and not the event emitted address? Explained below.
--
-- For these indexes, "sender" is used as the representation of a user instead
-- of the emitted fields that represent the interacting account's address;
-- i.e., the "swapper", "user", "provider", and "registrant". 
--
-- Most often, these two fields match; however, objects and resource accounts
-- are often used in place of the transaction "sender" account as a proxy to
-- interact with the module, meaning that the actual user intending to
-- interact with the module is often only the "sender" and *not*` the
-- address in the corresponding event field.
--
-- It is possible that this assumption could be wrong, in that the "sender"
-- and individual "swapper"/"user"/"provider"/"registrant" fields don't match,
-- but the actual user is *not* the sender but in the fact the one in the event
-- field. A specific example of this would be if an account (the "sender") signs
-- and sends a multi-sig script or wrapper module in which multiple other
-- accounts sign separate swap/chat/register/liquidity transactions.
--
-- However, the difference between "sender" and the corresponding event field
-- falls under the scope of application logic and is thus left to be dealt
-- with there, not here.

--------------------------------------------------------------------------------

-- Include all the row data in each index to make the queries much more efficient.
-- The difference between the two indexes for each table is just that one of them
-- INCLUDEs `market_id` and the other indexes on it in the composite index, to
-- facilitate all markets vs per market queries.

CREATE INDEX sender_all_swap_hstry_idx
ON swap_events (
    sender,
    transaction_version,
    event_index
) INCLUDE (
    transaction_timestamp,
    market_id, -- here.
    symbol_emojis,
    is_sell,
    base_volume,
    quote_volume,
    avg_execution_price_q64,
    lp_coin_supply -- To determine bonding curve status.
);

CREATE INDEX sender_mkt_swap_hstry_idx
ON swap_events (
    sender,
    market_id, -- here.
    transaction_version,
    event_index
) INCLUDE (
    transaction_timestamp,
    symbol_emojis,
    is_sell,
    base_volume,
    quote_volume,
    avg_execution_price_q64,
    lp_coin_supply -- To determine bonding curve status.
);

CREATE INDEX sender_all_chat_hstry_idx
ON chat_events (
    sender,
    transaction_version,
    event_index
) INCLUDE (
    transaction_timestamp,
    market_id, -- here.
    symbol_emojis,
    "message",
    user_emojicoin_balance,
    last_swap_avg_execution_price_q64,
    lp_coin_supply -- To determine bonding curve status.
);

CREATE INDEX sender_mkt_chat_hstry_idx
ON chat_events (
    sender,
    market_id, -- here.
    transaction_version,
    event_index
) INCLUDE (
    transaction_timestamp,
    symbol_emojis,
    "message",
    user_emojicoin_balance,
    last_swap_avg_execution_price_q64,
    lp_coin_supply -- To determine bonding curve status.
);

CREATE INDEX sender_all_pool_hstry_idx
ON liquidity_events (
    sender,
    transaction_version,
    event_index
) INCLUDE (
    transaction_timestamp,
    market_id, -- here.
    symbol_emojis,
    liquidity_provided,
    base_amount,
    quote_amount,
    lp_coin_amount,
    last_swap_avg_execution_price_q64
);

CREATE INDEX sender_mkt_pool_hstry_idx
ON liquidity_events (
    sender,
    market_id, -- here.
    transaction_version,
    event_index
) INCLUDE (
    transaction_timestamp,
    symbol_emojis,
    liquidity_provided,
    base_amount,
    quote_amount,
    lp_coin_amount,
    last_swap_avg_execution_price_q64
);

-- No need to make two indexes- these are inherently unique for each market.
CREATE INDEX sender_mkt_rgstr_hstry_idx
ON market_registration_events (
    sender,
    transaction_version,
    event_index
) INCLUDE (
    transaction_timestamp,
    market_id, -- here.
    symbol_emojis
);
