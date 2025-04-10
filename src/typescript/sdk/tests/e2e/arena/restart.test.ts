import type { MeleeEmojiData } from "../../../src";
import {
  fetchArenaMeleeView,
  fetchMeleeEmojiData,
  sleep,
  toArenaLeaderboardHistoryModel,
} from "../../../src";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import { postgrest, TableName } from "../../../src/indexer-v2";
import { getPublisher } from "../../utils";
import { DockerTestHarness } from "../../utils/docker/docker-test-harness";
import { waitForProcessor } from "../helpers";
import {
  ONE_SECOND_MICROSECONDS,
  setNextMeleeDurationAndEnsureCrank,
  waitUntilCurrentMeleeEnds,
} from "./utils";

describe("ensures arena candlesticks work", () => {
  const emojicoin = new EmojicoinClient();
  const account = getPublisher();
  let melee: MeleeEmojiData;

  beforeAll(async () => {
    await emojicoin.register(account, ["🥇"]);
    await emojicoin.register(account, ["🥈"]);
    await setNextMeleeDurationAndEnsureCrank(ONE_SECOND_MICROSECONDS * 10n).then((res) => {
      melee = res.melee;
      return waitForProcessor(res);
    });
  }, 70000);

  it("verifies that the processor restart with a correct price", async () => {
    await waitUntilCurrentMeleeEnds();
    const crank = await emojicoin.arena.enter(
      account,
      1n,
      false,
      melee.market0.symbolEmojis,
      melee.market1.symbolEmojis,
      "symbol0"
    );
    melee = await fetchArenaMeleeView(crank.arena.event.meleeID).then(fetchMeleeEmojiData);

    const enter = await emojicoin.arena.enter(
      account,
      1n,
      false,
      melee.market0.symbolEmojis,
      melee.market1.symbolEmojis,
      "symbol0"
    );
    expect(enter.events.arenaEnterEvents.length).toEqual(1);
    await waitUntilCurrentMeleeEnds();
    await DockerTestHarness.restartProcessor();
    await sleep(10000);

    // Crank
    const res = await emojicoin.arena.enter(
      account,
      1n,
      false,
      melee.market0.symbolEmojis,
      melee.market1.symbolEmojis,
      "symbol0"
    );

    await waitForProcessor(res);

    const leaderboard = await postgrest
      .from(TableName.ArenaLeaderboardHistory)
      .select("*")
      .eq("melee_id", melee.view.meleeID)
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaLeaderboardHistoryModel)));

    expect(leaderboard).not.toBeNull();
    expect(leaderboard!.length).toEqual(1);

    const element = leaderboard![0];
    const pnl = Number(element.profits) / Number(element.losses);

    expect(pnl).toBeGreaterThan(0.9);
    expect(pnl).toBeLessThan(1.1);
  }, 40000);
});
