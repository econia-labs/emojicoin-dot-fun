// cspell:word kolorist
// cspell:word funder

import {
  fetchArenaMeleeView,
  fetchArenaRegistryView,
  fetchMeleeEmojiData,
  generateRandomSymbol,
  getAptosApiKey,
  getSymbolEmojisInString,
  ONE_APT,
} from "@econia-labs/emojicoin-sdk";
import { EmojicoinClient } from "@econia-labs/emojicoin-sdk/client";
import { getPublisher } from "../../../../sdk/tests/utils";
import { program } from "commander";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { toExplorerLink } from "./explorer-link";
import { lightBlue } from "kolorist";
import { FundVault } from "@/contract-apis/emojicoin-arena";

const publisher = getPublisher();

const getCustomAptosClient = (network: Network) =>
  new Aptos(
    new AptosConfig({
      network,
      clientConfig: {
        API_KEY: getAptosApiKey(),
      },
    })
  );

/**
 *
 * @example
 * ```shell
 * # Specify the symbol
 * pnpm run utils:register-market --
 *
 * # Or generate a random symbol
 * pnpm run utils:register-market
 * ```
 */
async function main() {
  program
    .command("register")
    .description("Register a market")
    .option("-n, --network [string]", "the aptos network to use", Network.LOCAL)
    .argument("[symbol]", "market symbol to register", generateRandomSymbol().symbolEmojis.join(""))
    .action(async (symbol, options) => {
      const network = options.network;
      const aptos = getCustomAptosClient(network);
      const emojicoin = new EmojicoinClient({ aptos });
      const symbolEmojis = getSymbolEmojisInString(symbol);
      // I hate looking at the long emojis, but we need some for testing purposes.
      if (Math.random() < 0.5) {
        while (symbolEmojis.length > 1) {
          symbolEmojis.pop();
        }
      }
      const { response: res1 } = await emojicoin.register(publisher, symbolEmojis);
      const { response: res2 } = await emojicoin.buy(publisher, symbolEmojis, 1n);
      console.log(
        `Success! symbol: ${symbolEmojis} register: ${res1.version}, swap: ${res2.version}`
      );
    });

  program
    .command("crank")
    .description("Crank an arena melee")
    .option("-n, --network [string]", "the aptos network to use", Network.LOCAL)
    .action(async (options) => {
      const network = options.network;
      const aptos = getCustomAptosClient(network);
      const emojicoin = new EmojicoinClient({ aptos });
      const { currentMeleeID } = await fetchArenaRegistryView();
      const meleeView = await fetchArenaMeleeView(currentMeleeID).then(fetchMeleeEmojiData);
      const isOver =
        new Date().getTime() >
        meleeView.view.startTime.getTime() + Number(meleeView.view.duration / 1000n);

      if (!isOver) {
        console.error("Melee isn't over yet!");
      }
      const [symbol1, symbol2] = [meleeView.market1.symbolEmojis, meleeView.market2.symbolEmojis];
      const res = await emojicoin.arena.enter(publisher, 1n, false, symbol1, symbol2, "symbol1");
      const { models } = res;
      const { melee } = models.arenaMeleeEvents.pop() ?? {};
      if (melee) {
        const { meleeID } = melee;
        console.log(`Success! Melee ID: ${meleeID}, version: ${res.response.version}`);
      } else {
        console.log(`Failed to crank. Version: ${res.response.version}`);
      }
    });

  program
    .command("enter")
    .description("Enter the arena melee")
    .option("-n, --network [string]", "the aptos network to use", Network.LOCAL)
    .action(async (options) => {
      const network = options.network;
      const aptos = getCustomAptosClient(network);
      const emojicoin = new EmojicoinClient({ aptos });
      const { currentMeleeID } = await fetchArenaRegistryView();
      const meleeView = await fetchArenaMeleeView(currentMeleeID).then(fetchMeleeEmojiData);
      if (
        new Date().getTime() >
        meleeView.view.startTime.getTime() + Number(meleeView.view.duration / 1000n)
      ) {
        console.log("Failure!! Melee has already ended.");
        return;
      }
      const [symbol1, symbol2] = [meleeView.market1.symbolEmojis, meleeView.market2.symbolEmojis];
      const res = await emojicoin.arena.enter(
        publisher,
        10000n,
        false,
        symbol1,
        symbol2,
        "symbol1"
      );
      const { models } = res;
      const meleeID =
        models.arenaMeleeEvents.pop()?.melee.meleeID ??
        models.arenaEnterEvents.pop()?.enter.meleeID ??
        {};
      const link = lightBlue(
        `${toExplorerLink({ value: res.response.version, linkType: "version" })}`
      );
      if (meleeID) {
        console.log(`Success! Melee ID: ${meleeID}, version: ${link}`);
      } else {
        console.log(`Failed to enter. Version: ${link}`);
      }
    });

  program
    .command("fund-vault")
    .description("Fund the arena vault.")
    .option("-n, --network [string]", "the aptos network to use", Network.LOCAL)
    .action(async (options) => {
      const network = options.network;
      const aptos = getCustomAptosClient(network);
      const res = await FundVault.submit({
        aptosConfig: aptos.config,
        funder: publisher,
        amount: ONE_APT * 10000000,
      });

      const link = lightBlue(`${toExplorerLink({ value: res.version, linkType: "version" })}`);
      if (res.success) {
        console.log(`Success! Version: ${link}`);
      } else {
        console.log(`Failed to fund. Version: ${link}`);
      }
    });

  // Now parse and run proper commands.
  program.parse();
}

main().then();
