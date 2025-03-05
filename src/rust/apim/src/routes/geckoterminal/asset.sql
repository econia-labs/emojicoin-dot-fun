SELECT symbol_emojis
FROM market_latest_state_event
WHERE market_address = $1
