module arena::emojicoin_arena {

    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::randomness::Self;
    use aptos_framework::timestamp;
    use aptos_std::smart_table::{Self, SmartTable};
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

    const LOCK_IN_PERIOD_HOURS: u64 = 12;
    const MELEE_DURATION_HOURS: u64 = 36;
    const MICROSECONDS_PER_HOUR: u64 = 3_600_000_000;

    /// Flat integrator fee.
    const INTEGRATOR_FEE_RATE_BPS: u8 = 100;
    const INTEGRATOR_FEE_RATE_BPS_DUAL_ROUTE: u8 = 50;
    const REWARDS_PER_MELEE: u64 = 1500 * 100_000_000;
    const MATCH_PERCENTAGE: u64 = 20;
    const MAX_PERCENTAGE: u64 = 100;
    const MAX_MATCH_AMOUNT: u64 = 100_000_000;

    struct Melee has copy, drop, store {
        /// 1-indexed for conformity with market ID indexing.
        melee_id: u64,
        /// Market with lower market ID first.
        market_metadatas: vector<MarketMetadata>,
        available_rewards_in_octas: u64,
        /// In microseconds.
        start_time: u64,
        lock_in_period: u64,
        duration: u64
    }

    struct Nil has store {}

    struct MeleeEscrow<phantom Coin0, phantom LP0, phantom Coin1, phantom LP1> has key {
        melee_id: u64,
        emojicoin_0: Coin<Coin0>,
        emojicoin_1: Coin<Coin1>,
        tap_out_fee: u64
    }

    struct Registry has key {
        /// Map from melee serial ID to the melee.
        melees_by_id: SmartTable<u64, Melee>,
        /// Map from a sorted combination of market IDs (lower ID first) to the melee serial ID.
        melees_by_market_combo_sorted_market_ids: SmartTable<vector<u64>, u64>,
        /// Approves transfers from the vault.
        signer_capability: SignerCapability
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
                    tap_out_fee: 0
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
                if (current_tap_out_fee < MAX_MATCH_AMOUNT && lock_ins_still_allowed) {
                    let eligible_match_amount = MAX_MATCH_AMOUNT - current_tap_out_fee;
                    eligible_match_amount = if (eligible_match_amount
                        < current_melee_ref.available_rewards_in_octas) {
                        eligible_match_amount
                    } else {
                        current_melee_ref.available_rewards_in_octas
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
                            ((input_amount as u128) * (MATCH_PERCENTAGE as u128)
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
                            &mut registry_ref_mut.melees_by_id.borrow_mut(melee_id).available_rewards_in_octas;
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

        // Return early if type arguments or melee ID is passed incorrectly, but only after cranking
        // schedule.
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

    fun init_module(arena: &signer) {
        // Get first melee market addresses, without using randomness APIs.
        let time = timestamp::now_microseconds();
        let (_, _, _, n_markets, _, _, _, _, _, _, _, _) =
            unpack_registry_view(registry_view());
        let pseudo_random_market_id_0 = time % n_markets + 1;
        let pseudo_random_market_id_1;
        loop {
            pseudo_random_market_id_1 = psuedo_random_u64(time) % n_markets + 1;
            if (pseudo_random_market_id_1 != pseudo_random_market_id_0) break;
        };
        let market_ids =
            sort_unique_market_ids(
                pseudo_random_market_id_0, pseudo_random_market_id_1
            );

        // Initialize first melee.
        let start_time =
            last_period_boundary(time, LOCK_IN_PERIOD_HOURS * MICROSECONDS_PER_HOUR);
        let melees_by_id = smart_table::new();
        melees_by_id.add(
            1,
            Melee {
                melee_id: 1,
                market_metadatas: market_ids.map_ref(|market_id_ref| {
                    option::destroy_some(
                        emojicoin_dot_fun::market_metadata_by_market_id(*market_id_ref)
                    )
                }),
                available_rewards_in_octas: REWARDS_PER_MELEE,
                start_time,
                lock_in_period: LOCK_IN_PERIOD_HOURS * MICROSECONDS_PER_HOUR,
                duration: MELEE_DURATION_HOURS * MICROSECONDS_PER_HOUR
            }
        );
        let melees_by_market_combo_sorted_market_ids = smart_table::new();
        melees_by_market_combo_sorted_market_ids.add(market_ids, 1);

        // Store registry resource.
        let (vault_signer, signer_capability) =
            account::create_resource_account(arena, REGISTRY_SEED);
        move_to(
            arena,
            Registry {
                melees_by_id,
                melees_by_market_combo_sorted_market_ids,
                signer_capability
            }
        );
        coin::register<AptosCoin>(&vault_signer);
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
        // Only allow exit if user has corresponding melee resourcce and melee ID matches.
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
                        &mut exited_melee_ref_mut.available_rewards_in_octas;
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
            let market_ids = next_melee_market_ids();
            let melee_id = n_melees + 1;
            let registry_ref_mut = &mut Registry[@arena];
            registry_ref_mut.melees_by_id.add(
                melee_id,
                Melee {
                    melee_id,
                    market_metadatas: market_ids.map_ref(|market_id_ref| {
                        option::destroy_some(
                            emojicoin_dot_fun::market_metadata_by_market_id(*market_id_ref)
                        )
                    }),
                    available_rewards_in_octas: REWARDS_PER_MELEE,
                    start_time: last_period_boundary(
                        time, LOCK_IN_PERIOD_HOURS * MICROSECONDS_PER_HOUR
                    ),
                    lock_in_period: LOCK_IN_PERIOD_HOURS * MICROSECONDS_PER_HOUR,
                    duration: MELEE_DURATION_HOURS * MICROSECONDS_PER_HOUR
                }
            );
            registry_ref_mut.melees_by_market_combo_sorted_market_ids.add(
                market_ids, melee_id
            );
            true
        } else false
    }

    inline fun last_period_boundary(time: u64, period: u64): u64 {
        (time / period) * period
    }

    inline fun next_melee_market_ids(): vector<u64> {
        let (_, _, _, n_markets, _, _, _, _, _, _, _, _) =
            unpack_registry_view(registry_view());
        let market_ids;
        loop {
            let random_market_id_0 = random_market_id(n_markets);
            let random_market_id_1 = random_market_id(n_markets);
            if (random_market_id_0 == random_market_id_1) continue;
            market_ids = sort_unique_market_ids(random_market_id_0, random_market_id_1);
            if (!Registry[@arena].melees_by_market_combo_sorted_market_ids.contains(market_ids)) {
                break;
            }
        };
        market_ids

    }

    /// Psuedo random number generator based on xorshift64 algorithm from Wikipedia.
    inline fun psuedo_random_u64(seed: u64): u64 {
        seed = seed ^ (seed << 13);
        seed = seed ^ (seed >> 7);
        seed = seed ^ (seed << 17);
        seed
    }

    /// Market IDs are 1-indexed.
    inline fun random_market_id(n_markets: u64): u64 {
        randomness::u64_range(0, n_markets) + 1
    }

    inline fun sort_unique_market_ids(market_id_0: u64, market_id_1: u64): vector<u64> {
        if (market_id_0 < market_id_1) {
            vector[market_id_0, market_id_1]
        } else {
            vector[market_id_1, market_id_0]
        }
    }
}