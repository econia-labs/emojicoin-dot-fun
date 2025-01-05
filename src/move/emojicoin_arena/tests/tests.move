#[test_only]
// This test module uses the same design schema as the emojicoin dot fun core test module.
module emojicoin_arena::tests {
    use aptos_framework::account::{
        create_resource_address,
        create_signer_for_test as get_signer
    };
    use emojicoin_arena::emojicoin_arena::{
        ExchangeRate,
        Exit,
        RegistryView,
        get_DEFAULT_AVAILABLE_REWARDS,
        get_DEFAULT_DURATION,
        get_DEFAULT_MAX_MATCH_PERCENTAGE,
        get_DEFAULT_MAX_MATCH_AMOUNT,
        get_REGISTRY_SEED,
        init_module_test_only,
        registry_view,
        unpack_exchange_rate,
        unpack_exit,
        unpack_registry_view
    };
    use emojicoin_dot_fun::tests as emojicoin_dot_fun_tests;
    use std::vector;

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
        emojicoin_0_exchange_rate: MockExchangeRate,
        emojicoin_1_exchange_rate: MockExchangeRate
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

    // Test market emoji bytes.
    const BLACK_CAT: vector<u8> = x"f09f9088e2808de2ac9b";
    const BLACK_HEART: vector<u8> = x"f09f96a4";
    const YELLOW_HEART: vector<u8> = x"f09f929b";

    public fun assert_exchange_rate(
        self: MockExchangeRate, actual: ExchangeRate
    ) {
        let (base, quote) = unpack_exchange_rate(actual);
        assert!(self.base == base);
        assert!(self.quote == quote);
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
        self.emojicoin_0_exchange_rate.assert_exchange_rate(emojicoin_0_exchange_rate);
        self.emojicoin_1_exchange_rate.assert_exchange_rate(emojicoin_1_exchange_rate);
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

    public fun base_registry_view(): MockRegistryView {
        MockRegistryView {
            n_melees: 1,
            vault_address: base_vault_address(),
            vault_balance: 0,
            next_melee_duration: get_DEFAULT_DURATION(),
            next_melee_available_rewards: get_DEFAULT_AVAILABLE_REWARDS(),
            next_melee_max_match_percentage: get_DEFAULT_MAX_MATCH_PERCENTAGE(),
            next_melee_max_match_amount: get_DEFAULT_MAX_MATCH_AMOUNT()
        }
    }

    public fun base_vault_address(): address {
        create_resource_address(&@emojicoin_arena, get_REGISTRY_SEED())
    }

    /// Initialize emojicoin dot fun with test markets.
    public fun init_emojicoin_dot_fun_with_test_markets() {
        emojicoin_dot_fun_tests::init_package();
        vector::for_each_ref(
            &vector[BLACK_CAT, BLACK_HEART, YELLOW_HEART],
            |bytes_ref| {
                emojicoin_dot_fun_tests::init_market(vector[*bytes_ref]);
            }
        );
    }

    #[test]
    fun init_module_default() {
        init_emojicoin_dot_fun_with_test_markets();
        init_module_test_only(&get_signer(@emojicoin_arena));
        base_registry_view().assert_registry_view(registry_view());
    }
}
