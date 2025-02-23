// cspell:word kolorist

import { fetchArenaMeleeView, fetchArenaRegistryView } from "@econia-labs/emojicoin-sdk";
import { lightRed, yellow } from "kolorist";
import {
  ONE_SECOND_MICROSECONDS,
  registerAndUnlockInitialMarketsForArenaTest,
  setNextDurationAndEnsureCrank,
  waitUntilCurrentMeleeEnds,
} from "src/test-exports";
import { DEFAULT_MELEE_DURATION } from "../utils/const";

const main = async () => {
  try {
    await registerAndUnlockInitialMarketsForArenaTest();
  } catch (e) {
    console.warn(
      lightRed("WARNING:"),
      "Encountered an error while unlocking initial markets. Did you already call this function?"
    );
  }

  const { currentMeleeID } = await fetchArenaRegistryView();
  const melee = await fetchArenaMeleeView(currentMeleeID);
  const now = new Date().getTime();
  const end = Number(melee.duration / 1000n) + melee.startTime.getTime();
  const seconds = Math.max((end - now) / 1000, 0);
  if (seconds) {
    console.log(`Waiting ${seconds} seconds for the arena to end.`);
  }
  await waitUntilCurrentMeleeEnds();

  const coloredSeconds = yellow(`${DEFAULT_MELEE_DURATION / ONE_SECOND_MICROSECONDS}`);
  console.log(`Setting next melee duration to: ${coloredSeconds} seconds.`);
  await setNextDurationAndEnsureCrank(DEFAULT_MELEE_DURATION);
};

main().then(() => console.log("Initialized the local network for arena tests!"));
