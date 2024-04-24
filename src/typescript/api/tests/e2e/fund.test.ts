import { Account, isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { getAptosClient, ONE_APT } from "../../src";

jest.setTimeout(10000);

describe("tests a simple faucet fund account request", () => {
  const { aptos } = getAptosClient();
  const account = Account.generate();

  beforeAll(async () => {
    await aptos.fundAccount({ accountAddress: account.accountAddress, amount: ONE_APT });
  });

  it("should have a balance of 2 APT", async () => {
    const previousBalance = await aptos.getAccountAPTAmount({
      accountAddress: account.accountAddress,
    });

    const fundResponse = await aptos.fundAccount({
      accountAddress: account.accountAddress,
      amount: ONE_APT,
    });
    const balance = await aptos.getAccountAPTAmount({
      accountAddress: account.accountAddress,
      minimumLedgerVersion: Number(fundResponse.version) + 1,
    });

    expect(balance).toBe(ONE_APT * 2);
    expect(balance - previousBalance).toBe(ONE_APT);
    expect(isUserTransactionResponse(fundResponse)).toBe(true);
  });
});
