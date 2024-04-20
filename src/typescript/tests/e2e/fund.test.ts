import {
  Account,
  AccountAddress,
  isUserTransactionResponse,
  type EntryFunctionPayloadResponse,
} from "@aptos-labs/ts-sdk";
import { getAptosClient } from "../../src/helpers/aptos-client";

import { fundAccounts } from "../../src/helpers/fund-accounts";

import { ONE_APT } from "../../src/utils";

jest.setTimeout(10000);

describe("tests a simple faucet fund account request", () => {
  const { aptos } = getAptosClient();
  const account = Account.generate();

  beforeAll(async () => {
    await fundAccounts(aptos, [account]);
  });

  it("should have a balance of 2 APT", async () => {
    const previousBalance = await aptos.getAccountAPTAmount({
      accountAddress: account.accountAddress,
    });

    // Sends two fund requests to the first account and splits it up between the rest.
    const fundResponse = await fundAccounts(aptos, [account]);
    const gasUsed = Number(fundResponse.gas_unit_price) * Number(fundResponse.gas_used);

    const balance = await aptos.getAccountAPTAmount({
      accountAddress: account.accountAddress,
      minimumLedgerVersion: Number(fundResponse.version),
    });

    const payload = fundResponse.payload as EntryFunctionPayloadResponse;
    expect(payload.arguments[0]).toStrictEqual([]);
    const expectedBalance = previousBalance + ONE_APT * 2 - gasUsed;

    expect(balance).toBe(expectedBalance);
    expect(isUserTransactionResponse(fundResponse)).toBe(true);
  });

  it("should have a balance of 1 APT", async () => {
    const accountTwo = Account.generate();

    const previousBalance = await aptos.getAccountAPTAmount({
      accountAddress: account.accountAddress,
    });

    // Sends two fund requests to the first account and splits it up between the rest.
    const fundResponse = await fundAccounts(aptos, [account, accountTwo]);
    const gasUsed = Number(fundResponse.gas_unit_price) * Number(fundResponse.gas_used);

    const balance = await aptos.getAccountAPTAmount({
      accountAddress: account.accountAddress,
      minimumLedgerVersion: Number(fundResponse.version),
    });

    const payload = fundResponse.payload as EntryFunctionPayloadResponse;
    const [addresses, amounts] = payload.arguments;
    const addressArg = AccountAddress.from(addresses[0]);
    expect(addresses).toHaveLength(1);
    expect(amounts).toHaveLength(1);
    expect(addressArg.toStringLong()).toStrictEqual(accountTwo.accountAddress.toStringLong());
    expect(Number(amounts[0])).toStrictEqual(ONE_APT);

    expect(balance).toBe(previousBalance + ONE_APT - gasUsed);
    expect(isUserTransactionResponse(fundResponse)).toBe(true);
  });
});
