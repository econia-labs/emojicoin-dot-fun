-- This file should undo anything in `up.sql`

DROP VIEW arena_leaderboard_history_with_arena_info;

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
