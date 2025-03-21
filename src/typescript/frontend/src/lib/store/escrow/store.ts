import { findEscrows, type UserEscrow } from "@sdk/utils/arena/escrow";
import { createStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Option } from "@sdk/utils";
import { type MeleeID } from "@sdk-types";
import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";

type UserAddress = `0x${string}`;
type EscrowMap = Map<MeleeID, UserEscrow>;

export type EscrowState = {
  escrows: Map<UserAddress, EscrowMap>;
  processedTransactions: Set<bigint>;
};

export type EscrowActions = {
  ensureUserInMap: (user: `0x${string}`) => void;
  push: (user: `0x${string}`, ...escrows: UserEscrow[]) => void;
  pushTransactions: (...txns: UserTransactionResponse[]) => void;
};

export type EscrowStore = EscrowActions & EscrowState;

const initialEscrowState = (): EscrowState => ({
  escrows: new Map(),
  processedTransactions: new Set(),
});

/**
 * // trigger cpslel here to remove/update this doc comment when finished w the initial impl
 *
 * The flow for this store:
 *
 * 1. User sends a transaction successfully.
 * 2. The response is pushed an an array of user transaction responses
 * 3. It's parsed and processed accordingly, against a map of users: on-chain state.
 *    - Storing against a user map allows this store to be agnostic to the currently connected
 *      address and merely parse/update { [user]: state }
 *    - Then components that use this data just look up the user's state in a map, with the key
 *      being the currently connected user/account address
 * 4. Note that the response contains two useful things: the events and the writeset changes
 *    For escrows in particular, the writeset is more useful, as the user escrow isn't updated in
 *    events.
 */
export const createEscrowStore = () =>
  createStore<EscrowStore>()(
    immer((set, get) => ({
      ...initialEscrowState(),
      ensureUserInMap(user) {
        if (!get().escrows.has(user)) {
          set((state) => {
            console.log("setting the user to empty map?", user);
            state.escrows.set(user, new Map());
          });
        }
      },
      pushTransactions(...txns) {
        txns.forEach((escrow) => {
          if (get().processedTransactions.has(BigInt(escrow.version))) {
            console.log("has already?", Array.from(get().processedTransactions), escrow.version);
          }
        });
        txns
          .filter(({ version }) => !get().processedTransactions.has(BigInt(version)))
          .flatMap(findEscrows)
          .forEach((escrow) => {
            get().push(escrow.user, escrow);
            set((state) => {
              console.log("adding version", escrow);
              state.processedTransactions.add(escrow.version);
            });
          });
      },
      push(user, ...newEscrows) {
        get().ensureUserInMap(user);
        set((state) => {
          const userEscrows = Option(state.escrows.get(user)).expect(
            "User should exist in the map"
          );

          newEscrows
            .filter((escrow) => user === escrow.user)
            .forEach((escrow) => {
              console.log("got escrows for matching user!!!");
              const esc = userEscrows.get(escrow.meleeID);
              if (esc) {
                console.log("esc exists", esc);
              } else {
                console.log("esc doesnt exist", esc);
              }
            });

          newEscrows
            .filter((escrow) => user === escrow.user)
            .forEach((escrow) =>
              Option(userEscrows.get(escrow.meleeID)).mapOrElse(
                () => {
                  console.log("looks like it's trying to set it here?", escrow);
                  userEscrows.set(escrow.meleeID, escrow);
                },
                (existingEscrow) => {
                  console.log("existing alerady?", existingEscrow.version, escrow.version);
                  if (existingEscrow.version < escrow.version) {
                    existingEscrow = escrow;
                  }
                }
              )
            );
        });
      },
    }))
  );
