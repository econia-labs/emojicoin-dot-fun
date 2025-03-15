import { createStore } from "zustand";
import { immer } from "zustand/middleware/immer";

export type EscrowState = {};

export type EscrowActions = {};

export type EscrowStore = EscrowActions & EscrowState;

const initialEscrowState = (): EscrowState => ({});

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
    }))
  );
