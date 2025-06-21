// cspell: disable

import { isUserTransactionResponse, type UserTransactionResponse } from "@aptos-labs/ts-sdk";

import { ensureTypeTagStruct, isWriteSetChangeWriteResource } from "../../../src";
import { findEscrowsInTxn, isEscrowWriteSetChange } from "../../../src/utils/arena/escrow";
import TransactionJsonCoinStores from "./json/escrow-txn-coin-stores.json";
import TransactionJsonFungibleAssets from "./json/escrow-txn-fungible-assets.json";

const EscrowTxnResponseCoinStores = TransactionJsonCoinStores as UserTransactionResponse;
const EscrowTxnResponseFungibleAssets = TransactionJsonFungibleAssets as UserTransactionResponse;

describe("escrow resource parser tests", () => {
  it("finds an escrow resource in a transaction's writeset changes", () => {
    const changes = EscrowTxnResponseCoinStores.changes
      .filter(isWriteSetChangeWriteResource)
      .filter(isEscrowWriteSetChange);
    expect(changes).toHaveLength(1);
    const resource = changes.pop()!;
    expect(resource).toEqual({
      type: "write_resource",
      address: "0xffc117086980d34dc3b5a42cb407ed888f60623f46021f35c2ca522ea13cc961",
      state_key_hash: "0xc68434cd96ddfdfa6fd88573a023f499ada2bade2fc0216e1bdcb9113ec038d5",
      data: {
        type: `0xf000d910b99722d201c6cf88eb7d1112b43475b9765b118f289b5d65d919000d::emojicoin_arena::
        Escrow<0xbd9ababccfd739d8bf39409d44a0868ba29495bf57c0b122c15027cf224ca78c::coin_factory::Emo
        jicoin, 0xbd9ababccfd739d8bf39409d44a0868ba29495bf57c0b122c15027cf224ca78c::coin_factory::Em
        ojicoinLP, 0xbd8e88964b5f5b576819b9a3651a7818c1a2bad2bb5614bc0526dac104bf15cc::coin_factory:
        :Emojicoin, 0xbd8e88964b5f5b576819b9a3651a7818c1a2bad2bb5614bc0526dac104bf15cc::coin_factory
        ::EmojicoinLP>`.replaceAll(/\n */g, ""),
        data: {
          emojicoin_0: {
            value: "12097558542607",
          },
          emojicoin_1: {
            value: "0",
          },
          match_amount: "0",
          melee_id: "2",
        },
      },
    });
  });

  it("finds an escrow resource in a transaction response and converts it correctly (coin stores)", () => {
    expect(isUserTransactionResponse(EscrowTxnResponseCoinStores)).toBe(true);
    const response = EscrowTxnResponseCoinStores;
    const escrows = findEscrowsInTxn(response);
    expect(escrows).toHaveLength(1);
    const escrow = escrows.pop()!;
    expect({
      ...escrow,
      coinTypes: escrow.coinTypes.map((ct) => ct.toString()),
    }).toEqual({
      version: BigInt(response.version),
      user: "0xffc117086980d34dc3b5a42cb407ed888f60623f46021f35c2ca522ea13cc961",
      meleeID: 2n,
      emojicoin0: 12097558542607n,
      emojicoin1: 0n,
      matchAmount: 0n,
      open: true,
      lockedIn: false,
      coinTypes: [
        "0xbd9ababccfd739d8bf39409d44a0868ba29495bf57c0b122c15027cf224ca78c::coin_factory::Emojicoin",
        "0xbd9ababccfd739d8bf39409d44a0868ba29495bf57c0b122c15027cf224ca78c::coin_factory::EmojicoinLP",
        "0xbd8e88964b5f5b576819b9a3651a7818c1a2bad2bb5614bc0526dac104bf15cc::coin_factory::Emojicoin",
        "0xbd8e88964b5f5b576819b9a3651a7818c1a2bad2bb5614bc0526dac104bf15cc::coin_factory::EmojicoinLP",
      ]
        .map(ensureTypeTagStruct)
        .map((v) => v.toString()),
    });
  });

  it("finds an escrow resource in a transaction response and converts it correctly (fungible assets)", () => {
    expect(isUserTransactionResponse(EscrowTxnResponseFungibleAssets)).toBe(true);
    const response = EscrowTxnResponseFungibleAssets;
    const escrows = findEscrowsInTxn(response);
    expect(escrows).toHaveLength(1);
    const escrow = escrows.pop()!;
    expect({
      ...escrow,
      coinTypes: escrow.coinTypes.map((ct) => ct.toString()),
    }).toEqual({
      version: BigInt(response.version),
      user: "0xbad225596d685895aa64d92f4f0e14d2f9d8075d3b8adf1e90ae6037f1fcbabe",
      meleeID: 2n,
      emojicoin0: 0n,
      emojicoin1: 139962905030918n,
      matchAmount: 0n,
      open: true,
      lockedIn: false,
      coinTypes: [
        "0x58f40ecd236f430c28e30699bf8a7f478c6e4efe9c6d6a2227a86f41e1f0e44::coin_factory::Emojicoin",
        "0x58f40ecd236f430c28e30699bf8a7f478c6e4efe9c6d6a2227a86f41e1f0e44::coin_factory::EmojicoinLP",
        "0x674420b88044de47849a322db8e91dd8476d6ead2923d3fe52ced655754b2c6b::coin_factory::Emojicoin",
        "0x674420b88044de47849a322db8e91dd8476d6ead2923d3fe52ced655754b2c6b::coin_factory::EmojicoinLP",
      ]
        .map(ensureTypeTagStruct)
        .map((v) => v.toString()),
    });
  });
});
