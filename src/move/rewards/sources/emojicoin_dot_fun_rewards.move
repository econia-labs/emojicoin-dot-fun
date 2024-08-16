module rewards::emojicoin_dot_fun_rewards {

    use std::vector;

    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::event;
    use aptos_framework::randomness;
    use emojicoin_dot_fun::emojicoin_dot_fun::{Self, Swap};
    use std::signer;

    /// Resource account address seed for the vault.
    const VAULT: vector<u8> = b"Vault";

    /// Flat integrator fee.
    const INTEGRATOR_FEE_RATE_BPS: u8 = 100;

    // Assorted conversion factors.
    const BASIS_POINTS_PER_UNIT: u64 = 10_000;
    const SHIFT_Q64: u8 = 64;
    const OCTAS_PER_APT: u64 = 100_000_000;

    /// Nominal volume denominated in APT, representing the expected total volume corresponding to
    /// the disbursement of `APT_NOMINAL_REWARDS` in rewards.
    const APT_NOMINAL_VOLUME: u64 = 750_000;

    /// Nominal total reward pool amount in APT, representing amount of rewards expected to be
    /// disbursed per `APT_NOMINAL_VOLUME`.
    const APT_NOMINAL_REWARDS: u64 = 5_000;

    /// Mismatch in length of tiers vectors.
    const E_N_TIERS_MISMATCH: u64 = 0;
    /// Nominal reward amount does not match amount derived from tiers.
    const E_REWARD_AMOUNT_MISMATCH: u64 = 1;
    /// Expected value of rewards exceeds nominal fees paid.
    const E_EXPECTED_VALUE: u64 = 2;

    /// Expected number of rewards disbursed per tier per `APT_NOMINAL_VOLUME`.
    const NOMINAL_N_REWARDS_PER_TIER: vector<u64> = vector[
        1_500,
        500,
        200,
        50,
        5,
        1,
    ];

    /// Reward value in APT per reward per tier.
    const APT_REWARD_AMOUNTS_PER_TIER: vector<u64> = vector[
        1,
        2,
        5,
        10,
        100,
        500,
    ];

    struct RewardTier has drop, store {
        apt_amount_per_reward: u64,
        n_rewards_disbursed: u64,
        n_rewards_remaining: u64,
        reward_probability_per_octa_of_swap_fees_paid_q64: u128,
    }

    struct Vault has key {
        signer_capability: SignerCapability,
        reward_tiers: vector<RewardTier>,
    }

    #[event]
    struct EmojicoindotFunRewards has copy, drop, store {
        swap: Swap,
        octas_reward_amount: u64,
    }

    /// To fund 10 rewards in the first tier and 5 rewards in the second tier, pass
    /// `n_rewards_to_fund_per_tier` as `vector[10, 5, ...]`.
    public entry fun fund_tiers(funder: &signer, n_rewards_to_fund_per_tier: vector<u64>)
        acquires Vault
    {
        // Check tiers.
        let n_tiers = vector::length(&NOMINAL_N_REWARDS_PER_TIER);
        let tiers_ref_mut = &mut borrow_global_mut<Vault>(@rewards).reward_tiers;
        assert!(vector::length(&n_rewards_to_fund_per_tier) == n_tiers, E_N_TIERS_MISMATCH);

        // Calculate total amount to fund, updating remaining rewards for each tier.
        let octas_to_fund = 0;
        for (i in 0..n_tiers)  {
            let tier_ref_mut = vector::borrow_mut(tiers_ref_mut, i);
            let n_rewards_to_fund_this_tier = *vector::borrow(&n_rewards_to_fund_per_tier, i);
            octas_to_fund = octas_to_fund +
                n_rewards_to_fund_this_tier * tier_ref_mut.apt_amount_per_reward * OCTAS_PER_APT;
            tier_ref_mut.n_rewards_remaining =
                tier_ref_mut.n_rewards_remaining + n_rewards_to_fund_this_tier;
        };

        // Transfer rewards to vault.
        aptos_account::transfer(funder, @rewards, octas_to_fund);
    }

    fun init_module(rewards: &signer) {
        let (vault_signer, signer_capability) = account::create_resource_account(rewards, VAULT);
        move_to(rewards, Vault {
            signer_capability,
            reward_tiers: reward_tiers(),
        });
        coin::register<AptosCoin>(&vault_signer);
    }

    fun reward_tiers(): vector<RewardTier> {
        // Check tier count.
        let n_tiers = vector::length(&NOMINAL_N_REWARDS_PER_TIER);
        assert!(vector::length(&APT_REWARD_AMOUNTS_PER_TIER) == n_tiers, E_N_TIERS_MISMATCH);

        // Check total number of rewards, and total rewards amount in APT.
        let n_rewards_total = 0;
        let apt_total_reward_amount = 0;
        for (i in 0..n_tiers)  {
            let n_rewards_this_tier = *vector::borrow(&NOMINAL_N_REWARDS_PER_TIER, i);
            n_rewards_total = n_rewards_total + n_rewards_this_tier;
            apt_total_reward_amount = apt_total_reward_amount +
                *vector::borrow(&APT_REWARD_AMOUNTS_PER_TIER, i) * n_rewards_this_tier;
        };
        assert!(apt_total_reward_amount == APT_NOMINAL_REWARDS, E_REWARD_AMOUNT_MISMATCH);

        // Check expected value of rewards against nominal fees paid.
        let octas_nominal_volume = APT_NOMINAL_VOLUME * OCTAS_PER_APT;
        let octas_nominal_fees = (
            (
                (octas_nominal_volume as u128) * (INTEGRATOR_FEE_RATE_BPS as u128) /
                (BASIS_POINTS_PER_UNIT as u128)
            ) as u64
        );
        let octas_total_reward_amount = apt_total_reward_amount * OCTAS_PER_APT;
        assert!(octas_total_reward_amount <= octas_nominal_fees, E_EXPECTED_VALUE);

        // Construct tiers.
        let reward_tiers = vector[];
        for (i in 0..n_tiers) {
            vector::push_back(&mut reward_tiers, RewardTier {
                apt_amount_per_reward: *vector::borrow(&APT_REWARD_AMOUNTS_PER_TIER, i),
                n_rewards_disbursed: 0,
                n_rewards_remaining: 0,
                reward_probability_per_octa_of_swap_fees_paid_q64:
                    (
                        ((*vector::borrow(&NOMINAL_N_REWARDS_PER_TIER, i) as u128) << SHIFT_Q64) /
                        (octas_nominal_fees as u128)
                    )
            });
        };
        reward_tiers
    }

    #[randomness]
    entry fun swap_with_rewards<Emojicoin, EmojicoinLP>(
        swapper: &signer,
        market_address: address,
        input_amount: u64,
        is_sell: bool,
        min_output_amount: u64,
    ) acquires Vault {

        // Simulate swap to get integrator fee, then execute swap.
        let swapper_address = signer::address_of(swapper);
        let swap = emojicoin_dot_fun::simulate_swap<Emojicoin, EmojicoinLP>(
            swapper_address,
            market_address,
            input_amount,
            is_sell,
            @integrator,
            INTEGRATOR_FEE_RATE_BPS,
        );
        let (
             _, _, _, _, _, _, _, _, _, _, _, _, integrator_fee_in_octas, _, _, _, _, _,
        ) = emojicoin_dot_fun::unpack_swap(swap);
        emojicoin_dot_fun::swap<Emojicoin, EmojicoinLP>(
            swapper,
            market_address,
            input_amount,
            is_sell,
            @integrator,
            INTEGRATOR_FEE_RATE_BPS,
            min_output_amount,
        );

        // Get vault balance, returning early if empty.
        let vault_ref_mut = borrow_global_mut<Vault>(@rewards);
        let vault_signer_cap_ref = &vault_ref_mut.signer_capability;
        let vault_address = account::get_signer_capability_address(vault_signer_cap_ref);
        let vault_balance = coin::balance<AptosCoin>(vault_address);
        if (vault_balance == 0) return;

        // Get a random number between 0 and 1, represented as a Q64.
        let random_q64 = randomness::u128_range(0, 1 << SHIFT_Q64);

        // Loop over all reward tiers in reverse order to provide reconciliation rewards for the
        // next-highest tier in the case that the highest eligible tier has no rewards remaining.
        // Only disburse rewards after looping over all tiers, to prevent undergassing attacks.
        let tiers_ref_mut = &mut vault_ref_mut.reward_tiers;
        let n_tiers = vector::length(tiers_ref_mut);
        let octas_reward_amount = 0;
        let eligible_for_reconciliation = false;
        for (i in 0..n_tiers) {
            let tier_index = n_tiers - i - 1;
            let tier_ref_mut = vector::borrow_mut(tiers_ref_mut, tier_index);

            // Get reward probability threshold for current tier based on integrator fees paid.
            let probability_per_octa_q64 =
                tier_ref_mut.reward_probability_per_octa_of_swap_fees_paid_q64;
            let reward_threshold_q64 = ( // Q64 multiplication requires shifting at the end.
                (
                    ((probability_per_octa_q64 as u256) * (integrator_fee_in_octas as u256))
                        >> SHIFT_Q64
                ) as u128
            );

            // User is eligible for rewards if they are eligible for reconciliation, or if they have
            // not yet been rewarded and their random number is below the reward threshold.
            let eligible_for_reward = eligible_for_reconciliation ||
                (octas_reward_amount == 0 && random_q64 < reward_threshold_q64);

            // But costs less gas to win big, because then not invoking this after winning at top
            // tier.
            if (eligible_for_reward) {
                if (tier_ref_mut.n_rewards_remaining == 0) {
                    eligible_for_reconciliation = true;
                } else {
                    tier_ref_mut.n_rewards_remaining = tier_ref_mut.n_rewards_remaining - 1;
                    tier_ref_mut.n_rewards_disbursed = tier_ref_mut.n_rewards_disbursed + 1;
                    octas_reward_amount = tier_ref_mut.apt_amount_per_reward * OCTAS_PER_APT;
                    eligible_for_reconciliation = false;
                }
            }
        };

        if (octas_reward_amount > 0) {
            let vault_signer = account::create_signer_with_capability(vault_signer_cap_ref);
            aptos_account::transfer(&vault_signer, swapper_address, octas_reward_amount);
            event::emit(EmojicoindotFunRewards{ swap, octas_reward_amount });
        }

    }

    #[test] fun test_reward_tiers() { reward_tiers(); }
}
