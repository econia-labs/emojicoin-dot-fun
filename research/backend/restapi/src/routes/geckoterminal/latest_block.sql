SELECT block, timestamp
FROM event
ORDER BY transaction_version DESC
LIMIT 1
