module arena::emojicoin_arena {

    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aggregator_v2::{Self, Aggregator};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::randomness::Self;
    use aptos_framework::timestamp;
    use aptos_std::smart_table::{Self, SmartTable};
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

    /// Resource account address seed for the registry.
    const REGISTRY_SEED: vector<u8> = b"Arena registry";

    const U64_MAX: u64 = 0xffffffffffffffff;
    const MAX_PERCENTAGE: u64 = 100;

    /// Flat integrator fee.
    const INTEGRATOR_FEE_RATE_BPS: u8 = 100;
    const INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE: u8 = 50;

    // Default parameters for new melees.
    const DEFAULT_DURATION: u64 = 36 * 3_600_000_000;
    const DEFAULT_LOCK_IN_PERIOD: u64 = 12 * 3_600_000_000;
    const DEFAULT_AVAILABLE_REWADS: u64 = 1500 * 100_000_000;
    const DEFAULT_MATCH_PERCENTAGE: u64 = 50;
    const DEFAULT_MAX_MATCH_AMOUNT: u64 = 10 * 100_000_000;

    struct Melee has store {
        /// 1-indexed for conformity with emojicoin market ID indexing.
        melee_id: u64,
        /// Metadata for market with lower market ID comes first.
        market_metadatas: vector<MarketMetadata>,
        /// In microseconds.
        start_time: u64,
        /// How long melee lasts after start time.
        duration: u64,
        /// How long after start time users can lock in.
        lock_in_period: u64,
        /// Amount of rewards available for distribution in octas, conditional on vault balance.
        available_rewards: u64,
        /// Percentage of user's input amount to match in octas, when locking in.
        match_percentage: u64,
        /// Maximum amount of APT to match in octas, when locking in.
        max_match_amount: u64,
        /// Active entrants.
        entrants: SmartTable<address, Nil>,
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
        /// `Melee.market_id`.
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
        /// Octas user must pay to exit the melee, if they have locked in.
        tap_out_fee: u64
    }

    struct Nil has store {}

    struct Registry has key {
        /// Map from melee serial ID to the melee.
        melees_by_id: SmartTable<u64, Melee>,
        /// Map from a sorted combination of market IDs (lower ID first) to the melee serial ID.
        melee_ids_by_market_ids: SmartTable<vector<u64>, u64>,
        /// Approves transfers from the vault.
        signer_capability: SignerCapability,
        /// `Melee.duration` for new melees.
        new_melee_duration: u64,
        /// `Melee.lock_in_period` for new melees.
        new_melee_lock_in_period: u64,
        /// `Melee.available_rewards` for new melees.
        new_melee_available_rewards: u64,
        /// `Melee.match_percentage` for new melees.
        new_melee_match_percentage: u64,
        /// `Melee.max_match_amount` for new melees.
        new_melee_max_match_amount: u64
    }

    struct UserMelees has key {
        /// Set of serial IDs of all melees the user has entered.
        melee_ids: SmartTable<u64, Nil>
    }

    public entry fun fund_vault(arena: &signer, amount: u64) acquires Registry {
        assert!(signer::address_of(arena) == @arena, E_NOT_ARENA);
        let vault_address =
            account::get_signer_capability_address(&Registry[@arena].signer_capability);
        aptos_account::transfer(arena, vault_address, amount);
    }

    public entry fun withdraw_from_vault(arena: &signer, amount: u64) acquires Registry {
        assert!(signer::address_of(arena) == @arena, E_NOT_ARENA);
        let vault_signer =
            account::create_signer_with_capability(&Registry[@arena].signer_capability);
        aptos_account::transfer(&vault_signer, @arena, amount);
    }

    #[randomness]
    entry fun enter<Coin0, LP0, Coin1, LP1>(
        entrant: &signer,
        buy_emojicoin_0: bool,
        input_amount: u64,
        lock_in: bool
    ) acquires MeleeEscrow, Registry, UserMelees {
        if (crank_schedule()) return; // Can not enter melee if cranking ends it.

        // Verify coin types for the current melee by calling the market view function.
        let current_melee_ref = borrow_current_melee_ref();
        let market_metadatas = current_melee_ref.market_metadatas;
        let (_, market_address_0, _) = unpack_market_metadata(market_metadatas[0]);
        market_view<Coin0, LP0>(market_address_0);
        let (_, market_address_1, _) = unpack_market_metadata(market_metadatas[1]);
        market_view<Coin1, LP1>(market_address_1);

        // Create escrow and user melees resources if they don't exist.
        let melee_id = current_melee_ref.melee_id;
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
                move_to(entrant, UserMelees { melee_ids: smart_table::new() });
            };
            let user_melee_ids_ref_mut = &mut UserMelees[entrant_address].melee_ids;
            user_melee_ids_ref_mut.add(melee_id, Nil {});
        };

        // Try locking in if user selects the option.
        let match_amount =
            if (lock_in) {
                let escrow_ref_mut =
                    &mut MeleeEscrow<Coin0, LP0, Coin1, LP1>[entrant_address];
                let current_tap_out_fee = escrow_ref_mut.tap_out_fee;
                let lock_in_period_end_time =
                    current_melee_ref.start_time + current_melee_ref.lock_in_period;
                let lock_ins_still_allowed =
                    timestamp::now_microseconds() < lock_in_period_end_time;
                if (current_tap_out_fee < current_melee_ref.max_match_amount
                    && lock_ins_still_allowed) {
                    let eligible_match_amount =
                        current_melee_ref.max_match_amount - current_tap_out_fee;
                    eligible_match_amount = if (eligible_match_amount
                        < current_melee_ref.available_rewards) {
                        eligible_match_amount
                    } else {
                        current_melee_ref.available_rewards
                    };
                    let vault_balance =
                        coin::balance<AptosCoin>(
                            account::get_signer_capability_address(
                                &Registry[@arena].signer_capability
                            )
                        );
                    eligible_match_amount = if (eligible_match_amount < vault_balance) {
                        eligible_match_amount
                    } else {
                        vault_balance
                    };
                    let requested_match_amount =
                        (
                            ((input_amount as u128)
                                * (current_melee_ref.match_percentage as u128)
                                / (MAX_PERCENTAGE as u128)) as u64
                        );
                    let actual_match_amount =
                        if (eligible_match_amount < requested_match_amount) {
                            eligible_match_amount
                        } else {
                            requested_match_amount
                        };
                    if (actual_match_amount > 0) {
                        escrow_ref_mut.tap_out_fee = escrow_ref_mut.tap_out_fee
                            + actual_match_amount;
                        let registry_ref_mut = &mut Registry[@arena];
                        let available_rewards_ref_mut =
                            &mut registry_ref_mut.melees_by_id.borrow_mut(melee_id).available_rewards;
                        *available_rewards_ref_mut = *available_rewards_ref_mut
                            - actual_match_amount;
                        let vault_signer =
                            account::create_signer_with_capability(
                                &registry_ref_mut.signer_capability
                            );
                        aptos_account::transfer(
                            &vault_signer, entrant_address, actual_match_amount
                        );
                    };
                    actual_match_amount
                } else { 0 }
            } else { 0 };

        // Execute a swap then immediately move funds into escrow.
        let input_amount_after_matching = input_amount + match_amount;
        let escrow_ref_mut = &mut MeleeEscrow<Coin0, LP0, Coin1, LP1>[entrant_address];
        if (buy_emojicoin_0) {
            let swap =
                emojicoin_dot_fun::simulate_swap<Coin0, LP0>(
                    entrant_address,
                    market_address_0,
                    input_amount_after_matching,
                    false,
                    @integrator,
                    INTEGRATOR_FEE_RATE_BPS
                );
            let (_, _, _, _, _, _, _, _, net_proceeds, _, _, _, _, _, _, _, _, _) =
                emojicoin_dot_fun::unpack_swap(swap);
            emojicoin_dot_fun::swap<Coin0, LP0>(
                entrant,
                market_address_0,
                input_amount_after_matching,
                false,
                @integrator,
                INTEGRATOR_FEE_RATE_BPS,
                1
            );
            coin::merge(
                &mut escrow_ref_mut.emojicoin_0, coin::withdraw(entrant, net_proceeds)
            );
        } else {
            let swap =
                emojicoin_dot_fun::simulate_swap<Coin1, LP1>(
                    entrant_address,
                    market_address_1,
                    input_amount_after_matching,
                    false,
                    @integrator,
                    INTEGRATOR_FEE_RATE_BPS
                );
            let (_, _, _, _, _, _, _, _, net_proceeds, _, _, _, _, _, _, _, _, _) =
                emojicoin_dot_fun::unpack_swap(swap);
            emojicoin_dot_fun::swap<Coin1, LP1>(
                entrant,
                market_address_1,
                input_amount_after_matching,
                false,
                @integrator,
                INTEGRATOR_FEE_RATE_BPS,
                1
            );
            coin::merge(
                &mut escrow_ref_mut.emojicoin_1, coin::withdraw(entrant, net_proceeds)
            );
        }
    }

    #[randomness]
    entry fun exit<Coin0, LP0, Coin1, LP1>(
        participant: &signer, melee_id: u64
    ) acquires MeleeEscrow, Registry {
        exit_inner<Coin0, LP0, Coin1, LP1>(participant, melee_id, !crank_schedule());
    }

    #[randomness]
    entry fun swap<Coin0, LP0, Coin1, LP1>(
        swapper: &signer,
        melee_id: u64,
        market_addresses: vector<address>,
        buy_emojicoin_0: bool
    ) acquires MeleeEscrow, Registry {
        let exit_once_done = crank_schedule();

        // Return early if type arguments or melee ID are passed incorrectly, but only after
        // cranking schedule.
        let swapper_address = signer::address_of(swapper);
        if (!exists<MeleeEscrow<Coin0, LP0, Coin1, LP1>>(swapper_address)) {
            return;
        };
        let escrow_ref_mut = &mut MeleeEscrow<Coin0, LP0, Coin1, LP1>[swapper_address];
        if (escrow_ref_mut.melee_id != melee_id)
            return;
        let (market_address_0, market_address_1) =
            (market_addresses[0], market_addresses[1]);

        if (buy_emojicoin_0) {
            // Move emojicoin 1 balance out of escrow.
            let emojicoin_1_ref_mut = &mut escrow_ref_mut.emojicoin_1;
            let input_amount = coin::value(emojicoin_1_ref_mut);
            aptos_account::deposit_coins(
                swapper_address, coin::extract_all(emojicoin_1_ref_mut)
            );

            // Get amount of APT recieved by selling emojicoin 1, then execute swap.
            let swap_to_apt =
                emojicoin_dot_fun::simulate_swap<Coin1, LP1>(
                    swapper_address,
                    market_address_1,
                    input_amount,
                    true,
                    @integrator,
                    INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE
                );
            let (_, _, _, _, _, _, _, _, net_proceeds_in_apt, _, _, _, _, _, _, _, _, _) =
                emojicoin_dot_fun::unpack_swap(swap_to_apt);
            emojicoin_dot_fun::swap<Coin1, LP1>(
                swapper,
                market_address_1,
                input_amount,
                true,
                @integrator,
                INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE,
                1
            );

            // Get amount of emojicoin 0 recieved by buying it with APT proceeds.
            let swap_to_emojicoin_0 =
                emojicoin_dot_fun::simulate_swap<Coin0, LP0>(
                    swapper_address,
                    market_address_0,
                    net_proceeds_in_apt,
                    false,
                    @integrator,
                    INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE
                );
            let (
                _,
                _,
                _,
                _,
                _,
                _,
                _,
                _,
                net_proceeds_in_emojicoin_0,
                _,
                _,
                _,
                _,
                _,
                _,
                _,
                _,
                _
            ) = emojicoin_dot_fun::unpack_swap(swap_to_emojicoin_0);
            emojicoin_dot_fun::swap<Coin0, LP0>(
                swapper,
                market_address_0,
                net_proceeds_in_apt,
                false,
                @integrator,
                INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE,
                1
            );

            // Move emojicoin 0 balance to escrow.
            coin::merge(
                &mut escrow_ref_mut.emojicoin_0,
                coin::withdraw(swapper, net_proceeds_in_emojicoin_0)
            );
        } else {
            // Move emojicoin 0 balance out of escrow.
            let emojicoin_0_ref_mut = &mut escrow_ref_mut.emojicoin_0;
            let input_amount = coin::value(emojicoin_0_ref_mut);
            aptos_account::deposit_coins(
                swapper_address, coin::extract_all(emojicoin_0_ref_mut)
            );

            // Get amount of APT recieved by selling emojicoin 0, then execute swap.
            let swap_to_apt =
                emojicoin_dot_fun::simulate_swap<Coin0, LP0>(
                    swapper_address,
                    market_address_0,
                    input_amount,
                    true,
                    @integrator,
                    INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE
                );
            let (_, _, _, _, _, _, _, _, net_proceeds_in_apt, _, _, _, _, _, _, _, _, _) =
                emojicoin_dot_fun::unpack_swap(swap_to_apt);
            emojicoin_dot_fun::swap<Coin0, LP0>(
                swapper,
                market_address_1,
                input_amount,
                true,
                @integrator,
                INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE,
                1
            );

            // Get amount of emojicoin 1 recieved by buying it with APT proceeds.
            let swap_to_emojicoin_1 =
                emojicoin_dot_fun::simulate_swap<Coin1, LP1>(
                    swapper_address,
                    market_address_1,
                    net_proceeds_in_apt,
                    false,
                    @integrator,
                    INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE
                );
            let (
                _,
                _,
                _,
                _,
                _,
                _,
                _,
                _,
                net_proceeds_in_emojicoin_1,
                _,
                _,
                _,
                _,
                _,
                _,
                _,
                _,
                _
            ) = emojicoin_dot_fun::unpack_swap(swap_to_emojicoin_1);
            emojicoin_dot_fun::swap<Coin1, LP1>(
                swapper,
                market_address_1,
                net_proceeds_in_apt,
                false,
                @integrator,
                INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE,
                1
            );

            // Move emojicoin 1 balance to escrow.
            coin::merge(
                &mut escrow_ref_mut.emojicoin_1,
                coin::withdraw(swapper, net_proceeds_in_emojicoin_1)
            );
        };

        if (exit_once_done) exit_inner<Coin0, LP0, Coin1, LP1>(swapper, melee_id, false);
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
                new_melee_duration: DEFAULT_DURATION,
                new_melee_lock_in_period: DEFAULT_LOCK_IN_PERIOD,
                new_melee_available_rewards: DEFAULT_AVAILABLE_REWADS,
                new_melee_match_percentage: DEFAULT_MATCH_PERCENTAGE,
                new_melee_max_match_amount: DEFAULT_MAX_MATCH_AMOUNT
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

    inline fun borrow_current_melee_ref(): &Melee {
        let registry_ref = &Registry[@arena];
        let n_melees = registry_ref.melees_by_id.length();
        registry_ref.melees_by_id.borrow(n_melees)
    }

    inline fun exit_inner<Coin0, LP0, Coin1, LP1>(
        participant: &signer, melee_id: u64, may_have_to_pay_tap_out_fee: bool
    ) acquires Registry {
        let participant_address = signer::address_of(participant);
        // Only allow exit if user has corresponding melee resource and melee ID matches.
        if (exists<MeleeEscrow<Coin0, LP0, Coin1, LP1>>(participant_address)) {
            let escrow_ref_mut =
                &mut MeleeEscrow<Coin0, LP0, Coin1, LP1>[participant_address];
            // Only allow exit if melee ID matches.
            if (escrow_ref_mut.melee_id == melee_id) {
                // Update available rewards and transfer tap out fee to vault if applicable.
                if (may_have_to_pay_tap_out_fee) {
                    let registry_ref_mut = &mut Registry[@arena];
                    let exited_melee_ref_mut =
                        registry_ref_mut.melees_by_id.borrow_mut(melee_id);
                    let tap_out_fee_ref_mut = &mut escrow_ref_mut.tap_out_fee;
                    let available_rewards_ref_mut =
                        &mut exited_melee_ref_mut.available_rewards;
                    *available_rewards_ref_mut = *available_rewards_ref_mut
                        + *tap_out_fee_ref_mut;
                    let vault_address =
                        account::get_signer_capability_address(
                            &registry_ref_mut.signer_capability
                        );
                    aptos_account::transfer(
                        participant, vault_address, *tap_out_fee_ref_mut
                    );
                    *tap_out_fee_ref_mut = 0;
                };
                // Move emojicoin balances out of escrow.
                aptos_account::deposit_coins(
                    participant_address,
                    coin::extract_all(&mut escrow_ref_mut.emojicoin_0)
                );
                aptos_account::deposit_coins(
                    participant_address,
                    coin::extract_all(&mut escrow_ref_mut.emojicoin_1)
                );
            };
        }
    }

    /// Cranks schedule and returns `true` if a melee has ended as a result.
    inline fun crank_schedule(): bool {
        let time = timestamp::now_microseconds();
        let registry_ref = &Registry[@arena];
        let n_melees = registry_ref.melees_by_id.length();
        let most_recent_melee_ref = registry_ref.melees_by_id.borrow(n_melees);
        if (time >= most_recent_melee_ref.start_time + most_recent_melee_ref.duration) {
            let next_melee_market_ids = next_melee_market_ids(registry_ref);
            register_melee(&mut Registry[@arena], n_melees, next_melee_market_ids);
            true
        } else false
    }

    inline fun get_n_registered_markets(): u64 {
        let (_, _, _, n_markets, _, _, _, _, _, _, _, _) =
            unpack_registry_view(registry_view());
        n_markets
    }

    inline fun last_period_boundary(time: u64, period: u64): u64 {
        (time / period) * period
    }

    inline fun next_melee_market_ids(registry_ref: &Registry): vector<u64> {
        let n_markets = get_n_registered_markets();
        let market_ids;
        loop {
            let market_id_0 = random_market_id(n_markets);
            let market_id_1 = random_market_id(n_markets);
            if (market_id_0 == market_id_1) continue;
            market_ids = sort_unique_market_ids(market_id_0, market_id_1);
            if (!registry_ref.melee_ids_by_market_ids.contains(market_ids))
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
        n_melees: u64,
        sorted_unique_market_ids: vector<u64>
    ) {
        let melee_id = n_melees + 1;
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
                    timestamp::now_microseconds(),
                    registry_ref_mut.new_melee_lock_in_period
                ),
                lock_in_period: registry_ref_mut.new_melee_lock_in_period,
                duration: registry_ref_mut.new_melee_duration,
                available_rewards: registry_ref_mut.new_melee_available_rewards,
                match_percentage: registry_ref_mut.new_melee_match_percentage,
                max_match_amount: registry_ref_mut.new_melee_max_match_amount,
                entrants: smart_table::new(),
                n_melee_swaps: aggregator_v2::create_unbounded_aggregator(),
                melee_swaps_volume: aggregator_v2::create_unbounded_aggregator(),
                emojicoin_0_locked: aggregator_v2::create_unbounded_aggregator(),
                emojicoin_1_locked: aggregator_v2::create_unbounded_aggregator()
            }
        );
        registry_ref_mut.melee_ids_by_market_ids.add(sorted_unique_market_ids, melee_id);
    }

    inline fun sort_unique_market_ids(market_id_0: u64, market_id_1: u64): vector<u64> {
        if (market_id_0 < market_id_1) {
            vector[market_id_0, market_id_1]
        } else {
            vector[market_id_1, market_id_0]
        }
    }
}
