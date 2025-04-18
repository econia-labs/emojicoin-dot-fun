SELECT creator, creation_block, codepoints, creation_timestamp, creation_transaction
FROM market
WHERE address = $1
