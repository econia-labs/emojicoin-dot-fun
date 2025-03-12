import { type Uint64String, type AccountAddressString } from "../emojicoin_dot_fun";
import type JsonTypes from "./json-types";

export type ArenaJsonTypes = {
  ExchangeRate: {
    base: Uint64String;
    quote: Uint64String;
  };

  BothEmojicoinExchangeRates: {
    emojicoin_0_exchange_rate: ArenaJsonTypes["ExchangeRate"];
    emojicoin_1_exchange_rate: ArenaJsonTypes["ExchangeRate"];
  };

  /**
   * #[event]
   * ___::emojicoin_arena::Melee
   */
  ArenaMeleeEvent: {
    melee_id: Uint64String;
    emojicoin_0_market_address: AccountAddressString;
    emojicoin_1_market_address: AccountAddressString;
    start_time: Uint64String;
    duration: Uint64String;
    max_match_percentage: Uint64String;
    max_match_amount: Uint64String;
    available_rewards: Uint64String;
  };

  /**
   * #[event]
   * ___::emojicoin_arena::Enter
   */
  ArenaEnterEvent: {
    user: AccountAddressString;
    melee_id: Uint64String;
    input_amount: Uint64String;
    quote_volume: Uint64String;
    integrator_fee: Uint64String;
    match_amount: Uint64String;
    emojicoin_0_proceeds: Uint64String;
    emojicoin_1_proceeds: Uint64String;
  } & JsonTypes["BothEmojicoinExchangeRates"];

  /**
   * #[event]
   * ___::emojicoin_arena::Exit
   */
  ArenaExitEvent: {
    user: AccountAddressString;
    melee_id: Uint64String;
    tap_out_fee: Uint64String;
    emojicoin_0_proceeds: Uint64String;
    emojicoin_1_proceeds: Uint64String;
  } & JsonTypes["BothEmojicoinExchangeRates"];

  /**
   * #[event]
   * ___::emojicoin_arena::Swap
   */
  ArenaSwapEvent: {
    user: AccountAddressString;
    melee_id: Uint64String;
    quote_volume: Uint64String;
    integrator_fee: Uint64String;
    emojicoin_0_proceeds: Uint64String;
    emojicoin_1_proceeds: Uint64String;
  } & JsonTypes["BothEmojicoinExchangeRates"];

  /**
   * #[event]
   * ___::emojicoin_arena::VaultBalanceUpdate
   */
  ArenaVaultBalanceUpdateEvent: {
    new_balance: Uint64String;
  };

  /**
   * Resource/struct
   * ___::emojicoin_arena::Registry
   */
  ArenaRegistry: {
    n_melees: Uint64String;
    vault_address: AccountAddressString;
    vault_balance: Uint64String;
    next_melee_duration: Uint64String;
    next_melee_available_rewards: Uint64String;
    next_melee_max_match_percentage: Uint64String;
    next_melee_max_match_amount: Uint64String;
  };
};
