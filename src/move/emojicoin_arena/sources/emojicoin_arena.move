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
    use emojicoin_dot_fun::emojicoin_dot_fun;
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

    #[event]
    /// Tracks state for active and historical melees. Also emitted whenever a new melee starts.
    struct Melee has copy, drop, store {
        /// 1-indexed for conformity with emojicoin market ID indexing.
        melee_id: u64,
        /// Address for emojicoin market with lower market ID.
        emojicoin_0_market_address: address,
        /// Address for emojicoin market with higher market ID.
        emojicoin_1_market_address: address,
        /// In microseconds.
        start_time: u64,
        /// How long melee lasts after start time.
        duration: u64,
        /// Max percentage of user's input amount to match in octas, when locking in.
        max_match_percentage: u64,
        /// Maximum amount of APT to match in octas, when locking in.
        max_match_amount: u64,
        /// Amount of rewards that are available to claim for an active melee, measured in octas and
        /// conditional on vault balance. If melee is inactive, represents the amount of rewards
        /// that were available at the end of the melee.
        available_rewards: u64
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
        next_melee_max_match_amount: u64
    }

    struct Escrow<phantom Coin0, phantom LP0, phantom Coin1, phantom LP1> has key {
        /// Corresponding `Melee.melee_id`.
        melee_id: u64,
        /// Emojicoin 0 holdings.
        emojicoin_0: Coin<Coin0>,
        /// Emojicoin 1 holdings.
        emojicoin_1: Coin<Coin1>,
        /// Cumulative amount of APT matched since most recent deposit into an empty `Escrow`, reset
        /// to 0 upon exit. Must be paid back in full when tapping out.
        match_amount: u64
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
        tap_out_fee: u64,
        emojicoin_0_proceeds: u64,
        emojicoin_1_proceeds: u64
    }

    #[event]
    /// Emitted whenever a user executes a double-route swap inside `Escrow`.
    struct Swap has copy, drop, store {
        user: address,
        melee_id: u64,
        quote_volume: u64,
        emojicoin_0_proceeds: u64,
        emojicoin_1_proceeds: u64
    }

    /// Exchange rate between APT and emojicoins.
    struct ExchangeRate has copy, drop, store {
        /// Octas per `quote` emojicoins.
        base: u64,
        /// Emojicoins per `base` octas.
        quote: u64
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
    ) acquires Escrow, Registry {
        let (melee_just_ended, registry_ref_mut, time, n_melees_before_cranking) =
            crank_schedule();
        if (melee_just_ended) return; // Can not enter melee if cranking ends it.

        // Get market addresses for active melee.
        let active_melee_ref_mut =
            registry_ref_mut.melees_by_id.borrow_mut(n_melees_before_cranking);
        let market_address_0 = active_melee_ref_mut.emojicoin_0_market_address;
        let market_address_1 = active_melee_ref_mut.emojicoin_1_market_address;

        // Create escrow if it doesn't exist.
        let melee_id = active_melee_ref_mut.melee_id;
        let entrant_address = signer::address_of(entrant);
        if (!exists<Escrow<Coin0, LP0, Coin1, LP1>>(entrant_address)) {
            move_to(
                entrant,
                Escrow<Coin0, LP0, Coin1, LP1> {
                    melee_id,
                    emojicoin_0: coin::zero(),
                    emojicoin_1: coin::zero(),
                    match_amount: 0
                }
            );
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
        if (escrow_ref_mut.match_amount > 0) assert!(lock_in, E_TOP_OFF_MUST_LOCK_IN);

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
                    active_melee_ref_mut.available_rewards -= match_amount;

                    // Update escrow state.
                    escrow_ref_mut.escrow_match_amount_increment(match_amount);

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
                emojicoin_1_proceeds = net_proceeds;
                quote_volume
            };

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

    }

    #[randomness]
    entry fun exit<Coin0, LP0, Coin1, LP1>(participant: &signer) acquires Escrow, Registry {
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
    entry fun swap<Coin0, LP0, Coin1, LP1>(swapper: &signer) acquires Escrow, Registry {

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
        let market_address_0 = swap_melee_ref_mut.emojicoin_0_market_address;
        let market_address_1 = swap_melee_ref_mut.emojicoin_1_market_address;

        // Swap, updating total emojicoin locked values based on side.
        let emojicoin_0_ref_mut = &mut escrow_ref_mut.emojicoin_0;
        let emojicoin_1_ref_mut = &mut escrow_ref_mut.emojicoin_1;
        let emojicoin_0_locked_before_swap = coin::value(emojicoin_0_ref_mut);
        let emojicoin_1_locked_before_swap = coin::value(emojicoin_1_ref_mut);
        let (emojicoin_0_proceeds, emojicoin_1_proceeds) = (0, 0);
        let quote_volume =
            if (emojicoin_0_locked_before_swap > 0) {
                let quote_volume =
                    swap_within_escrow<Coin0, LP0, Coin1, LP1>(
                        swapper,
                        swapper_address,
                        market_address_0,
                        market_address_1,
                        emojicoin_0_ref_mut,
                        emojicoin_1_ref_mut
                    );
                emojicoin_1_proceeds = coin::value(emojicoin_1_ref_mut);
                quote_volume
            } else {
                assert!(emojicoin_1_locked_before_swap > 0, E_SWAP_NO_FUNDS);
                let quote_volume =
                    swap_within_escrow<Coin1, LP1, Coin0, LP0>(
                        swapper,
                        swapper_address,
                        market_address_1,
                        market_address_0,
                        emojicoin_1_ref_mut,
                        emojicoin_0_ref_mut
                    );
                emojicoin_0_proceeds = coin::value(emojicoin_0_ref_mut);
                quote_volume
            };

        // Emit swap event.
        event::emit(
            Swap {
                user: swapper_address,
                melee_id: escrow_ref_mut.melee_id,
                quote_volume,
                emojicoin_0_proceeds,
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
                next_melee_max_match_amount: DEFAULT_MAX_MATCH_AMOUNT
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

    inline fun escrow_match_amount_increment<Coin0, LP0, Coin1, LP1>(
        self: &mut Escrow<Coin0, LP0, Coin1, LP1>,
        amount: u64
    ) {
        self.match_amount += amount;
    }

    inline fun escrow_match_amount_reset<Coin0, LP0, Coin1, LP1>(
        self: &mut Escrow<Coin0, LP0, Coin1, LP1>
    ) {
        self.match_amount = 0;
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
        let market_address_0 = exited_melee_ref_mut.emojicoin_0_market_address;
        let market_address_1 = exited_melee_ref_mut.emojicoin_1_market_address;

        // Charge tap out fee if applicable.
        let tap_out_fee = 0;
        let match_amount = escrow_ref_mut.match_amount;
        if (melee_is_active) {
            if (match_amount > 0) {
                let vault_address =
                    account::get_signer_capability_address(
                        &registry_ref_mut.signer_capability
                    );
                aptos_account::transfer(participant, vault_address, match_amount);
                tap_out_fee = match_amount;
                emit_vault_balance_update_with_vault_address(vault_address);

                // Update melee state.
                exited_melee_ref_mut.available_rewards += match_amount;
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
            tap_out_fee
        };

        // Update escrow state.
        escrow_ref_mut.escrow_match_amount_reset();

        // Emit exit event.
        event::emit(exit);
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
                active_melee_ref_mut.max_match_amount - escrow_ref_mut.match_amount
            )
        }
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
        let market_addresses =
            sorted_unique_market_ids.map_ref(|market_id_ref| {
                let (_, market_address, _) =
                    emojicoin_dot_fun::unpack_market_metadata(
                        option::destroy_some(
                            emojicoin_dot_fun::market_metadata_by_market_id(*market_id_ref)
                        )
                    );
                market_address
            });
        let emojicoin_0_market_address = market_addresses[0];
        let emojicoin_1_market_address = market_addresses[1];
        let start_time =
            last_period_boundary(
                timestamp::now_microseconds(), registry_ref_mut.next_melee_duration
            );
        let melee = Melee {
            melee_id,
            emojicoin_0_market_address,
            emojicoin_1_market_address,
            start_time,
            duration: registry_ref_mut.next_melee_duration,
            max_match_percentage: registry_ref_mut.next_melee_max_match_percentage,
            max_match_amount: registry_ref_mut.next_melee_max_match_amount,
            available_rewards: registry_ref_mut.next_melee_available_rewards
        };
        registry_ref_mut.melees_by_id.add(melee_id, melee);
        registry_ref_mut.melee_ids_by_market_ids.add(sorted_unique_market_ids, melee_id);
        event::emit(melee);
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
