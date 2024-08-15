module rewards::emojicoin_dot_fun_rewards {

    use std::vector;

    //use std::signer;
    use aptos_framework::account::SignerCapability;
    //use aptos_framework::aptos_account;
    //use aptos_framework::aptos_coin::AptosCoin;
    //use aptos_framework::coin;
    //use aptos_framework::event;
    //use aptos_framework::randomness;
    use emojicoin_dot_fun::emojicoin_dot_fun::Swap;

    /// Resource account address seed for the vault.
    const VAULT: vector<u8> = b"Vault";

    /// Flat integrator fee.
    const INTEGRATOR_FEE_RATE_BPS: u8 = 100;

    /// Basis points per nominal unit.
    const BPS_PER_UNIT: u64 = 10_000;

    /// Nominal volume denominated in octas, representing the expected total volume corresponding to
    /// the disbursement of all rewards.
    const NOMINAL_VOLUME: u64 = 500_000_000_000_000;
    /// Nominal total reward pool amount, representing amount of rewards expected to be disbursed
    /// once nominal volume has been traded.
    const NOMINAL_REWARDS: u64 = 500_000_000_000;

    const SHIFT_Q64: u8 = 64;

    const NOMINAL_WINNERS_PER_TIER: vector<u64> = vector[
        5_000,
        500,
        50,
        5
    ];
    const REWARD_AMOUNTS_PER_TIER: vector<u64> = vector[
        100_000_000,
        1_000_000_000,
        10_000_000_000,
        100_000_000_000,
    ];

    struct RewardTier has store {
        octas_per_reward: u64,
        rewards_remaining: u64,
        win_probability_per_octa_of_swap_fees_paid_q64: u128,
    }

    struct Vault has key {
        signer_capability: SignerCapability,
        reward_tiers: vector<RewardTier>,
    }

    #[event]
    struct EmojicoinDotFunRewardsLotteryWinner has copy, drop, store {
        swap: Swap,
        reward_amount: u64,
    }

    fun calculate_probabilities(): vector<RewardTier> {
        // Check tier count.
        let n_tiers = vector::length(&NOMINAL_WINNERS_PER_TIER);
        assert!(vector::length(&REWARD_AMOUNTS_PER_TIER) == n_tiers, 0);

        // Check number of winners, total rewards.
        let n_winners = 0;
        let total_rewards = 0;
        for (i in 0..n_tiers)  {
            n_winners = n_winners + *vector::borrow(&NOMINAL_WINNERS_PER_TIER, i);
            total_rewards = total_rewards + *vector::borrow(&REWARD_AMOUNTS_PER_TIER, i);
        };
        assert!(total_rewards == NOMINAL_REWARDS, 0);

        // Check expected value of rewards against nominal fees paid.
        let nominal_fees = (
            (
                (NOMINAL_VOLUME as u128) * (INTEGRATOR_FEE_RATE_BPS as u128) /
                (BPS_PER_UNIT as u128)
            ) as u64
        );
        assert!(total_rewards < nominal_fees, 0);

        // Construct tiers.
        let reward_tiers = vector[];
        for (i in 0..n_tiers) {
            vector::push_back(&mut reward_tiers, RewardTier {
                octas_per_reward: *vector::borrow(&REWARD_AMOUNTS_PER_TIER, i),
                rewards_remaining: 0,
                win_probability_per_octa_of_swap_fees_paid_q64:
                    (
                        ((*vector::borrow(&NOMINAL_WINNERS_PER_TIER, i) as u128) << SHIFT_Q64) /
                        (nominal_fees as u128)
                    )
            });
        };
        reward_tiers
    }

/*
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
            &borrow_global<RewardsVaultSignerCapability>(@rewards).signer_capability;
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
        move_to(rewards, RewardsVaultSignerCapability{
            signer_capability,
            prize_tiers: vector[
                PrizeTier {
                    octas_per_prize
                }
            ]
        });
        coin::register<AptosCoin>(&vault_signer);
    }

    #[test] fun expected_value() {
        let bps_per_unit = (emojicoin_dot_fun::get_BASIS_POINTS_PER_UNIT() as u64);
        assert!(
            WIN_PERCENTAGE_NUMERATOR * REWARD_AMOUNT_IN_OCTAS / WIN_PERCENTAGE_DENOMINATOR <
                VOLUME_THRESHOLD_IN_OCTAS * (INTEGRATOR_FEE_RATE_BPS as u64) / bps_per_unit,
            0
        );
    }

*/
}
