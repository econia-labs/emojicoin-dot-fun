// cspell:word funder
// cspell:word unexited
module emojicoin_arena::emojicoin_arena {

    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event;
    use aptos_framework::randomness::Self;
    use aptos_framework::timestamp;
    use aptos_std::math64::min;
    use aptos_std::table::{Self, Table};
    use aptos_std::table_with_length::{Self, TableWithLength};
    use aptos_std::type_info;
    use emojicoin_arena::pseudo_randomness;
    use emojicoin_dot_fun::emojicoin_dot_fun;
    use std::option::Self;
    use std::signer;

    /// Signer does not correspond to `@emojicoin_arena` named address.
    const E_NOT_EMOJICOIN_ARENA: u64 = 0;
    /// User's melee escrow has nonzero emojicoin 0 balance.
    const E_ENTER_COIN_BALANCE_0: u64 = 1;
    /// User's melee escrow has nonzero emojicoin 1 balance.
    const E_ENTER_COIN_BALANCE_1: u64 = 2;
    /// User did not select lock in even though they've been matched since escrow was last empty.
    const E_TOP_OFF_MUST_LOCK_IN: u64 = 3;
    /// Provided escrow coin type is invalid.
    const E_INVALID_ESCROW_COIN_TYPE: u64 = 4;
    /// User has no escrow resource.
    const E_NO_ESCROW: u64 = 5;
    /// User has no funds in escrow to withdraw.
    const E_EXIT_NO_FUNDS: u64 = 6;
    /// Provided melee ID does not match existing resource.
    const E_MELEE_ID_MISMATCH: u64 = 7;
    /// Melee ID does not correspond to a melee that has been registered.
    const E_INVALID_MELEE_ID: u64 = 8;
    /// User has no funds in escrow to swap.
    const E_SWAP_NO_FUNDS: u64 = 9;
    /// User can not afford tap out fee.
    const E_EXIT_TAP_OUT_FEE: u64 = 10;

    const MAX_PERCENTAGE: u64 = 100;

    /// Resource account address seed for the registry.
    const REGISTRY_SEED: vector<u8> = b"Arena registry";

    /// Flat integrator fee for a single-route swap into escrow.
    const INTEGRATOR_FEE_RATE_BPS_SINGLE_ROUTE: u8 = 100;
    /// Flat integrator fee for a double-route swap within escrow.
    const INTEGRATOR_FEE_RATE_BPS_DOUBLE_ROUTE: u8 = 50;

    // Default parameters for new melees.
    const DEFAULT_DURATION: u64 = 20 * 3_600_000_000;
    const DEFAULT_AVAILABLE_REWARDS: u64 = 1000 * 100_000_000;
    const DEFAULT_MAX_MATCH_PERCENTAGE: u64 = 50;
    const DEFAULT_MAX_MATCH_AMOUNT: u64 = 5 * 100_000_000;

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

    /// Tracks all melees, holds a signer capability for the rewards vault, and stores parameters
    /// for the next melee.
    struct Registry has key {
        /// A map of each `Melee`'s `melee_id` to the `Melee` itself. 1-indexed for conformity with
        /// emojicoin market ID indexing.
        melees_by_id: TableWithLength<u64, Melee>,
        /// Map from a sorted combination of market IDs (lower ID first) to the `Melee` serial ID,
        /// used to prevent duplicate melees by reverse lookup during crank time.
        melee_ids_by_market_ids: Table<vector<u64>, u64>,
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

    struct RegistryView has copy, drop, store {
        n_melees: u64,
        vault_address: address,
        vault_balance: u64,
        next_melee_duration: u64,
        next_melee_available_rewards: u64,
        next_melee_max_match_percentage: u64,
        next_melee_max_match_amount: u64
    }

    /// Tracks user's emojicoin holdings and octas matched since the escrow was last empty.
    struct Escrow<phantom Coin0, phantom LP0, phantom Coin1, phantom LP1> has key {
        /// Corresponding `Melee.melee_id`.
        melee_id: u64,
        /// Emojicoin 0 holdings.
        emojicoin_0: Coin<Coin0>,
        /// Emojicoin 1 holdings.
        emojicoin_1: Coin<Coin1>,
        /// Cumulative octas matched since the `Escrow` was last empty, reset to 0 upon exit. Must
        /// be paid back in full when tapping out.
        match_amount: u64
    }

    struct EscrowView has copy, drop, store {
        melee_id: u64,
        emojicoin_0_balance: u64,
        emojicoin_1_balance: u64,
        match_amount: u64
    }

    #[event]
    /// Emitted whenever a user executes a single-route swap into `Escrow`.
    struct Enter has copy, drop, store {
        user: address,
        melee_id: u64,
        /// Argument passed to `enter`, independent of potential `match_amount`.
        input_amount: u64,
        quote_volume: u64,
        integrator_fee: u64,
        match_amount: u64,
        emojicoin_0_proceeds: u64,
        emojicoin_1_proceeds: u64,
        /// After the swap into escrow.
        emojicoin_0_exchange_rate: ExchangeRate,
        /// After the swap into escrow.
        emojicoin_1_exchange_rate: ExchangeRate
    }

    #[event]
    /// Emitted whenever a user exits from `Escrow`.
    struct Exit has copy, drop, store {
        user: address,
        melee_id: u64,
        /// Octas user had to pay if exiting before the end of the melee, if applicable.
        tap_out_fee: u64,
        emojicoin_0_proceeds: u64,
        emojicoin_1_proceeds: u64,
        emojicoin_0_exchange_rate: ExchangeRate,
        emojicoin_1_exchange_rate: ExchangeRate
    }

    #[event]
    /// Emitted whenever a user executes a double-route swap inside `Escrow`.
    struct Swap has copy, drop, store {
        user: address,
        melee_id: u64,
        quote_volume: u64,
        integrator_fee: u64,
        emojicoin_0_proceeds: u64,
        emojicoin_1_proceeds: u64,
        /// After the swap within escrow.
        emojicoin_0_exchange_rate: ExchangeRate,
        /// After the swap within escrow.
        emojicoin_1_exchange_rate: ExchangeRate
    }

    #[event]
    /// Emitted whenever the vault balance is updated, except for when the vault is funded by
    /// sending funds directly to the vault address instead of by using the `fund_vault` function.
    struct VaultBalanceUpdate has copy, drop, store {
        new_balance: u64
    }

    /// Exchange rate between APT and emojicoins.
    struct ExchangeRate has copy, drop, store {
        /// Octas per `quote` emojicoins.
        base: u64,
        /// Emojicoins per `base` octas.
        quote: u64
    }

    /// Ephemeral batch of swap arguments for a given emojicoin market, enabling cleaner abstraction
    /// across coin types.
    struct SwapArgumentsForEmojicoin has copy, drop {
        swapper_address: address,
        input_amount: u64,
        sell_emojicoin_for_apt: bool,
        integrator_fee_rate_bps: u8
    }

    #[randomness]
    entry fun enter<Coin0, LP0, Coin1, LP1, EscrowCoin>(
        entrant: &signer, input_amount: u64, lock_in: bool
    ) acquires Escrow, Registry {

        // Crank schedule, returning early as applicable and storing active melee ID.
        let (melee_just_ended, registry_ref_mut, time, n_melees_before_cranking) =
            crank_schedule();
        if (melee_just_ended) return; // Can not enter melee if cranking ends it.
        let melee_id = n_melees_before_cranking;

        // Get market addresses for active melee.
        let (active_melee_ref_mut, market_address_0, market_address_1) =
            borrow_melee_mut_with_market_addresses(
                registry_ref_mut, n_melees_before_cranking
            );

        // Create escrow if it doesn't exist.
        let entrant_address =
            ensure_melee_escrow_exists<Coin0, LP0, Coin1, LP1>(entrant, melee_id);

        // Verify user has indicated escrow coin type as one of the two emojicoin types. Note that
        // coin types are later type checked against each market during exchange rate calculations.
        let buy_coin_0 = check_buy_side<Coin0, Coin1, EscrowCoin>();

        // Verify that user does not split balance between the two emojicoins.
        let escrow_ref_mut =
            check_enter_balances<Coin0, LP0, Coin1, LP1>(entrant_address, buy_coin_0);

        // Verify that if user has been matched since the escrow was last empty, they lock in again.
        if (escrow_ref_mut.match_amount > 0) assert!(lock_in, E_TOP_OFF_MUST_LOCK_IN);

        // Match a portion of user's contribution if they elect to lock in, and if there are any
        // available rewards to match.
        let match_amount =
            try_match_entry<Coin0, LP0, Coin1, LP1>(
                lock_in,
                input_amount,
                escrow_ref_mut,
                active_melee_ref_mut,
                registry_ref_mut,
                time,
                entrant_address
            );

        // Execute a swap into the escrow.
        let (quote_volume, integrator_fee, emojicoin_0_proceeds, emojicoin_1_proceeds) =
            swap_into_escrow<Coin0, LP0, Coin1, LP1>(
                entrant,
                entrant_address,
                escrow_ref_mut,
                market_address_0,
                market_address_1,
                input_amount + match_amount,
                buy_coin_0
            );

        // Emit enter event.
        event::emit(
            Enter {
                user: entrant_address,
                melee_id,
                input_amount,
                quote_volume,
                integrator_fee,
                match_amount,
                emojicoin_0_proceeds,
                emojicoin_1_proceeds,
                emojicoin_0_exchange_rate: exchange_rate_inner<Coin0, LP0>(
                    market_address_0
                ),
                emojicoin_1_exchange_rate: exchange_rate_inner<Coin1, LP1>(
                    market_address_1
                )
            }
        );

    }

    #[randomness]
    entry fun swap<Coin0, LP0, Coin1, LP1>(swapper: &signer) acquires Escrow, Registry {
        // Crank schedule, set local variables.
        let (
            _,
            _,
            market_address_0,
            market_address_1,
            melee_is_active,
            swapper_address,
            escrow_ref_mut,
            melee_id
        ) = existing_participant_prologue<Coin0, LP0, Coin1, LP1>(swapper);

        // Swap coins within escrow.
        let (quote_volume, integrator_fee, emojicoin_0_proceeds, emojicoin_1_proceeds) =
            swap_within_escrow<Coin0, LP0, Coin1, LP1>(
                swapper,
                swapper_address,
                escrow_ref_mut,
                market_address_0,
                market_address_1
            );

        // Emit swap event.
        event::emit(
            Swap {
                user: swapper_address,
                melee_id,
                quote_volume,
                integrator_fee,
                emojicoin_0_proceeds,
                emojicoin_1_proceeds,
                emojicoin_0_exchange_rate: exchange_rate_inner<Coin0, LP0>(
                    market_address_0
                ),
                emojicoin_1_exchange_rate: exchange_rate_inner<Coin1, LP1>(
                    market_address_1
                )
            }
        );

        // Exit automatically if melee is no longer active.
        if (!melee_is_active) {
            exit_epilogue<Coin0, LP0, Coin1, LP1>(
                swapper_address,
                escrow_ref_mut,
                melee_id,
                0,
                market_address_0,
                market_address_1
            );
        }
    }

    #[randomness]
    entry fun exit<Coin0, LP0, Coin1, LP1>(participant: &signer) acquires Escrow, Registry {
        // Crank schedule, set local variables.
        let (
            registry_ref_mut,
            exited_melee_ref_mut,
            market_address_0,
            market_address_1,
            melee_is_active,
            participant_address,
            escrow_ref_mut,
            melee_id
        ) = existing_participant_prologue<Coin0, LP0, Coin1, LP1>(participant);

        // Charge tap out fee if applicable, updating escrow match amount since user has exited.
        let match_amount = escrow_ref_mut.match_amount;
        let tap_out_fee =
            if (melee_is_active && match_amount > 0) {

                // Get vault address and transfer match amount back to vault.
                let vault_address =
                    account::get_signer_capability_address(
                        &registry_ref_mut.signer_capability
                    );
                let user_balance = coin::balance<AptosCoin>(participant_address);
                assert!(user_balance >= match_amount, E_EXIT_TAP_OUT_FEE);
                aptos_account::transfer(participant, vault_address, match_amount);
                emit_vault_balance_update_with_vault_address(vault_address);

                // Update available rewards for the melee since match amount has been returned.
                exited_melee_ref_mut.available_rewards += match_amount;

                match_amount
            } else { 0 };

        escrow_ref_mut.match_amount = 0;

        // Withdraw emojicoin balance from escrow, verifying there are funds to withdraw.
        let (emojicoin_0_proceeds, emojicoin_1_proceeds) =
            exit_epilogue<Coin0, LP0, Coin1, LP1>(
                participant_address,
                escrow_ref_mut,
                melee_id,
                tap_out_fee,
                market_address_0,
                market_address_1
            );
        assert!(
            emojicoin_0_proceeds > 0 || emojicoin_1_proceeds > 0,
            E_EXIT_NO_FUNDS
        );
    }

    #[view]
    public fun escrow<Coin0, LP0, Coin1, LP1>(participant: address): EscrowView acquires Escrow {
        assert!(
            exists<Escrow<Coin0, LP0, Coin1, LP1>>(participant),
            E_NO_ESCROW
        );
        let escrow_ref = &Escrow<Coin0, LP0, Coin1, LP1>[participant];
        EscrowView {
            melee_id: escrow_ref.melee_id,
            emojicoin_0_balance: coin::value(&escrow_ref.emojicoin_0),
            emojicoin_1_balance: coin::value(&escrow_ref.emojicoin_1),
            match_amount: escrow_ref.match_amount
        }
    }

    public fun unpack_escrow_view(self: EscrowView): (u64, u64, u64, u64) {
        let EscrowView { melee_id, emojicoin_0_balance, emojicoin_1_balance, match_amount } =
            self;
        (melee_id, emojicoin_0_balance, emojicoin_1_balance, match_amount)
    }

    #[view]
    public fun escrow_exists<Coin0, LP0, Coin1, LP1>(participant: address): bool {
        exists<Escrow<Coin0, LP0, Coin1, LP1>>(participant)
    }

    #[view]
    public fun exchange_rate<Emojicoin, EmojicoinLP>(
        market_address: address
    ): ExchangeRate {
        exchange_rate_inner<Emojicoin, EmojicoinLP>(market_address)
    }

    public fun unpack_exchange_rate(self: ExchangeRate): (u64, u64) {
        let ExchangeRate { base, quote } = self;
        (base, quote)
    }

    #[view]
    /// Uses mutable references since inner match amount call requires them to prevent issues in
    /// core APIs, even though no data gets mutated. Does not crank schedule since this requires
    /// randomness, which is not safely supported in public functions.
    public fun match_amount<Coin0, LP0, Coin1, LP1>(
        participant: address, input_amount: u64, melee_id: u64
    ): u64 acquires Escrow, Registry {

        // Get global resources and associated information.
        let registry_ref_mut = &mut Registry[@emojicoin_arena];
        let melees_by_id_ref_mut = &mut registry_ref_mut.melees_by_id;
        let n_registered_melees = melees_by_id_ref_mut.length();

        // If user has an escrow, check melee ID and get the amount they've matched for the melee.
        let escrow_match_amount =
            if (exists<Escrow<Coin0, LP0, Coin1, LP1>>(participant)) {
                let escrow_ref = &Escrow<Coin0, LP0, Coin1, LP1>[participant];
                assert!(escrow_ref.melee_id == melee_id, E_MELEE_ID_MISMATCH);
                escrow_ref.match_amount
            } else { // Otherwise, check melee ID and type arguments, returning no match amount.
                assert!(
                    melee_id <= n_registered_melees && melee_id > 0,
                    E_INVALID_MELEE_ID
                );
                let indicated_melee_ref_mut = melees_by_id_ref_mut.borrow_mut(melee_id);
                emojicoin_dot_fun::market_view<Coin0, LP0>(
                    indicated_melee_ref_mut.emojicoin_0_market_address
                );
                emojicoin_dot_fun::market_view<Coin1, LP1>(
                    indicated_melee_ref_mut.emojicoin_1_market_address
                );
                0
            };

        // Borrow the most recent melee, returning early if it does not match indicated melee ID.
        if (melee_id != n_registered_melees) return 0;
        let most_recent_melee_ref_mut =
            melees_by_id_ref_mut.borrow_mut(n_registered_melees);

        // Return early if most recent melee has ended.
        let time = timestamp::now_microseconds();
        if (time
            >= most_recent_melee_ref_mut.start_time
                + most_recent_melee_ref_mut.duration)
            return 0;

        // Cross-reference resources and time to get match amount.
        match_amount_inner(
            input_amount,
            escrow_match_amount,
            most_recent_melee_ref_mut,
            registry_ref_mut,
            time
        )
    }

    #[view]
    public fun melee(melee_id: u64): Melee acquires Registry {
        let registry_ref = &Registry[@emojicoin_arena];
        let melees_by_id_ref = &registry_ref.melees_by_id;
        assert!(
            melee_id <= melees_by_id_ref.length() && melee_id > 0,
            E_INVALID_MELEE_ID
        );
        *melees_by_id_ref.borrow(melee_id)
    }

    public fun unpack_melee(self: Melee): (u64, address, address, u64, u64, u64, u64, u64) {
        let Melee {
            melee_id,
            emojicoin_0_market_address,
            emojicoin_1_market_address,
            start_time,
            duration,
            max_match_percentage,
            max_match_amount,
            available_rewards
        } = self;
        (
            melee_id,
            emojicoin_0_market_address,
            emojicoin_1_market_address,
            start_time,
            duration,
            max_match_percentage,
            max_match_amount,
            available_rewards
        )
    }

    #[view]
    public fun registry(): RegistryView acquires Registry {
        let registry_ref = &Registry[@emojicoin_arena];
        let vault_address =
            account::get_signer_capability_address(&registry_ref.signer_capability);
        RegistryView {
            n_melees: registry_ref.melees_by_id.length(),
            vault_address,
            vault_balance: coin::balance<AptosCoin>(vault_address),
            next_melee_duration: registry_ref.next_melee_duration,
            next_melee_available_rewards: registry_ref.next_melee_available_rewards,
            next_melee_max_match_percentage: registry_ref.next_melee_max_match_percentage,
            next_melee_max_match_amount: registry_ref.next_melee_max_match_amount
        }
    }

    public fun unpack_registry_view(self: RegistryView):
        (u64, address, u64, u64, u64, u64, u64) {
        let RegistryView {
            n_melees,
            vault_address,
            vault_balance,
            next_melee_duration,
            next_melee_available_rewards,
            next_melee_max_match_percentage,
            next_melee_max_match_amount
        } = self;
        (
            n_melees,
            vault_address,
            vault_balance,
            next_melee_duration,
            next_melee_available_rewards,
            next_melee_max_match_percentage,
            next_melee_max_match_amount
        )
    }

    public entry fun fund_vault(funder: &signer, amount: u64) acquires Registry {
        let vault_address =
            account::get_signer_capability_address(
                &Registry[@emojicoin_arena].signer_capability
            );
        aptos_account::transfer(funder, vault_address, amount);
        emit_vault_balance_update_with_vault_address(vault_address);
    }

    public entry fun set_next_melee_available_rewards(
        emojicoin_arena: &signer, amount: u64
    ) acquires Registry {
        borrow_registry_mut_checked(emojicoin_arena).next_melee_available_rewards =
            amount;
    }

    public entry fun set_next_melee_duration(
        emojicoin_arena: &signer, duration: u64
    ) acquires Registry {
        borrow_registry_mut_checked(emojicoin_arena).next_melee_duration = duration;
    }

    public entry fun set_next_melee_max_match_amount(
        emojicoin_arena: &signer, max_match_amount: u64
    ) acquires Registry {
        borrow_registry_mut_checked(emojicoin_arena).next_melee_max_match_amount =
            max_match_amount;
    }

    public entry fun set_next_melee_max_match_percentage(
        emojicoin_arena: &signer, max_match_percentage: u64
    ) acquires Registry {
        borrow_registry_mut_checked(emojicoin_arena).next_melee_max_match_percentage =
            max_match_percentage;
    }

    public entry fun withdraw_from_vault(
        emojicoin_arena: &signer, amount: u64
    ) acquires Registry {
        let signer_capability_ref =
            &borrow_registry_mut_checked(emojicoin_arena).signer_capability;
        aptos_account::transfer(
            &account::create_signer_with_capability(signer_capability_ref),
            @emojicoin_arena,
            amount
        );
        emit_vault_balance_update_with_signer_capability_ref(signer_capability_ref);
    }

    fun init_module(emojicoin_arena: &signer) acquires Registry {
        // Store registry resource.
        let (vault_signer, signer_capability) =
            account::create_resource_account(emojicoin_arena, REGISTRY_SEED);
        move_to(
            emojicoin_arena,
            Registry {
                melees_by_id: table_with_length::new(),
                melee_ids_by_market_ids: table::new(),
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
            &mut Registry[@emojicoin_arena],
            0,
            sort_unique_market_ids(market_id_0, market_id_1),
            0,
            DEFAULT_DURATION
        );
    }

    inline fun borrow_melee_mut_with_market_addresses(
        registry_ref_mut: &mut Registry, melee_id: u64
    ): (&mut Melee, address, address) {
        let melee_ref_mut = registry_ref_mut.melees_by_id.borrow_mut(melee_id);
        let market_address_0 = melee_ref_mut.emojicoin_0_market_address;
        let market_address_1 = melee_ref_mut.emojicoin_1_market_address;
        (melee_ref_mut, market_address_0, market_address_1)
    }

    inline fun borrow_registry_mut_checked(emojicoin_arena: &signer): &mut Registry {
        assert!(
            signer::address_of(emojicoin_arena) == @emojicoin_arena,
            E_NOT_EMOJICOIN_ARENA
        );
        &mut Registry[@emojicoin_arena]
    }

    inline fun check_buy_side<Coin0, Coin1, EscrowCoin>(): bool {
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
        buy_coin_0
    }

    inline fun check_enter_balances<Coin0, LP0, Coin1, LP1>(
        entrant_address: address, buy_coin_0: bool
    ): &mut Escrow<Coin0, LP0, Coin1, LP1> {
        let escrow_ref_mut = &mut Escrow<Coin0, LP0, Coin1, LP1>[entrant_address];
        if (buy_coin_0)
            assert!(
                coin::value(&escrow_ref_mut.emojicoin_1) == 0, E_ENTER_COIN_BALANCE_1
            )
        else
            assert!(
                coin::value(&escrow_ref_mut.emojicoin_0) == 0, E_ENTER_COIN_BALANCE_0
            );
        escrow_ref_mut
    }

    /// Crank schedule and return `true` if the active melee has ended as a result, along with other
    /// assorted variables, to reduce borrows and lookups in the caller.
    inline fun crank_schedule(): (bool, &mut Registry, u64, u64) {

        // Determine the last active melee.
        let registry_ref_mut = &mut Registry[@emojicoin_arena];
        let n_melees_before_cranking = registry_ref_mut.melees_by_id.length();
        let last_active_melee_ref_mut =
            registry_ref_mut.melees_by_id.borrow_mut(n_melees_before_cranking);

        // If the last active melee has ended, register a new melee.
        let last_active_melee_start_time = last_active_melee_ref_mut.start_time;
        let last_active_melee_duration = last_active_melee_ref_mut.duration;
        let time = timestamp::now_microseconds();
        let cranked =
            if (time >= last_active_melee_start_time + last_active_melee_duration) {
                let market_ids = next_melee_market_ids(registry_ref_mut);
                register_melee(
                    registry_ref_mut,
                    n_melees_before_cranking,
                    market_ids,
                    last_active_melee_start_time,
                    last_active_melee_duration
                );
                true
            } else false;

        (cranked, registry_ref_mut, time, n_melees_before_cranking)
    }

    inline fun emit_vault_balance_update_with_signer_capability_ref(
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

    inline fun ensure_melee_escrow_exists<Coin0, LP0, Coin1, LP1>(
        entrant: &signer, melee_id: u64
    ): address {
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
        entrant_address
    }

    inline fun exchange_rate_inner<Emojicoin, EmojicoinLP>(
        market_address: address
    ): ExchangeRate {

        // Get reserves from the market view.
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

        // Select reserves based on whether the market is in the bonding curve.
        let reserves =
            if (in_bonding_curve) clamm_virtual_reserves
            else cpamm_real_reserves;
        let (base, quote) = emojicoin_dot_fun::unpack_reserves(reserves);

        ExchangeRate { base, quote }
    }

    /// Crank schedule, set local variables for a participant who has already joined a melee. Used
    /// for `swap` and `exit` functions.
    inline fun existing_participant_prologue<Coin0, LP0, Coin1, LP1>(
        participant: &signer
    ): (
        &mut Registry,
        &mut Melee,
        address,
        address,
        bool,
        address,
        &mut Escrow<Coin0, LP0, Coin1, LP1>,
        u64
    ) {

        // Ensure user has escrow.
        let participant_address = signer::address_of(participant);
        assert!(
            exists<Escrow<Coin0, LP0, Coin1, LP1>>(participant_address),
            E_NO_ESCROW
        );
        let escrow_ref_mut = &mut Escrow<Coin0, LP0, Coin1, LP1>[participant_address];

        // Crank schedule, determine if melee from escrow is active or not.
        let (cranked, registry_ref_mut, _, n_melees_before_cranking) = crank_schedule();
        let melee_id = escrow_ref_mut.melee_id;
        let melee_is_active = !cranked && melee_id == n_melees_before_cranking;

        // Get mutable reference to melee indicated in escrow, and market addresses.
        let (escrow_melee_ref_mut, market_address_0, market_address_1) =
            borrow_melee_mut_with_market_addresses(registry_ref_mut, melee_id);

        (
            registry_ref_mut,
            escrow_melee_ref_mut,
            market_address_0,
            market_address_1,
            melee_is_active,
            participant_address,
            escrow_ref_mut,
            melee_id
        )
    }

    inline fun exit_epilogue<Coin0, LP0, Coin1, LP1>(
        participant_address: address,
        escrow_ref_mut: &mut Escrow<Coin0, LP0, Coin1, LP1>,
        melee_id: u64,
        tap_out_fee: u64,
        market_address_0: address,
        market_address_1: address
    ): (u64, u64) {

        // Reset escrow match amount.
        escrow_ref_mut.match_amount = 0;

        // Withdraw emojicoin balance from escrow.
        let (emojicoin_0_proceeds, emojicoin_1_proceeds) =
            try_withdraw_from_escrow_both_coins(participant_address, escrow_ref_mut);
        assert!(
            emojicoin_0_proceeds > 0 || emojicoin_1_proceeds > 0,
            E_EXIT_NO_FUNDS
        );

        // Emit exit event.
        event::emit(
            Exit {
                user: participant_address,
                melee_id,
                emojicoin_0_proceeds,
                emojicoin_1_proceeds,
                tap_out_fee,
                emojicoin_0_exchange_rate: exchange_rate_inner<Coin0, LP0>(
                    market_address_0
                ),
                emojicoin_1_exchange_rate: exchange_rate_inner<Coin1, LP1>(
                    market_address_1
                )
            }
        );

        (emojicoin_0_proceeds, emojicoin_1_proceeds)
    }

    inline fun get_n_registered_markets(): u64 {
        let (_, _, _, n_markets, _, _, _, _, _, _, _, _) =
            emojicoin_dot_fun::unpack_registry_view(emojicoin_dot_fun::registry_view());
        n_markets
    }

    /// Returns the most recent time that is an integer multiple of `duration` after `start_time`,
    /// assuming `current_time` is at least `duration` after `start_time`.
    inline fun last_period_boundary(
        current_time: u64, start_time: u64, duration: u64
    ): u64 {
        (((current_time - start_time) / duration) * duration) + start_time
    }

    /// Uses mutable references to avoid borrowing issues.
    inline fun match_amount_inner(
        input_amount: u64,
        escrow_match_amount: u64,
        active_melee_ref_mut: &mut Melee,
        registry_ref_mut: &mut Registry,
        time: u64
    ): u64 {
        let elapsed_time = ((time - active_melee_ref_mut.start_time) as u256);
        let duration = (active_melee_ref_mut.duration as u256);
        // Scale down input amount for matching percentage and remaining time in one compound
        // operation, to reduce truncation errors. Equivalent to:
        //
        //                max match percentage   remaining time
        // input amount * -------------------- * --------------
        //                100                    duration
        //
        // Note that the calculation for remaining time (duration - elapsed_time) should never
        // underflow since callers only invoke this function for an active melee.
        let raw_match_amount =
            (
                ((input_amount as u256)
                    * (active_melee_ref_mut.max_match_percentage as u256)
                    * (duration - elapsed_time)) / ((MAX_PERCENTAGE as u256) * duration) as u64
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
            active_melee_ref_mut.max_match_amount - escrow_match_amount
        )
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
        sorted_unique_market_ids: vector<u64>,
        last_melee_start_time: u64,
        last_melee_duration: u64
    ) {
        // Get new melee ID, which is 1-indexed.
        let melee_id = n_melees_before_registration + 1;

        // Get the market addresses for each market ID, and store addresses tuple in the reverse
        // lookup table.
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
        registry_ref_mut.melee_ids_by_market_ids.add(sorted_unique_market_ids, melee_id);

        // Pack the melee.
        let melee = Melee {
            melee_id,
            emojicoin_0_market_address,
            emojicoin_1_market_address,
            start_time: last_period_boundary(
                timestamp::now_microseconds(),
                last_melee_start_time,
                last_melee_duration
            ),
            duration: registry_ref_mut.next_melee_duration,
            max_match_percentage: registry_ref_mut.next_melee_max_match_percentage,
            max_match_amount: registry_ref_mut.next_melee_max_match_amount,
            available_rewards: registry_ref_mut.next_melee_available_rewards
        };

        // Store the melee, and emit it as an event.
        registry_ref_mut.melees_by_id.add(melee_id, melee);
        event::emit(melee);
    }

    /// Assumes `market_id_0` != `market_id_1`.
    inline fun sort_unique_market_ids(market_id_0: u64, market_id_1: u64): vector<u64> {
        if (market_id_0 < market_id_1) {
            vector[market_id_0, market_id_1]
        } else {
            vector[market_id_1, market_id_0]
        }
    }

    inline fun swap_into_escrow<Coin0, LP0, Coin1, LP1>(
        swapper: &signer,
        swapper_address: address,
        escrow_ref_mut: &mut Escrow<Coin0, LP0, Coin1, LP1>,
        market_address_0: address,
        market_address_1: address,
        octas_to_spend: u64,
        buy_coin_0: bool
    ): (u64, u64, u64, u64) {

        // Pack swap arguments for the emojicoin to buy.
        let swap_arguments = SwapArgumentsForEmojicoin {
            swapper_address,
            input_amount: octas_to_spend,
            sell_emojicoin_for_apt: false,
            integrator_fee_rate_bps: INTEGRATOR_FEE_RATE_BPS_SINGLE_ROUTE
        };

        // Initialize return values.
        let (emojicoin_0_proceeds, emojicoin_1_proceeds) = (0, 0);
        let (quote_volume, integrator_fee);

        // Execute a swap into escrow based on the emojicoin to buy.
        if (buy_coin_0) {
            (emojicoin_0_proceeds, quote_volume, integrator_fee) = swap_into_escrow_for_emojicoin<Coin0, LP0>(
                swapper, &swap_arguments, market_address_0, &mut escrow_ref_mut.emojicoin_0
            );
        } else {
            (emojicoin_1_proceeds, quote_volume, integrator_fee) = swap_into_escrow_for_emojicoin<Coin1, LP1>(
                swapper, &swap_arguments, market_address_1, &mut escrow_ref_mut.emojicoin_1
            );
        };

        (quote_volume, integrator_fee, emojicoin_0_proceeds, emojicoin_1_proceeds)
    }

    inline fun swap_into_escrow_for_emojicoin<Emojicoin, EmojicoinLP>(
        swapper: &signer,
        swap_arguments_ref: &SwapArgumentsForEmojicoin,
        market_address: address,
        target_emojicoin_ref_mut: &mut Coin<Emojicoin>
    ): (u64, u64, u64) {
        let (net_proceeds, quote_volume, integrator_fee) =
            swap_with_stats_for_emojicoin<Emojicoin, EmojicoinLP>(
                swapper, market_address, swap_arguments_ref
            );
        coin::merge(target_emojicoin_ref_mut, coin::withdraw(swapper, net_proceeds));
        (net_proceeds, quote_volume, integrator_fee)
    }

    inline fun swap_out_of_escrow_for_emojicoin<Emojicoin, EmojicoinLP>(
        swapper: &signer,
        swap_arguments_ref: &SwapArgumentsForEmojicoin,
        market_address: address,
        target_emojicoin_ref_mut: &mut Coin<Emojicoin>
    ): (u64, u64, u64) {
        withdraw_from_escrow(
            swap_arguments_ref.swapper_address, target_emojicoin_ref_mut
        );
        swap_with_stats_for_emojicoin<Emojicoin, EmojicoinLP>(
            swapper, market_address, swap_arguments_ref
        )
    }

    inline fun swap_within_escrow<Coin0, LP0, Coin1, LP1>(
        swapper: &signer,
        swapper_address: address,
        escrow_ref_mut: &mut Escrow<Coin0, LP0, Coin1, LP1>,
        market_address_0: address,
        market_address_1: address
    ): (u64, u64, u64, u64) {

        // Get balances in escrow.
        let emojicoin_0_balance = coin::value(&escrow_ref_mut.emojicoin_0);
        let emojicoin_1_balance = coin::value(&escrow_ref_mut.emojicoin_1);

        // Initialize return values.
        let (emojicoin_0_proceeds, emojicoin_1_proceeds) = (0, 0);
        let (quote_volume, integrator_fee);

        // Execute a swap within escrow based on the direction.
        if (emojicoin_0_balance > 0) {
            (quote_volume, integrator_fee, emojicoin_1_proceeds) = swap_within_escrow_for_direction<Coin0, LP0, Coin1, LP1>(
                swapper,
                swapper_address,
                market_address_0,
                market_address_1,
                emojicoin_0_balance,
                &mut escrow_ref_mut.emojicoin_0,
                &mut escrow_ref_mut.emojicoin_1
            );
        } else {
            // Verify that at least one emojicoin balance is nonzero.
            assert!(emojicoin_1_balance > 0, E_SWAP_NO_FUNDS);

            (quote_volume, integrator_fee, emojicoin_0_proceeds) = swap_within_escrow_for_direction<Coin1, LP1, Coin0, LP0>(
                swapper,
                swapper_address,
                market_address_1,
                market_address_0,
                emojicoin_1_balance,
                &mut escrow_ref_mut.emojicoin_1,
                &mut escrow_ref_mut.emojicoin_0
            );
        };

        (quote_volume, integrator_fee, emojicoin_0_proceeds, emojicoin_1_proceeds)
    }

    inline fun swap_with_stats_for_emojicoin<Emojicoin, LP>(
        swapper: &signer,
        market_address: address,
        swap_arguments_for_emojicoin_ref: &SwapArgumentsForEmojicoin
    ): (u64, u64, u64) {

        // Extract swap arguments that are used more than once.
        let input_amount = swap_arguments_for_emojicoin_ref.input_amount;
        let sell_emojicoin_for_apt =
            swap_arguments_for_emojicoin_ref.sell_emojicoin_for_apt;
        let integrator_fee_rate_bps =
            swap_arguments_for_emojicoin_ref.integrator_fee_rate_bps;

        // Simulate swap, get key stats.
        let simulated_swap =
            emojicoin_dot_fun::simulate_swap<Emojicoin, LP>(
                swap_arguments_for_emojicoin_ref.swapper_address,
                market_address,
                input_amount,
                sell_emojicoin_for_apt,
                @integrator,
                integrator_fee_rate_bps
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
            net_proceeds,
            _,
            quote_volume,
            _,
            integrator_fee,
            _,
            _,
            _,
            _,
            _
        ) = emojicoin_dot_fun::unpack_swap(simulated_swap);

        // Execute swap.
        emojicoin_dot_fun::swap<Emojicoin, LP>(
            swapper,
            market_address,
            input_amount,
            sell_emojicoin_for_apt,
            @integrator,
            integrator_fee_rate_bps,
            1
        );

        (net_proceeds, quote_volume, integrator_fee)
    }

    inline fun swap_within_escrow_for_direction<FromCoin, FromLP, ToCoin, ToLP>(
        swapper: &signer,
        swapper_address: address,
        market_address_from: address,
        market_address_to: address,
        from_emojicoin_balance: u64,
        from_emojicoin_ref_mut: &mut Coin<FromCoin>,
        to_emojicoin_ref_mut: &mut Coin<ToCoin>
    ): (u64, u64, u64) {

        // Pack swap arguments for the first emojicoin swap out of escrow.
        let swap_arguments = SwapArgumentsForEmojicoin {
            swapper_address,
            input_amount: from_emojicoin_balance,
            sell_emojicoin_for_apt: true,
            integrator_fee_rate_bps: INTEGRATOR_FEE_RATE_BPS_DOUBLE_ROUTE
        };

        // Swap out of escrow.
        let (apt_proceeds, _, integrator_fee_first_swap) =
            swap_out_of_escrow_for_emojicoin<FromCoin, FromLP>(
                swapper,
                &swap_arguments,
                market_address_from,
                from_emojicoin_ref_mut
            );

        // Mutate swap arguments for the second swap into escrow.
        swap_arguments.input_amount = apt_proceeds;
        swap_arguments.sell_emojicoin_for_apt = false;

        // Swap into escrow.
        let (to_emojicoin_proceeds, quote_volume, integrator_fee_second_swap) =
            swap_into_escrow_for_emojicoin<ToCoin, ToLP>(
                swapper,
                &swap_arguments,
                market_address_to,
                to_emojicoin_ref_mut
            );

        // Sum fees across swaps, but only use volume from second swap to avoid double counting.
        let integrator_fee = integrator_fee_first_swap + integrator_fee_second_swap;
        (quote_volume, integrator_fee, to_emojicoin_proceeds)
    }

    /// During entry to a melee, try matching a portion of user's contribution if they elect to lock
    /// in, returning the matched amount.
    inline fun try_match_entry<Coin0, LP0, Coin1, LP1>(
        lock_in: bool,
        input_amount: u64,
        escrow_ref_mut: &mut Escrow<Coin0, LP0, Coin1, LP1>,
        active_melee_ref_mut: &mut Melee,
        registry_ref_mut: &mut Registry,
        time: u64,
        entrant_address: address
    ): u64 {
        if (lock_in) {
            let escrow_match_amount_ref_mut = &mut escrow_ref_mut.match_amount;
            let match_amount =
                match_amount_inner(
                    input_amount,
                    *escrow_match_amount_ref_mut,
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
                emit_vault_balance_update_with_signer_capability_ref(
                    signer_capability_ref
                );

                // Update rewards state for melee and escrow.
                active_melee_ref_mut.available_rewards -= match_amount;
                *escrow_match_amount_ref_mut += match_amount;

            };

            match_amount

        } else 0
    }

    /// Only invoke withdraw function is balance is nonzero, returning the amount withdrawn.
    inline fun try_withdraw_from_escrow<Emojicoin>(
        recipient: address, escrow_coin_ref_mut: &mut Coin<Emojicoin>
    ): u64 {
        let proceeds = coin::value(escrow_coin_ref_mut);
        if (proceeds > 0) {
            withdraw_from_escrow(recipient, escrow_coin_ref_mut);
        };
        proceeds
    }

    inline fun try_withdraw_from_escrow_both_coins<Coin0, LP0, Coin1, LP1>(
        recipient: address,
        escrow_ref_mut: &mut Escrow<Coin0, LP0, Coin1, LP1>
    ): (u64, u64) {
        let emojicoin_0_proceeds =
            try_withdraw_from_escrow(recipient, &mut escrow_ref_mut.emojicoin_0);
        let emojicoin_1_proceeds =
            try_withdraw_from_escrow(recipient, &mut escrow_ref_mut.emojicoin_1);
        (emojicoin_0_proceeds, emojicoin_1_proceeds)
    }

    inline fun withdraw_from_escrow<Emojicoin>(
        recipient: address, escrow_coin_ref_mut: &mut Coin<Emojicoin>
    ) {
        aptos_account::deposit_coins(recipient, coin::extract_all(escrow_coin_ref_mut));
    }

    #[test_only]
    #[lint::allow_unsafe_randomness]
    public fun enter_for_test<Coin0, LP0, Coin1, LP1, EscrowCoin>(
        entrant: &signer, input_amount: u64, lock_in: bool
    ) acquires Escrow, Registry {
        enter<Coin0, LP0, Coin1, LP1, EscrowCoin>(entrant, input_amount, lock_in)
    }

    #[test_only]
    #[lint::allow_unsafe_randomness]
    public fun exit_for_test<Coin0, LP0, Coin1, LP1>(participant: &signer) acquires Escrow, Registry {
        exit<Coin0, LP0, Coin1, LP1>(participant)
    }

    #[test_only]
    public fun get_DEFAULT_AVAILABLE_REWARDS(): u64 {
        DEFAULT_AVAILABLE_REWARDS
    }

    #[test_only]
    public fun get_DEFAULT_DURATION(): u64 {
        DEFAULT_DURATION
    }

    #[test_only]
    public fun get_DEFAULT_MAX_MATCH_PERCENTAGE(): u64 {
        DEFAULT_MAX_MATCH_PERCENTAGE
    }

    #[test_only]
    public fun get_DEFAULT_MAX_MATCH_AMOUNT(): u64 {
        DEFAULT_MAX_MATCH_AMOUNT
    }

    #[test_only]
    public fun get_INTEGRATOR_FEE_RATE_BPS_DOUBLE_ROUTE(): u8 {
        INTEGRATOR_FEE_RATE_BPS_DOUBLE_ROUTE
    }

    #[test_only]
    public fun get_INTEGRATOR_FEE_RATE_BPS_SINGLE_ROUTE(): u8 {
        INTEGRATOR_FEE_RATE_BPS_SINGLE_ROUTE
    }

    #[test_only]
    public fun get_REGISTRY_SEED(): vector<u8> {
        REGISTRY_SEED
    }

    #[test_only]
    public fun set_melee_available_rewards(melee_id: u64, amount: u64) acquires Registry {
        Registry[@emojicoin_arena].melees_by_id.borrow_mut(melee_id).available_rewards =
            amount;
    }

    #[test_only]
    public fun set_melee_max_match_amount(melee_id: u64, amount: u64) acquires Registry {
        Registry[@emojicoin_arena].melees_by_id.borrow_mut(melee_id).max_match_amount =
            amount;
    }

    #[test_only]
    public fun init_module_test_only(account: &signer) acquires Registry {
        init_module(account)
    }

    #[test_only]
    public fun melee_ids_by_market_ids_contains_for_test(
        sorted_unique_market_ids: vector<u64>
    ): bool acquires Registry {
        Registry[@emojicoin_arena].melee_ids_by_market_ids.contains(
            sorted_unique_market_ids
        )
    }

    #[test_only]
    #[lint::allow_unsafe_randomness]
    public fun random_market_id_for_test(): u64 {
        random_market_id(get_n_registered_markets())
    }

    #[test_only]
    #[lint::allow_unsafe_randomness]
    public fun swap_for_test<Coin0, LP0, Coin1, LP1>(swapper: &signer) acquires Escrow, Registry {
        swap<Coin0, LP0, Coin1, LP1>(swapper);
    }

    #[test_only]
    public fun unpack_enter(
        self: Enter
    ): (address, u64, u64, u64, u64, u64, u64, u64, ExchangeRate, ExchangeRate) {
        let Enter {
            user,
            melee_id,
            input_amount,
            quote_volume,
            integrator_fee,
            match_amount,
            emojicoin_0_proceeds,
            emojicoin_1_proceeds,
            emojicoin_0_exchange_rate,
            emojicoin_1_exchange_rate
        } = self;
        (
            user,
            melee_id,
            input_amount,
            quote_volume,
            integrator_fee,
            match_amount,
            emojicoin_0_proceeds,
            emojicoin_1_proceeds,
            emojicoin_0_exchange_rate,
            emojicoin_1_exchange_rate
        )
    }

    #[test_only]
    public fun unpack_exit(self: Exit):
        (address, u64, u64, u64, u64, ExchangeRate, ExchangeRate) {
        let Exit {
            user,
            melee_id,
            tap_out_fee,
            emojicoin_0_proceeds,
            emojicoin_1_proceeds,
            emojicoin_0_exchange_rate,
            emojicoin_1_exchange_rate
        } = self;
        (
            user,
            melee_id,
            tap_out_fee,
            emojicoin_0_proceeds,
            emojicoin_1_proceeds,
            emojicoin_0_exchange_rate,
            emojicoin_1_exchange_rate
        )
    }

    #[test_only]
    public fun unpack_swap(self: Swap):
        (
        address, u64, u64, u64, u64, u64, ExchangeRate, ExchangeRate
    ) {
        let Swap {
            user,
            melee_id,
            quote_volume,
            integrator_fee,
            emojicoin_0_proceeds,
            emojicoin_1_proceeds,
            emojicoin_0_exchange_rate,
            emojicoin_1_exchange_rate
        } = self;
        (
            user,
            melee_id,
            quote_volume,
            integrator_fee,
            emojicoin_0_proceeds,
            emojicoin_1_proceeds,
            emojicoin_0_exchange_rate,
            emojicoin_1_exchange_rate
        )
    }

    #[test_only]
    public fun unpack_vault_balance_update(self: VaultBalanceUpdate): u64 {
        let VaultBalanceUpdate { new_balance } = self;
        new_balance
    }
}
