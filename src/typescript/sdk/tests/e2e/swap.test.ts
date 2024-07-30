import { Account, type TypeTag, type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { ONE_APT } from "../../src/const";
import { SYMBOL_DATA } from "../../src";
import { EmojicoinDotFun } from "../../src/emojicoin_dot_fun";
import { getTestHelpers } from "../utils";
import {
  getEmojicoinMarketAddressAndTypeTags,
  getRegistrationGracePeriodFlag,
  isRegistrationGracePeriodOver,
} from "../../src/markets/utils";
import {
  getAptBalanceFromChanges,
  getFeeStatement,
  getCoinBalanceFromChanges,
} from "../../src/utils/parse-changes-for-balances";

jest.setTimeout(90000);

describe("tests the swap functionality", () => {
  const { aptos } = getTestHelpers();
  const randomIntegrator = Account.generate();
  const registrant = Account.generate();
  const nonRegistrantUser = Account.generate();
  const emoji = SYMBOL_DATA.byStrictName("pile of poo");
  const {
    marketAddress: pooMarketAddress,
    emojicoin: pooEmojicoin,
    emojicoinLP: pooLPCoin,
  } = getEmojicoinMarketAddressAndTypeTags({
    symbolBytes: emoji.hex,
  });
  let registerMarketResponse: UserTransactionResponse;
  const transactionArgs = {
    aptosConfig: aptos.config,
    marketAddress: pooMarketAddress,
    user: registrant,
    emoji: emoji.hex,
    integrator: randomIntegrator.accountAddress,
    integratorFeeRateBps: 0,
    typeTags: [pooEmojicoin, pooLPCoin] as [TypeTag, TypeTag],
  };

  beforeAll(async () => {
    if (aptos.config.network === "local") {
      await aptos.fundAccount({ accountAddress: registrant.accountAddress, amount: ONE_APT * 10 });
      await aptos.fundAccount({
        accountAddress: nonRegistrantUser.accountAddress,
        amount: ONE_APT * 10,
      });
    } else {
      const fundAccounts = [
        aptos.fundAccount({ accountAddress: registrant.accountAddress, amount: ONE_APT }),
        aptos.fundAccount({ accountAddress: registrant.accountAddress, amount: ONE_APT }),
        aptos.fundAccount({ accountAddress: registrant.accountAddress, amount: ONE_APT }),
        aptos.fundAccount({ accountAddress: nonRegistrantUser.accountAddress, amount: ONE_APT }),
        aptos.fundAccount({ accountAddress: nonRegistrantUser.accountAddress, amount: ONE_APT }),
        aptos.fundAccount({ accountAddress: nonRegistrantUser.accountAddress, amount: ONE_APT }),
      ];
      await Promise.all(fundAccounts);
    }
    // Register a market.
    registerMarketResponse = await EmojicoinDotFun.RegisterMarket.submit({
      aptosConfig: aptos.config,
      registrant,
      emojis: [emoji.hex],
      integrator: randomIntegrator.accountAddress,
      options: {
        maxGasAmount: ONE_APT / 100,
        gasUnitPrice: 100,
      },
    });
    expect(registerMarketResponse.success).toBe(true);
    return true;
  });

  // NOTE: We would ideally write a separate e2e unit test for all the storage refund scenarios,
  // but it would require writing a custom contract that frees the resource up in the same
  // transaction as spending APT. It is a little too much effort, and this test is sufficient.
  it("successfully swap buys, checks APT balance accounting for storage refunds", async () => {
    const aptBalanceBefore = getAptBalanceFromChanges(
      registerMarketResponse,
      registrant.accountAddress
    )!;

    const inputAmount = 3212n;
    const swapResponse = await EmojicoinDotFun.Swap.submit({
      ...transactionArgs,
      swapper: registrant,
      inputAmount,
      isSell: false,
    });

    const { success } = swapResponse;
    expect(success).toBe(true);
    const gasUsed = BigInt(swapResponse.gas_used) * BigInt(swapResponse.gas_unit_price);

    const newAptBalance = getAptBalanceFromChanges(swapResponse, registrant.accountAddress)!;
    const emojicoinBalance = getCoinBalanceFromChanges({
      response: swapResponse,
      userAddress: registrant.accountAddress,
      coinType: pooEmojicoin,
    })!;

    // This calculation only works because the user is not the fee payer.
    // See `getNewCoinBalanceFromChanges` for more details.
    const { storageFeeRefundOctas } = getFeeStatement(swapResponse);

    const calculated = aptBalanceBefore - (gasUsed + inputAmount) + storageFeeRefundOctas;
    expect(newAptBalance).toBe(calculated);
    expect(emojicoinBalance).toBeGreaterThan(1n);
  });

  it("successfully swap sells", async () => {
    const emojicoinBalanceBefore =
      getCoinBalanceFromChanges({
        response: registerMarketResponse,
        userAddress: registrant.accountAddress,
        coinType: pooEmojicoin,
      }) ?? 0n;
    const inputAmount = 10000n;
    const buySwapResponse = await EmojicoinDotFun.Swap.submit({
      ...transactionArgs,
      swapper: registrant,
      inputAmount,
      isSell: false,
    });

    expect(buySwapResponse.success).toBe(true);
    const newEmojicoinBalance = getCoinBalanceFromChanges({
      response: buySwapResponse,
      userAddress: registrant.accountAddress,
      coinType: pooEmojicoin,
    })!;
    expect(newEmojicoinBalance).toBeGreaterThan(emojicoinBalanceBefore);

    const sellSwapResponse = await EmojicoinDotFun.Swap.submit({
      ...transactionArgs,
      swapper: registrant,
      inputAmount: newEmojicoinBalance,
      isSell: true,
    });

    expect(sellSwapResponse.success).toBe(true);
    const finalAptBalance = getAptBalanceFromChanges(sellSwapResponse, registrant.accountAddress)!;
    const finalEmojicoinBalance = getCoinBalanceFromChanges({
      response: sellSwapResponse,
      userAddress: registrant.accountAddress,
      coinType: pooEmojicoin,
    })!;

    expect(finalAptBalance).toBeGreaterThan(0n);
    expect(finalEmojicoinBalance).toBe(0n);
  });

  it("successfully ends the grace period by having the registrant buy", async () => {
    const newEmoji = SYMBOL_DATA.byStrictName("anger symbol");
    const newMarketRegisterResponse = await EmojicoinDotFun.RegisterMarket.submit({
      aptosConfig: aptos.config,
      registrant,
      emojis: [newEmoji.hex],
      integrator: randomIntegrator.accountAddress,
      options: {
        maxGasAmount: ONE_APT / 100,
        gasUnitPrice: 100,
      },
    });
    const { marketAddress, emojicoin, emojicoinLP } = getEmojicoinMarketAddressAndTypeTags({
      symbolBytes: newEmoji.hex,
    });
    expect(newMarketRegisterResponse.success).toBe(true);
    const { marketNotFound, flag, gracePeriodOver } = await getRegistrationGracePeriodFlag({
      aptos,
      symbol: newEmoji.emoji,
    });
    expect(marketNotFound).toBeFalsy();
    expect(gracePeriodOver).toBeFalsy();
    expect(flag || (flag && !isRegistrationGracePeriodOver(flag)) === gracePeriodOver);

    if (!gracePeriodOver) {
      await EmojicoinDotFun.Swap.submit({
        aptosConfig: transactionArgs.aptosConfig,
        swapper: registrant,
        inputAmount: 10000n,
        isSell: false,
        marketAddress,
        integratorFeeRateBps: transactionArgs.integratorFeeRateBps,
        integrator: transactionArgs.integrator,
        typeTags: [emojicoin, emojicoinLP],
      });
    }
    const { flag: secondFlag, gracePeriodOver: gracePeriodOverForSure } =
      await getRegistrationGracePeriodFlag({
        aptos,
        symbol: newEmoji.emoji,
      });
    expect(
      secondFlag ||
        (secondFlag && !isRegistrationGracePeriodOver(secondFlag)) === gracePeriodOverForSure
    );
    expect(gracePeriodOverForSure).toBe(true);
    expect(!secondFlag || isRegistrationGracePeriodOver(secondFlag)).toBe(true);
  });

  it("successfully swap buys after the market registrant has ended the grace period", async () => {
    const { flag, gracePeriodOver } = await getRegistrationGracePeriodFlag({
      aptos,
      symbol: emoji.emoji,
    });
    expect(flag || (flag && !isRegistrationGracePeriodOver(flag)) === gracePeriodOver);
    if (!gracePeriodOver) {
      await EmojicoinDotFun.Swap.submit({
        ...transactionArgs,
        swapper: registrant,
        inputAmount: 10000n,
        isSell: false,
      });
    }

    const nonRegistrantSwapResponse = await EmojicoinDotFun.Swap.submit({
      ...transactionArgs,
      swapper: nonRegistrantUser,
      inputAmount: 10000n,
      isSell: false,
    });

    expect(nonRegistrantSwapResponse.success).toBe(true);
  });

  it("fails to swap buy before the market registrant has ended the grace period", async () => {
    const newEmoji = SYMBOL_DATA.byStrictName("yo-yo");
    const newMarketRegisterResponse = await EmojicoinDotFun.RegisterMarket.submit({
      aptosConfig: aptos.config,
      registrant,
      emojis: [newEmoji.hex],
      integrator: randomIntegrator.accountAddress,
      options: {
        maxGasAmount: ONE_APT / 100,
        gasUnitPrice: 100,
      },
    });
    expect(newMarketRegisterResponse.success).toBe(true);
    const { marketAddress, emojicoin, emojicoinLP } = getEmojicoinMarketAddressAndTypeTags({
      symbolBytes: newEmoji.hex,
    });
    const failedSwap = EmojicoinDotFun.Swap.submit({
      aptosConfig: transactionArgs.aptosConfig,
      swapper: nonRegistrantUser,
      inputAmount: 10000n,
      isSell: false,
      marketAddress,
      integratorFeeRateBps: transactionArgs.integratorFeeRateBps,
      integrator: transactionArgs.integrator,
      typeTags: [emojicoin, emojicoinLP],
    });
    await expect(failedSwap).rejects.toThrow();
  });

  it("correctly sees the grace period hasn't ended", async () => {
    const newEmoji = SYMBOL_DATA.byStrictName("yawning face");
    const newMarketRegisterResponse = await EmojicoinDotFun.RegisterMarket.submit({
      aptosConfig: aptos.config,
      registrant,
      emojis: [newEmoji.hex],
      integrator: randomIntegrator.accountAddress,
      options: {
        maxGasAmount: ONE_APT / 100,
        gasUnitPrice: 100,
      },
    });
    expect(newMarketRegisterResponse.success).toBe(true);
    const { marketNotFound, gracePeriodOver } = await getRegistrationGracePeriodFlag({
      aptos,
      symbol: newEmoji.emoji,
    });
    expect(marketNotFound).toBe(false);
    expect(gracePeriodOver).toBe(false);
  });
});
