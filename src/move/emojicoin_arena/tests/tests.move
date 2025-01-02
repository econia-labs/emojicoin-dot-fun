#[test_only]
// This test module uses the same design schema as the emojicoin dot fun core test module.
module emojicoin_arena::tests {
    use aptos_framework::account::{
        create_resource_address,
        create_signer_for_test as get_signer
    };
    use aptos_framework::event::{emitted_events};
    use aptos_framework::timestamp;
    use aptos_framework::transaction_context;
    use emojicoin_arena::emojicoin_arena::{
        Exit,
        NewMelee,
        ProfitAndLoss,
        RegistryView,
        TopExits,
        VaultBalanceUpdate,
        fund_vault,
        get_DEFAULT_AVAILABLE_REWARDS,
        get_DEFAULT_DURATION,
        get_DEFAULT_MAX_MATCH_PERCENTAGE,
        get_DEFAULT_MAX_MATCH_AMOUNT,
        get_NULL_ADDRESS,
        get_REGISTRY_SEED,
        init_module_test_only,
        registry_view,
        set_next_melee_available_rewards,
        set_next_melee_duration,
        set_next_melee_max_match_amount,
        set_next_melee_max_match_percentage,
        unpack_exit,
        unpack_new_melee,
        unpack_profit_and_loss,
        unpack_registry_view,
        unpack_top_exits,
        unpack_vault_balance_update,
        withdraw_from_vault
    };
    use emojicoin_dot_fun::emojicoin_dot_fun::{
        MarketMetadata,
        market_metadata_by_market_id,
        unpack_market_metadata
    };
    use emojicoin_dot_fun::test_acquisitions::mint_aptos_coin_to;
    use emojicoin_dot_fun::tests as emojicoin_dot_fun_tests;
    use std::option;
    use std::vector;

    struct MockExit has copy, drop, store {
        user: address,
        melee_id: u64,
        octas_entered: u64,
        octas_matched: u64,
        tap_out_fee: u64,
        emojicoin_0_proceeds: u64,
        emojicoin_1_proceeds: u64,
        profit_and_loss: MockProfitAndLoss
    }

    struct MockMarketMetadata has copy, drop, store {
        market_id: u64,
        market_address: address,
        emoji_bytes: vector<u8>
    }

    struct MockNewMelee has copy, drop, store {
        melee_id: u64,
        market_metadatas: vector<MockMarketMetadata>,
        start_time: u64,
        duration: u64,
        max_match_percentage: u64,
        max_match_amount: u64,
        available_rewards: u64
    }

    struct MockProfitAndLoss has copy, drop, store {
        octas_value: u128,
        octas_gain: u128,
        octas_loss: u128,
        octas_growth_q64: u128
    }

    struct MockRegistryView has copy, drop, store {
        n_melees: u64,
        vault_address: address,
        vault_balance: u64,
        next_melee_duration: u64,
        next_melee_available_rewards: u64,
        next_melee_max_match_percentage: u64,
        next_melee_max_match_amount: u64,
        n_entrants: u64,
        n_swaps: u64,
        swaps_volume: u128,
        octas_matched: u64,
        top_exits: MockTopExits
    }

    struct MockTopExits has copy, drop, store {
        by_octas_gain: MockExit,
        by_octas_growth_q64: MockExit
    }

    struct MockVaultBalanceUpdate has copy, drop, store {
        new_balance: u64
    }

    // Test market emoji bytes, in order of market ID.
    const BLACK_CAT: vector<u8> = x"f09f9088e2808de2ac9b";
    const BLACK_HEART: vector<u8> = x"f09f96a4";
    const YELLOW_HEART: vector<u8> = x"f09f929b";
    const YIN_YANG: vector<u8> = x"e298afefb88f";
    const ZEBRA: vector<u8> = x"f09fa693";
    const ZOMBIE: vector<u8> = x"f09fa79f";

    public fun assert_exit(self: MockExit, actual: Exit) {
        let (
            user,
            melee_id,
            octas_entered,
            octas_matched,
            tap_out_fee,
            emojicoin_0_proceeds,
            emojicoin_1_proceeds,
            profit_and_loss
        ) = unpack_exit(actual);
        assert!(self.user == user);
        assert!(self.melee_id == melee_id);
        assert!(self.octas_entered == octas_entered);
        assert!(self.octas_matched == octas_matched);
        assert!(self.tap_out_fee == tap_out_fee);
        assert!(self.emojicoin_0_proceeds == emojicoin_0_proceeds);
        assert!(self.emojicoin_1_proceeds == emojicoin_1_proceeds);
        self.profit_and_loss.assert_profit_and_loss(profit_and_loss);
    }

    public fun assert_market_metadata(
        self: MockMarketMetadata, actual: MarketMetadata
    ) {
        let (market_id, market_address, emoji_bytes) = unpack_market_metadata(actual);
        assert!(self.market_id == market_id);
        assert!(self.market_address == market_address);
        assert!(self.emoji_bytes == emoji_bytes);
    }

    public fun assert_market_metadatas(
        mock: vector<MockMarketMetadata>, actual: vector<MarketMetadata>
    ) {
        let mock_length = mock.length();
        assert!(mock_length == actual.length());
        for (metadata_index in 0..mock_length) {
            (mock[metadata_index].assert_market_metadata(actual[metadata_index]));
        };
    }

    public fun assert_new_melee(self: MockNewMelee, actual: NewMelee) {
        let (
            melee_id,
            market_metadatas,
            start_time,
            duration,
            max_match_percentage,
            max_match_amount,
            available_rewards
        ) = unpack_new_melee(actual);
        assert!(self.melee_id == melee_id);
        assert_market_metadatas(self.market_metadatas, market_metadatas);
        assert!(self.start_time == start_time);
        assert!(self.duration == duration);
        assert!(self.max_match_percentage == max_match_percentage);
        assert!(self.max_match_amount == max_match_amount);
        assert!(self.available_rewards == available_rewards);
    }

    public fun assert_profit_and_loss(
        self: MockProfitAndLoss, actual: ProfitAndLoss
    ) {
        let (octas_value, octas_gain, octas_loss, octas_growth_q64) =
            unpack_profit_and_loss(actual);
        assert!(self.octas_value == octas_value);
        assert!(self.octas_gain == octas_gain);
        assert!(self.octas_loss == octas_loss);
        assert!(self.octas_growth_q64 == octas_growth_q64);
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
            next_melee_max_match_amount,
            n_entrants,
            n_swaps,
            swaps_volume,
            octas_matched,
            top_exits
        ) = unpack_registry_view(actual);
        assert!(self.n_melees == n_melees);
        assert!(self.vault_address == vault_address);
        assert!(self.vault_balance == vault_balance);
        assert!(self.next_melee_duration == next_melee_duration);
        assert!(self.next_melee_available_rewards == next_melee_available_rewards);
        assert!(self.next_melee_max_match_percentage == next_melee_max_match_percentage);
        assert!(self.next_melee_max_match_amount == next_melee_max_match_amount);
        assert!(self.n_entrants == n_entrants);
        assert!(self.n_swaps == n_swaps);
        assert!(self.swaps_volume == swaps_volume);
        assert!(self.octas_matched == octas_matched);
        self.top_exits.assert_top_exits(top_exits);
    }

    public fun assert_top_exits(self: MockTopExits, actual: TopExits) {
        let (by_octas_gain, by_octas_growth_q64) = unpack_top_exits(actual);
        self.by_octas_gain.assert_exit(by_octas_gain);
        self.by_octas_growth_q64.assert_exit(by_octas_growth_q64);
    }

    public fun assert_vault_balance_update(
        self: MockVaultBalanceUpdate, actual: VaultBalanceUpdate
    ) {
        let new_balance = unpack_vault_balance_update(actual);
        assert!(self.new_balance == new_balance);
    }

    public fun base_exit(): MockExit {
        MockExit {
            user: get_NULL_ADDRESS(),
            melee_id: 0,
            octas_entered: 0,
            octas_matched: 0,
            tap_out_fee: 0,
            emojicoin_0_proceeds: 0,
            emojicoin_1_proceeds: 0,
            profit_and_loss: base_profit_and_loss()
        }
    }

    public fun base_new_melee(): MockNewMelee {
        MockNewMelee {
            melee_id: 1,
            market_metadatas: vector[
                MockMarketMetadata {
                    market_id: 1,
                    market_address: @black_cat_market,
                    emoji_bytes: BLACK_CAT
                },
                MockMarketMetadata {
                    market_id: 5,
                    market_address: @zebra_market,
                    emoji_bytes: ZEBRA
                }
            ],
            start_time: base_start_time(),
            duration: get_DEFAULT_DURATION(),
            max_match_percentage: get_DEFAULT_MAX_MATCH_PERCENTAGE(),
            max_match_amount: get_DEFAULT_MAX_MATCH_AMOUNT(),
            available_rewards: get_DEFAULT_AVAILABLE_REWARDS()
        }
    }

    public fun base_profit_and_loss(): MockProfitAndLoss {
        MockProfitAndLoss {
            octas_value: 0,
            octas_gain: 0,
            octas_loss: 0,
            octas_growth_q64: 0
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
            next_melee_max_match_amount: get_DEFAULT_MAX_MATCH_AMOUNT(),
            n_entrants: 0,
            n_swaps: 0,
            swaps_volume: 0,
            octas_matched: 0,
            top_exits: base_top_exits()
        }
    }

    public fun base_start_time(): u64 {
        get_DEFAULT_DURATION()
    }

    public fun base_top_exits(): MockTopExits {
        MockTopExits {
            by_octas_gain: base_exit(),
            by_octas_growth_q64: base_exit()
        }
    }

    public fun base_vault_address(): address {
        create_resource_address(&@emojicoin_arena, get_REGISTRY_SEED())
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

    public fun init_modue_with_funded_vault() {
        init_emojicoin_dot_fun_with_test_markets();

        // Set global time to base publish time.
        timestamp::update_global_time_for_test(base_publish_time());

        // Initialize module.
        init_module_test_only(&get_signer(@emojicoin_arena));

        // Fund admin, then fund vault.
        mint_aptos_coin_to(@emojicoin_arena, get_DEFAULT_AVAILABLE_REWARDS());
        fund_vault(&get_signer(@emojicoin_arena), get_DEFAULT_AVAILABLE_REWARDS());
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
        registry_view.assert_registry_view(registry_view());
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
        registry_view.assert_registry_view(registry_view());

        // Assert new melee event.
        let new_melee_events = emitted_events<NewMelee>();
        assert!(new_melee_events.length() == 1);
        base_new_melee().assert_new_melee(new_melee_events[0]);
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
        registry_view.assert_registry_view(registry_view());

        // Assert new melee event.
        let new_melee_events = emitted_events<NewMelee>();
        assert!(new_melee_events.length() == 1);
        let mock_new_melee = base_new_melee();
        mock_new_melee.market_metadatas = vector[
            MockMarketMetadata {
                market_id: 4,
                market_address: @yin_yang_market,
                emoji_bytes: YIN_YANG
            },
            MockMarketMetadata {
                market_id: 6,
                market_address: @zombie_market,
                emoji_bytes: ZOMBIE
            }
        ];
        mock_new_melee.assert_new_melee(new_melee_events[0]);
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_NOT_ARENA,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun set_next_melee_available_rewards_not_arena() {
        set_next_melee_available_rewards(&get_signer(@aptos_framework), 0);
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_NOT_ARENA,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun set_next_melee_duration_not_arena() {
        set_next_melee_duration(&get_signer(@aptos_framework), 0);
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_NOT_ARENA,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun set_next_melee_max_match_amount_not_arena() {
        set_next_melee_max_match_amount(&get_signer(@aptos_framework), 0);
    }

    #[test]
    #[
        expected_failure(
            abort_code = emojicoin_arena::emojicoin_arena::E_NOT_ARENA,
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
            abort_code = emojicoin_arena::emojicoin_arena::E_NOT_ARENA,
            location = emojicoin_arena::emojicoin_arena
        )
    ]
    public fun withdraw_from_vault_not_arena() {
        withdraw_from_vault(&get_signer(@aptos_framework), 0);
    }
}
