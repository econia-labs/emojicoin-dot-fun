// cspell:word unexited
module arena::emojicoin_arena {

    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aggregator_v2::{Self, Aggregator};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::randomness::Self;
    use aptos_framework::timestamp;
    use aptos_std::math64::min;
    use aptos_std::smart_table::{Self, SmartTable};
    use aptos_std::type_info;
    use arena::pseudo_randomness;
    use emojicoin_dot_fun::emojicoin_dot_fun::{
        Self,
        MarketMetadata,
        market_view,
        registry_view,
        unpack_market_metadata,
        unpack_registry_view
    };
    use std::option::Self;
    use std::signer;

    /// Signer does not correspond to arena account.
    const E_NOT_ARENA: u64 = 0;
    /// New melee duration is too short.
    const E_NEW_DURATION_TOO_SHORT: u64 = 1;
    /// New melee lock-in period is too long.
    const E_NEW_LOCK_IN_PERIOD_TOO_LONG: u64 = 2;
    /// New melee match percentage is too high.
    const E_NEW_MATCH_PERCENTAGE_TOO_HIGH: u64 = 3;
    /// User's melee escrow has nonzero emojicoin 0 balance.
    const E_ENTER_COIN_BALANCE_0: u64 = 4;
    /// User's melee escrow has nonzero emojicoin 1 balance.
    const E_ENTER_COIN_BALANCE_1: u64 = 5;
    /// Elected to lock in but unable to match.
    const E_UNABLE_TO_LOCK_IN: u64 = 6;
    /// Provided escrow coin type is invalid.
    const E_INVALID_ESCROW_COIN_TYPE: u64 = 7;
    /// User has no escrow resource.
    const E_NO_ESCROW: u64 = 8;
    /// Swapper has no funds in escrow to swap.
    const E_SWAP_NO_FUNDS: u64 = 9;
    /// User has no funds in escrow to withdraw.
    const E_EXIT_NO_FUNDS: u64 = 10;

    /// Resource account address seed for the registry.
    const REGISTRY_SEED: vector<u8> = b"Arena registry";

    const U64_MAX: u64 = 0xffffffffffffffff;
    const MAX_PERCENTAGE: u64 = 100;

    /// Flat integrator fee.
    const INTEGRATOR_FEE_RATE_BPS: u8 = 100;
    const INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE: u8 = 50;

    // Default parameters for new melees.
    const DEFAULT_DURATION: u64 = 36 * 3_600_000_000;
    const DEFAULT_AVAILABLE_REWARDS: u64 = 1000 * 100_000_000;
    const DEFAULT_MAX_MATCH_PERCENTAGE: u64 = 50;
    const DEFAULT_MAX_MATCH_AMOUNT: u64 = 5 * 100_000_000;

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
        /// Amount of rewards that are available to claim for this melee while it is still active.
        /// Measured in octas, conditional on vault balance.
        available_rewards: u64,
        /// All entrants who have entered the melee, used as a set.
        all_entrants: SmartTable<address, Nil>,
        /// Active entrants in the melee, used as a set.
        active_entrants: SmartTable<address, Nil>,
        /// Entrants who have exited the melee, used as a set.
        exited_entrants: SmartTable<address, Nil>,
        /// Entrants who have locked in, used as a set.
        locked_in_entrants: SmartTable<address, Nil>,
        /// Number of melee-specific swaps.
        n_melee_swaps: Aggregator<u64>,
        /// Volume of melee-specific swaps in octas.
        melee_swaps_volume: Aggregator<u128>,
        /// Amount of emojicoin 0 locked in all melee escrows for the melee.
        emojicoin_0_locked: Aggregator<u64>,
        /// Amount of emojicoin 1 locked in all melee escrows for the melee.
        emojicoin_1_locked: Aggregator<u64>
    }

    struct MeleeEscrow<phantom Coin0, phantom LP0, phantom Coin1, phantom LP1> has key {
        /// Corresponding `Melee.melee_id`.
        melee_id: u64,
        /// Emojicoin 0 holdings.
        emojicoin_0: Coin<Coin0>,
        /// Emojicoin 1 holdings.
        emojicoin_1: Coin<Coin1>,
        /// Volume of user's melee-specific swaps in octas.
        melee_swaps_volume: u128,
        /// Number of swaps user has executed during the melee.
        n_melee_swaps: u64,
        /// APT entered into the melee, used as a benchmark for PnL calculations. Normalized when
        /// topping off, reset to zero when exiting.
        octas_entered: u64,
        /// Octas user must pay to exit the melee before it ends, if they have locked in. Equivalent
        /// to the current total amount of APT rewards they have been matched across all
        /// transactions since they began depositing funds into an empty escrow.
        tap_out_fee: u64
    }

    struct Nil has drop, store {}

    struct Registry has key {
        /// A map of each melee's `melee_id` to the melee.
        melees_by_id: SmartTable<u64, Melee>,
        /// Map from a sorted combination of market IDs (lower ID first) to the melee serial ID.
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
        n_melee_swaps: Aggregator<u64>,
        /// Volume of melee-specific swaps in octas.
        melee_swaps_volume: Aggregator<u128>,
        /// Amount of octas disbursed as rewards. Decremented when a user taps out.
        rewards_disbursed: u64
    }

    struct UserMelees has key {
        /// Set of serial IDs of all melees the user has entered.
        entered_melee_ids: SmartTable<u64, Nil>,
        /// Set of serial IDs of all melees the user has exited.
        exited_melee_ids: SmartTable<u64, Nil>,
        /// Set of serial IDs of all melees the user has entered but not exited.
        unexited_melee_ids: SmartTable<u64, Nil>
    }

    public entry fun fund_vault(arena: &signer, amount: u64) acquires Registry {
        aptos_account::transfer(
            arena,
            account::get_signer_capability_address(
                &borrow_registry_ref_checked(arena).signer_capability
            ),
            amount
        );
    }

    public entry fun set_next_melee_available_rewards(
        arena: &signer, amount: u64
    ) acquires Registry {
        borrow_registry_ref_mut_checked(arena).next_melee_available_rewards = amount;
    }

    public entry fun set_next_melee_duration(arena: &signer, duration: u64) acquires Registry {
        let registry_ref_mut = borrow_registry_ref_mut_checked(arena);
        registry_ref_mut.next_melee_duration = duration;
    }

    public entry fun set_next_melee_max_match_percentage(
        arena: &signer, max_match_percentage: u64
    ) acquires Registry {
        borrow_registry_ref_mut_checked(arena).next_melee_max_match_percentage = max_match_percentage;
    }

    public entry fun set_next_melee_max_match_amount(
        arena: &signer, max_match_amount: u64
    ) acquires Registry {
        borrow_registry_ref_mut_checked(arena).next_melee_max_match_amount = max_match_amount;
    }

    public entry fun withdraw_from_vault(arena: &signer, amount: u64) acquires Registry {
        aptos_account::transfer(
            &account::create_signer_with_capability(
                &borrow_registry_ref_checked(arena).signer_capability
            ),
            @arena,
            amount
        );
    }

    #[randomness]
    entry fun enter<Coin0, LP0, Coin1, LP1, EscrowCoin>(
        entrant: &signer, input_amount: u64, lock_in: bool
    ) acquires MeleeEscrow, Registry, UserMelees {
        let (melee_just_ended, registry_ref_mut, time, n_melees_before_cranking) =
            crank_schedule();
        if (melee_just_ended) return; // Can not enter melee if cranking ends it.

        // Verify that coin types are for the current melee by calling the market view function.
        let current_melee_ref_mut =
            registry_ref_mut.melees_by_id.borrow_mut(n_melees_before_cranking);
        let market_metadatas = current_melee_ref_mut.market_metadatas;
        let (_, market_address_0, _) = unpack_market_metadata(market_metadatas[0]);
        // Ensures the function aborts if Coin0 doesn't match LP0.
        market_view<Coin0, LP0>(market_address_0);
        let (_, market_address_1, _) = unpack_market_metadata(market_metadatas[1]);
        // Ensures the function aborts if Coin1 doesn't match LP1.
        market_view<Coin1, LP1>(market_address_1);

        // Create escrow and user melees resources if they don't exist.
        let melee_id = current_melee_ref_mut.melee_id;
        let entrant_address = signer::address_of(entrant);
        if (!exists<MeleeEscrow<Coin0, LP0, Coin1, LP1>>(entrant_address)) {
            move_to(
                entrant,
                MeleeEscrow<Coin0, LP0, Coin1, LP1> {
                    melee_id,
                    emojicoin_0: coin::zero(),
                    emojicoin_1: coin::zero(),
                    octas_entered: 0,
                    tap_out_fee: 0,
                    melee_swaps_volume: 0,
                    n_melee_swaps: 0
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

        // Update user melees resource.
        let user_melees_ref_mut = &mut UserMelees[entrant_address];
        add_if_not_contains(&mut user_melees_ref_mut.entered_melee_ids, melee_id);
        add_if_not_contains(&mut user_melees_ref_mut.unexited_melee_ids, melee_id);
        remove_if_contains(&mut user_melees_ref_mut.exited_melee_ids, melee_id);

        // Verify user is selecting one of the two emojicoin types.
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
        let escrow_ref_mut = &mut MeleeEscrow<Coin0, LP0, Coin1, LP1>[entrant_address];
        if (buy_coin_0)
            assert!(
                coin::value(&escrow_ref_mut.emojicoin_1) == 0, E_ENTER_COIN_BALANCE_1
            )
        else
            assert!(
                coin::value(&escrow_ref_mut.emojicoin_0) == 0, E_ENTER_COIN_BALANCE_0
            );

        // Try matching user's contribution if they elect to lock in.
        let match_amount =
            if (lock_in) {
                // Verify that user can even lock in.
                let match_amount =
                    match_amount(
                        input_amount,
                        escrow_ref_mut,
                        current_melee_ref_mut,
                        registry_ref_mut,
                        time
                    );
                assert!(match_amount > 0, E_UNABLE_TO_LOCK_IN);

                // Transfer APT to entrant.
                aptos_account::transfer(
                    &account::create_signer_with_capability(
                        &registry_ref_mut.signer_capability
                    ),
                    entrant_address,
                    match_amount
                );

                // Update melee state.
                current_melee_ref_mut.available_rewards_decrement(match_amount);
                current_melee_ref_mut.locked_in_entrants_add_if_not_contains(
                    entrant_address
                );

                // Update escrow state.
                escrow_ref_mut.tap_out_fee = escrow_ref_mut.tap_out_fee + match_amount;
                match_amount

            } else 0;

        // Execute a swap then immediately move funds into escrow.
        let input_amount_after_matching = input_amount + match_amount;
        let escrow_ref_mut = &mut MeleeEscrow<Coin0, LP0, Coin1, LP1>[entrant_address];
        if (buy_coin_0) {
            let (net_proceeds, _) =
                swap_with_stats_buy_emojicoin<Coin0, LP0>(
                    entrant,
                    entrant_address,
                    market_address_0,
                    input_amount_after_matching,
                    INTEGRATOR_FEE_RATE_BPS
                );
            coin::merge(
                &mut escrow_ref_mut.emojicoin_0, coin::withdraw(entrant, net_proceeds)
            );
        } else {
            let (net_proceeds, _) =
                swap_with_stats_buy_emojicoin<Coin1, LP1>(
                    entrant,
                    entrant_address,
                    market_address_1,
                    input_amount_after_matching,
                    INTEGRATOR_FEE_RATE_BPS
                );
            coin::merge(
                &mut escrow_ref_mut.emojicoin_1, coin::withdraw(entrant, net_proceeds)
            );
        };

        // Update melee state.
        current_melee_ref_mut.all_entrants_add_if_not_contains(entrant_address);
        current_melee_ref_mut.active_entrants_add_if_not_contains(entrant_address);
        current_melee_ref_mut.exited_entrants_remove_if_contains(entrant_address);
    }

    #[randomness]
    entry fun exit<Coin0, LP0, Coin1, LP1>(
        participant: &signer
    ) acquires MeleeEscrow, Registry, UserMelees {
        let participant_address = signer::address_of(participant);
        assert!(
            exists<MeleeEscrow<Coin0, LP0, Coin1, LP1>>(participant_address),
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
    entry fun swap<Coin0, LP0, Coin1, LP1>(
        swapper: &signer, market_addresses: vector<address>
    ) acquires MeleeEscrow, Registry, UserMelees {

        // Verify that swapper has an escrow resource.
        let swapper_address = signer::address_of(swapper);
        assert!(
            exists<MeleeEscrow<Coin0, LP0, Coin1, LP1>>(swapper_address),
            E_NO_ESCROW
        );
        let escrow_ref_mut = &mut MeleeEscrow<Coin0, LP0, Coin1, LP1>[swapper_address];

        // Try cranking the schedule, and if a new melee starts, flag that user's escrow should be
        // emptied immediately after the swap.
        let (exit_once_done, registry_ref_mut, _, _) = crank_schedule();

        let quote_volume =
            if (coin::value(&escrow_ref_mut.emojicoin_0) > 0) {
                swap_within_escrow<Coin0, LP0, Coin1, LP1>(
                    swapper,
                    swapper_address,
                    market_addresses[0],
                    market_addresses[1],
                    &mut escrow_ref_mut.emojicoin_0,
                    &mut escrow_ref_mut.emojicoin_1
                )
            } else {
                assert!(coin::value(&escrow_ref_mut.emojicoin_1) > 0, E_SWAP_NO_FUNDS);
                swap_within_escrow<Coin1, LP1, Coin0, LP0>(
                    swapper,
                    swapper_address,
                    market_addresses[1],
                    market_addresses[0],
                    &mut escrow_ref_mut.emojicoin_1,
                    &mut escrow_ref_mut.emojicoin_0
                )
            };

        // Update melee state.
        let swap_melee_ref_mut =
            registry_ref_mut.melees_by_id.borrow_mut(escrow_ref_mut.melee_id);
        swap_melee_ref_mut.n_melee_swaps_increment();
        swap_melee_ref_mut.melee_swaps_volume_increment((quote_volume as u128));

        if (exit_once_done)
            exit_inner<Coin0, LP0, Coin1, LP1>(
                swapper,
                swapper_address,
                registry_ref_mut,
                false
            );
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
                n_melee_swaps: aggregator_v2::create_unbounded_aggregator(),
                melee_swaps_volume: aggregator_v2::create_unbounded_aggregator(),
                rewards_disbursed: 0
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

    /// Cranks schedule and returns `true` if a melee has ended as a result, along with assorted
    /// variables, to reduce borrows and lookups in the caller.
    inline fun crank_schedule(): (bool, &mut Registry, u64, u64) {
        let time = timestamp::now_microseconds();
        let registry_ref_mut = &mut Registry[@arena];
        let n_melees_before_cranking = registry_ref_mut.melees_by_id.length();
        let current_melee_ref =
            registry_ref_mut.melees_by_id.borrow(n_melees_before_cranking);
        let cranked =
            if (time >= current_melee_ref.start_time + current_melee_ref.duration) {
                let market_ids = next_melee_market_ids(registry_ref_mut);
                register_melee(registry_ref_mut, n_melees_before_cranking, market_ids);
                true
            } else false;
        (cranked, registry_ref_mut, time, n_melees_before_cranking)
    }

    inline fun all_entrants_add_if_not_contains(
        self: &mut Melee, address: address
    ) {
        add_if_not_contains(&mut self.all_entrants, address);
    }

    inline fun active_entrants_add_if_not_contains(
        self: &mut Melee, address: address
    ) {
        add_if_not_contains(&mut self.active_entrants, address);
    }

    inline fun active_entrants_remove_if_contains(
        self: &mut Melee, address: address
    ) {
        remove_if_contains(&mut self.active_entrants, address);
    }

    inline fun available_rewards_decrement(self: &mut Melee, amount: u64) {
        self.available_rewards = self.available_rewards - amount;
    }

    inline fun available_rewards_increment(self: &mut Melee, amount: u64) {
        self.available_rewards = self.available_rewards + amount;
    }

    /// Assumes user has an escrow resource.
    inline fun exit_inner<Coin0, LP0, Coin1, LP1>(
        participant: &signer,
        participant_address: address,
        registry_ref_mut: &mut Registry,
        melee_is_current: bool
    ) acquires Registry {
        let escrow_ref_mut = &mut MeleeEscrow<Coin0, LP0, Coin1, LP1>[participant_address];
        let melee_id = escrow_ref_mut.melee_id;
        let exited_melee_ref_mut = registry_ref_mut.melees_by_id.borrow_mut(melee_id);

        // Charge tap out fee if applicable.
        if (melee_is_current) {
            let tap_out_fee_ref_mut = &mut escrow_ref_mut.tap_out_fee;
            if (*tap_out_fee_ref_mut > 0) {
                let vault_address =
                    account::get_signer_capability_address(
                        &registry_ref_mut.signer_capability
                    );
                aptos_account::transfer(
                    participant, vault_address, *tap_out_fee_ref_mut
                );
                *tap_out_fee_ref_mut = 0;
                exited_melee_ref_mut.available_rewards_increment(*tap_out_fee_ref_mut);
            }
        };

        // Withdraw emojicoin balances from escrow.
        if (coin::value(&escrow_ref_mut.emojicoin_0) > 0) {
            withdraw_from_escrow(participant_address, &mut escrow_ref_mut.emojicoin_0);
        } else {
            assert!(coin::value(&escrow_ref_mut.emojicoin_1) > 0, E_EXIT_NO_FUNDS);
            withdraw_from_escrow(participant_address, &mut escrow_ref_mut.emojicoin_1);
        };

        // Update user state.
        let user_melees_ref_mut = &mut UserMelees[participant_address];
        add_if_not_contains(&mut user_melees_ref_mut.exited_melee_ids, melee_id);
        remove_if_contains(&mut user_melees_ref_mut.unexited_melee_ids, melee_id);

        // Update melee state.
        exited_melee_ref_mut.active_entrants_remove_if_contains(participant_address);
        exited_melee_ref_mut.exited_entrants_add_if_not_contains(participant_address);
        exited_melee_ref_mut.locked_in_entrants_remove_if_contains(participant_address);
    }

    inline fun exited_entrants_add_if_not_contains(
        self: &mut Melee, address: address
    ) {
        add_if_not_contains(&mut self.exited_entrants, address);
    }

    inline fun exited_entrants_remove_if_contains(
        self: &mut Melee, address: address
    ) {
        remove_if_contains(&mut self.exited_entrants, address);
    }

    inline fun get_n_registered_markets(): u64 {
        let (_, _, _, n_markets, _, _, _, _, _, _, _, _) =
            unpack_registry_view(registry_view());
        n_markets
    }

    inline fun last_period_boundary(time: u64, period: u64): u64 {
        (time / period) * period
    }

    inline fun locked_in_entrants_add_if_not_contains(
        self: &mut Melee, address: address
    ) {
        add_if_not_contains(&mut self.locked_in_entrants, address);
    }

    inline fun locked_in_entrants_remove_if_contains(
        self: &mut Melee, address: address
    ) {
        remove_if_contains(&mut self.locked_in_entrants, address);
    }

    /// Uses mutable references to avoid freezing references up the stack.
    inline fun match_amount<Coin0, LP0, Coin1, LP1>(
        input_amount: u64,
        escrow_ref_mut: &mut MeleeEscrow<Coin0, LP0, Coin1, LP1>,
        current_melee_ref_mut: &mut Melee,
        registry_ref_mut: &mut Registry,
        time: u64
    ): u64 {
        let elapsed_time = ((time - current_melee_ref_mut.start_time) as u256);
        let duration = (current_melee_ref_mut.duration as u256);
        if (elapsed_time >= duration) { 0 }
        else {
            // Scale down input amount for matching percentage and remaining time in one compound
            // operation, to reduce truncation errors. Equivalent to:
            //
            //                max match percentage   remaining time
            // input_amount * -------------------- * --------------
            //                100                    duration
            let raw_match_amount =
                (
                    ((input_amount as u256)
                        * (current_melee_ref_mut.max_match_percentage as u256)
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
                    current_melee_ref_mut.available_rewards
                );
            // Correct for the max match amount that the user is eligible for.
            min(
                corrected_for_melee_available_rewards,
                current_melee_ref_mut.max_match_amount - escrow_ref_mut.tap_out_fee
            )
        }
    }

    inline fun melee_swaps_volume_increment(
        self: &mut Melee, amount: u128
    ) {
        aggregator_v2::add(&mut self.melee_swaps_volume, amount);
    }

    inline fun n_melee_swaps_increment(self: &mut Melee) {
        aggregator_v2::add(&mut self.n_melee_swaps, 1);
    }

    /// Accepts a mutable reference to avoid freezing references up the stack.
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

    /// Pseudo-random proxy for `random_market_id` for use during `init_module`.
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
        registry_ref_mut.melees_by_id.add(
            melee_id,
            Melee {
                melee_id,
                market_metadatas: sorted_unique_market_ids.map_ref(|market_id_ref| {
                    option::destroy_some(
                        emojicoin_dot_fun::market_metadata_by_market_id(*market_id_ref)
                    )
                }),
                start_time: last_period_boundary(
                    timestamp::now_microseconds(), registry_ref_mut.next_melee_duration
                ),
                duration: registry_ref_mut.next_melee_duration,
                max_match_percentage: registry_ref_mut.next_melee_max_match_percentage,
                max_match_amount: registry_ref_mut.next_melee_max_match_amount,
                available_rewards: registry_ref_mut.next_melee_available_rewards,
                all_entrants: smart_table::new(),
                active_entrants: smart_table::new(),
                exited_entrants: smart_table::new(),
                locked_in_entrants: smart_table::new(),
                n_melee_swaps: aggregator_v2::create_unbounded_aggregator(),
                melee_swaps_volume: aggregator_v2::create_unbounded_aggregator(),
                emojicoin_0_locked: aggregator_v2::create_unbounded_aggregator(),
                emojicoin_1_locked: aggregator_v2::create_unbounded_aggregator()
            }
        );
        registry_ref_mut.melee_ids_by_market_ids.add(sorted_unique_market_ids, melee_id);
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

    inline fun withdraw_from_escrow<Emojicoin>(
        recipient: address, escrow_coin_ref_mut: &mut Coin<Emojicoin>
    ) {
        aptos_account::deposit_coins(recipient, coin::extract_all(escrow_coin_ref_mut));
    }
}
