WITH lasts AS (
    (
        SELECT block_number, transaction_timestamp
        FROM liquidity_events
        ORDER BY block_number DESC
        LIMIT 1
    )
    UNION ALL
    (
        SELECT block_number, transaction_timestamp
        FROM swap_events
        ORDER BY block_number DESC
        LIMIT 1
    )
)
SELECT block_number, transaction_timestamp
FROM lasts
ORDER BY block_number DESC
LIMIT 1
