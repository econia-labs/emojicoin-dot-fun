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
    now(),                              -- Bump time
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
    92233720368547758080000000000000    -- Volume in 1m state tracker
)
