CREATE TYPE event_type AS ENUM (
    'global_state',
    'state',
    'periodic_state',
    'market_registration',
    'swap',
    'chat',
    'liquidity',
    'melee',
    'arena_enter',
    'arena_swap',
    'arena_exit',
    'arena_vault_balance_update'
);

CREATE TABLE event (
    transaction_version NUMERIC NOT NULL,
    event_index NUMERIC NOT NULL,
    block NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    event_type event_type NOT NULL,
    data JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (transaction_version, event_index)
);

CREATE TABLE market (
    codepoints TEXT PRIMARY KEY,

    creator TEXT NOT NULL,
    creation_timestamp TIMESTAMPTZ NOT NULL,
    creation_transaction NUMERIC NOT NULL,
    creation_block NUMERIC NOT NULL,

    codepoints_array TEXT[] NOT NULL,

    reserves_cpamm_base NUMERIC NOT NULL,
    reserves_cpamm_quote NUMERIC NOT NULL,
    reserves_clamm_base NUMERIC NOT NULL,
    reserves_clamm_quote NUMERIC NOT NULL,

    volume_base NUMERIC NOT NULL DEFAULT 0,
    volume_quote NUMERIC NOT NULL DEFAULT 0,

    pool_fees_base NUMERIC NOT NULL DEFAULT 0,
    pool_fees_quote NUMERIC NOT NULL DEFAULT 0,

    swaps NUMERIC NOT NULL DEFAULT 0,
    chats NUMERIC NOT NULL DEFAULT 0,

    daily_percentage_return NUMERIC,
    fully_diluted_value NUMERIC NOT NULL,
    integrator_fees NUMERIC NOT NULL DEFAULT 0,
    last_swap_quote_volume NUMERIC,
    lp_coin_supply NUMERIC NOT NULL DEFAULT 0,
    market_cap NUMERIC NOT NULL,
    total_quote_locked NUMERIC NOT NULL,
    total_value_locked NUMERIC NOT NULL,

    address TEXT NOT NULL,
    market_id NUMERIC NOT NULL,

    price NUMERIC NOT NULL GENERATED ALWAYS AS (
        CASE WHEN lp_coin_supply = 0
            THEN reserves_clamm_quote / reserves_clamm_base
            ELSE reserves_cpamm_quote / reserves_cpamm_base
        END
    ) STORED
);

CREATE TABLE swap (
    transaction_version NUMERIC NOT NULL,
    event_index NUMERIC NOT NULL,
    block NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,

    codepoints TEXT NOT NULL REFERENCES market,
    nonce NUMERIC NOT NULL,

    sender TEXT NOT NULL,

    input_amount NUMERIC NOT NULL,
    net_proceeds NUMERIC NOT NULL,

    is_sell BOOLEAN NOT NULL,
    average_price NUMERIC NOT NULL,

    integrator_fees NUMERIC NOT NULL,
    pool_fees NUMERIC NOT NULL,

    volume_base NUMERIC NOT NULL,
    volume_quote NUMERIC NOT NULL,

    PRIMARY KEY (transaction_version, event_index),
    FOREIGN KEY (transaction_version, event_index) REFERENCES event
);

CREATE TABLE chat (
    transaction_version NUMERIC NOT NULL,
    event_index NUMERIC NOT NULL,
    block NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,

    codepoints TEXT NOT NULL REFERENCES market,
    nonce NUMERIC NOT NULL,

    sender TEXT NOT NULL,

    message TEXT NOT NULL,
    emojicoin_balance NUMERIC NOT NULL,
    supply NUMERIC NOT NULL,

    PRIMARY KEY (transaction_version, event_index),
    FOREIGN KEY (transaction_version, event_index) REFERENCES event
);

CREATE TABLE liquidity (
    transaction_version NUMERIC NOT NULL,
    event_index NUMERIC NOT NULL,
    block NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,

    codepoints TEXT NOT NULL REFERENCES market,
    nonce NUMERIC NOT NULL,

    sender TEXT NOT NULL,

    base_amount NUMERIC NOT NULL,
    quote_amount NUMERIC NOT NULL,
    lp_coin_amount NUMERIC NOT NULL,

    liquidity_provided BOOLEAN NOT NULL,

    base_donation_claim_amount NUMERIC NOT NULL,
    quote_donation_claim_amount NUMERIC NOT NULL,

    PRIMARY KEY (transaction_version, event_index),
    FOREIGN KEY (transaction_version, event_index) REFERENCES event
);

CREATE TABLE reserves (
    transaction_version NUMERIC NOT NULL,
    event_index NUMERIC NOT NULL,
    block NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,

    codepoints TEXT NOT NULL REFERENCES market,

    clamm_base NUMERIC NOT NULL,
    clamm_quote NUMERIC NOT NULL,
    cpamm_base NUMERIC NOT NULL,
    cpamm_quote NUMERIC NOT NULL,
    lp_coin_supply NUMERIC NOT NULL,

    PRIMARY KEY (transaction_version, event_index),
    FOREIGN KEY (transaction_version, event_index) REFERENCES event
);


CREATE TYPE candlestick_duration AS ENUM (
    'fifteen_seconds',
    'one_minute',
    'five_minutes',
    'fifteen_minutes',
    'thirty_minutes',
    'one_hour',
    'four_hours',
    'one_day'
);

CREATE TABLE candlestick (
    codepoints TEXT NOT NULL REFERENCES market,
    start TIMESTAMPTZ NOT NULL,
    duration candlestick_duration NOT NULL,
    open NUMERIC NOT NULL,
    close NUMERIC NOT NULL,
    low NUMERIC NOT NULL,
    high NUMERIC NOT NULL,

    PRIMARY KEY (codepoints, duration, start)
);

CREATE TABLE melee (
    melee_id NUMERIC NOT NULL PRIMARY KEY,

    emojicoin_0_codepoints TEXT REFERENCES market,
    emojicoin_0_locked NUMERIC NOT NULL DEFAULT 0,
    emojicoin_0_price NUMERIC NOT NULL,

    emojicoin_1_codepoints TEXT REFERENCES market,
    emojicoin_1_locked NUMERIC NOT NULL DEFAULT 0,
    emojicoin_1_price NUMERIC NOT NULL,

    volume NUMERIC NOT NULL DEFAULT 0,
    rewards_remaining NUMERIC NOT NULL,
    start TIMESTAMPTZ,
    duration NUMERIC,
    max_match_amount NUMERIC,
    max_match_percentage NUMERIC
);

CREATE TABLE melee_position (
    melee_id NUMERIC NOT NULL REFERENCES melee,
    account TEXT NOT NULL,

    open BOOLEAN NOT NULL DEFAULT true,

    emojicoin_0_balance NUMERIC NOT NULL,
    emojicoin_1_balance NUMERIC NOT NULL,

    last_exit_codepoints TEXT REFERENCES market,
    last_exit_version NUMERIC,
    emojicoin_0_balance_before_last_exit NUMERIC NOT NULL,
    emojicoin_1_balance_before_last_exit NUMERIC NOT NULL,

    withdrawals NUMERIC NOT NULL DEFAULT 0,
    deposits NUMERIC NOT NULL DEFAULT 0,

    match_amount NUMERIC NOT NULL DEFAULT 0,

    PRIMARY KEY (melee_id, account)
);

CREATE TABLE melee_candlestick (
    melee_id NUMERIC NOT NULL REFERENCES melee,
    start TIMESTAMPTZ NOT NULL,
    duration candlestick_duration NOT NULL,
    open NUMERIC NOT NULL,
    close NUMERIC NOT NULL,
    low NUMERIC NOT NULL,
    high NUMERIC NOT NULL,

    PRIMARY KEY (melee_id, duration, start)
);

CREATE TABLE arena_reward_vault (
    balance NUMERIC NOT NULL
);

INSERT INTO arena_reward_vault (balance) VALUES (0);

CREATE TABLE favorite (
    sender TEXT NOT NULL,
    codepoints TEXT NOT NULL REFERENCES market,

    PRIMARY KEY (sender, codepoints)
);
