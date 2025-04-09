-- Insert a snapshot of the leaderboard in arena_leaderboard_history for the
-- given melee ID.

-- This query hasn't been optimized, but as long as it isn't egregiously
-- inefficient it isn't a significant concern, since it's only used once
-- every 24 hours when an arena ends.


-- This query takes three parameters:
--
-- $1: the melee_id for which to calculate the leaderboard
-- $2: the curve price of emojicoin_0 at the end of the melee
-- $3: the curve price of emojicoin_1 at the end of the melee
-- $4: the transaction version of the snapshot; i.e., when this melee ended

INSERT INTO arena_leaderboard_history (
    "user",
    last_transaction_version,
    melee_id,
    profits,
    losses,
    emojicoin_0_balance,
    emojicoin_1_balance,
    exited,
    last_exit_0,
    withdrawals
)
-- Get the total deposit amount and last exit for each user.
WITH position AS (
    SELECT
        "user",
        deposits,
        last_exit_0
    FROM arena_position
    WHERE melee_id = $1
),
-- Get the total withdrawal amount for each user.
withdrawals AS (
    SELECT
        "user",
        SUM(apt_proceeds) as withdrawals
    FROM arena_exit_events
    WHERE melee_id = $1
    AND during_melee
    GROUP BY "user"
),
-- Get the last balance the user had at the end of the melee.
last_balances AS (
    SELECT DISTINCT ON("user")
        "user",
        emojicoin_0_balance,
        emojicoin_1_balance
    FROM (
        SELECT
            "user",
            transaction_version,
            event_index,
            emojicoin_0_proceeds AS emojicoin_0_balance,
            emojicoin_1_proceeds AS emojicoin_1_balance
        FROM arena_enter_events
        WHERE melee_id = $1
        UNION ALL
        SELECT
            "user",
            transaction_version,
            event_index,
            emojicoin_0_proceeds AS emojicoin_0_balance,
            emojicoin_1_proceeds AS emojicoin_1_balance
        FROM arena_swap_events
        WHERE melee_id = $1
        AND during_melee
        UNION ALL
        SELECT
            "user",
            transaction_version,
            event_index,
            0::numeric AS emojicoin_0_balance,
            0::numeric AS emojicoin_1_balance
        FROM arena_exit_events
        WHERE melee_id = $1
        AND during_melee
    ) AS a
    ORDER BY "user", transaction_version DESC, event_index DESC
)
SELECT
    position."user",
    $4 AS last_transaction_version,
    $1 AS melee_id,
    -- Profits = Withdrawals in APT + current emojicoin balance converted to APT.
    COALESCE(withdrawals, 0) +
        ROUND(
            emojicoin_0_balance * $2 +
            emojicoin_1_balance * $3
        ) AS profits,
    deposits AS losses,
    emojicoin_0_balance,
    emojicoin_1_balance,
    -- Determine whether the user has exited or not by checking that:
    --   1. The user has no balance at the end of the melee.
    --                           OR
    --   2. There is an exit event for the user *after* that melee ended.
    emojicoin_0_balance + emojicoin_1_balance = 0
    OR
    EXISTS(
        SELECT * FROM arena_exit_events AS aee
        WHERE aee."user" = position."user"
        AND melee_id = $1
        AND NOT during_melee
    )
    AS exited,
    last_exit_0,
    COALESCE(withdrawals, 0) AS withdrawals
FROM position
    NATURAL INNER JOIN last_balances
    NATURAL LEFT JOIN withdrawals;
