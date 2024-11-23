module rewards::emojicoin_dot_fun_arena {

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
    use std::option::{Self, Option};
    use std::signer;

    /// Resource account address seed for the registry.
    const REGISTRY_SEED: vector<u8> = b"Arena registry";

    const U64_MAX: u64 = 0xffffffffffffffff;

    const LOCK_IN_PERIOD_HOURS: u64 = 12;
    const MELEE_DURATION_HOURS: u64 = 36;
    const MICROSECONDS_PER_HOUR: u64 = 3_600_000_000;

    /// Flat integrator fee.
    const INTEGRATOR_FEE_RATE_BPS: u8 = 100;
    const REWARDS_PER_MELEE: u64 = 1500 * 100_000_000;
    const MATCH_PERCENTAGE: u64 = 20;
    const MAX_PERCENTAGE: u64 = 100;
    const MAX_MATCH_AMOUNT: u64 = 100_000_000;

    struct Melee has copy, drop, store {
        /// 1-indexed for conformity with market ID indexing.
        melee_id: u64,
        /// Market with lower market ID first.
        market_metadatas: vector<MarketMetadata>,
        available_rewards: u64,
        /// In microseconds.
        start_time: u64,
        lock_in_period: u64,
        duration: u64
    }

    struct Nil has store {}

    struct MeleeEscrow<phantom Emojicoin0, phantom EmojicoinLP0, phantom Emojicoin1, phantom EmojicoinLP1> has key {
        melee_id: u64,
        /// Indentical to `Melee.market_metadatas`.
        market_metadatas: vector<MarketMetadata>,
        emojicoin_0: Coin<Emojicoin0>,
        emojicoin_1: Coin<Emojicoin1>,
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

    #[randomness]
    entry fun enter<Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1>(
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
        market_view<Emojicoin0, EmojicoinLP0>(market_address_0);
        let (_, market_address_1, _) = unpack_market_metadata(market_metadatas[1]);
        market_view<Emojicoin1, EmojicoinLP1>(market_address_1);

        // Create escrow and user melees resources if they don't exist.
        let melee_id = current_melee_ref.melee_id;
        let entrant_address = signer::address_of(entrant);
        if (!exists<MeleeEscrow<Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1>>(
            entrant_address
        )) {
            move_to(
                entrant,
                MeleeEscrow<Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1> {
                    melee_id,
                    market_metadatas,
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
                    &mut MeleeEscrow<Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1>[entrant_address];
                let current_tap_out_fee = escrow_ref_mut.tap_out_fee;
                let lock_in_period_end_time =
                    current_melee_ref.start_time + current_melee_ref.lock_in_period;
                let lock_ins_still_allowed =
                    timestamp::now_microseconds() < lock_in_period_end_time;
                if (current_tap_out_fee < MAX_MATCH_AMOUNT && lock_ins_still_allowed) {
                    let eligible_match_amount = MAX_MATCH_AMOUNT - current_tap_out_fee;
                    eligible_match_amount = if (eligible_match_amount
                        < current_melee_ref.available_rewards) {
                        eligible_match_amount
                    } else {
                        current_melee_ref.available_rewards
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
                        let registry_ref_mut = &mut Registry[@rewards];
                        let available_rewards_ref_mut =
                            registry_ref_mut.melees_by_id.borrow_mut(melee_id).available_rewards;
                        available_rewards_ref_mut = available_rewards_ref_mut
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
        let escrow_ref_mut =
            &mut MeleeEscrow<Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1>[entrant_address];
        if (buy_emojicoin_0) {
            let swap =
                emojicoin_dot_fun::simulate_swap<Emojicoin0, EmojicoinLP0>(
                    entrant_address,
                    market_address_0,
                    input_amount_after_matching,
                    false,
                    @integrator,
                    INTEGRATOR_FEE_RATE_BPS
                );
            let (_, _, _, _, _, _, _, _, net_proceeds, _, _, _, _, _, _, _, _, _) =
                emojicoin_dot_fun::unpack_swap(swap);
            emojicoin_dot_fun::swap<Emojicoin0, EmojicoinLP0>(
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
                emojicoin_dot_fun::simulate_swap<Emojicoin1, EmojicoinLP1>(
                    entrant_address,
                    market_address_1,
                    input_amount_after_matching,
                    false,
                    @integrator,
                    INTEGRATOR_FEE_RATE_BPS
                );
            let (_, _, _, _, _, _, _, _, net_proceeds, _, _, _, _, _, _, _, _, _) =
                emojicoin_dot_fun::unpack_swap(swap);
            emojicoin_dot_fun::swap<Emojicoin1, EmojicoinLP1>(
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
    entry fun exit<Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1>(
        participant: &signer, melee_id: u64
    ) acquires Registry {
        let may_have_to_pay_tap_out_fee = !crank_schedule();
        // Ensure registry available rewards incremented correctly.
    }

    #[randomness]
    entry fun swap<Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1>(
        swapper: &signer,
        melee_id: u64,
        market_addresses: vector<address>,
        buy_emojicoin_0: bool
    ) acquires Registry {
        if (crank_schedule()) {}
        else {}
    }

    fun init_module(rewards: &signer) {
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
                available_rewards: REWARDS_PER_MELEE,
                start_time,
                lock_in_period: LOCK_IN_PERIOD_HOURS * MICROSECONDS_PER_HOUR,
                duration: MELEE_DURATION_HOURS * MICROSECONDS_PER_HOUR
            }
        );
        let melees_by_market_combo_sorted_market_ids = smart_table::new();
        melees_by_market_combo_sorted_market_ids.add(market_ids, 1);

        // Store registry resource.
        let (vault_signer, signer_capability) =
            account::create_resource_account(rewards, REGISTRY_SEED);
        move_to(
            rewards,
            Registry {
                melees_by_id,
                melees_by_market_combo_sorted_market_ids,
                signer_capability
            }
        );
        coin::register<AptosCoin>(&vault_signer);
    }

    /// Cranks schedule and returns `true` if a melee has ended as a result.
    inline fun crank_schedule(): bool {
        let time = timestamp::now_microseconds();
        let registry_ref = &Registry[@rewards];
        let n_melees = registry_ref.melees_by_id.length();
        let most_recent_melee_ref = registry_ref.melees_by_id.borrow(n_melees);
        if (most_recent_melee_ref.start_time + most_recent_melee_ref.duration >= time) {
            let market_ids = next_melee_market_ids();
            let melee_id = n_melees + 1;
            let registry_ref_mut = &mut Registry[@rewards];
            registry_ref_mut.melees_by_id.add(
                melee_id,
                Melee {
                    melee_id,
                    market_metadatas: market_ids.map_ref(|market_id_ref| {
                        option::destroy_some(
                            emojicoin_dot_fun::market_metadata_by_market_id(*market_id_ref)
                        )
                    }),
                    available_rewards: REWARDS_PER_MELEE,
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
            if (!Registry[@rewards].melees_by_market_combo_sorted_market_ids.contains(market_ids)) {
                break;
            }
        };
        market_ids

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

    /// Psuedo random number generator based on xorshift64 algorithm from Wikipedia.
    inline fun psuedo_random_u64(seed: u64): u64 {
        seed = seed ^ (seed << 13);
        seed = seed ^ (seed >> 7);
        seed = seed ^ (seed << 17);
        seed
    }

    inline fun borrow_current_melee_ref(): &Melee {
        let registry_ref = &Registry[@rewards];
        let n_melees = registry_ref.melees_by_id.length();
        registry_ref.melees_by_id.borrow(n_melees)
    }
}
