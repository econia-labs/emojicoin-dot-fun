-- Fields marked with ## are non relevant to this test, and set to meaningless values.
insert into swap_events values (
    2,                                  -- ##
    '1',                                -- ##
    '1',                                -- ##
    now() - interval '1 day 1 hour',    -- Transaction timestamp
    now(),                              -- ##

    -- Market and state metadata.
    777701,                             -- Market ID
    '\\xDEADBEEF'::bytea,               -- ##
    '{""}',                             -- ##
    now(),                              -- ##
    2,                                  -- ##
    'swap_buy',                         -- ##
    '0xaaa101',                         -- ##

    -- Swap event data.
    '',                                 -- ##
    '',                                 -- ##
    0,                                  -- ##
    0,                                  -- ##
    false,                              -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    0,                                  -- ##
    13835058055282163712000,            -- Average execution price Q64
    0,                                  -- ##
    false,                              -- ##
    false,                              -- ##

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
    0,                                  -- ##
    0                                   -- ##
)
