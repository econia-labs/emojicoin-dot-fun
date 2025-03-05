SELECT
    sender as "sender!",
    block_number as "block_number!",
    transaction_timestamp as "transaction_timestamp!",
    transaction_version as "transaction_version!",
    event_index as "event_index!",
    market_address as "market_address!",
    is_sell as "is_sell!",
    net_proceeds as "net_proceeds!",
    input_amount as "input_amount!",
    avg_execution_price_q64 as "avg_execution_price_q64!",
    lp_coin_supply as "lp_coin_supply!",
    clamm_virtual_reserves_base as "clamm_virtual_reserves_base!",
    clamm_virtual_reserves_quote as "clamm_virtual_reserves_quote!",
    cpamm_real_reserves_base as "cpamm_real_reserves_base!",
    cpamm_real_reserves_quote as "cpamm_real_reserves_quote!",
    0 as "base_amount!",
    0 as "quote_amount!",
    'swap' AS "event_type!"
FROM swap_events
WHERE block_number >= $1 AND block_number <= $2
UNION ALL
SELECT
    sender,
    block_number,
    transaction_timestamp,
    transaction_version,
    event_index,
    market_address,
    false AS is_sell,
    0 AS net_proceeds,
    0 AS input_amount,
    0 AS avg_execution_price_q64,
    lp_coin_supply,
    clamm_virtual_reserves_base,
    clamm_virtual_reserves_quote,
    cpamm_real_reserves_base,
    cpamm_real_reserves_quote,
    base_amount,
    quote_amount,
    'swap' AS "event_type!"
FROM liquidity_events
WHERE block_number >= $1 AND block_number <= $2
