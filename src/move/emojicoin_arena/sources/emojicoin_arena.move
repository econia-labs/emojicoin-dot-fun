// cspell:word funder
// cspell:word unexited
module arena::emojicoin_arena {

    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event;
    use aptos_framework::randomness::Self;
    use aptos_framework::timestamp;
    use aptos_std::math64::min;
    use aptos_std::smart_table::{Self, SmartTable};
    use aptos_std::type_info;
    use arena::pseudo_randomness;
    use emojicoin_dot_fun::emojicoin_dot_fun::{Self, MarketMetadata};
    use std::option::Self;
    use std::signer;

    /// Signer does not correspond to arena account.
    const E_NOT_ARENA: u64 = 0;
    /// User's melee escrow has nonzero emojicoin 0 balance.
    const E_ENTER_COIN_BALANCE_0: u64 = 1;
    /// User's melee escrow has nonzero emojicoin 1 balance.
    const E_ENTER_COIN_BALANCE_1: u64 = 2;
    /// User did not elect to lock in even though they've been matched since their most recent
    /// deposit into an empty escrow.
    const E_TOP_OFF_MUST_LOCK_IN: u64 = 3;
    /// Provided escrow coin type is invalid.
    const E_INVALID_ESCROW_COIN_TYPE: u64 = 4;
    /// User has no escrow resource.
    const E_NO_ESCROW: u64 = 5;
    /// Swapper has no funds in escrow to swap.
    const E_SWAP_NO_FUNDS: u64 = 6;
    /// User has no funds in escrow to withdraw.
    const E_EXIT_NO_FUNDS: u64 = 7;

    const MAX_PERCENTAGE: u64 = 100;
    const SHIFT_Q64: u8 = 64;
    const NULL_ADDRESS: address = @0x0;

    /// Resource account address seed for the registry.
    const REGISTRY_SEED: vector<u8> = b"Arena registry";

    /// Flat integrator fee.
    const INTEGRATOR_FEE_RATE_BPS: u8 = 100;
    const INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE: u8 = 50;

    // Default parameters for new melees.
    const DEFAULT_DURATION: u64 = 20 * 3_600_000_000;
    const DEFAULT_AVAILABLE_REWARDS: u64 = 1000 * 100_000_000;
    const DEFAULT_MAX_MATCH_PERCENTAGE: u64 = 50;
    const DEFAULT_MAX_MATCH_AMOUNT: u64 = 5 * 100_000_000;

    struct Nil has drop, store {}

    struct Melee has store {
        /// 1-indexed for conformity with emojicoin market ID indexing.
        melee_id: u64,
        /// Metadata for market with lower market ID comes first.
        market_metadatas: vector<MarketMetadata>,
        /// In microseconds.
        start_time: u64,
        /// How long melee lasts after start time.
        duration: u64,
        /// Max percentage of user's input amount to match in octas, when locking in.
        max_match_percentage: u64,
        /// Maximum amount of APT to match in octas, when locking in.
        max_match_amount: u64,
        /// Amount of rewards that are available to claim for this melee, measured in octas, and
        /// conditional on vault balance. Reset to 0 when cranking the schedule.
        available_rewards: u64,
        /// All entrants who have entered the melee, used as a set.
        all_entrants: SmartTable<address, Nil>,
        /// Active entrants in the melee, used as a set.
        active_entrants: SmartTable<address, Nil>,
        /// Entrants who have exited the melee, used as a set.
        exited_entrants: SmartTable<address, Nil>,
        /// Entrants who have locked in, used as a set. If user exits before the melee ends they are
        /// removed from this set. If they exit after the melee ends, they are not removed.
        locked_in_entrants: SmartTable<address, Nil>,
        /// Number of melee-specific swaps.
        n_swaps: u64,
        /// Volume of melee-specific swaps in octas.
        swaps_volume: u128,
        /// Amount of emojicoin 0 locked in all melee escrows for the melee.
        emojicoin_0_locked: u64,
        /// Amount of emojicoin 1 locked in all melee escrows for the melee.
        emojicoin_1_locked: u64,
        /// `TopExits` for the `Melee`.
        top_exits: TopExits
    }

    struct Registry has key {
        /// A map of each `Melee`'s `melee_id` to the `Melee` itself.
        melees_by_id: SmartTable<u64, Melee>,
        /// Map from a sorted combination of market IDs (lower ID first) to the `Melee` serial ID.
        melee_ids_by_market_ids: SmartTable<vector<u64>, u64>,
        /// Approves transfers from the vault.
        signer_capability: SignerCapability,
        /// `Melee.duration` for next melee.
        next_melee_duration: u64,
        /// `Melee.available_rewards` for next melee.
        next_melee_available_rewards: u64,
        /// `Melee.max_match_percentage` for next melee.
        next_melee_max_match_percentage: u64,
        /// `Melee.max_match_amount` for next melee.
        next_melee_max_match_amount: u64,
        /// All entrants who have entered a melee.
        all_entrants: SmartTable<address, Nil>,
        /// Number of melee-specific swaps.
        n_swaps: u64,
        /// Volume of melee-specific swaps in octas.
        swaps_volume: u128,
        /// Amount of octas matched. Decremented when a user taps out.
        octas_matched: u64,
        /// `TopExits` across all `Melee`s.
        top_exits: TopExits
    }

    struct Escrow<phantom Coin0, phantom LP0, phantom Coin1, phantom LP1> has key {
        /// Corresponding `Melee.melee_id`.
        melee_id: u64,
        /// Emojicoin 0 holdings.
        emojicoin_0: Coin<Coin0>,
        /// Emojicoin 1 holdings.
        emojicoin_1: Coin<Coin1>,
        /// Number of swaps user has executed during the `Melee`.
        n_swaps: u64,
        /// Volume of user's `Melee`-specific swaps in octas.
        swaps_volume: u128,
        /// Cumulative amount of APT entered into the `Melee` since the most recent deposit into an
        /// empty `Escrow`. Inclusive of total amount matched from locking in since most recent
        /// deposit into an empty `Escrow`. Reset to 0 upon exit.
        octas_entered: u64,
        /// Cumulative amount of APT matched since most recent deposit into an empty `Escrow`, reset
        /// to 0 upon exit. Must be paid back in full when tapping out.
        octas_matched: u64
    }

    struct UserMelees has key {
        /// Set of serial IDs of all `Melee`s the user has entered.
        entered_melee_ids: SmartTable<u64, Nil>,
        /// Set of serial IDs of all `Melee`s the user has exited.
        exited_melee_ids: SmartTable<u64, Nil>,
        /// Set of serial IDs of all `Melee`s the user has entered but not exited.
        unexited_melee_ids: SmartTable<u64, Nil>
    }

    /// The top `Exit`s for either a `Melee` or for all `Melee`s, depending on context:
    /// `by_octas_gain` means highest `ProfitAndLoss.octas_gain`, and `by_octas_growth_q64` means
    /// highest `ProfitAndLoss.octas_growth_q64`. Initialized via `null_top_exits`.
    struct TopExits has copy, drop, store {
        by_octas_gain: Exit,
        by_octas_growth_q64: Exit
    }

    #[event]
    /// Emitted whenever a user executes a single-route swap into `Escrow`.
    struct Enter has copy, drop, store {
        user: address,
        melee_id: u64,
        input_amount: u64,
        quote_volume: u64,
        match_amount: u64,
        emojicoin_0_proceeds: u64,
        emojicoin_1_proceeds: u64
    }

    #[event]
    /// Emitted whenever a user exits from `Escrow`.
    struct Exit has copy, drop, store {
        user: address,
        melee_id: u64,
        octas_entered: u64,
        octas_matched: u64,
        tap_out_fee: u64,
        emojicoin_0_proceeds: u64,
        emojicoin_1_proceeds: u64,
        profit_and_loss: ProfitAndLoss
    }

    #[event]
    /// Emitted whenever a user executes a double-route swap inside `Escrow`.
    struct Swap has copy, drop, store {
        user: address,
        melee_id: u64,
        quote_volume: u64,
        emojicoin_0_in: u64,
        emojicoin_0_proceeds: u64,
        emojicoin_1_in: u64,
        emojicoin_1_proceeds: u64
    }

    #[event]
    /// Emitted after a user enters, swaps, or exits, representing their final `Escrow` state.
    struct EscrowState has copy, drop, store {
        user: address,
        melee_id: u64,
        emojicoin_0_balance: u64,
        emojicoin_1_balance: u64,
        n_swaps: u64,
        swaps_volume: u128,
        octas_entered: u64,
        octas_matched: u64,
        profit_and_loss: ProfitAndLoss
    }

    #[event]
    /// Emitted after a user enters, swaps, or exits, representing the final `Melee` state for the
    /// corresponding `Melee` (which may be inactive.)
    struct MeleeState has copy, drop, store {
        melee_id: u64,
        available_rewards: u64,
        n_all_entrants: u64,
        n_active_entrants: u64,
        n_exited_entrants: u64,
        n_locked_in_entrants: u64,
        n_swaps: u64,
        swaps_volume: u128,
        emojicoin_0_locked: u64,
        emojicoin_1_locked: u64,
        emojicoin_0_exchange_rate: ExchangeRate,
        emojicoin_1_exchange_rate: ExchangeRate,
        top_exits: TopExits
    }

    #[event]
    /// Emitted after a user enters or exits, representing their final `UserMelees` state.
    struct UserMeleesState has copy, drop, store {
        n_entered_melees: u64,
        n_exited_melees: u64,
        n_unexited_melees: u64
    }

    #[event]
    /// Emitted after a user enters, swaps, or exits, representing the final `Registry` state.
    struct RegistryState has copy, drop, store {
        n_melees: u64,
        n_entrants: u64,
        n_swaps: u64,
        swaps_volume: u128,
        octas_matched: u64,
        top_exits: TopExits
    }

    #[event]
    /// Emitted whenever a new `Melee` starts.
    struct NewMelee has copy, drop, store {
        melee_id: u64,
        market_metadatas: vector<MarketMetadata>,
        start_time: u64,
        duration: u64,
        max_match_percentage: u64,
        max_match_amount: u64,
        available_rewards: u64
    }

    /// Exchange rate between APT and emojicoins.
    struct ExchangeRate has copy, drop, store {
        /// Octas per `quote` emojicoins.
        base: u64,
        /// Emojicoins per `base` octas.
        quote: u64
    }

    /// Based on proceeds when exiting, otherwise based on holdings in escrow.
    struct ProfitAndLoss has copy, drop, store {
        /// Emojicoins effective value, converted to octas at current exchange rate.
        octas_value: u128,
        /// Unrealized gain if `octas_value` is greater than `Escrow.octas_entered`.
        octas_gain: u128,
        /// Unrealized loss if `octas_value` is less than `Escrow.octas_entered`.
        octas_loss: u128,
        /// Ratio of `octas_value` to `Escrow.octas_entered`, as a Q64.
        octas_growth_q64: u128
    }

    #[event]
    /// Emitted whenever the vault balance is updated, except for when the vault is funded by
    /// sending funds directly to the vault address instead of by using the `fund_vault` function.
    struct VaultBalanceUpdate has copy, drop, store {
        new_balance: u64
    }

    public entry fun fund_vault(funder: &signer, amount: u64) acquires Registry {
        let vault_address =
            account::get_signer_capability_address(&Registry[@arena].signer_capability);
        aptos_account::transfer(funder, vault_address, amount);
        emit_vault_balance_update_with_vault_address(vault_address);
    }

    public entry fun set_next_melee_available_rewards(
        arena: &signer, amount: u64
    ) acquires Registry {
        borrow_registry_ref_mut_checked(arena).next_melee_available_rewards = amount;
    }

    public entry fun set_next_melee_duration(arena: &signer, duration: u64) acquires Registry {
        borrow_registry_ref_mut_checked(arena).next_melee_duration = duration;
    }

    public entry fun set_next_melee_max_match_percentage(
        arena: &signer, max_match_percentage: u64
    ) acquires Registry {
        borrow_registry_ref_mut_checked(arena).next_melee_max_match_percentage =
            max_match_percentage;
    }

    public entry fun set_next_melee_max_match_amount(
        arena: &signer, max_match_amount: u64
    ) acquires Registry {
        borrow_registry_ref_mut_checked(arena).next_melee_max_match_amount =
            max_match_amount;
    }

    public entry fun withdraw_from_vault(arena: &signer, amount: u64) acquires Registry {
        let signer_capability_ref =
            &borrow_registry_ref_mut_checked(arena).signer_capability;
        aptos_account::transfer(
            &account::create_signer_with_capability(signer_capability_ref),
            @arena,
            amount
        );
        emit_vault_balance_update_with_singer_capability_ref(signer_capability_ref);
    }

    #[randomness]
    entry fun enter<Coin0, LP0, Coin1, LP1, EscrowCoin>(
        entrant: &signer, input_amount: u64, lock_in: bool
    ) acquires Escrow, Registry, UserMelees {
        let (melee_just_ended, registry_ref_mut, time, n_melees_before_cranking) =
            crank_schedule();
        if (melee_just_ended) return; // Can not enter melee if cranking ends it.

        // Get market addresses for active melee.
        let active_melee_ref_mut =
            registry_ref_mut.melees_by_id.borrow_mut(n_melees_before_cranking);
        let (market_address_0, market_address_1) = market_addresses(active_melee_ref_mut);

        // Create escrow and user melees resources if they don't exist.
        let melee_id = active_melee_ref_mut.melee_id;
        let entrant_address = signer::address_of(entrant);
        if (!exists<Escrow<Coin0, LP0, Coin1, LP1>>(entrant_address)) {
            move_to(
                entrant,
                Escrow<Coin0, LP0, Coin1, LP1> {
                    melee_id,
                    emojicoin_0: coin::zero(),
                    emojicoin_1: coin::zero(),
                    octas_entered: 0,
                    octas_matched: 0,
                    swaps_volume: 0,
                    n_swaps: 0
                }
            );
            if (!exists<UserMelees>(entrant_address)) {
                move_to(
                    entrant,
                    UserMelees {
                        entered_melee_ids: smart_table::new(),
                        exited_melee_ids: smart_table::new(),
                        unexited_melee_ids: smart_table::new()
                    }
                );
            };
        };

        // Verify user has indicated escrow coin type as one of the two emojicoin types. Note that
        // coin types are later type checked during exchange rate calculation inner calls.
        let coin_0_type_info = type_info::type_of<Coin0>();
        let coin_1_type_info = type_info::type_of<Coin1>();
        let escrow_coin_type_info = type_info::type_of<EscrowCoin>();
        let buy_coin_0 =
            if (coin_0_type_info == escrow_coin_type_info) true
            else {
                assert!(
                    escrow_coin_type_info == coin_1_type_info,
                    E_INVALID_ESCROW_COIN_TYPE
                );
                false
            };

        // Verify that user does not split balance between the two emojicoins.
        let escrow_ref_mut = &mut Escrow<Coin0, LP0, Coin1, LP1>[entrant_address];
        if (buy_coin_0)
            assert!(
                coin::value(&escrow_ref_mut.emojicoin_1) == 0, E_ENTER_COIN_BALANCE_1
            )
        else
            assert!(
                coin::value(&escrow_ref_mut.emojicoin_0) == 0, E_ENTER_COIN_BALANCE_0
            );

        // Verify that if user has been matched since their most recent deposit into an empty
        // escrow, they lock in again.
        if (escrow_ref_mut.octas_matched > 0) assert!(lock_in, E_TOP_OFF_MUST_LOCK_IN);

        // Match a portion of user's contribution if they elect to lock in, and if there are any
        // available rewards to match.
        let match_amount =
            if (lock_in) {
                let match_amount =
                    match_amount(
                        input_amount,
                        escrow_ref_mut,
                        active_melee_ref_mut,
                        registry_ref_mut,
                        time
                    );
                if (match_amount > 0) {

                    // Transfer APT to entrant.
                    let signer_capability_ref = &registry_ref_mut.signer_capability;
                    aptos_account::transfer(
                        &account::create_signer_with_capability(signer_capability_ref),
                        entrant_address,
                        match_amount
                    );
                    emit_vault_balance_update_with_singer_capability_ref(
                        signer_capability_ref
                    );

                    // Update melee state.
                    active_melee_ref_mut.melee_available_rewards_decrement(match_amount);
                    active_melee_ref_mut.melee_locked_in_entrants_add_if_not_contains(
                        entrant_address
                    );

                    // Update registry state.
                    registry_ref_mut.registry_octas_matched_increment(match_amount);

                    // Update escrow state.
                    escrow_ref_mut.escrow_octas_matched_increment(match_amount);

                };

                match_amount

            } else 0;

        // Execute a swap then immediately move funds into escrow, updating total emojicoin locked
        // values based on side.
        let input_amount_after_matching = input_amount + match_amount;
        let (emojicoin_0_proceeds, emojicoin_1_proceeds) = (0, 0);
        let quote_volume =
            if (buy_coin_0) {
                let (net_proceeds, quote_volume) =
                    swap_with_stats_buy_emojicoin<Coin0, LP0>(
                        entrant,
                        entrant_address,
                        market_address_0,
                        input_amount_after_matching,
                        INTEGRATOR_FEE_RATE_BPS
                    );
                let emojicoin_0_ref_mut = &mut escrow_ref_mut.emojicoin_0;
                coin::merge(emojicoin_0_ref_mut, coin::withdraw(entrant, net_proceeds));
                active_melee_ref_mut.melee_emojicoin_0_locked_increment(
                    coin::value(emojicoin_0_ref_mut)
                );
                emojicoin_0_proceeds = net_proceeds;
                quote_volume
            } else {
                let (net_proceeds, quote_volume) =
                    swap_with_stats_buy_emojicoin<Coin1, LP1>(
                        entrant,
                        entrant_address,
                        market_address_1,
                        input_amount_after_matching,
                        INTEGRATOR_FEE_RATE_BPS
                    );
                let emojicoin_1_ref_mut = &mut escrow_ref_mut.emojicoin_1;
                coin::merge(emojicoin_1_ref_mut, coin::withdraw(entrant, net_proceeds));
                active_melee_ref_mut.melee_emojicoin_1_locked_increment(
                    coin::value(emojicoin_1_ref_mut)
                );
                emojicoin_1_proceeds = net_proceeds;
                quote_volume
            };

        // Update melee state.
        let quote_volume_u128 = (quote_volume as u128);
        active_melee_ref_mut.melee_n_swaps_increment();
        active_melee_ref_mut.melee_swaps_volume_increment(quote_volume_u128);
        active_melee_ref_mut.melee_all_entrants_add_if_not_contains(entrant_address);
        active_melee_ref_mut.melee_active_entrants_add_if_not_contains(entrant_address);
        active_melee_ref_mut.melee_exited_entrants_remove_if_contains(entrant_address);

        // Update registry state.
        registry_ref_mut.registry_n_swaps_increment();
        registry_ref_mut.registry_swaps_volume_increment(quote_volume_u128);
        registry_ref_mut.registry_all_entrants_add_if_not_contains(entrant_address);

        // Update escrow state.
        escrow_ref_mut.escrow_n_swaps_increment();
        escrow_ref_mut.escrow_swaps_volume_increment(quote_volume_u128);
        escrow_ref_mut.escrow_octas_entered_increment(input_amount_after_matching);

        // Update user melees state.
        let user_melees_ref_mut = &mut UserMelees[entrant_address];
        user_melees_ref_mut.user_melees_entered_melee_ids_add_if_not_contains(melee_id);
        user_melees_ref_mut.user_melees_unexited_melee_ids_add_if_not_contains(melee_id);
        user_melees_ref_mut.user_melees_exited_melee_ids_remove_if_contains(melee_id);

        // Emit user melees state.
        user_melees_ref_mut.emit_user_melees_state();

        // Emit enter event.
        event::emit(
            Enter {
                user: entrant_address,
                melee_id,
                input_amount,
                quote_volume,
                match_amount,
                emojicoin_0_proceeds,
                emojicoin_1_proceeds
            }
        );

        // Get final exchange rates.
        let exchange_rate_0 = exchange_rate<Coin0, LP0>(market_address_0);
        let exchange_rate_1 = exchange_rate<Coin1, LP1>(market_address_1);

        // Emit state events.
        emit_state(
            registry_ref_mut,
            active_melee_ref_mut,
            escrow_ref_mut,
            entrant_address,
            exchange_rate_0,
            exchange_rate_1
        );
    }

    #[randomness]
    entry fun exit<Coin0, LP0, Coin1, LP1>(participant: &signer) acquires Escrow, Registry, UserMelees {
        let participant_address = signer::address_of(participant);
        assert!(
            exists<Escrow<Coin0, LP0, Coin1, LP1>>(participant_address),
            E_NO_ESCROW
        );
        let (melee_just_ended, registry_ref_mut, _, _) = crank_schedule();
        exit_inner<Coin0, LP0, Coin1, LP1>(
            participant,
            participant_address,
            registry_ref_mut,
            !melee_just_ended
        );
    }

    #[randomness]
    entry fun swap<Coin0, LP0, Coin1, LP1>(swapper: &signer) acquires Escrow, Registry, UserMelees {

        // Verify that swapper has an escrow resource.
        let swapper_address = signer::address_of(swapper);
        assert!(
            exists<Escrow<Coin0, LP0, Coin1, LP1>>(swapper_address),
            E_NO_ESCROW
        );
        let escrow_ref_mut = &mut Escrow<Coin0, LP0, Coin1, LP1>[swapper_address];

        // Try cranking the schedule, and if a new melee starts, flag that user's escrow should be
        // emptied immediately after the swap.
        let (exit_once_done, registry_ref_mut, _, _) = crank_schedule();

        // Get market addresses.
        let swap_melee_ref_mut =
            registry_ref_mut.melees_by_id.borrow_mut(escrow_ref_mut.melee_id);
        let (market_address_0, market_address_1) = market_addresses(swap_melee_ref_mut);

        // Swap, updating total emojicoin locked values based on side.
        let emojicoin_0_ref_mut = &mut escrow_ref_mut.emojicoin_0;
        let emojicoin_1_ref_mut = &mut escrow_ref_mut.emojicoin_1;
        let emojicoin_0_locked_before_swap = coin::value(emojicoin_0_ref_mut);
        let emojicoin_1_locked_before_swap = coin::value(emojicoin_1_ref_mut);
        let (emojicoin_0_in, emojicoin_0_proceeds, emojicoin_1_in, emojicoin_1_proceeds) =
            (0, 0, 0, 0);
        let quote_volume =
            if (emojicoin_0_locked_before_swap > 0) {
                emojicoin_0_in = emojicoin_0_locked_before_swap;
                let quote_volume =
                    swap_within_escrow<Coin0, LP0, Coin1, LP1>(
                        swapper,
                        swapper_address,
                        market_address_0,
                        market_address_1,
                        emojicoin_0_ref_mut,
                        emojicoin_1_ref_mut
                    );
                swap_melee_ref_mut.melee_emojicoin_0_locked_decrement(emojicoin_0_in);
                emojicoin_1_proceeds = coin::value(emojicoin_1_ref_mut);
                swap_melee_ref_mut.melee_emojicoin_1_locked_increment(emojicoin_1_proceeds);
                quote_volume
            } else {
                assert!(emojicoin_1_locked_before_swap > 0, E_SWAP_NO_FUNDS);
                emojicoin_1_in = emojicoin_1_locked_before_swap;
                let quote_volume =
                    swap_within_escrow<Coin1, LP1, Coin0, LP0>(
                        swapper,
                        swapper_address,
                        market_address_1,
                        market_address_0,
                        emojicoin_1_ref_mut,
                        emojicoin_0_ref_mut
                    );
                swap_melee_ref_mut.melee_emojicoin_1_locked_decrement(emojicoin_1_in);
                emojicoin_0_proceeds = coin::value(emojicoin_0_ref_mut);
                swap_melee_ref_mut.melee_emojicoin_0_locked_increment(emojicoin_0_proceeds);
                quote_volume
            };

        // Update melee state.
        let quote_volume_u128 = (quote_volume as u128);
        swap_melee_ref_mut.melee_n_swaps_increment();
        swap_melee_ref_mut.melee_swaps_volume_increment(quote_volume_u128);

        // Update registry state.
        registry_ref_mut.registry_n_swaps_increment();
        registry_ref_mut.registry_swaps_volume_increment(quote_volume_u128);

        // Update escrow state.
        escrow_ref_mut.escrow_n_swaps_increment();
        escrow_ref_mut.escrow_swaps_volume_increment(quote_volume_u128);

        // Emit swap event.
        event::emit(
            Swap {
                user: swapper_address,
                melee_id: escrow_ref_mut.melee_id,
                quote_volume,
                emojicoin_0_in,
                emojicoin_0_proceeds,
                emojicoin_1_in,
                emojicoin_1_proceeds
            }
        );

        // Exit as needed, emitting state if not exiting, since exit inner function emits state.
        if (exit_once_done)
            exit_inner<Coin0, LP0, Coin1, LP1>(
                swapper,
                swapper_address,
                registry_ref_mut,
                false
            )
        else {
            // Get final exchange rates.
            let exchange_rate_0 = exchange_rate<Coin0, LP0>(market_address_0);
            let exchange_rate_1 = exchange_rate<Coin1, LP1>(market_address_1);

            emit_state(
                registry_ref_mut,
                swap_melee_ref_mut,
                escrow_ref_mut,
                swapper_address,
                exchange_rate_0,
                exchange_rate_1
            );
        }
    }

    fun init_module(arena: &signer) acquires Registry {
        // Store registry resource.
        let (vault_signer, signer_capability) =
            account::create_resource_account(arena, REGISTRY_SEED);
        move_to(
            arena,
            Registry {
                melees_by_id: smart_table::new(),
                melee_ids_by_market_ids: smart_table::new(),
                signer_capability,
                next_melee_duration: DEFAULT_DURATION,
                next_melee_available_rewards: DEFAULT_AVAILABLE_REWARDS,
                next_melee_max_match_percentage: DEFAULT_MAX_MATCH_PERCENTAGE,
                next_melee_max_match_amount: DEFAULT_MAX_MATCH_AMOUNT,
                all_entrants: smart_table::new(),
                n_swaps: 0,
                swaps_volume: 0,
                octas_matched: 0,
                top_exits: null_top_exits()
            }
        );
        coin::register<AptosCoin>(&vault_signer);

        // Use pseudo-randomness to get market IDs for the first melee, since randomness is not
        // supported during `init_module`.
        let n_markets = get_n_registered_markets();
        let market_id_0 = pseudo_random_market_id(n_markets);
        let market_id_1;
        loop {
            market_id_1 = pseudo_random_market_id(n_markets);
            if (market_id_1 != market_id_0) break;
        };

        // Register the first melee.
        register_melee(
            &mut Registry[@arena],
            0,
            sort_unique_market_ids(market_id_0, market_id_1)
        );
    }

    inline fun add_if_not_contains<T: drop>(
        map_ref_mut: &mut SmartTable<T, Nil>, key: T
    ) {
        if (!map_ref_mut.contains(key)) {
            map_ref_mut.add(key, Nil {});
        }
    }

    inline fun borrow_registry_ref_checked(arena: &signer): &Registry {
        assert!(signer::address_of(arena) == @arena, E_NOT_ARENA);
        &Registry[@arena]
    }

    inline fun borrow_registry_ref_mut_checked(arena: &signer): &mut Registry {
        assert!(signer::address_of(arena) == @arena, E_NOT_ARENA);
        &mut Registry[@arena]
    }

    /// Crank schedule and return `true` if the active melee has ended as a result, along with other
    /// assorted variables, to reduce borrows and lookups in the caller.
    inline fun crank_schedule(): (bool, &mut Registry, u64, u64) {
        let time = timestamp::now_microseconds();
        let registry_ref_mut = &mut Registry[@arena];
        let n_melees_before_cranking = registry_ref_mut.melees_by_id.length();
        let last_active_melee_ref_mut =
            registry_ref_mut.melees_by_id.borrow_mut(n_melees_before_cranking);
        let cranked =
            if (time
                >= last_active_melee_ref_mut.start_time
                    + last_active_melee_ref_mut.duration) {
                last_active_melee_ref_mut.available_rewards = 0;
                let market_ids = next_melee_market_ids(registry_ref_mut);
                register_melee(registry_ref_mut, n_melees_before_cranking, market_ids);
                true
            } else false;
        (cranked, registry_ref_mut, time, n_melees_before_cranking)
    }

    /// Octa-denominated value of emojicoins at given exchange rate.
    inline fun effective_value(
        emojicoin_holdings: u64, exchange_rate: ExchangeRate
    ): u128 {
        (emojicoin_holdings as u128) * (exchange_rate.quote as u128)
            / (exchange_rate.base as u128)
    }

    inline fun emit_escrow_state<Coin0, LP0, Coin1, LP1>(
        self: &mut Escrow<Coin0, LP0, Coin1, LP1>,
        participant_address: address,
        emojicoin_0_exchange_rate: ExchangeRate,
        emojicoin_1_exchange_rate: ExchangeRate
    ) {
        let emojicoin_0_balance = coin::value(&self.emojicoin_0);
        let emojicoin_1_balance = coin::value(&self.emojicoin_1);
        let octas_entered = self.octas_entered;
        event::emit(
            EscrowState {
                user: participant_address,
                melee_id: self.melee_id,
                emojicoin_0_balance,
                emojicoin_1_balance,
                n_swaps: self.n_swaps,
                swaps_volume: self.swaps_volume,
                octas_entered,
                octas_matched: self.octas_matched,
                profit_and_loss: profit_and_loss(
                    octas_entered,
                    emojicoin_0_balance,
                    emojicoin_1_balance,
                    emojicoin_0_exchange_rate,
                    emojicoin_1_exchange_rate
                )
            }
        );
    }

    /// Uses mutable references to avoid borrowing issues.
    inline fun emit_melee_state(
        self: &mut Melee,
        emojicoin_0_exchange_rate: ExchangeRate,
        emojicoin_1_exchange_rate: ExchangeRate
    ) {
        event::emit(
            MeleeState {
                melee_id: self.melee_id,
                available_rewards: self.available_rewards,
                n_all_entrants: self.all_entrants.length(),
                n_active_entrants: self.active_entrants.length(),
                n_exited_entrants: self.exited_entrants.length(),
                n_locked_in_entrants: self.locked_in_entrants.length(),
                n_swaps: self.n_swaps,
                swaps_volume: self.swaps_volume,
                emojicoin_0_locked: self.emojicoin_0_locked,
                emojicoin_1_locked: self.emojicoin_1_locked,
                emojicoin_0_exchange_rate,
                emojicoin_1_exchange_rate,
                top_exits: self.top_exits
            }
        );
    }

    /// Uses mutable references to avoid borrowing issues.
    inline fun emit_registry_state(self: &mut Registry) {
        event::emit(
            RegistryState {
                n_melees: self.melees_by_id.length(),
                n_entrants: self.all_entrants.length(),
                n_swaps: self.n_swaps,
                swaps_volume: self.swaps_volume,
                octas_matched: self.octas_matched,
                top_exits: self.top_exits
            }
        );
    }

    /// Uses mutable references to avoid borrowing issues. Emitted in ascending hierarchy order,
    /// since registry state must be emitted after melee state.
    inline fun emit_state<Coin0, LP0, Coin1, LP1>(
        registry_ref_mut: &mut Registry,
        melee_ref_mut: &mut Melee,
        escrow_ref_mut: &mut Escrow<Coin0, LP0, Coin1, LP1>,
        participant_address: address,
        emojicoin_0_exchange_rate: ExchangeRate,
        emojicoin_1_exchange_rate: ExchangeRate
    ) {
        escrow_ref_mut.emit_escrow_state(
            participant_address, emojicoin_0_exchange_rate, emojicoin_1_exchange_rate
        );
        melee_ref_mut.emit_melee_state(
            emojicoin_0_exchange_rate, emojicoin_1_exchange_rate
        );
        registry_ref_mut.emit_registry_state(); // Must emit after melee state for borrow checker.
    }

    inline fun emit_user_melees_state(self: &mut UserMelees) {
        event::emit(
            UserMeleesState {
                n_entered_melees: self.entered_melee_ids.length(),
                n_exited_melees: self.exited_melee_ids.length(),
                n_unexited_melees: self.unexited_melee_ids.length()
            }
        )
    }

    inline fun emit_vault_balance_update_with_singer_capability_ref(
        signer_capability_ref: &SignerCapability
    ) {
        event::emit(
            VaultBalanceUpdate {
                new_balance: coin::balance<AptosCoin>(
                    account::get_signer_capability_address(signer_capability_ref)
                )
            }
        );
    }

    inline fun emit_vault_balance_update_with_vault_address(
        vault_address: address
    ) {
        event::emit(
            VaultBalanceUpdate {
                new_balance: coin::balance<AptosCoin>(vault_address)
            }
        );
    }

    inline fun escrow_n_swaps_increment<Coin0, LP0, Coin1, LP1>(
        self: &mut Escrow<Coin0, LP0, Coin1, LP1>
    ) {
        self.n_swaps += 1;
    }

    inline fun escrow_octas_entered_increment<Coin0, LP0, Coin1, LP1>(
        self: &mut Escrow<Coin0, LP0, Coin1, LP1>,
        amount: u64
    ) {
        self.octas_entered += amount;
    }

    inline fun escrow_octas_entered_reset<Coin0, LP0, Coin1, LP1>(
        self: &mut Escrow<Coin0, LP0, Coin1, LP1>
    ) {
        self.octas_entered = 0;
    }

    inline fun escrow_octas_matched_increment<Coin0, LP0, Coin1, LP1>(
        self: &mut Escrow<Coin0, LP0, Coin1, LP1>,
        amount: u64
    ) {
        self.octas_matched += amount;
    }

    inline fun escrow_octas_matched_reset<Coin0, LP0, Coin1, LP1>(
        self: &mut Escrow<Coin0, LP0, Coin1, LP1>
    ) {
        self.octas_matched = 0;
    }

    inline fun escrow_swaps_volume_increment<Coin0, LP0, Coin1, LP1>(
        self: &mut Escrow<Coin0, LP0, Coin1, LP1>,
        amount: u128
    ) {
        self.swaps_volume += amount;
    }

    inline fun exchange_rate<Emojicoin, EmojicoinLP>(
        market_address: address
    ): ExchangeRate {
        let (
            _,
            _,
            clamm_virtual_reserves,
            cpamm_real_reserves,
            _,
            in_bonding_curve,
            _,
            _,
            _,
            _,
            _,
            _,
            _
        ) =
            emojicoin_dot_fun::unpack_market_view(
                emojicoin_dot_fun::market_view<Emojicoin, EmojicoinLP>(market_address)
            );
        let reserves =
            if (in_bonding_curve) clamm_virtual_reserves
            else cpamm_real_reserves;
        let (base, quote) = emojicoin_dot_fun::unpack_reserves(reserves);
        ExchangeRate { base, quote }
    }

    /// Assumes user has an escrow resource.
    inline fun exit_inner<Coin0, LP0, Coin1, LP1>(
        participant: &signer,
        participant_address: address,
        registry_ref_mut: &mut Registry,
        melee_is_active: bool
    ) acquires Registry {
        let escrow_ref_mut = &mut Escrow<Coin0, LP0, Coin1, LP1>[participant_address];
        let melee_id = escrow_ref_mut.melee_id;
        let exited_melee_ref_mut = registry_ref_mut.melees_by_id.borrow_mut(melee_id);
        let (market_address_0, market_address_1) = market_addresses(exited_melee_ref_mut);

        // Charge tap out fee if applicable.
        let octas_entered = escrow_ref_mut.octas_entered;
        let tap_out_fee = 0;
        let octas_matched = escrow_ref_mut.octas_matched;
        if (melee_is_active) {
            if (octas_matched > 0) {
                let vault_address =
                    account::get_signer_capability_address(
                        &registry_ref_mut.signer_capability
                    );
                aptos_account::transfer(participant, vault_address, octas_matched);
                tap_out_fee = octas_matched;
                emit_vault_balance_update_with_vault_address(vault_address);

                // Update melee state.
                exited_melee_ref_mut.melee_available_rewards_increment(octas_matched);
                exited_melee_ref_mut.melee_locked_in_entrants_remove_if_contains(
                    participant_address
                );

                // Update registry state.
                registry_ref_mut.registry_octas_matched_decrement(octas_matched);
            }
        };

        // Withdraw emojicoin balances from escrow.
        let (emojicoin_0_proceeds, emojicoin_1_proceeds) = (0, 0);
        if (coin::value(&escrow_ref_mut.emojicoin_0) > 0) {
            let emojicoin_0_ref_mut = &mut escrow_ref_mut.emojicoin_0;
            emojicoin_0_proceeds = coin::value(emojicoin_0_ref_mut);
            withdraw_from_escrow(participant_address, emojicoin_0_ref_mut);
        } else {
            let emojicoin_1_ref_mut = &mut escrow_ref_mut.emojicoin_1;
            emojicoin_1_proceeds = coin::value(emojicoin_1_ref_mut);
            assert!(emojicoin_1_proceeds > 0, E_EXIT_NO_FUNDS);
            withdraw_from_escrow(participant_address, emojicoin_1_ref_mut);
        };

        // Get final exchange rates.
        let exchange_rate_0 = exchange_rate<Coin0, LP0>(market_address_0);
        let exchange_rate_1 = exchange_rate<Coin1, LP1>(market_address_1);

        // Construct exit event.
        let exit = Exit {
            user: participant_address,
            melee_id,
            emojicoin_0_proceeds,
            emojicoin_1_proceeds,
            octas_entered,
            octas_matched,
            tap_out_fee,
            profit_and_loss: profit_and_loss(
                octas_entered,
                emojicoin_0_proceeds,
                emojicoin_1_proceeds,
                exchange_rate_0,
                exchange_rate_1
            )
        };

        // Update registry state.
        registry_ref_mut.registry_top_exits_update(&exit);

        // Update melee state.
        exited_melee_ref_mut.melee_active_entrants_remove_if_contains(participant_address);
        exited_melee_ref_mut.melee_exited_entrants_add_if_not_contains(participant_address);
        exited_melee_ref_mut.melee_top_exits_update(&exit);

        // Update escrow state.
        escrow_ref_mut.escrow_octas_entered_reset();
        escrow_ref_mut.escrow_octas_matched_reset();

        // Update user melees state.
        let user_melees_ref_mut = &mut UserMelees[participant_address];
        user_melees_ref_mut.user_melees_exited_melee_ids_add_if_not_contains(melee_id);
        user_melees_ref_mut.user_melees_unexited_melee_ids_remove_if_contains(melee_id);

        // Emit user melees state.
        user_melees_ref_mut.emit_user_melees_state();

        // Emit exit event.
        event::emit(exit);

        // Emit state events.
        emit_state(
            registry_ref_mut,
            exited_melee_ref_mut,
            escrow_ref_mut,
            participant_address,
            exchange_rate_0,
            exchange_rate_1
        );
    }

    inline fun get_n_registered_markets(): u64 {
        let (_, _, _, n_markets, _, _, _, _, _, _, _, _) =
            emojicoin_dot_fun::unpack_registry_view(emojicoin_dot_fun::registry_view());
        n_markets
    }

    inline fun last_period_boundary(time: u64, period: u64): u64 {
        (time / period) * period
    }

    /// Uses mutable references to avoid borrowing issues.
    inline fun market_addresses(melee_ref_mut: &mut Melee): (address, address) {
        let market_metadatas = melee_ref_mut.market_metadatas;
        let (_, market_address_0, _) =
            emojicoin_dot_fun::unpack_market_metadata(market_metadatas[0]);
        let (_, market_address_1, _) =
            emojicoin_dot_fun::unpack_market_metadata(market_metadatas[1]);
        (market_address_0, market_address_1)
    }

    /// Uses mutable references to avoid borrowing issues.
    inline fun match_amount<Coin0, LP0, Coin1, LP1>(
        input_amount: u64,
        escrow_ref_mut: &mut Escrow<Coin0, LP0, Coin1, LP1>,
        active_melee_ref_mut: &mut Melee,
        registry_ref_mut: &mut Registry,
        time: u64
    ): u64 {
        let elapsed_time = ((time - active_melee_ref_mut.start_time) as u256);
        let duration = (active_melee_ref_mut.duration as u256);
        if (elapsed_time >= duration) { 0 }
        else {
            // Scale down input amount for matching percentage and remaining time in one compound
            // operation, to reduce truncation errors. Equivalent to:
            //
            //                max match percentage   remaining time
            // input amount * -------------------- * --------------
            //                100                    duration
            let raw_match_amount =
                (
                    ((input_amount as u256)
                        * (active_melee_ref_mut.max_match_percentage as u256)
                        * (duration - elapsed_time)) / ((MAX_PERCENTAGE as u256)
                        * duration) as u64
                );
            // Correct for the amount that is available in the vault.
            let corrected_for_vault_balance =
                min(
                    raw_match_amount,
                    coin::balance<AptosCoin>(
                        account::get_signer_capability_address(
                            &registry_ref_mut.signer_capability
                        )
                    )
                );
            // Correct for available rewards in melee.
            let corrected_for_melee_available_rewards =
                min(
                    corrected_for_vault_balance,
                    active_melee_ref_mut.available_rewards
                );
            // Correct for the max match amount that the user is eligible for.
            min(
                corrected_for_melee_available_rewards,
                active_melee_ref_mut.max_match_amount - escrow_ref_mut.octas_matched
            )
        }
    }

    inline fun melee_active_entrants_add_if_not_contains(
        self: &mut Melee, address: address
    ) {
        add_if_not_contains(&mut self.active_entrants, address);
    }

    inline fun melee_active_entrants_remove_if_contains(
        self: &mut Melee, address: address
    ) {
        remove_if_contains(&mut self.active_entrants, address);
    }

    inline fun melee_all_entrants_add_if_not_contains(
        self: &mut Melee, address: address
    ) {
        add_if_not_contains(&mut self.all_entrants, address);
    }

    inline fun melee_available_rewards_decrement(
        self: &mut Melee, amount: u64
    ) {
        self.available_rewards -= amount;
    }

    inline fun melee_available_rewards_increment(
        self: &mut Melee, amount: u64
    ) {
        self.available_rewards += amount;
    }

    inline fun melee_emojicoin_0_locked_decrement(
        self: &mut Melee, amount: u64
    ) {
        self.emojicoin_0_locked -= amount;
    }

    inline fun melee_emojicoin_0_locked_increment(
        self: &mut Melee, amount: u64
    ) {
        self.emojicoin_0_locked += amount;
    }

    inline fun melee_emojicoin_1_locked_decrement(
        self: &mut Melee, amount: u64
    ) {
        self.emojicoin_1_locked -= amount;
    }

    inline fun melee_emojicoin_1_locked_increment(
        self: &mut Melee, amount: u64
    ) {
        self.emojicoin_1_locked += amount;
    }

    inline fun melee_exited_entrants_add_if_not_contains(
        self: &mut Melee, address: address
    ) {
        add_if_not_contains(&mut self.exited_entrants, address);
    }

    inline fun melee_exited_entrants_remove_if_contains(
        self: &mut Melee, address: address
    ) {
        remove_if_contains(&mut self.exited_entrants, address);
    }

    inline fun melee_locked_in_entrants_add_if_not_contains(
        self: &mut Melee, address: address
    ) {
        add_if_not_contains(&mut self.locked_in_entrants, address);
    }

    inline fun melee_locked_in_entrants_remove_if_contains(
        self: &mut Melee, address: address
    ) {
        remove_if_contains(&mut self.locked_in_entrants, address);
    }

    inline fun melee_n_swaps_increment(self: &mut Melee) {
        self.n_swaps += 1;
    }

    inline fun melee_swaps_volume_increment(
        self: &mut Melee, amount: u128
    ) {
        self.swaps_volume += amount;
    }

    inline fun melee_top_exits_update(self: &mut Melee, exit: &Exit) {
        if (exit.profit_and_loss.octas_gain
            > self.top_exits.by_octas_gain.profit_and_loss.octas_gain)
            self.top_exits.by_octas_gain = *exit;
        if (exit.profit_and_loss.octas_growth_q64
            > self.top_exits.by_octas_growth_q64.profit_and_loss.octas_growth_q64)
            self.top_exits.by_octas_growth_q64 = *exit;
    }

    /// Accepts a mutable reference to avoid borrowing issues.
    inline fun next_melee_market_ids(registry_ref_mut: &mut Registry): vector<u64> {
        let n_markets = get_n_registered_markets();
        let market_ids;
        loop {
            let market_id_0 = random_market_id(n_markets);
            let market_id_1 = random_market_id(n_markets);
            if (market_id_0 == market_id_1) continue;
            market_ids = sort_unique_market_ids(market_id_0, market_id_1);
            if (!registry_ref_mut.melee_ids_by_market_ids.contains(market_ids))
                break;
        };
        market_ids

    }

    inline fun null_exit(): Exit {
        Exit {
            user: NULL_ADDRESS,
            melee_id: 0,
            emojicoin_0_proceeds: 0,
            emojicoin_1_proceeds: 0,
            octas_entered: 0,
            octas_matched: 0,
            tap_out_fee: 0,
            profit_and_loss: ProfitAndLoss {
                octas_value: 0,
                octas_gain: 0,
                octas_loss: 0,
                octas_growth_q64: 0
            }
        }
    }

    inline fun null_top_exits(): TopExits {
        TopExits {
            by_octas_gain: null_exit(),
            by_octas_growth_q64: null_exit()
        }
    }

    inline fun profit_and_loss(
        octas_entered: u64,
        emojicoin_0_holdings: u64,
        emojicoin_1_holdings: u64,
        emojicoin_0_exchange_rate: ExchangeRate,
        emojicoin_1_exchange_rate: ExchangeRate
    ): ProfitAndLoss {
        let (octas_value, octas_gain, octas_loss, octas_growth_q64) = (0, 0, 0, 0);
        let octas_entered = (octas_entered as u128);
        if (octas_entered > 0) {
            octas_value =
                if (emojicoin_0_holdings > 0)
                    effective_value(emojicoin_0_holdings, emojicoin_0_exchange_rate)
                else if (emojicoin_1_holdings > 0)
                    effective_value(emojicoin_1_holdings, emojicoin_1_exchange_rate)
                else 0;
            if (octas_value > 0) {
                if (octas_value > octas_entered) octas_gain = octas_value
                    - octas_entered;
                if (octas_value < octas_entered) octas_loss = octas_entered
                    - octas_value;
                octas_growth_q64 = (octas_value << SHIFT_Q64) / (octas_entered);
            }
        };
        ProfitAndLoss { octas_value, octas_gain, octas_loss, octas_growth_q64 }
    }

    /// Pseudo-random substitute for `random_market_id`, since the Aptos randomness API is not
    /// available during `init_module`.
    inline fun pseudo_random_market_id(n_markets: u64): u64 {
        pseudo_randomness::u64_range(0, n_markets) + 1
    }

    /// Market IDs are 1-indexed.
    inline fun random_market_id(n_markets: u64): u64 {
        randomness::u64_range(0, n_markets) + 1
    }

    inline fun register_melee(
        registry_ref_mut: &mut Registry,
        n_melees_before_registration: u64,
        sorted_unique_market_ids: vector<u64>
    ) {
        let melee_id = n_melees_before_registration + 1;
        let market_metadatas =
            sorted_unique_market_ids.map_ref(|market_id_ref| {
                option::destroy_some(
                    emojicoin_dot_fun::market_metadata_by_market_id(*market_id_ref)
                )
            });
        let start_time =
            last_period_boundary(
                timestamp::now_microseconds(), registry_ref_mut.next_melee_duration
            );
        let duration = registry_ref_mut.next_melee_duration;
        let max_match_percentage = registry_ref_mut.next_melee_max_match_percentage;
        let max_match_amount = registry_ref_mut.next_melee_max_match_amount;
        let available_rewards = registry_ref_mut.next_melee_available_rewards;
        registry_ref_mut.melees_by_id.add(
            melee_id,
            Melee {
                melee_id,
                market_metadatas,
                start_time,
                duration,
                max_match_percentage,
                max_match_amount,
                available_rewards,
                all_entrants: smart_table::new(),
                active_entrants: smart_table::new(),
                exited_entrants: smart_table::new(),
                locked_in_entrants: smart_table::new(),
                n_swaps: 0,
                swaps_volume: 0,
                emojicoin_0_locked: 0,
                emojicoin_1_locked: 0,
                top_exits: null_top_exits()
            }
        );
        registry_ref_mut.melee_ids_by_market_ids.add(sorted_unique_market_ids, melee_id);
        event::emit(
            NewMelee {
                melee_id,
                market_metadatas,
                start_time,
                duration,
                max_match_percentage,
                max_match_amount,
                available_rewards
            }
        )
    }

    inline fun registry_all_entrants_add_if_not_contains(
        self: &mut Registry, address: address
    ) {
        add_if_not_contains(&mut self.all_entrants, address);
    }

    inline fun registry_n_swaps_increment(self: &mut Registry) {
        self.n_swaps += 1;
    }

    inline fun registry_octas_matched_decrement(
        self: &mut Registry, amount: u64
    ) {
        self.octas_matched -= amount;
    }

    inline fun registry_octas_matched_increment(
        self: &mut Registry, amount: u64
    ) {
        self.octas_matched += amount;
    }

    inline fun registry_swaps_volume_increment(
        self: &mut Registry, amount: u128
    ) {
        self.swaps_volume += amount;
    }

    inline fun registry_top_exits_update(self: &mut Registry, exit: &Exit) {
        if (exit.profit_and_loss.octas_gain
            > self.top_exits.by_octas_gain.profit_and_loss.octas_gain)
            self.top_exits.by_octas_gain = *exit;
        if (exit.profit_and_loss.octas_growth_q64
            > self.top_exits.by_octas_growth_q64.profit_and_loss.octas_growth_q64)
            self.top_exits.by_octas_growth_q64 = *exit;
    }

    inline fun remove_if_contains<T: copy + drop>(
        map_ref_mut: &mut SmartTable<T, Nil>, key: T
    ) {
        if (map_ref_mut.contains(key)) {
            map_ref_mut.remove(key);
        }
    }

    inline fun sort_unique_market_ids(market_id_0: u64, market_id_1: u64): vector<u64> {
        if (market_id_0 < market_id_1) {
            vector[market_id_0, market_id_1]
        } else {
            vector[market_id_1, market_id_0]
        }
    }

    inline fun swap_with_stats<Emojicoin, LP>(
        swapper: &signer,
        swapper_address: address,
        market_address: address,
        input_amount: u64,
        sell_to_apt: bool,
        integrator_fee_rate_bps: u8
    ): (u64, u64) {
        let simulated_swap =
            emojicoin_dot_fun::simulate_swap<Emojicoin, LP>(
                swapper_address,
                market_address,
                input_amount,
                sell_to_apt,
                @integrator,
                integrator_fee_rate_bps
            );
        let (_, _, _, _, _, _, _, _, net_proceeds, _, quote_volume, _, _, _, _, _, _, _) =
            emojicoin_dot_fun::unpack_swap(simulated_swap);
        emojicoin_dot_fun::swap<Emojicoin, LP>(
            swapper,
            market_address,
            input_amount,
            sell_to_apt,
            @integrator,
            integrator_fee_rate_bps,
            1
        );
        (net_proceeds, quote_volume)
    }

    inline fun swap_with_stats_buy_emojicoin<Emojicoin, LP>(
        swapper: &signer,
        swapper_address: address,
        market_address: address,
        input_amount: u64,
        integrator_fee_rate_bps: u8
    ): (u64, u64) {
        swap_with_stats<Emojicoin, LP>(
            swapper,
            swapper_address,
            market_address,
            input_amount,
            false,
            integrator_fee_rate_bps
        )
    }

    inline fun swap_with_stats_sell_to_apt<Emojicoin, LP>(
        swapper: &signer,
        swapper_address: address,
        market_address: address,
        input_amount: u64,
        integrator_fee_rate_bps: u8
    ): (u64, u64) {
        swap_with_stats<Emojicoin, LP>(
            swapper,
            swapper_address,
            market_address,
            input_amount,
            true,
            integrator_fee_rate_bps
        )
    }

    inline fun swap_within_escrow<FromCoin, FromLP, ToCoin, ToLP>(
        swapper: &signer,
        swapper_address: address,
        market_address_from: address,
        market_address_to: address,
        escrow_from_coin_ref_mut: &mut Coin<FromCoin>,
        escrow_to_coin_ref_mut: &mut Coin<ToCoin>
    ): u64 {
        // Move all from coins out of escrow.
        let input_amount = coin::value(escrow_from_coin_ref_mut);
        withdraw_from_escrow(swapper_address, escrow_from_coin_ref_mut);

        // Swap into APT.
        let (net_proceeds_in_apt, _) =
            swap_with_stats_sell_to_apt<FromCoin, FromLP>(
                swapper,
                swapper_address,
                market_address_from,
                input_amount,
                INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE
            );

        // Swap into to emojicoin.
        let (net_proceeds_in_to_coin, quote_volume) =
            swap_with_stats_buy_emojicoin<ToCoin, ToLP>(
                swapper,
                swapper_address,
                market_address_to,
                net_proceeds_in_apt,
                INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE
            );

        // Move to coin to escrow.
        coin::merge(
            escrow_to_coin_ref_mut, coin::withdraw(swapper, net_proceeds_in_to_coin)
        );

        // Return quote volume on second swap only, to avoid double-counting.
        quote_volume
    }

    inline fun user_melees_entered_melee_ids_add_if_not_contains(
        self: &mut UserMelees, melee_id: u64
    ) {
        add_if_not_contains(&mut self.entered_melee_ids, melee_id);
    }

    inline fun user_melees_exited_melee_ids_add_if_not_contains(
        self: &mut UserMelees, melee_id: u64
    ) {
        add_if_not_contains(&mut self.exited_melee_ids, melee_id);
    }

    inline fun user_melees_exited_melee_ids_remove_if_contains(
        self: &mut UserMelees, melee_id: u64
    ) {
        remove_if_contains(&mut self.exited_melee_ids, melee_id);
    }

    inline fun user_melees_unexited_melee_ids_add_if_not_contains(
        self: &mut UserMelees, melee_id: u64
    ) {
        add_if_not_contains(&mut self.unexited_melee_ids, melee_id);
    }

    inline fun user_melees_unexited_melee_ids_remove_if_contains(
        self: &mut UserMelees, melee_id: u64
    ) {
        remove_if_contains(&mut self.unexited_melee_ids, melee_id);
    }

    inline fun withdraw_from_escrow<Emojicoin>(
        recipient: address, escrow_coin_ref_mut: &mut Coin<Emojicoin>
    ) {
        aptos_account::deposit_coins(recipient, coin::extract_all(escrow_coin_ref_mut));
    }
}
