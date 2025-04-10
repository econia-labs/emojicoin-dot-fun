-- Your SQL goes here
CREATE TABLE candlesticks (
    market_id NUMERIC NOT NULL,
    last_transaction_version BIGINT NOT NULL,

    period period_type NOT NULL,
    start_time TIMESTAMP NOT NULL,

    open_price NUMERIC NOT NULL,
    high_price NUMERIC NOT NULL,
    low_price NUMERIC NOT NULL,
    close_price NUMERIC NOT NULL,
    volume NUMERIC NOT NULL,

    symbol_emojis TEXT[] NOT NULL,

    PRIMARY KEY (market_id, period, start_time)
);
