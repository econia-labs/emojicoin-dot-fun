insert into market_latest_state_event values (
    2,                                  -- ##
    '1',                                -- ##
    '1',                                -- ##
    now(),                              -- Transaction timestamp
    now(),                              -- ##

    -- Market and state metadata.
    777701,                             -- Market ID
    '\\xDEADBEEF'::bytea,               -- ##
    '{""}',                             -- ##
    now() - interval '1 day 1 hour',    -- ##
    2,                                  -- ##
    'swap_buy',                         -- ##
    '0xaaa101',                         -- ##

    -- State event data.
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    false,                              -- ##
    13835058055282163712000,            -- Last swap average execution price
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    now(),                              -- ##

    0,                                  -- ##
    false,                              -- ##
    500000000000000                     -- ##
)
