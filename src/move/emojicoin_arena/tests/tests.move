#[test_only]
// This test module uses the same design schema as the emojicoin dot fun core test module.
module emojicoin_arena::tests {
    use aptos_framework::account::{
        create_resource_address,
        create_signer_for_test as get_signer
    };
    use aptos_framework::coin;
    use aptos_framework::event::{emitted_events};
    use aptos_framework::randomness;
    use aptos_framework::timestamp;
    use aptos_framework::transaction_context;
    use black_cat_market::coin_factory::{Emojicoin as BlackCat, EmojicoinLP as BlackCatLP};
    use black_heart_market::coin_factory::{
        Emojicoin as BlackHeart,
        EmojicoinLP as BlackHeartLP
    };
    use emojicoin_dot_fun::emojicoin_dot_fun::{
        Self,
        MarketMetadata,
        get_BASE_VIRTUAL_CEILING,
        get_EMOJICOIN_REMAINDER,
        get_QUOTE_REAL_CEILING,
        get_QUOTE_VIRTUAL_FLOOR,
        market_metadata_by_market_id,
        simulate_swap,
        unpack_market_metadata
    };
    use emojicoin_arena::emojicoin_arena::{
        Enter,
        EscrowView,
        ExchangeRate,
        Exit,
        Melee,
        RegistryView,
        Swap,
        VaultBalanceUpdate,
        enter_for_test as enter,
        escrow,
        escrow_exists,
        exchange_rate,
        exit_for_test as exit,
        fund_vault,
        get_DEFAULT_AVAILABLE_REWARDS,
        get_DEFAULT_DURATION,
        get_DEFAULT_MAX_MATCH_PERCENTAGE,
        get_DEFAULT_MAX_MATCH_AMOUNT,
        get_INTEGRATOR_FEE_RATE_BPS_DOUBLE_ROUTE,
        get_INTEGRATOR_FEE_RATE_BPS_SINGLE_ROUTE,
        get_REGISTRY_SEED,
        init_module_test_only,
        match_amount,
        melee,
        melee_ids_by_market_ids_contains_for_test as melee_ids_by_market_ids_contains,
        random_market_id_for_test as random_market_id,
        registry,
        set_melee_available_rewards,
        set_melee_max_match_amount,
        set_next_melee_available_rewards,
        set_next_melee_duration,
        set_next_melee_max_match_amount,
        set_next_melee_max_match_percentage,
        swap_for_test as swap,
        unpack_enter,
        unpack_escrow_view,
        unpack_exchange_rate,
        unpack_exit,
        unpack_melee,
        unpack_registry_view,
        unpack_swap,
        unpack_vault_balance_update,
        withdraw_from_vault
    };
    use emojicoin_dot_fun::test_acquisitions::mint_aptos_coin_to;
    use emojicoin_dot_fun::tests as emojicoin_dot_fun_tests;
    use std::option;
    use std::vector;
    use zebra_market::coin_factory::{Emojicoin as Zebra, EmojicoinLP as ZebraLP};
    use zombie_market::coin_factory::{Emojicoin as Zombie, EmojicoinLP as ZombieLP};

    struct MockEnter has copy, drop, store {
        user: address,
        melee_id: u64,
        input_amount: u64,
        quote_volume: u64,
        integrator_fee: u64,
        match_amount: u64,
        emojicoin_0_proceeds: u64,
        emojicoin_1_proceeds: u64,
        emojicoin_0_exchange_rate: ExchangeRate,
        emojicoin_1_exchange_rate: ExchangeRate
    }

    struct MockEscrowView has copy, drop, store {
        melee_id: u64,
        emojicoin_0_balance: u64,
        emojicoin_1_balance: u64,
        match_amount: u64
    }

    struct MockExchangeRate has copy, drop, store {
        base: u64,
        quote: u64
    }

    struct MockExit has copy, drop, store {
        user: address,
        melee_id: u64,
        tap_out_fee: u64,
        emojicoin_0_proceeds: u64,
        emojicoin_1_proceeds: u64,
        emojicoin_0_exchange_rate: ExchangeRate,
        emojicoin_1_exchange_rate: ExchangeRate
    }

    struct MockMarketMetadata has copy, drop, store {
        market_id: u64,
        market_address: address,
        emoji_bytes: vector<u8>
    }

    struct MockMelee has copy, drop, store {
        melee_id: u64,
        emojicoin_0_market_address: address,
        emojicoin_1_market_address: address,
        start_time: u64,
        duration: u64,
        max_match_percentage: u64,
        max_match_amount: u64,
        available_rewards: u64
    }

    struct MockRegistryView has copy, drop, store {
        n_melees: u64,
        vault_address: address,
        vault_balance: u64,
        next_melee_duration: u64,
        next_melee_available_rewards: u64,
        next_melee_max_match_percentage: u64,
        next_melee_max_match_amount: u64
    }

    struct MockSwap has copy, drop, store {
        user: address,
        melee_id: u64,
        quote_volume: u64,
        integrator_fee: u64,
        emojicoin_0_proceeds: u64,
        emojicoin_1_proceeds: u64,
        emojicoin_0_exchange_rate: ExchangeRate,
        emojicoin_1_exchange_rate: ExchangeRate
    }

    struct MockVaultBalanceUpdate has copy, drop, store {
        new_balance: u64
    }

    struct SimulatedSwapInputs has copy, drop, store {
        market_address: address,
        input_amount: u64,
        selling_emojicoins: bool,
        integrator_fee_rate: u8
    }

    struct SimulatedSwapStats has copy, drop, store {
        quote_volume: u64,
        integrator_fee: u64,
        net_proceeds: u64
    }

    // Test market emoji bytes, in order of market ID.
    const BLACK_CAT: vector<u8> = x"f09f9088e2808de2ac9b";
    const BLACK_HEART: vector<u8> = x"f09f96a4";
    const YELLOW_HEART: vector<u8> = x"f09f929b";
    const YIN_YANG: vector<u8> = x"e298afefb88f";
    const ZEBRA: vector<u8> = x"f09fa693";
    const ZOMBIE: vector<u8> = x"f09fa79f";

    const PARTICIPANT: address = @0x1234567890abcdef;
    const MAX_PERCENTAGE: u64 = 100;

    public fun assert_escrow_view(
        self: MockEscrowView, actual: EscrowView
    ) {
        let (melee_id, emojicoin_0_balance, emojicoin_1_balance, match_amount) =
            unpack_escrow_view(actual);
        assert!(self.melee_id == melee_id);
        assert!(self.emojicoin_0_balance == emojicoin_0_balance);
        assert!(self.emojicoin_1_balance == emojicoin_1_balance);
        assert!(self.match_amount == match_amount);
    }

    public fun assert_exchange_rate(
        self: MockExchangeRate, actual: ExchangeRate
    ) {
        let (base, quote) = unpack_exchange_rate(actual);
        assert!(self.base == base);
        assert!(self.quote == quote);
    }

    public fun assert_enter(self: MockEnter, actual: Enter) {
        let (
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
        ) = unpack_enter(actual);
        assert!(self.user == user);
        assert!(self.melee_id == melee_id);
        assert!(self.input_amount == input_amount);
        assert!(self.quote_volume == quote_volume);
        assert!(self.integrator_fee == integrator_fee);
        assert!(self.match_amount == match_amount);
        assert!(self.emojicoin_0_proceeds == emojicoin_0_proceeds);
        assert!(self.emojicoin_1_proceeds == emojicoin_1_proceeds);
        assert!(self.emojicoin_0_exchange_rate == emojicoin_0_exchange_rate);
        assert!(self.emojicoin_1_exchange_rate == emojicoin_1_exchange_rate);
    }

    public fun assert_exit(self: MockExit, actual: Exit) {
        let (
            user,
            melee_id,
            tap_out_fee,
            emojicoin_0_proceeds,
            emojicoin_1_proceeds,
            emojicoin_0_exchange_rate,
            emojicoin_1_exchange_rate
        ) = unpack_exit(actual);
        assert!(self.user == user);
        assert!(self.melee_id == melee_id);
        assert!(self.tap_out_fee == tap_out_fee);
        assert!(self.emojicoin_0_proceeds == emojicoin_0_proceeds);
        assert!(self.emojicoin_1_proceeds == emojicoin_1_proceeds);
        assert!(self.emojicoin_0_exchange_rate == emojicoin_0_exchange_rate);
        assert!(self.emojicoin_1_exchange_rate == emojicoin_1_exchange_rate);
    }

    public fun assert_market_metadata(
        self: MockMarketMetadata, actual: MarketMetadata
    ) {
        let (market_id, market_address, emoji_bytes) = unpack_market_metadata(actual);
        assert!(self.market_id == market_id);
        assert!(self.market_address == market_address);
        assert!(self.emoji_bytes == emoji_bytes);
    }

    public fun assert_melee(self: MockMelee, actual: Melee) {
        let (
            melee_id,
            emojicoin_0_market_address,
            emojicoin_1_market_address,
            start_time,
            duration,
            max_match_percentage,
            max_match_amount,
            available_rewards
        ) = unpack_melee(actual);
        assert!(self.melee_id == melee_id);
        assert!(self.emojicoin_0_market_address == emojicoin_0_market_address);
        assert!(self.emojicoin_1_market_address == emojicoin_1_market_address);
        assert!(self.start_time == start_time);
        assert!(self.duration == duration);
        assert!(self.max_match_percentage == max_match_percentage);
        assert!(self.max_match_amount == max_match_amount);
        assert!(self.available_rewards == available_rewards);
    }

    public fun assert_registry_view(
        self: MockRegistryView, actual: RegistryView
    ) {
        let (
            n_melees,
            vault_address,
            vault_balance,
            next_melee_duration,
            next_melee_available_rewards,
            next_melee_max_match_percentage,
            next_melee_max_match_amount
        ) = unpack_registry_view(actual);
        assert!(self.n_melees == n_melees);
        assert!(self.vault_address == vault_address);
        assert!(self.vault_balance == vault_balance);
        assert!(self.next_melee_duration == next_melee_duration);
        assert!(self.next_melee_available_rewards == next_melee_available_rewards);
        assert!(self.next_melee_max_match_percentage == next_melee_max_match_percentage);
        assert!(self.next_melee_max_match_amount == next_melee_max_match_amount);
    }

    public fun assert_swap(self: MockSwap, actual: Swap) {
        let (
            user,
            melee_id,
            quote_volume,
            integrator_fee,
            emojicoin_0_proceeds,
            emojicoin_1_proceeds,
            emojicoin_0_exchange_rate,
            emojicoin_1_exchange_rate
        ) = unpack_swap(actual);
        assert!(self.user == user);
        assert!(self.melee_id == melee_id);
        assert!(self.quote_volume == quote_volume);
        assert!(self.integrator_fee == integrator_fee);
        assert!(self.emojicoin_0_proceeds == emojicoin_0_proceeds);
        assert!(self.emojicoin_1_proceeds == emojicoin_1_proceeds);
        assert!(self.emojicoin_0_exchange_rate == emojicoin_0_exchange_rate);
        assert!(self.emojicoin_1_exchange_rate == emojicoin_1_exchange_rate);
    }

    public fun assert_vault_balance_update(
        self: MockVaultBalanceUpdate, actual: VaultBalanceUpdate
    ) {
        let new_balance = unpack_vault_balance_update(actual);
        assert!(self.new_balance == new_balance);
    }

    public fun base_enter_amount(): u64 {
        get_QUOTE_REAL_CEILING() / 2
    }

    public fun base_escrow_view(): MockEscrowView {
        MockEscrowView {
            melee_id: 1,
            emojicoin_0_balance: 0,
            emojicoin_1_balance: 0,
            match_amount: 0
        }
    }

    public fun base_melee(): MockMelee {
        MockMelee {
            melee_id: 1,
            emojicoin_0_market_address: @black_cat_market,
            emojicoin_1_market_address: @zebra_market,
            start_time: base_start_time(),
            duration: get_DEFAULT_DURATION(),
            max_match_percentage: get_DEFAULT_MAX_MATCH_PERCENTAGE(),
            max_match_amount: get_DEFAULT_MAX_MATCH_AMOUNT(),
            available_rewards: get_DEFAULT_AVAILABLE_REWARDS()
        }
    }

    /// 1.5x the default melee duration.
    public fun base_publish_time(): u64 {
        get_DEFAULT_DURATION() + get_DEFAULT_DURATION() / 2
    }

    public fun base_registry_view(): MockRegistryView {
        MockRegistryView {
            n_melees: 1,
            vault_address: base_vault_address(),
            vault_balance: get_DEFAULT_AVAILABLE_REWARDS(),
            next_melee_duration: get_DEFAULT_DURATION(),
            next_melee_available_rewards: get_DEFAULT_AVAILABLE_REWARDS(),
            next_melee_max_match_percentage: get_DEFAULT_MAX_MATCH_PERCENTAGE(),
            next_melee_max_match_amount: get_DEFAULT_MAX_MATCH_AMOUNT()
        }
    }

    public fun base_start_time(): u64 {
        get_DEFAULT_DURATION()
    }

    public fun base_vault_address(): address {
        create_resource_address(&@emojicoin_arena, get_REGISTRY_SEED())
    }

    /// Fund `PARTICIPANT` with initial APT and emojicoin supply so balance checks do not abort
    /// during swap simulation, based on `arena_octas_enter_amount` to be initially entered: by
    /// buying `arena_octas_enter_amount` worth of initial supply for each emojicoin, the user's
    /// balance will always suffice for the swap simulation.
    public fun fund_participant<Coin0, LP0, Coin1, LP1>(
        arena_octas_enter_amount: u64, market_address_0: address, market_address_1: address
    ): (u64, u64) {
        mint_aptos_coin_to(PARTICIPANT, arena_octas_enter_amount * 3);
        emojicoin_dot_fun::swap<Coin0, LP0>(
            &get_signer(PARTICIPANT),
            market_address_0,
            arena_octas_enter_amount,
            false,
            @integrator,
            0,
            1
        );
        emojicoin_dot_fun::swap<Coin1, LP1>(
            &get_signer(PARTICIPANT),
            market_address_1,
            arena_octas_enter_amount,
            false,
            @integrator,
            0,
            1
        );
        (coin::balance<Coin0>(PARTICIPANT), coin::balance<Coin1>(PARTICIPANT))
    }

    /// Initialize emojicoin dot fun with test markets.
    public fun init_emojicoin_dot_fun_with_test_markets() {
        emojicoin_dot_fun_tests::init_package();
        vector::for_each_ref(
            &vector[BLACK_CAT, BLACK_HEART, YELLOW_HEART, YIN_YANG, ZEBRA, ZOMBIE],
            |bytes_ref| {
                emojicoin_dot_fun_tests::init_market(vector[*bytes_ref]);
            }
        );
    }

    public fun init_module_with_funded_vault() {
        init_emojicoin_dot_fun_with_test_markets();

        // Set global time to base publish time.
        timestamp::update_global_time_for_test(base_publish_time());

        // Initialize module.
        init_module_test_only(&get_signer(@emojicoin_arena));

        // Fund admin, then fund vault.
        mint_aptos_coin_to(@emojicoin_arena, get_DEFAULT_AVAILABLE_REWARDS());
        fund_vault(&get_signer(@emojicoin_arena), get_DEFAULT_AVAILABLE_REWARDS());
    }

    public fun init_module_with_funded_vault_and_participant(): (u64, u64) {
        init_module_with_funded_vault();
        fund_participant<BlackCat, BlackCatLP, Zebra, ZebraLP>(
            base_enter_amount(),
            @black_cat_market,
            @zebra_market
        )
    }

    #[lint::allow_unsafe_randomness]
    public fun set_randomness_seed_for_crank_coverage() {
        randomness::initialize_for_testing(&get_signer(@aptos_framework));
        let seed = x"0000000000000000000000000000000000000000000000000000000000000025";
        std::debug::print(&seed);
        randomness::set_seed(seed);
    }

    public fun simulated_swap_stats<Emojicoin, EmojicoinLP>(
        simulated_swap_inputs: SimulatedSwapInputs
    ): SimulatedSwapStats {
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
        ) =
            emojicoin_dot_fun::unpack_swap(
                simulate_swap<Emojicoin, EmojicoinLP>(
                    PARTICIPANT,
                    simulated_swap_inputs.market_address,
                    simulated_swap_inputs.input_amount,
                    simulated_swap_inputs.selling_emojicoins,
                    @integrator,
                    simulated_swap_inputs.integrator_fee_rate
                )
            );
        SimulatedSwapStats { quote_volume, integrator_fee, net_proceeds }
    }

    #[test]
    public fun admin_functions() {
        // Initialize emojicoin dot fun.
        init_emojicoin_dot_fun_with_test_markets();

        // Set global time to base publish time.
        timestamp::update_global_time_for_test(base_publish_time());

        // Initialize module.
        init_module_test_only(&get_signer(@emojicoin_arena));

        // Fund admin, then fund vault.
        mint_aptos_coin_to(@emojicoin_arena, get_DEFAULT_AVAILABLE_REWARDS());
        fund_vault(&get_signer(@emojicoin_arena), get_DEFAULT_AVAILABLE_REWARDS());

        // Assert vault balance update event.
        let vault_balance_update_events = emitted_events<VaultBalanceUpdate>();
        assert!(vault_balance_update_events.length() == 1);
        MockVaultBalanceUpdate { new_balance: get_DEFAULT_AVAILABLE_REWARDS() }.assert_vault_balance_update(
            vault_balance_update_events[0]
        );

        // Withdraw from vault.
        let withdrawn_octas = 1;
        withdraw_from_vault(&get_signer(@emojicoin_arena), withdrawn_octas);

        // Assert vault balance update event.
        let vault_balance_update_events = emitted_events<VaultBalanceUpdate>();
        assert!(vault_balance_update_events.length() == 2);
        MockVaultBalanceUpdate {
            new_balance: get_DEFAULT_AVAILABLE_REWARDS() - withdrawn_octas
        }.assert_vault_balance_update(vault_balance_update_events[1]);

        // Set next melee parameters.
        let (
            next_available_rewards,
            next_duration,
            next_max_match_amount,
            next_max_match_percentage
        ) = (2, 3, 4, 5);
        set_next_melee_available_rewards(
            &get_signer(@emojicoin_arena), next_available_rewards
        );
        set_next_melee_duration(&get_signer(@emojicoin_arena), next_duration);
        set_next_melee_max_match_amount(
            &get_signer(@emojicoin_arena), next_max_match_amount
        );
        set_next_melee_max_match_percentage(
            &get_signer(@emojicoin_arena), next_max_match_percentage
        );

        // Verify registry view.
        let registry_view = base_registry_view();
        registry_view.next_melee_available_rewards = next_available_rewards;
        registry_view.next_melee_duration = next_duration;
        registry_view.next_melee_max_match_amount = next_max_match_amount;
        registry_view.next_melee_max_match_percentage = next_max_match_percentage;
        registry_view.vault_balance -= withdrawn_octas;
        registry_view.assert_registry_view(registry());
    }

    #[test]
    #[lint::allow_unsafe_randomness]
    public fun enter_crank_twice() {
        init_module_with_funded_vault_and_participant();
        randomness::initialize_for_testing(&get_signer(@aptos_framework));

        // Set time to middle of a new melee.
        let time = base_publish_time();
        time += get_DEFAULT_DURATION();
        timestamp::update_global_time_for_test(time);

        // Crank via enter API.
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, BlackCat>(
            &get_signer(PARTICIPANT),
            base_enter_amount(),
            true
        );

        // Assert state.
        let registry_view = base_registry_view();
        registry_view.n_melees = 2;
        registry_view.assert_registry_view(registry());
        let melee_view_1 = base_melee();
        melee_view_1.assert_melee(melee(melee_view_1.melee_id));
        let melee_view_2 = melee_view_1;
        melee_view_2.melee_id = 2;
        melee_view_2.emojicoin_0_market_address = @black_heart_market;
        melee_view_2.emojicoin_1_market_address = @zombie_market;
        melee_view_2.start_time = base_start_time() + get_DEFAULT_DURATION();
        melee_view_2.assert_melee(melee(melee_view_2.melee_id));

        // Set time to middle of another melee.
        time += get_DEFAULT_DURATION();
        timestamp::update_global_time_for_test(time);

        // Crank via enter API.
        enter<BlackHeart, BlackHeartLP, Zombie, ZombieLP, BlackHeart>(
            &get_signer(PARTICIPANT),
            base_enter_amount(),
            true
        );

        // Assert emitted melee events.
    }

    #[test]
    #[lint::allow_unsafe_randomness]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_ENTER_COIN_BALANCE_0,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun enter_invalid_escrow_coin_balance_0() {
        init_module_with_funded_vault_and_participant();
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, BlackCat>(
            &get_signer(PARTICIPANT),
            base_enter_amount(),
            true
        );
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, Zebra>(
            &get_signer(PARTICIPANT),
            base_enter_amount(),
            true
        );
    }

    #[test]
    #[lint::allow_unsafe_randomness]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_ENTER_COIN_BALANCE_1,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun enter_invalid_escrow_coin_balance_1() {
        init_module_with_funded_vault_and_participant();
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, Zebra>(
            &get_signer(PARTICIPANT),
            base_enter_amount(),
            true
        );
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, BlackCat>(
            &get_signer(PARTICIPANT),
            base_enter_amount(),
            true
        );
    }

    #[test]
    #[lint::allow_unsafe_randomness]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_INVALID_ESCROW_COIN_TYPE,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun enter_invalid_escrow_coin_type() {
        init_module_with_funded_vault_and_participant();
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, BlackCatLP>(
            &get_signer(PARTICIPANT),
            base_enter_amount(),
            true
        );
    }

    #[test]
    #[lint::allow_unsafe_randomness]
    public fun enter_lock_in_top_off() {
        init_module_with_funded_vault_and_participant();

        // Assert emitted vault balance event.
        let vault_balance_update_events = emitted_events<VaultBalanceUpdate>();
        assert!(vault_balance_update_events.length() == 1);
        let vault_balance_update_event = MockVaultBalanceUpdate {
            new_balance: get_DEFAULT_AVAILABLE_REWARDS()
        };
        vault_balance_update_event.assert_vault_balance_update(
            vault_balance_update_events[0]
        );

        // Assign input amount for first entry to first melee, determine user remaining octas.
        let melee_id = 1;
        let input_amount = 10000;

        // Determine raw match amount without any other corrections.
        let max_match_percentage = get_DEFAULT_MAX_MATCH_PERCENTAGE();
        // Correct for max match percentage.
        let raw_match_amount = input_amount * max_match_percentage / 100;
        // Correct for time elapsed since start of melee.
        raw_match_amount =
            raw_match_amount * (base_publish_time() - get_DEFAULT_DURATION())
                / get_DEFAULT_DURATION();

        // Assert raw match amount.
        assert!(
            raw_match_amount
                == match_amount<BlackCat, BlackCatLP, Zebra, ZebraLP>(
                    PARTICIPANT, input_amount, melee_id
                )
        );

        // Simulate swap into escrow.
        let swap_inputs_enter = SimulatedSwapInputs {
            market_address: @black_cat_market,
            input_amount: input_amount + raw_match_amount,
            selling_emojicoins: false,
            integrator_fee_rate: get_INTEGRATOR_FEE_RATE_BPS_SINGLE_ROUTE()
        };
        let swap_stats_enter =
            simulated_swap_stats<BlackCat, BlackCatLP>(swap_inputs_enter);

        // Enter melee with locking in.
        let lock_in = true;
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, BlackCat>(
            &get_signer(PARTICIPANT),
            input_amount,
            lock_in
        );

        // Assert state.
        let registry_view = base_registry_view();
        registry_view.vault_balance -= raw_match_amount;
        registry_view.assert_registry_view(registry());
        let melee_view = base_melee();
        melee_view.available_rewards -= raw_match_amount;
        melee_view.assert_melee(melee(melee_view.melee_id));
        let escrow_view = base_escrow_view();
        escrow_view.match_amount += raw_match_amount;
        escrow_view.emojicoin_0_balance = swap_stats_enter.net_proceeds;
        escrow_view.assert_escrow_view(
            escrow<BlackCat, BlackCatLP, Zebra, ZebraLP>(PARTICIPANT)
        );

        // Assert emitted enter event.
        let enter_events = emitted_events<Enter>();
        assert!(enter_events.length() == 1);
        let enter_event = MockEnter {
            user: PARTICIPANT,
            melee_id: 1,
            input_amount,
            quote_volume: swap_stats_enter.quote_volume,
            integrator_fee: swap_stats_enter.integrator_fee,
            match_amount: raw_match_amount,
            emojicoin_0_proceeds: swap_stats_enter.net_proceeds,
            emojicoin_1_proceeds: 0,
            emojicoin_0_exchange_rate: exchange_rate<BlackCat, BlackCatLP>(
                @black_cat_market
            ),
            emojicoin_1_exchange_rate: exchange_rate<Zebra, ZebraLP>(@zebra_market)
        };
        enter_event.assert_enter(enter_events[0]);

        // Assert emitted vault balance event.
        vault_balance_update_events = emitted_events<VaultBalanceUpdate>();
        assert!(vault_balance_update_events.length() == 2);
        vault_balance_update_event.new_balance -= raw_match_amount;
        vault_balance_update_event.assert_vault_balance_update(
            vault_balance_update_events[1]
        );

        // Withdraw from vault so that it must be corrected for.
        let match_amount = raw_match_amount - 1;
        let amount_to_withdraw = registry_view.vault_balance - match_amount;
        withdraw_from_vault(&get_signer(@emojicoin_arena), amount_to_withdraw);
        registry_view.vault_balance -= amount_to_withdraw;

        // Assert emitted vault balance event.
        vault_balance_update_events = emitted_events<VaultBalanceUpdate>();
        assert!(vault_balance_update_events.length() == 3);
        vault_balance_update_event.new_balance -= amount_to_withdraw;
        vault_balance_update_event.assert_vault_balance_update(
            vault_balance_update_events[2]
        );

        // Assert match amount.
        assert!(
            match_amount
                == match_amount<BlackCat, BlackCatLP, Zebra, ZebraLP>(
                    PARTICIPANT, input_amount, melee_id
                )
        );

        // Simulate swap into escrow.
        swap_inputs_enter.input_amount = input_amount + match_amount;
        swap_stats_enter = simulated_swap_stats<BlackCat, BlackCatLP>(swap_inputs_enter);

        // Top off.
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, BlackCat>(
            &get_signer(PARTICIPANT),
            input_amount,
            lock_in
        );

        // Assert state.
        registry_view.vault_balance -= match_amount;
        registry_view.assert_registry_view(registry());
        melee_view.available_rewards -= match_amount;
        melee_view.assert_melee(melee(melee_view.melee_id));
        escrow_view.match_amount += match_amount;
        escrow_view.emojicoin_0_balance += swap_stats_enter.net_proceeds;
        escrow_view.assert_escrow_view(
            escrow<BlackCat, BlackCatLP, Zebra, ZebraLP>(PARTICIPANT)
        );

        // Assert emitted enter event.
        enter_events = emitted_events<Enter>();
        assert!(enter_events.length() == 2);
        enter_event.quote_volume = swap_stats_enter.quote_volume;
        enter_event.integrator_fee = swap_stats_enter.integrator_fee;
        enter_event.match_amount = match_amount;
        enter_event.emojicoin_0_proceeds = swap_stats_enter.net_proceeds;
        enter_event.emojicoin_0_exchange_rate = exchange_rate<BlackCat, BlackCatLP>(
            @black_cat_market
        );
        enter_event.emojicoin_1_exchange_rate = exchange_rate<Zebra, ZebraLP>(
            @zebra_market
        );
        enter_event.assert_enter(enter_events[1]);

        // Assert emitted vault balance event.
        vault_balance_update_events = emitted_events<VaultBalanceUpdate>();
        assert!(vault_balance_update_events.length() == 4);
        vault_balance_update_event.new_balance -= match_amount;
        vault_balance_update_event.assert_vault_balance_update(
            vault_balance_update_events[3]
        );

        // Deposit back into vault so that it is not limiting factor for corrections.
        fund_vault(&get_signer(@emojicoin_arena), amount_to_withdraw);
        registry_view.vault_balance += amount_to_withdraw;

        // Assert emitted vault balance event.
        vault_balance_update_events = emitted_events<VaultBalanceUpdate>();
        assert!(vault_balance_update_events.length() == 5);
        vault_balance_update_event.new_balance += amount_to_withdraw;
        vault_balance_update_event.assert_vault_balance_update(
            vault_balance_update_events[4]
        );

        // Set available rewards in melee to become limiting factor.
        match_amount -= 1;
        set_melee_available_rewards(melee_view.melee_id, match_amount);
        melee_view.available_rewards = match_amount;

        // Assert match amount.
        assert!(
            match_amount
                == match_amount<BlackCat, BlackCatLP, Zebra, ZebraLP>(
                    PARTICIPANT, input_amount, melee_id
                )
        );

        // Simulate swap into escrow.
        swap_inputs_enter.input_amount = input_amount + match_amount;
        swap_stats_enter = simulated_swap_stats<BlackCat, BlackCatLP>(swap_inputs_enter);

        // Top off.
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, BlackCat>(
            &get_signer(PARTICIPANT),
            input_amount,
            lock_in
        );

        // Assert state.
        registry_view.vault_balance -= match_amount;
        registry_view.assert_registry_view(registry());
        melee_view.available_rewards -= match_amount;
        melee_view.assert_melee(melee(melee_view.melee_id));
        escrow_view.match_amount += match_amount;
        escrow_view.emojicoin_0_balance += swap_stats_enter.net_proceeds;
        escrow_view.assert_escrow_view(
            escrow<BlackCat, BlackCatLP, Zebra, ZebraLP>(PARTICIPANT)
        );

        // Assert emitted enter event.
        enter_events = emitted_events<Enter>();
        assert!(enter_events.length() == 3);
        enter_event.quote_volume = swap_stats_enter.quote_volume;
        enter_event.integrator_fee = swap_stats_enter.integrator_fee;
        enter_event.match_amount = match_amount;
        enter_event.emojicoin_0_proceeds = swap_stats_enter.net_proceeds;
        enter_event.emojicoin_0_exchange_rate = exchange_rate<BlackCat, BlackCatLP>(
            @black_cat_market
        );
        enter_event.emojicoin_1_exchange_rate = exchange_rate<Zebra, ZebraLP>(
            @zebra_market
        );
        enter_event.assert_enter(enter_events[2]);

        // Assert emitted vault balance event.
        vault_balance_update_events = emitted_events<VaultBalanceUpdate>();
        assert!(vault_balance_update_events.length() == 6);
        vault_balance_update_event.new_balance -= match_amount;
        vault_balance_update_event.assert_vault_balance_update(
            vault_balance_update_events[5]
        );

        // Set max match amount to become limiting factor.
        match_amount -= 1;
        set_melee_available_rewards(
            melee_view.melee_id, get_DEFAULT_MAX_MATCH_AMOUNT()
        );
        melee_view.available_rewards = get_DEFAULT_MAX_MATCH_AMOUNT();
        melee_view.max_match_amount = escrow_view.match_amount + match_amount;
        set_melee_max_match_amount(melee_view.melee_id, melee_view.max_match_amount);

        // Assert match amount.
        assert!(
            match_amount
                == match_amount<BlackCat, BlackCatLP, Zebra, ZebraLP>(
                    PARTICIPANT, input_amount, melee_id
                )
        );

        // Simulate swap into escrow.
        swap_inputs_enter.input_amount = input_amount + match_amount;
        swap_stats_enter = simulated_swap_stats<BlackCat, BlackCatLP>(swap_inputs_enter);

        // Top off.
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, BlackCat>(
            &get_signer(PARTICIPANT),
            input_amount,
            lock_in
        );

        // Assert state.
        registry_view.vault_balance -= match_amount;
        registry_view.assert_registry_view(registry());
        melee_view.available_rewards -= match_amount;
        melee_view.assert_melee(melee(melee_view.melee_id));
        escrow_view.match_amount += match_amount;
        escrow_view.emojicoin_0_balance += swap_stats_enter.net_proceeds;
        escrow_view.assert_escrow_view(
            escrow<BlackCat, BlackCatLP, Zebra, ZebraLP>(PARTICIPANT)
        );

        // Assert emitted enter event.
        enter_events = emitted_events<Enter>();
        assert!(enter_events.length() == 4);
        enter_event.quote_volume = swap_stats_enter.quote_volume;
        enter_event.integrator_fee = swap_stats_enter.integrator_fee;
        enter_event.match_amount = match_amount;
        enter_event.emojicoin_0_proceeds = swap_stats_enter.net_proceeds;
        enter_event.emojicoin_0_exchange_rate = exchange_rate<BlackCat, BlackCatLP>(
            @black_cat_market
        );
        enter_event.emojicoin_1_exchange_rate = exchange_rate<Zebra, ZebraLP>(
            @zebra_market
        );
        enter_event.assert_enter(enter_events[3]);

        // Assert emitted vault balance event.
        vault_balance_update_events = emitted_events<VaultBalanceUpdate>();
        assert!(vault_balance_update_events.length() == 7);
        vault_balance_update_event.new_balance -= match_amount;
        vault_balance_update_event.assert_vault_balance_update(
            vault_balance_update_events[6]
        );

        // Simulate swap into escrow for no match amount, since max match is now met.
        swap_inputs_enter.input_amount = input_amount;
        swap_stats_enter = simulated_swap_stats<BlackCat, BlackCatLP>(swap_inputs_enter);

        // Top off.
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, BlackCat>(
            &get_signer(PARTICIPANT),
            input_amount,
            lock_in
        );

        // Assert state.
        registry_view.assert_registry_view(registry());
        melee_view.assert_melee(melee(melee_view.melee_id));
        escrow_view.emojicoin_0_balance += swap_stats_enter.net_proceeds;
        escrow_view.assert_escrow_view(
            escrow<BlackCat, BlackCatLP, Zebra, ZebraLP>(PARTICIPANT)
        );

        // Assert emitted enter event.
        enter_events = emitted_events<Enter>();
        assert!(enter_events.length() == 5);
        enter_event.quote_volume = swap_stats_enter.quote_volume;
        enter_event.integrator_fee = swap_stats_enter.integrator_fee;
        enter_event.match_amount = 0;
        enter_event.emojicoin_0_proceeds = swap_stats_enter.net_proceeds;
        enter_event.emojicoin_0_exchange_rate = exchange_rate<BlackCat, BlackCatLP>(
            @black_cat_market
        );
        enter_event.emojicoin_1_exchange_rate = exchange_rate<Zebra, ZebraLP>(
            @zebra_market
        );
        enter_event.assert_enter(enter_events[4]);

        // Assert no new vault balance event emitted.
        vault_balance_update_events = emitted_events<VaultBalanceUpdate>();
        assert!(vault_balance_update_events.length() == 7);
    }

    #[test]
    #[lint::allow_unsafe_randomness]
    public fun enter_swap_exit_repeat_other_side() {
        let (emojicoin_0_balance, emojicoin_1_balance) =
            init_module_with_funded_vault_and_participant();

        // Assert state.
        let registry_view = base_registry_view();
        let melee_view = base_melee();
        registry_view.assert_registry_view(registry());
        melee_view.assert_melee(melee(melee_view.melee_id));
        assert!(
            !escrow_exists<BlackCat, BlackCatLP, Zebra, ZebraLP>(PARTICIPANT)
        );

        // Simulate swap into escrow.
        let swap_inputs_enter = SimulatedSwapInputs {
            market_address: @black_cat_market,
            input_amount: base_enter_amount(),
            selling_emojicoins: false,
            integrator_fee_rate: get_INTEGRATOR_FEE_RATE_BPS_SINGLE_ROUTE()
        };
        let swap_stats_enter =
            simulated_swap_stats<BlackCat, BlackCatLP>(swap_inputs_enter);

        // Enter melee without locking in.
        let lock_in = false;
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, BlackCat>(
            &get_signer(PARTICIPANT),
            base_enter_amount(),
            lock_in
        );

        // Assert state.
        registry_view.assert_registry_view(registry());
        melee_view.assert_melee(melee(melee_view.melee_id));
        assert!(
            escrow_exists<BlackCat, BlackCatLP, Zebra, ZebraLP>(PARTICIPANT)
        );
        let escrow_view = base_escrow_view();
        escrow_view.emojicoin_0_balance = swap_stats_enter.net_proceeds;
        escrow_view.assert_escrow_view(
            escrow<BlackCat, BlackCatLP, Zebra, ZebraLP>(PARTICIPANT)
        );
        assert!(coin::balance<BlackCat>(PARTICIPANT) == emojicoin_0_balance);
        assert!(coin::balance<Zebra>(PARTICIPANT) == emojicoin_1_balance);

        // Assert emitted enter event.
        let enter_events = emitted_events<Enter>();
        assert!(enter_events.length() == 1);
        let enter_event = MockEnter {
            user: PARTICIPANT,
            melee_id: 1,
            input_amount: base_enter_amount(),
            quote_volume: swap_stats_enter.quote_volume,
            integrator_fee: swap_stats_enter.integrator_fee,
            match_amount: 0,
            emojicoin_0_proceeds: swap_stats_enter.net_proceeds,
            emojicoin_1_proceeds: 0,
            emojicoin_0_exchange_rate: exchange_rate<BlackCat, BlackCatLP>(
                @black_cat_market
            ),
            emojicoin_1_exchange_rate: exchange_rate<Zebra, ZebraLP>(@zebra_market)
        };
        enter_event.assert_enter(enter_events[0]);

        // Simulate swap within escrow.
        let swap_inputs_swap_route_0 = SimulatedSwapInputs {
            market_address: @black_cat_market,
            input_amount: swap_stats_enter.net_proceeds,
            selling_emojicoins: true,
            integrator_fee_rate: get_INTEGRATOR_FEE_RATE_BPS_DOUBLE_ROUTE()
        };
        let swap_stats_swap_route_0 =
            simulated_swap_stats<BlackCat, BlackCatLP>(swap_inputs_swap_route_0);
        let swap_inputs_swap_route_1 = SimulatedSwapInputs {
            market_address: @zebra_market,
            input_amount: swap_stats_swap_route_0.net_proceeds,
            selling_emojicoins: false,
            integrator_fee_rate: get_INTEGRATOR_FEE_RATE_BPS_DOUBLE_ROUTE()
        };
        let swap_stats_swap_route_1 =
            simulated_swap_stats<Zebra, ZebraLP>(swap_inputs_swap_route_1);

        // Swap within escrow.
        swap<BlackCat, BlackCatLP, Zebra, ZebraLP>(&get_signer(PARTICIPANT));

        // Assert state.
        registry_view.assert_registry_view(registry());
        melee_view.assert_melee(melee(melee_view.melee_id));
        escrow_view.emojicoin_0_balance = 0;
        escrow_view.emojicoin_1_balance = swap_stats_swap_route_1.net_proceeds;
        escrow_view.assert_escrow_view(
            escrow<BlackCat, BlackCatLP, Zebra, ZebraLP>(PARTICIPANT)
        );
        assert!(coin::balance<BlackCat>(PARTICIPANT) == emojicoin_0_balance);
        assert!(coin::balance<Zebra>(PARTICIPANT) == emojicoin_1_balance);

        // Assert emitted swap event.
        let swap_events = emitted_events<Swap>();
        assert!(swap_events.length() == 1);
        let swap_event = MockSwap {
            user: PARTICIPANT,
            melee_id: 1,
            quote_volume: swap_stats_swap_route_1.quote_volume,
            integrator_fee: swap_stats_swap_route_0.integrator_fee
                + swap_stats_swap_route_1.integrator_fee,
            emojicoin_0_proceeds: 0,
            emojicoin_1_proceeds: swap_stats_swap_route_1.net_proceeds,
            emojicoin_0_exchange_rate: exchange_rate<BlackCat, BlackCatLP>(
                @black_cat_market
            ),
            emojicoin_1_exchange_rate: exchange_rate<Zebra, ZebraLP>(@zebra_market)
        };
        swap_event.assert_swap(swap_events[0]);

        // Exit.
        exit<BlackCat, BlackCatLP, Zebra, ZebraLP>(&get_signer(PARTICIPANT));

        // Assert state.
        registry_view.assert_registry_view(registry());
        melee_view.assert_melee(melee(melee_view.melee_id));
        escrow_view.emojicoin_1_balance = 0;
        escrow_view.assert_escrow_view(
            escrow<BlackCat, BlackCatLP, Zebra, ZebraLP>(PARTICIPANT)
        );
        assert!(coin::balance<BlackCat>(PARTICIPANT) == emojicoin_0_balance);
        emojicoin_1_balance += swap_stats_swap_route_1.net_proceeds;
        assert!(coin::balance<Zebra>(PARTICIPANT) == emojicoin_1_balance);

        // Assert emitted exit event.
        let exit_events = emitted_events<Exit>();
        assert!(exit_events.length() == 1);
        let exit_event = MockExit {
            user: PARTICIPANT,
            melee_id: 1,
            tap_out_fee: 0,
            emojicoin_0_proceeds: 0,
            emojicoin_1_proceeds: swap_stats_swap_route_1.net_proceeds,
            emojicoin_0_exchange_rate: exchange_rate<BlackCat, BlackCatLP>(
                @black_cat_market
            ),
            emojicoin_1_exchange_rate: exchange_rate<Zebra, ZebraLP>(@zebra_market)
        };
        exit_event.assert_exit(exit_events[0]);

        // Fund with more APT.
        mint_aptos_coin_to(PARTICIPANT, base_enter_amount());

        // Simulate swap into escrow.
        swap_inputs_enter.market_address = @zebra_market;
        swap_stats_enter = simulated_swap_stats<Zebra, ZebraLP>(swap_inputs_enter);
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, Zebra>(
            &get_signer(PARTICIPANT),
            base_enter_amount(),
            lock_in
        );

        // Assert state.
        registry_view.assert_registry_view(registry());
        melee_view.assert_melee(melee(melee_view.melee_id));
        escrow_view.emojicoin_1_balance = swap_stats_enter.net_proceeds;
        escrow_view.assert_escrow_view(
            escrow<BlackCat, BlackCatLP, Zebra, ZebraLP>(PARTICIPANT)
        );
        assert!(coin::balance<BlackCat>(PARTICIPANT) == emojicoin_0_balance);
        assert!(coin::balance<Zebra>(PARTICIPANT) == emojicoin_1_balance);

        // Assert emitted enter event.
        enter_events = emitted_events<Enter>();
        assert!(enter_events.length() == 2);
        enter_event.quote_volume = swap_stats_enter.quote_volume;
        enter_event.integrator_fee = swap_stats_enter.integrator_fee;
        enter_event.emojicoin_0_proceeds = 0;
        enter_event.emojicoin_1_proceeds = swap_stats_enter.net_proceeds;
        enter_event.emojicoin_0_exchange_rate = exchange_rate<BlackCat, BlackCatLP>(
            @black_cat_market
        );
        enter_event.emojicoin_1_exchange_rate = exchange_rate<Zebra, ZebraLP>(
            @zebra_market
        );
        enter_event.assert_enter(enter_events[1]);

        // Simulate swap within escrow.
        swap_inputs_swap_route_0.market_address = @zebra_market;
        swap_inputs_swap_route_0.input_amount = swap_stats_enter.net_proceeds;
        swap_stats_swap_route_0 = simulated_swap_stats<Zebra, ZebraLP>(
            swap_inputs_swap_route_0
        );
        swap_inputs_swap_route_1.market_address = @black_cat_market;
        swap_inputs_swap_route_1.input_amount = swap_stats_swap_route_0.net_proceeds;
        swap_stats_swap_route_1 = simulated_swap_stats<BlackCat, BlackCatLP>(
            swap_inputs_swap_route_1
        );

        // Swap within escrow.
        swap<BlackCat, BlackCatLP, Zebra, ZebraLP>(&get_signer(PARTICIPANT));

        // Assert state.
        registry_view.assert_registry_view(registry());
        melee_view.assert_melee(melee(melee_view.melee_id));
        escrow_view.emojicoin_0_balance = swap_stats_swap_route_1.net_proceeds;
        escrow_view.emojicoin_1_balance = 0;
        escrow_view.assert_escrow_view(
            escrow<BlackCat, BlackCatLP, Zebra, ZebraLP>(PARTICIPANT)
        );
        assert!(coin::balance<BlackCat>(PARTICIPANT) == emojicoin_0_balance);
        assert!(coin::balance<Zebra>(PARTICIPANT) == emojicoin_1_balance);

        // Assert emitted swap event.
        swap_events = emitted_events<Swap>();
        assert!(swap_events.length() == 2);
        swap_event.quote_volume = swap_stats_swap_route_1.quote_volume;
        swap_event.integrator_fee =
            swap_stats_swap_route_0.integrator_fee
                + swap_stats_swap_route_1.integrator_fee;
        swap_event.emojicoin_0_proceeds = swap_stats_swap_route_1.net_proceeds;
        swap_event.emojicoin_1_proceeds = 0;
        swap_event.emojicoin_0_exchange_rate = exchange_rate<BlackCat, BlackCatLP>(
            @black_cat_market
        );
        swap_event.emojicoin_1_exchange_rate = exchange_rate<Zebra, ZebraLP>(
            @zebra_market
        );
        swap_event.assert_swap(swap_events[1]);

        // Exit.
        exit<BlackCat, BlackCatLP, Zebra, ZebraLP>(&get_signer(PARTICIPANT));

        // Assert state.
        registry_view.assert_registry_view(registry());
        melee_view.assert_melee(melee(melee_view.melee_id));
        escrow_view.emojicoin_0_balance = 0;
        escrow_view.assert_escrow_view(
            escrow<BlackCat, BlackCatLP, Zebra, ZebraLP>(PARTICIPANT)
        );
        emojicoin_0_balance += swap_stats_swap_route_1.net_proceeds;
        assert!(coin::balance<BlackCat>(PARTICIPANT) == emojicoin_0_balance);
        assert!(coin::balance<Zebra>(PARTICIPANT) == emojicoin_1_balance);

        // Assert emitted exit event.
        exit_events = emitted_events<Exit>();
        assert!(exit_events.length() == 2);
        exit_event.emojicoin_0_proceeds = swap_stats_swap_route_1.net_proceeds;
        exit_event.emojicoin_1_proceeds = 0;
        exit_event.emojicoin_0_exchange_rate = exchange_rate<BlackCat, BlackCatLP>(
            @black_cat_market
        );
        exit_event.emojicoin_1_exchange_rate = exchange_rate<Zebra, ZebraLP>(
            @zebra_market
        );
        exit_event.assert_exit(exit_events[1]);

    }

    #[test]
    #[lint::allow_unsafe_randomness]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_TOP_OFF_MUST_LOCK_IN,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun enter_top_off_must_lock_in() {
        init_module_with_funded_vault_and_participant();
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, BlackCat>(
            &get_signer(PARTICIPANT),
            base_enter_amount(),
            true
        );
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, BlackCat>(
            &get_signer(PARTICIPANT),
            base_enter_amount(),
            false
        );
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_NO_ESCROW,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun escrow_no_escrow() {
        escrow<BlackCat, BlackCatLP, Zebra, ZebraLP>(@0x0);
    }

    #[test]
    public fun exchange_rate_exact_transition() {
        emojicoin_dot_fun_tests::init_package_then_exact_transition();

        let (base, quote) =
            unpack_exchange_rate(
                exchange_rate<BlackCat, BlackCatLP>(@black_cat_market)
            );
        assert!(base == get_EMOJICOIN_REMAINDER());
        assert!(quote == get_QUOTE_REAL_CEILING());
    }

    #[test]
    public fun exchange_rate_fresh_market() {
        init_emojicoin_dot_fun_with_test_markets();

        let (base, quote) =
            unpack_exchange_rate(
                exchange_rate<BlackCat, BlackCatLP>(@black_cat_market)
            );
        assert!(base == get_BASE_VIRTUAL_CEILING());
        assert!(quote == get_QUOTE_VIRTUAL_FLOOR());
    }

    #[test]
    public fun init_module_base() {
        // Initialize emojicoin dot fun.
        init_emojicoin_dot_fun_with_test_markets();

        // Set global time to base publish time.
        timestamp::update_global_time_for_test(base_publish_time());

        // Initialize module.
        init_module_test_only(&get_signer(@emojicoin_arena));

        // Assert registry view.
        let registry_view = base_registry_view();
        registry_view.vault_balance = 0;
        registry_view.assert_registry_view(registry());

        // Assert melee event.
        let melee_events = emitted_events<Melee>();
        assert!(melee_events.length() == 1);
        base_melee().assert_melee(melee_events[0]);
    }

    #[test]
    /// Like `init_module_base`, but generates several AUIDs before calling `init_module`,
    /// effectively changing the pseudo-random seed. Since there are so few markets registered at
    /// the simulated publish time, multiple calls may be required to trigger a different initial
    /// melee than that from `init_module`, while also hitting coverage on the inner function
    /// `sort_unique_market_ids`.
    public fun init_module_different_seed() {
        for (i in 0..4) {
            transaction_context::generate_auid_address();
        };

        // Initialize emojicoin dot fun.
        init_emojicoin_dot_fun_with_test_markets();

        // Set global time to base publish time.
        timestamp::update_global_time_for_test(base_publish_time());

        // Initialize module.
        init_module_test_only(&get_signer(@emojicoin_arena));

        // Assert registry view.
        let registry_view = base_registry_view();
        registry_view.vault_balance = 0;
        registry_view.assert_registry_view(registry());

        // Assert melee event.
        let melee_events = emitted_events<Melee>();
        assert!(melee_events.length() == 1);
        let mock_melee = base_melee();
        mock_melee.emojicoin_0_market_address = @yin_yang_market;
        mock_melee.emojicoin_1_market_address = @zombie_market;
        mock_melee.assert_melee(melee_events[0]);
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_INVALID_MELEE_ID,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun match_amount_invalid_melee_id_hi() {
        init_module_with_funded_vault_and_participant();
        match_amount<BlackCat, BlackCatLP, Zebra, ZebraLP>(
            PARTICIPANT, base_enter_amount(), 2
        );
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_INVALID_MELEE_ID,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun match_amount_invalid_melee_id_lo() {
        init_module_with_funded_vault_and_participant();
        match_amount<BlackCat, BlackCatLP, Zebra, ZebraLP>(
            PARTICIPANT, base_enter_amount(), 0
        );
    }

    #[test]
    #[lint::allow_unsafe_randomness]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_MELEE_ID_MISMATCH,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun match_amount_melee_id_mismatch() {
        init_module_with_funded_vault_and_participant();
        enter<BlackCat, BlackCatLP, Zebra, ZebraLP, BlackCat>(
            &get_signer(PARTICIPANT),
            base_enter_amount(),
            true
        );
        match_amount<BlackCat, BlackCatLP, Zebra, ZebraLP>(
            PARTICIPANT, base_enter_amount(), 0
        );
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_INVALID_MELEE_ID,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun melee_invalid_melee_id_hi() {
        init_module_with_funded_vault_and_participant();
        melee(2);
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_INVALID_MELEE_ID,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun melee_invalid_melee_id_lo() {
        init_module_with_funded_vault_and_participant();
        melee(0);
    }

    #[test]
    #[lint::allow_unsafe_randomness]
    public fun randomness_seed_for_crank_coverage() {
        // Initialize module, randomness.
        init_module_with_funded_vault_and_participant();
        set_randomness_seed_for_crank_coverage();

        // Initialize all coverage conditions to false.
        let covered_equal_market_ids = false;
        let covered_unequal_market_ids = false;
        let covered_sort_order_market_id_0_hi = false;
        let covered_sort_order_market_id_0_lo = false;
        let covered_melee_ids_by_market_ids_contains = false;

        loop {
            // Get two random market IDs.
            let market_id_0 = random_market_id();
            let market_id_1 = random_market_id();

            // Check if they are equal, restarting loop as needed, and set coverage condition.
            if (market_id_0 == market_id_1) {
                std::debug::print(&1);
                covered_equal_market_ids = true;
                continue;
            } else {
                std::debug::print(&2);
                covered_unequal_market_ids = true;
            };

            // Sort market IDs, setting coverage conditions.
            let sorted_unique_market_ids = if (market_id_0 < market_id_1) {
                std::debug::print(&3);
                covered_sort_order_market_id_0_lo = true;
                vector[market_id_0, market_id_1]
            } else {
                std::debug::print(&4);
                covered_sort_order_market_id_0_hi = true;
                vector[market_id_1, market_id_0]
            };

            // Check if melee IDs by market IDs contains sorted unique market IDs, setting coverage
            // condition.
            if (melee_ids_by_market_ids_contains(sorted_unique_market_ids)) {
                std::debug::print(&5);
                covered_melee_ids_by_market_ids_contains = true;
                continue;
            } else {
                std::debug::print(&6);
                break;
            };
        };

        // Assert all coverage conditions met.
        assert!(covered_equal_market_ids);
        assert!(covered_unequal_market_ids);
        assert!(covered_sort_order_market_id_0_hi);
        assert!(covered_sort_order_market_id_0_lo);
        assert!(covered_melee_ids_by_market_ids_contains);
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_NOT_EMOJICOIN_ARENA,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun set_next_melee_available_rewards_not_arena() {
        set_next_melee_available_rewards(&get_signer(@aptos_framework), 0);
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_NOT_EMOJICOIN_ARENA,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun set_next_melee_duration_not_arena() {
        set_next_melee_duration(&get_signer(@aptos_framework), 0);
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_NOT_EMOJICOIN_ARENA,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun set_next_melee_max_match_amount_not_arena() {
        set_next_melee_max_match_amount(&get_signer(@aptos_framework), 0);
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_NOT_EMOJICOIN_ARENA,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun set_next_melee_max_match_percentage_not_arena() {
        set_next_melee_max_match_percentage(&get_signer(@aptos_framework), 0);
    }

    #[test]
    public fun test_market_addresses() {
        init_emojicoin_dot_fun_with_test_markets();
        let market_addresses = vector[
            @black_cat_market,
            @black_heart_market,
            @yellow_heart_market,
            @yin_yang_market,
            @zebra_market,
            @zombie_market
        ];
        let market_emoji_bytes = vector[BLACK_CAT, BLACK_HEART, YELLOW_HEART, YIN_YANG, ZEBRA, ZOMBIE];
        for (i in 0..market_addresses.length()) {
            MockMarketMetadata {
                market_id: i + 1,
                market_address: market_addresses[i],
                emoji_bytes: market_emoji_bytes[i]
            }.assert_market_metadata(
                option::destroy_some(market_metadata_by_market_id(i + 1))
            );
        };
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_NOT_EMOJICOIN_ARENA,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun withdraw_from_vault_not_arena() {
        withdraw_from_vault(&get_signer(@aptos_framework), 0);
    }
}
