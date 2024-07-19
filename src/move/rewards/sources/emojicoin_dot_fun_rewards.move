module emojicoin_dot_fun::emojicoin_dot_fun_rewards {

    use std::signer;
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::event;
    use aptos_framework::randomness;
    use emojicoin_dot_fun::emojicoin_dot_fun::{Self, Swap};

    /// Resource account address seed for the vault.
    const VAULT: vector<u8> = b"Vault";

    /// Flat integrator fee.
    const INTEGRATOR_FEE_RATE_BPS: u8 = 100;

    // APT amounts.
    const OCTAS_PER_APT: u64 = 100_000_000;
    const REWARD_AMOUNT_IN_APT: u64 = 1;
    const REWARD_AMOUNT_IN_OCTAS: u64 = 100_000_000;
    const VOLUME_THRESHOLD_IN_APT: u64 = 10;
    const VOLUME_THRESHOLD_IN_OCTAS: u64 = 1_000_000_000;

    // Randomness amounts.
    const WIN_PERCENTAGE_NUMERATOR: u64 = 999;
    const WIN_PERCENTAGE_DENOMINATOR: u64 = 10_000;

    struct RewardsVaultSignerCapability has key {
        signer_capability: SignerCapability,
    }

    #[event]
    struct EmojicoinDotFunRewardsLotteryWinner has copy, drop, store {
        swap: Swap,
        reward_amount: u64,
    }

    #[randomness]
    entry fun swap_with_rewards<Emojicoin, EmojicoinLP>(
        swapper: &signer,
        market_address: address,
        input_amount: u64,
        is_sell: bool,
    ) acquires RewardsVaultSignerCapability {

        // Simulate swap to get quote volume, then execute swap.
        let swapper_address = signer::address_of(swapper);
        let swap = emojicoin_dot_fun::simulate_swap(
            swapper_address,
            market_address,
            input_amount,
            is_sell,
            @integrator,
            INTEGRATOR_FEE_RATE_BPS,
        );
        let ( _, _, _, _, _, _, _, _, _, _, quote_volume, _, _, _, _, _) =
            emojicoin_dot_fun::unpack_swap(swap);
        emojicoin_dot_fun::swap<Emojicoin, EmojicoinLP>(
            swapper,
            market_address,
            input_amount,
            is_sell,
            @integrator,
            INTEGRATOR_FEE_RATE_BPS,
        );

        // Return if quote volume is below threshold, otherwise proceed to lottery.
        if (quote_volume < VOLUME_THRESHOLD_IN_OCTAS) return;

        // Get vault balance, returning without lottery if vault is empty.
        let vault_signer_cap_ref =
            &borrow_global<RewardsVaultSignerCapability>(@emojicoin_dot_fun).signer_capability;
        let vault_address = account::get_signer_capability_address(vault_signer_cap_ref);
        let vault_balance = coin::balance<AptosCoin>(vault_address);
        if (vault_balance == 0) return;

        // Evaluate lottery.
        let result = randomness::u64_range(0, WIN_PERCENTAGE_DENOMINATOR);
        if (result < WIN_PERCENTAGE_NUMERATOR) {
            let reward_amount = if (vault_balance < REWARD_AMOUNT_IN_OCTAS) vault_balance
                else REWARD_AMOUNT_IN_OCTAS;
            let vault_signer = account::create_signer_with_capability(vault_signer_cap_ref);
            aptos_account::transfer(&vault_signer, swapper_address, reward_amount);
            event::emit(EmojicoinDotFunRewardsLotteryWinner{ swap, reward_amount });
        };

    }

    fun init_module(rewards: &signer) {
        let (vault_signer, signer_capability) = account::create_resource_account(rewards, VAULT);
        move_to(rewards, RewardsVaultSignerCapability{ signer_capability });
        coin::register<AptosCoin>(&vault_signer);
    }

    #[test] fun test_apt_conversions() {
        assert!(VOLUME_THRESHOLD_IN_APT * OCTAS_PER_APT == VOLUME_THRESHOLD_IN_OCTAS, 0);
        assert!(REWARD_AMOUNT_IN_APT * OCTAS_PER_APT == REWARD_AMOUNT_IN_OCTAS, 0);
    }

    #[test] fun expected_value() {
        let bps_per_unit = (emojicoin_dot_fun::get_BASIS_POINTS_PER_UNIT() as u64);
        assert!(
            WIN_PERCENTAGE_NUMERATOR * REWARD_AMOUNT_IN_OCTAS / WIN_PERCENTAGE_DENOMINATOR <
                VOLUME_THRESHOLD_IN_OCTAS * (INTEGRATOR_FEE_RATE_BPS as u64) / bps_per_unit,
            0
        );
    }

}
