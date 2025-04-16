-- Raw events

CREATE TABLE arena_melee_events (
    transaction_version BIGINT NOT NULL,
    event_index BIGINT NOT NULL,
    sender VARCHAR(66) NOT NULL,
    entry_function VARCHAR(200),
    transaction_timestamp TIMESTAMP NOT NULL,
    inserted_at TIMESTAMP NOT NULL DEFAULT NOW(),

    melee_id NUMERIC NOT NULL PRIMARY KEY,
    emojicoin_0_market_address TEXT NOT NULL,
    emojicoin_1_market_address TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    duration NUMERIC NOT NULL,
    max_match_percentage NUMERIC NOT NULL,
    max_match_amount NUMERIC NOT NULL,
    available_rewards NUMERIC NOT NULL
);

CREATE TABLE arena_enter_events (
    transaction_version BIGINT NOT NULL,
    event_index BIGINT NOT NULL,
    sender VARCHAR(66) NOT NULL,
    entry_function VARCHAR(200),
    transaction_timestamp TIMESTAMP NOT NULL,
    inserted_at TIMESTAMP NOT NULL DEFAULT NOW(),

    "user" TEXT NOT NULL,
    melee_id NUMERIC NOT NULL,
    input_amount NUMERIC NOT NULL,
    quote_volume NUMERIC NOT NULL,
    integrator_fee NUMERIC NOT NULL,
    match_amount NUMERIC NOT NULL,
    emojicoin_0_proceeds NUMERIC NOT NULL,
    emojicoin_1_proceeds NUMERIC NOT NULL,
    emojicoin_0_exchange_rate_base NUMERIC NOT NULL,
    emojicoin_0_exchange_rate_quote NUMERIC NOT NULL,
    emojicoin_1_exchange_rate_base NUMERIC NOT NULL,
    emojicoin_1_exchange_rate_quote NUMERIC NOT NULL,

    PRIMARY KEY (transaction_version, event_index)
);

CREATE TABLE arena_exit_events (
    transaction_version BIGINT NOT NULL,
    event_index BIGINT NOT NULL,
    sender VARCHAR(66) NOT NULL,
    entry_function VARCHAR(200),
    transaction_timestamp TIMESTAMP NOT NULL,
    inserted_at TIMESTAMP NOT NULL DEFAULT NOW(),

    "user" TEXT NOT NULL,
    melee_id NUMERIC NOT NULL,
    tap_out_fee NUMERIC NOT NULL,
    emojicoin_0_proceeds NUMERIC NOT NULL,
    emojicoin_1_proceeds NUMERIC NOT NULL,
    apt_proceeds NUMERIC NOT NULL,
    emojicoin_0_exchange_rate_base NUMERIC NOT NULL,
    emojicoin_0_exchange_rate_quote NUMERIC NOT NULL,
    emojicoin_1_exchange_rate_base NUMERIC NOT NULL,
    emojicoin_1_exchange_rate_quote NUMERIC NOT NULL,

    during_melee BOOLEAN NOT NULL,

    PRIMARY KEY (transaction_version, event_index)
);

CREATE TABLE arena_swap_events (
    transaction_version BIGINT NOT NULL,
    event_index BIGINT NOT NULL,
    sender VARCHAR(66) NOT NULL,
    entry_function VARCHAR(200),
    transaction_timestamp TIMESTAMP NOT NULL,
    inserted_at TIMESTAMP NOT NULL DEFAULT NOW(),

    "user" TEXT NOT NULL,
    melee_id NUMERIC NOT NULL,
    quote_volume NUMERIC NOT NULL,
    integrator_fee NUMERIC NOT NULL,
    emojicoin_0_proceeds NUMERIC NOT NULL,
    emojicoin_1_proceeds NUMERIC NOT NULL,
    emojicoin_0_exchange_rate_base NUMERIC NOT NULL,
    emojicoin_0_exchange_rate_quote NUMERIC NOT NULL,
    emojicoin_1_exchange_rate_base NUMERIC NOT NULL,
    emojicoin_1_exchange_rate_quote NUMERIC NOT NULL,

    during_melee BOOLEAN NOT NULL,

    PRIMARY KEY (transaction_version, event_index)
);

CREATE TABLE arena_vault_balance_update_events (
    transaction_version BIGINT NOT NULL,
    event_index BIGINT NOT NULL,
    sender VARCHAR(66) NOT NULL,
    entry_function VARCHAR(200),
    transaction_timestamp TIMESTAMP NOT NULL,
    inserted_at TIMESTAMP NOT NULL DEFAULT NOW(),

    new_balance NUMERIC NOT NULL,

    PRIMARY KEY (transaction_version, event_index)
);

-- Derived data

CREATE TABLE arena_position (
    "user" TEXT NOT NULL,
    last_transaction_version BIGINT NOT NULL,
    melee_id NUMERIC NOT NULL,
    open BOOL NOT NULL,
    emojicoin_0_balance NUMERIC NOT NULL,
    emojicoin_1_balance NUMERIC NOT NULL,
    withdrawals NUMERIC NOT NULL,
    deposits NUMERIC NOT NULL,
    match_amount NUMERIC NOT NULL,
    last_exit_0 BOOLEAN,

    PRIMARY KEY ("user", melee_id)
);

CREATE TABLE arena_leaderboard_history (
    "user" TEXT NOT NULL,
    last_transaction_version BIGINT NOT NULL,
    melee_id NUMERIC NOT NULL,
    profits NUMERIC NOT NULL,
    losses NUMERIC NOT NULL,
    emojicoin_0_balance NUMERIC NOT NULL,
    emojicoin_1_balance NUMERIC NOT NULL,
    exited BOOLEAN NOT NULL,
    last_exit_0 BOOLEAN,
    withdrawals NUMERIC NOT NULL,

    PRIMARY KEY ("user", melee_id)
);

CREATE TABLE arena_info (
    melee_id NUMERIC NOT NULL PRIMARY KEY,
    last_transaction_version BIGINT NOT NULL,
    volume NUMERIC NOT NULL,
    rewards_remaining NUMERIC NOT NULL,
    emojicoin_0_locked NUMERIC NOT NULL,
    emojicoin_1_locked NUMERIC NOT NULL,

    -- Redundant information to avoid multiple queries/joins
    emojicoin_0_market_address TEXT,
    emojicoin_1_market_address TEXT,
    emojicoin_0_symbols TEXT[],
    emojicoin_1_symbols TEXT[],
    emojicoin_0_market_id NUMERIC,
    emojicoin_1_market_id NUMERIC,
    start_time TIMESTAMP,
    duration NUMERIC,
    max_match_percentage NUMERIC,
    max_match_amount NUMERIC
);

CREATE TABLE arena_candlesticks (
    melee_id NUMERIC NOT NULL,
    last_transaction_version BIGINT NOT NULL,

    period period_type NOT NULL,
    start_time TIMESTAMP NOT NULL,

    open_price NUMERIC NOT NULL,
    high_price NUMERIC NOT NULL,
    low_price NUMERIC NOT NULL,
    close_price NUMERIC NOT NULL,
    volume NUMERIC NOT NULL,
    n_swaps NUMERIC NOT NULL,

    PRIMARY KEY (melee_id, period, start_time)
);

-- Views

CREATE VIEW arena_leaderboard AS
WITH melee AS (
    SELECT * FROM arena_melee_events ORDER BY melee_id DESC LIMIT 1
), price_emojicoin_0 AS (
    SELECT avg_execution_price_q64 / POW(2,64)::NUMERIC AS price FROM swap_events
    WHERE market_address = (SELECT emojicoin_0_market_address FROM arena_melee_events WHERE melee_id = (SELECT melee_id FROM melee))
    ORDER BY market_nonce DESC
    LIMIT 1
), price_emojicoin_1 AS (
    SELECT avg_execution_price_q64 / POW(2,64)::NUMERIC AS price FROM swap_events
    WHERE market_address = (SELECT emojicoin_1_market_address FROM arena_melee_events WHERE melee_id = (SELECT melee_id FROM melee))
    ORDER BY market_nonce DESC
    LIMIT 1
), realized_position AS (
    SELECT
        "user",
        open,
        emojicoin_0_balance,
        emojicoin_1_balance,
        withdrawals +
            ROUND(emojicoin_0_balance * COALESCE((SELECT * FROM price_emojicoin_0), 0::numeric)) +
            ROUND(emojicoin_1_balance * COALESCE((SELECT * FROM price_emojicoin_1), 0::numeric)) AS profits,
        withdrawals,
        deposits AS losses
    FROM arena_position WHERE melee_id = (SELECT melee_id FROM melee)
)
SELECT
    *,
    profits / losses * 100 - 100 AS pnl_percent,
    profits - losses AS pnl_octas
FROM realized_position;

CREATE VIEW arena_leaderboard_history_with_arena_info AS
SELECT
    arena_leaderboard_history.user,
    arena_leaderboard_history.melee_id,
    arena_leaderboard_history.profits,
    arena_leaderboard_history.losses,
    arena_leaderboard_history.withdrawals,
    arena_leaderboard_history.emojicoin_0_balance,
    arena_leaderboard_history.emojicoin_1_balance,
    arena_leaderboard_history.exited,
    arena_leaderboard_history.last_exit_0,

    arena_info.emojicoin_0_symbols,
    arena_info.emojicoin_1_symbols,
    arena_info.emojicoin_0_market_address,
    arena_info.emojicoin_1_market_address,
    arena_info.emojicoin_0_market_id,
    arena_info.emojicoin_1_market_id,
    arena_info.start_time,
    arena_info.duration
FROM
    arena_leaderboard_history
INNER JOIN
    arena_info
ON
    arena_info.melee_id = arena_leaderboard_history.melee_id;

ALTER TYPE period_type ADD VALUE IF NOT EXISTS 'period_15s';

CREATE TABLE emojicoin_last_processed_transaction (
    id BIGINT NOT NULL PRIMARY KEY,
    version BIGINT NOT NULL
);
