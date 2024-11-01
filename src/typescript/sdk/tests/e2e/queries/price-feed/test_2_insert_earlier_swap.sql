-- Fields marked with ## are non relevant to this test, and set to meaningless values.
insert into swap_events values (
    1,                                  -- ##
    '1',                                -- ##
    '1',                                -- ##
    now() - interval '1 day 1 hour',    -- Transaction timestamp
    now(),                              -- ##

    -- Market and state metadata.
    777702,                             -- Market ID
    '\\xDEADBEEF'::bytea,               -- ##
    '{""}',                             -- ##
    now(),                              -- ##
    1,                                  -- ##
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
    18446744073709551616000,             -- Average execution price Q64
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
