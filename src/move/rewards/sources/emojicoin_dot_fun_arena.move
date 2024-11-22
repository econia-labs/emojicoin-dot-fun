module rewards::emojicoin_dot_fun_arena {

    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::randomness::Self;
    use aptos_framework::timestamp;
    use aptos_std::smart_table::{Self, SmartTable};
    use emojicoin_dot_fun::emojicoin_dot_fun::{
        Self,
        MarketMetadata,
        registry_view,
        unpack_registry_view
    };
    use std::option::{Self, Option};

    const REGISTRY_SEED: vector<u8> = b"Arena registry";
    const U64_MAX: u64 = 0xffffffffffffffff;

    const LOCK_IN_PERIOD_HOURS: u64 = 12;
    const MELEE_DURATION_HOURS: u64 = 36;
    const MICROSECONDS_PER_HOUR: u64 = 3_600_000_000;

    const REWARDS_PER_MELEE: u64 = 100_000_000 * 1250;

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

    struct UserMelees has key {
        /// Set of serial IDs of all melees the user has entered.
        melee_ids: SmartTable<u64, Nil>
    }

    struct Registry has key {
        /// Map from melee serial ID to the melee.
        melees_by_id: SmartTable<u64, Melee>,
        /// Map from a sorted combination of market IDs (lower ID first) to the melee serial ID.
        melees_by_market_combo_sorted_market_ids: SmartTable<vector<u64>, u64>,
        /// Approves transfers from the vault.
        signer_capability: SignerCapability
    }

    #[randomness]
    entry fun enter<Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1>(
        entrant: &signer,
        melee_id: u64,
        market_addresses: vector<address>,
        buy_emojicoin_0: bool,
        input_amount: u64,
        lock_in: bool
    ) {}

    #[randomness]
    entry fun swap<Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1>(
        swapper: &signer,
        melee_id: u64,
        market_addresses: vector<address>,
        buy_emojicoin_0: bool
    ) {}

    #[randomness]
    entry fun exit<Emojicoin0, EmojicoinLP0, Emojicoin1, EmojicoinLP1>(
        participant: &signer, melee_id: u64
    ) {}

    inline fun crank_schedule() {
        let registry_ref_mut = &mut Registry[@rewards];
        let n_melees = registry_ref_mut.melees_by_id.length();
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

    fun init_module(rewards: &signer) {
        /// Get first melee tuple, without using randomness APIs.
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
                market_metadatas: vector[
                    option::destroy_some(
                        emojicoin_dot_fun::market_metadata_by_market_id(market_ids[0])
                    ),
                    option::destroy_some(
                        emojicoin_dot_fun::market_metadata_by_market_id(market_ids[1])
                    )
                ],
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
}
