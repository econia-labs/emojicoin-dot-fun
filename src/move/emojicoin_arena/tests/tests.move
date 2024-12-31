#[test_only]
// This module uses the same testing schema as the emojicoin dot fun package tests.
module arena::tests {
    use aptos_framework::account::{create_signer_for_test as get_signer};
    use emojicoin_dot_fun::tests as emojicoin_dot_fun_tests;
    use arena::emojicoin_arena::{
        Exit,
        ProfitAndLoss,
        RegistryView,
        TopExits,
        init_module_test_only,
        unpack_exit,
        unpack_profit_and_loss,
        unpack_registry_view,
        unpack_top_exits
    };
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

    // Test market emoji bytes.
    const BLACK_CAT: vector<u8> = x"f09f9088e2808de2ac9b";
    const BLACK_HEART: vector<u8> = x"f09f96a4";
    const YELLOW_HEART: vector<u8> = x"f09f929b";

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
        init_module_test_only(&get_signer(@arena));
    }
}
