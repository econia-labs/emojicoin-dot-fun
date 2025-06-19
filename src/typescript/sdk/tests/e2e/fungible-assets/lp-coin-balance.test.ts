// cspell:word kolorist
// cspell:word funder

import type { AccountAddressInput, UserTransactionResponse } from "@aptos-labs/ts-sdk";
import {
  Account,
  AccountAddress,
  Ed25519PrivateKey,
  pairedFaMetadataAddress,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import { lightBlue, yellow } from "kolorist";

import type { SymbolEmoji } from "../../../src";
import {
  APTOS_COIN_TYPE_STRING,
  ensureTypeTagStruct,
  fetchFungibleAssetMetadata,
  fetchPrimaryStore,
  findMap,
  getBalanceFromWriteSetChanges,
  getMarketAddress,
  getPrimaryFungibleStoreAddress,
  isWriteSetChangeWriteResource,
  maxBigInt,
  maybeGetMatchingPrimaryStore,
  maybeGetUserCoinStore,
  MigrateToFungibleStore,
  ONE_APT,
  ONE_APT_BIGINT,
  toAccountAddress,
  toEmojicoinPairedFAMetadataAddresses,
  toEmojicoinPrimaryFungibleStores,
  toEmojicoinTypes,
  TransferCoins,
  zip,
} from "../../../src";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import { fetchUserLiquidityPools, waitForEmojicoinIndexer } from "../../../src/indexer-v2";
import { EXACT_TRANSITION_INPUT_AMOUNT } from "../../utils";
import { getFundedAccount, getFundedAccounts } from "../../utils/test-accounts";

jest.setTimeout(60000);

describe("tests to ensure the emojicoin indexer properly records emojicoin lp coin balances", () => {
  const registrants = getFundedAccounts("088", "089", "090", "091", "092", "093");
  const funderForRandomDerivedAccount = getFundedAccount("094");
  const marketSymbols: SymbolEmoji[][] = [["🧝"], ["🧝🏿"], ["🧝🏻"], ["🧝🏽"], ["🧝🏾"], ["🧝🏼"]];
  const emojicoin = new EmojicoinClient({ integratorFeeRateBPs: 0 });
  const { aptos } = emojicoin;

  async function buyPastBondingCurveAndCheck(
    registrant: Account,
    symbol: SymbolEmoji[]
  ): Promise<bigint> {
    const res = await emojicoin
      .register(registrant, symbol)
      .then(() => emojicoin.buy(registrant, symbol, EXACT_TRANSITION_INPUT_AMOUNT));

    expect(res.response.success).toBe(true);
    expect(res.swap.model.swap.startsInBondingCurve).toBe(true);
    expect(res.swap.model.swap.resultsInStateTransition).toBe(true);
    expect(res.models.marketLatestStateEvents[0].inBondingCurve).toBe(false);
    return BigInt(res.response.version);
  }

  const getLPMetadataAddress = (marketSymbol: SymbolEmoji[]) => {
    const { marketAddress } = emojicoin.utils.getEmojicoinInfo(marketSymbol);
    const { faEmojicoinLPMetadata } = toEmojicoinPairedFAMetadataAddresses(marketAddress);
    return faEmojicoinLPMetadata;
  };

  const fetchLPCoinBalanceFromGraphQLIndexer = async (
    accountOrAddress: Account | AccountAddressInput,
    marketSymbol: SymbolEmoji[]
  ) => {
    const { marketAddress } = emojicoin.utils.getEmojicoinInfo(marketSymbol);
    const { emojicoinLP } = toEmojicoinTypes(marketAddress);
    const coinType = ensureTypeTagStruct(emojicoinLP).toString();

    return await aptos
      .getAccountCoinAmount({
        accountAddress: toAccountAddress(accountOrAddress),
        coinType,
      })
      .then(BigInt);
  };

  beforeAll(async () => {
    const versions = await Promise.all(
      zip(registrants, marketSymbols).map(([registrant, emojis]) =>
        buyPastBondingCurveAndCheck(registrant, emojis)
      )
    );
    await waitForEmojicoinIndexer(maxBigInt(...versions));
    return true;
  });

  const fetchAndCheckLPBalance = async (
    accountOrAddress: Account | AccountAddressInput,
    marketSymbol: SymbolEmoji[],
    expectedBalance: bigint | "only_check_indexers",
    response: UserTransactionResponse
  ) => {
    await waitForEmojicoinIndexer(response.version);

    const accountAddress = toAccountAddress(accountOrAddress);
    const pools = await fetchUserLiquidityPools({ provider: accountAddress });
    expect(pools).toHaveLength(1);
    const [poolIndexerData] = pools;

    expect(poolIndexerData.transaction.version).toEqual(BigInt(response.version));

    if (expectedBalance !== "only_check_indexers") {
      expect(poolIndexerData.lpCoinBalance).toEqual(expectedBalance);
    }

    // Double check against the GraphQL indexer as a sanity check.
    const lpBalanceFromGraphQL = await fetchLPCoinBalanceFromGraphQLIndexer(
      accountAddress,
      marketSymbol
    );
    expect(lpBalanceFromGraphQL).toEqual(poolIndexerData.lpCoinBalance);

    // As a sanity check, also parse/check the balances in the write sets.
    parseAndCheckLPBalanceFromWriteSets(
      accountAddress,
      marketSymbol,
      poolIndexerData.lpCoinBalance,
      response
    );
  };

  function parseAndCheckLPBalanceFromWriteSets(
    accountOrAddress: Account | AccountAddressInput,
    marketSymbol: SymbolEmoji[],
    expectedBalance: bigint,
    response: UserTransactionResponse
  ) {
    const ownerAddress = toAccountAddress(accountOrAddress);
    const marketAddress = getMarketAddress(marketSymbol);
    const { emojicoinLP } = toEmojicoinTypes(marketAddress);
    const coinType = emojicoinLP;

    // Ensure the main coin parsing utility function works.
    const parsedBalance = getBalanceFromWriteSetChanges({ response, coinType, ownerAddress });
    expect(parsedBalance).toBeDefined();
    expect(parsedBalance).toEqual(expectedBalance);

    // Then, manually find the stores, and ensure the expected one has the balance.
    // That is, ensure that the balance parser found the balance with the expected store type.
    // Note that this is mostly copied from the balance getter function.
    const writeResources = response.changes.filter(isWriteSetChangeWriteResource);
    const { faEmojicoinLPMetadata: metadataAddress } =
      toEmojicoinPairedFAMetadataAddresses(marketAddress);
    const { primaryStoreEmojicoinLP: primaryStoreAddress } = toEmojicoinPrimaryFungibleStores({
      marketAddress,
      ownerAddress,
    });
    const primaryStore = findMap(writeResources, (change) =>
      maybeGetMatchingPrimaryStore({ change, metadataAddress, primaryStoreAddress })
    );
    const coinStore = findMap(writeResources, (change) =>
      maybeGetUserCoinStore({ change, ownerAddress, coinType })
    );

    // By default, the primary store will be used, unless an old version of the Aptos CLI is used.
    // When this is the case, it's prudent to log it to the console to indicate that the store that
    // was found was a coin store, not a primary store.
    if (coinStore) {
      console.warn(lightBlue("[INFO]:"), yellow("Found user's balance in a coin store!"));
      expect(primaryStore).toBeUndefined();
    } else {
      expect(coinStore).toBeUndefined();
    }
  }

  it("provide liquidity", async () => {
    const testIdx = 0;
    const [registrant, symbol] = [registrants[testIdx], marketSymbols[testIdx]];
    const res = await emojicoin.liquidity.provide(registrant, symbol, ONE_APT);
    await waitForEmojicoinIndexer(res.response.version);

    const { liquidity } = res.liquidity.model;
    expect(liquidity.quoteAmount).toEqual(ONE_APT_BIGINT);
    expect(liquidity.lpCoinAmount).not.toEqual(liquidity.quoteAmount); // Avoid false positives.

    // The user has no previous LP coin, so the change in the emitted event is their new balance.
    await fetchAndCheckLPBalance(registrant, symbol, liquidity.lpCoinAmount, res.response);
  });

  it("remove liquidity", async () => {
    const testIdx = 1;
    const [registrant, symbol] = [registrants[testIdx], marketSymbols[testIdx]];
    const provideRes = await emojicoin.liquidity.provide(registrant, symbol, ONE_APT);
    const { liquidity } = provideRes.liquidity.model;
    const lpAmountToRemove = liquidity.lpCoinAmount / 3n;
    const lpBalanceRemaining = liquidity.lpCoinAmount - lpAmountToRemove;
    expect(lpAmountToRemove + lpBalanceRemaining).toEqual(liquidity.lpCoinAmount);
    const removeRes = await emojicoin.liquidity.remove(registrant, symbol, lpAmountToRemove);

    expect(removeRes.liquidity.model.liquidity.lpCoinAmount).toEqual(lpAmountToRemove);
    await fetchAndCheckLPBalance(registrant, symbol, lpBalanceRemaining, removeRes.response);
  });

  it("properly records the final lp coin balance, not the delta", async () => {
    // Register like the simple provide liquidity event test above.
    const testIdx = 2;
    const [registrant, symbol] = [registrants[testIdx], marketSymbols[testIdx]];
    const res = await emojicoin.liquidity.provide(registrant, symbol, ONE_APT);
    await waitForEmojicoinIndexer(res.response.version);

    const { liquidity } = res.liquidity.model;
    expect(liquidity.quoteAmount).toEqual(ONE_APT_BIGINT);
    const initialBalance = liquidity.lpCoinAmount;
    expect(initialBalance).not.toEqual(liquidity.quoteAmount); // Avoid false positives.

    // Now transfer some of the lp coin balance out to a random address.
    const randomAddress = Account.generate().accountAddress;
    const transferAmount = initialBalance / 10n;
    const lpBalanceAfterTransfer = initialBalance - transferAmount;
    // Ensure bigint to properly floor the number.
    expect(transferAmount + lpBalanceAfterTransfer).toEqual(liquidity.lpCoinAmount);

    // Now transfer the LP coin.
    await aptos.fungibleAsset
      .transferFungibleAsset({
        sender: registrant,
        fungibleAssetMetadataAddress: getLPMetadataAddress(symbol),
        recipient: randomAddress,
        amount: transferAmount,
      })
      .then((transaction) =>
        aptos.transaction.signAndSubmitTransaction({ signer: registrant, transaction })
      )
      .then((res) => aptos.waitForTransaction({ transactionHash: res.hash }))
      .then((res) => {
        expect(res.success).toBe(true);
        return res;
      });

    // Now provide more liquidity to get more LP coin.
    const provide2 = await emojicoin.liquidity.provide(registrant, symbol, ONE_APT / 5);
    const additionalAmount = provide2.liquidity.model.liquidity.lpCoinAmount;
    expect(additionalAmount).not.toEqual(transferAmount); // Avoid false positives.

    const expectedFinalBalance = lpBalanceAfterTransfer + additionalAmount;
    await fetchAndCheckLPBalance(registrant, symbol, expectedFinalBalance, provide2.response);
  });

  it("gets the primary store correctly, verified by fetching on-chain", async () => {
    const testIdx = 3;
    const [registrant, symbol] = [registrants[testIdx], marketSymbols[testIdx]];
    const res = await emojicoin.liquidity.provide(registrant, symbol, ONE_APT);
    await waitForEmojicoinIndexer(res.response.version);

    const marketAddress = getMarketAddress(symbol);
    const { emojicoinLP } = toEmojicoinTypes(marketAddress);
    const coinType = ensureTypeTagStruct(emojicoinLP);

    // Ensure the user has migrated to using a fungible store.
    await MigrateToFungibleStore.submit({
      aptosConfig: emojicoin.aptos.config,
      account: registrant,
      typeTags: [coinType],
    });

    const primaryStore = await fetchPrimaryStore({ user: registrant.accountAddress, coinType });
    const offChainDerivedPrimaryStore = getPrimaryFungibleStoreAddress({
      ownerAddress: registrant.accountAddress,
      metadataAddress: pairedFaMetadataAddress(coinType.toString()),
    });

    expect(primaryStore.toString()).toEqual(offChainDerivedPrimaryStore.toString());
  });

  it("properly gets all balances in the long happy path for all addresses having leading zeros", async () => {
    const symbol: SymbolEmoji[] = ["👫🏻"];
    const expected = {
      marketAddress: "0x0321cb335a38022848c39372c7b3894e41c39c57aac613ac240824081a644630",
      // Note that the `emojicoinLP` coin store was used here, not the `emojicoin` store.
      metadataAddress: "0x01e8cdb38d8ddd7263aa019daa1ed57f591a5afa81d80b7764865c1b035b433c",
      ownerAddress: "0x029665e58596cb0b1e7e1efb033d4371505aa26ee3a47c21ae4462098207d6c0",
      primaryStore: "0x0be8f6131ed4c8b8417eee3b5cf3f87012649b626451f01dd3d6c377a33753ea",
    } as const;

    const user = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(
        PrivateKey.formatPrivateKey(
          "0xca4cb094c44bd307a4589892e8c2a92bd64042dacfbdaa0445a91ff875d7f327",
          PrivateKeyVariants.Ed25519
        )
      ),
    });
    const { emojicoinLP } = toEmojicoinTypes(expected.marketAddress);
    const coinType = ensureTypeTagStruct(emojicoinLP).toString();

    expect(user.accountAddress.toStringLong()).toEqual(expected.ownerAddress);
    expect(getMarketAddress(symbol).toStringLong()).toEqual(expected.marketAddress);
    expect(pairedFaMetadataAddress(coinType).toStringLong()).toEqual(expected.metadataAddress);
    expect(
      getPrimaryFungibleStoreAddress({
        ownerAddress: user.accountAddress,
        metadataAddress: pairedFaMetadataAddress(coinType),
      }).toStringLong()
    ).toEqual(expected.primaryStore);

    // ---------------------------------------------------------------------------------------------
    // Then, verify on-chain that these are actually the primary store and metadata addresses.
    // ---------------------------------------------------------------------------------------------

    // First, fund the account, since it's not part of the pre-funded group.
    await TransferCoins.submit({
      aptosConfig: emojicoin.aptos.config,
      from: funderForRandomDerivedAccount,
      to: user.accountAddress,
      typeTags: [APTOS_COIN_TYPE_STRING],
      amount: EXACT_TRANSITION_INPUT_AMOUNT + ONE_APT_BIGINT * 5n,
    });

    const version = await buyPastBondingCurveAndCheck(user, symbol);

    // Make sure the user actually has some emojicoinLP.
    await emojicoin.liquidity.provide(user, symbol, 1000n);

    await waitForEmojicoinIndexer(version);

    await MigrateToFungibleStore.submit({
      aptosConfig: emojicoin.aptos.config,
      account: user,
      typeTags: [coinType],
    });

    const primaryStore = await fetchPrimaryStore({ user: user.accountAddress, coinType });
    expect(AccountAddress.from(primaryStore).toStringLong()).toEqual(expected.primaryStore);

    const metadataOnChain = await fetchFungibleAssetMetadata(primaryStore);
    const { inner } = metadataOnChain;
    expect(AccountAddress.from(inner).toStringLong()).toEqual(expected.metadataAddress);

    // ---------------------------------------------------------------------------------------------
    // Then, provide liquidity and check the balance again.
    // Note that nothing this is all redundant when the CLI is running a node that already has the
    // fungible asset migration feature enabled by default.
    // ---------------------------------------------------------------------------------------------
    const res = await emojicoin.liquidity.provide(user, symbol, ONE_APT / 10);
    await waitForEmojicoinIndexer(res.response.version);

    await fetchAndCheckLPBalance(user.accountAddress, symbol, "only_check_indexers", res.response);
  });
});
