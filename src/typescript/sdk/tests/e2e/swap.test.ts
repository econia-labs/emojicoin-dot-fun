import {
  AccountAddress,
  isFeePayerSignature,
  type TypeTag,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { ONE_APT } from "../../src/const";
import { SYMBOL_DATA } from "../../src";
import { EmojicoinDotFun } from "../../src/emojicoin_dot_fun";
import { getPublishHelpers } from "../utils";
import {
  getEmojicoinMarketAddressAndTypeTags,
  getRegistrationGracePeriodFlag,
  isRegistrationGracePeriodOver,
} from "../../src/markets/utils";
import {
  getAptBalanceFromChanges,
  getCoinBalanceFromChanges,
  getFeeStatement,
} from "../../src/utils/parse-changes-for-balances";
import { getFundedAccount } from "../utils/test-accounts";

jest.setTimeout(90000);

describe("tests the swap functionality", () => {
  const { aptos } = getPublishHelpers();
  const randomIntegrator = getFundedAccount("001");
  const registrant = getFundedAccount("002");
  const nonRegistrantUser = getFundedAccount("003");
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
    integratorFeeRateBPs: 0,
    minOutputAmount: 1n,
    typeTags: [pooEmojicoin, pooLPCoin] as [TypeTag, TypeTag],
  };

  beforeAll(async () => {
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

  it("successfully swap buys, checks APT balance", async () => {
    const aptBalanceBefore = getAptBalanceFromChanges(
      registerMarketResponse,
      registrant.accountAddress
    )!;

    const realBalance = BigInt(
      await aptos.getAccountAPTAmount({
        accountAddress: registrant.accountAddress,
        minimumLedgerVersion: Number(registerMarketResponse.version),
      })
    );

    expect(aptBalanceBefore).toBe(realBalance);

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

    // Manually calculate the expected balance by accounting for a possible storage refund.
    const sig = swapResponse.signature;
    const hasFeePayer = sig && isFeePayerSignature(sig);
    const feePayerAddress = hasFeePayer
      ? AccountAddress.from(sig.fee_payer_address)
      : registrant.accountAddress;
    const storageRefund = AccountAddress.from(feePayerAddress).equals(registrant.accountAddress)
      ? getFeeStatement(swapResponse).storageFeeRefundOctas
      : 0n;
    const calculated = aptBalanceBefore - (gasUsed + inputAmount) + storageRefund;
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
        integratorFeeRateBPs: transactionArgs.integratorFeeRateBPs,
        integrator: transactionArgs.integrator,
        minOutputAmount: 1n,
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
      integratorFeeRateBPs: transactionArgs.integratorFeeRateBPs,
      integrator: transactionArgs.integrator,
      minOutputAmount: 1n,
      typeTags: [emojicoin, emojicoinLP],
    });
    await expect(failedSwap).rejects.toThrow();
  });

  it("sees the grace period hasn't ended", async () => {
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
