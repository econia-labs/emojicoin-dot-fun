import { Account } from "@aptos-labs/ts-sdk";
import {
  APT_BALANCE_REQUIRED_TO_REGISTER_MARKET,
  ONE_APT,
  ONE_APT_BIGINT,
} from "../../src/const";
import { getRegistryAddress, toChatEvent } from "../../src";
import { EmojicoinDotFun } from "../../src/emojicoin_dot_fun";
import { fundAccountFast, getTestHelpers } from "../utils";
import { getEmojicoinMarketAddressAndTypeTags } from "../../src/markets/utils";
import { STRUCT_STRINGS } from "../../src/utils/type-tags";

jest.setTimeout(20000);

describe("emits a chat message event successfully", () => {
  const { aptos, publisher } = getTestHelpers();
  const randomIntegrator = Account.generate();
  const user = Account.generate();

  beforeAll(async () => {
    await fundAccountFast(
      aptos,
      user,
      APT_BALANCE_REQUIRED_TO_REGISTER_MARKET / ONE_APT_BIGINT + 1n
    );
  });

  it("registers a black cat emojicoin and then emits complex chat emoji sequences", async () => {
    // Note the first two are supplementary chat emojis, the rest are valid symbol emojis.
    const chatEmojis = [
      ["f09fa791e2808df09f9a80", "🧑‍🚀"], // Astronaut.
      ["f09fa6b8f09f8fbee2808de29982efb88f", "🦸🏾‍♂️"], // Man superhero: medium-dark skin tone.
      ["f09f92a9", "💩"], // Pile of poo.
      ["f09fa4a1", "🤡"], // Clown face.
      ["f09f91b9", "👹"], // Ogre.
      ["f09f91ba", "👺"], // Goblin.
      ["f09f91bb", "👻"], // Ghost.
      ["f09f91bd", "👽"], // Alien.
      ["f09fa496", "🤖"], // Robot.
    ];

    const blackCatEmoji = "f09f9088e2808de2ac9b";

    // Register a market.
    const txResponse = await EmojicoinDotFun.RegisterMarket.submit({
      aptosConfig: aptos.config,
      registrant: user,
      emojis: [blackCatEmoji],
      integrator: randomIntegrator.accountAddress,
      options: {
        maxGasAmount: ONE_APT / 100,
        gasUnitPrice: 100,
      },
    });
    expect(txResponse.success).toBe(true);

    // Verify all emojis are supported in chat.
    await Promise.all(
      chatEmojis.map(async ([hex, _]) => {
        const [isSupported] = await new EmojicoinDotFun.IsASupportedChatEmoji({
          hexBytes: hex,
        }).view({ aptos });
        expect(isSupported).toBe(true);
      })
    );

    // Get the registry address.
    const registryAddress = await getRegistryAddress({
      aptos,
      moduleAddress: publisher.accountAddress,
    });

    // Get the black cat emojicoin market address and TypeTags.
    const { marketAddress, emojicoin, emojicoinLP } = getEmojicoinMarketAddressAndTypeTags({
      registryAddress,
      symbolBytes: blackCatEmoji,
    });

    // Submit a chat message with the first two emojis.
    const chatResponse = await EmojicoinDotFun.Chat.submit({
      aptosConfig: aptos.config,
      user,
      marketAddress,
      emojiBytes: chatEmojis.map(([hex, _]) => hex),
      emojiIndicesSequence: new Uint8Array([0, 1]),
      typeTags: [emojicoin, emojicoinLP],
    });

    let { success, events } = chatResponse;
    expect(success).toBe(true);
    const chatEventJSON = events.find((e) => e.type === STRUCT_STRINGS.ChatEvent)?.data;
    expect(chatEventJSON).toBeDefined();
    const chatEvent = toChatEvent(chatEventJSON, Number(chatResponse.version));
    // Ensure that an event is emitted and the message is correct.
    expect(chatEvent.message).toEqual("🧑‍🚀🦸🏾‍♂️");

    // Prepare a very long message.
    const indices = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 7, 6, 5, 4, 3, 2, 1, 0, 2, 2, 3, 3, 6, 6, 7, 7, 8, 1, 1, 1, 1,
      1, 1, 1, 1, 1,
    ];

    // Submit the very long chat message.
    const secondChatResponse = await EmojicoinDotFun.Chat.submit({
      aptosConfig: aptos.config,
      user,
      marketAddress,
      emojiBytes: chatEmojis.map(([hex, _]) => hex),
      emojiIndicesSequence: new Uint8Array(indices),
      typeTags: [emojicoin, emojicoinLP],
    });

    // Parse the event data and ensure that the message is correct.
    ({ success, events } = secondChatResponse);
    expect(success).toBe(true);
    const secondChatEventJSON = events.find((e) => e.type === STRUCT_STRINGS.ChatEvent)?.data;
    expect(secondChatEventJSON).toBeDefined();
    const secondChatEvent = toChatEvent(secondChatEventJSON, Number(chatResponse.version));
    expect(secondChatEvent.message).toEqual(indices.map((i) => chatEmojis[i][1]).join(""));
  });
});
