SELECT sender, block_number, symbol_emojis, transaction_timestamp, transaction_version
FROM market_registration_events
WHERE market_address = $1
