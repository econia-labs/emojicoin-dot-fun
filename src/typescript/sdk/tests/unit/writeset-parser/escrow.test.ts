// cspell: disable

import { isUserTransactionResponse, type UserTransactionResponse } from "@aptos-labs/ts-sdk";

import { isWriteSetChangeWriteResource } from "../../../src";
import { findEscrowsInTxn, isEscrowWritesetChange } from "../../../src/utils/arena/escrow";
import TransactionJson from "./json/escrow-txn.json";

const EscrowTxnResponse = TransactionJson as UserTransactionResponse;
describe("escrow resource parser tests", () => {
  it("finds an escrow resource in a transaction's writeset changes", () => {
    const changes = EscrowTxnResponse.changes
      .filter(isWriteSetChangeWriteResource)
      .filter(isEscrowWritesetChange);
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

  it("finds an escrow resource in a transaction response and converts it correctly", () => {
    expect(isUserTransactionResponse(EscrowTxnResponse)).toBe(true);
    const response = EscrowTxnResponse;
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
      ],
    });
  });
});
