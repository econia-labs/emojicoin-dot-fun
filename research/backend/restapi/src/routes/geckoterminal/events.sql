SELECT
    swap.sender as "sender!",
    swap.block as "block_number!",
    swap.timestamp as "transaction_timestamp!",
    swap.transaction_version as "transaction_version!",
    swap.event_index as "event_index!",
    address as "market_address!",
    is_sell as "is_sell!",
    net_proceeds as "net_proceeds!",
    input_amount as "input_amount!",
    average_price as "average_price!",
    reserves.lp_coin_supply as "lp_coin_supply!",
    reserves.clamm_base as "clamm_virtual_reserves_base!",
    reserves.clamm_quote as "clamm_virtual_reserves_quote!",
    reserves.cpamm_base as "cpamm_real_reserves_base!",
    reserves.cpamm_quote as "cpamm_real_reserves_quote!",
    0 as "base_amount!",
    0 as "quote_amount!",
    'swap' AS "event_type!"
FROM swap
INNER JOIN reserves ON reserves.transaction_version = swap.transaction_version AND reserves.event_index = swap.event_index
INNER JOIN market ON market.codepoints = swap.codepoints
WHERE swap.block >= $1 AND swap.block <= $2
UNION ALL
SELECT
    liquidity.sender,
    liquidity.block,
    liquidity.timestamp,
    liquidity.transaction_version,
    liquidity.event_index,
    address,
    false AS is_sell,
    0 AS net_proceeds,
    0 AS input_amount,
    0 AS avg_execution_price_q64,
    reserves.lp_coin_supply,
    reserves.clamm_base,
    reserves.clamm_quote,
    reserves.cpamm_base,
    reserves.cpamm_quote,
    base_amount,
    quote_amount,
    'swap' AS "event_type!"
FROM liquidity
INNER JOIN reserves ON reserves.transaction_version = liquidity.transaction_version AND reserves.event_index = liquidity.event_index
INNER JOIN market ON market.codepoints = liquidity.codepoints
WHERE liquidity.block >= $1 AND liquidity.block <= $2
