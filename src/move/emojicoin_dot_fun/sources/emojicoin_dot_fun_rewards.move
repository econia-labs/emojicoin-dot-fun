module emojicoin_dot_fun::emojicoin_dot_fun_rewards {
    use std::signer;
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    friend emojicoin_dot_fun::emojicoin_dot_fun;

    /// Resource account address seed for the vault.
    const VAULT_NAME: vector<u8> = b"Vault";

    struct RewardsVaultSignerCapability has key {
        signer_capability: SignerCapability,
    }

    struct EmojicoinDotFunRewards has key {
        apt_fees_paid: u64,
        apt_rewards_claimed: u64
    }

    public entry fun claim(user: &signer) acquires
        EmojicoinDotFunRewards,
        RewardsVaultSignerCapability
    {

        let (user_address, rewards_ref_mut) = borrow_rewards_ref_mut(user);

        // Check that user is eligible for claim.
        let paid = rewards_ref_mut.apt_fees_paid;
        let claimed = rewards_ref_mut.apt_rewards_claimed;
        if (paid == 0 || claimed >= paid) return;
        let eligible = paid - claimed;

        // Get vault balance.
        let vault_signer_cap_ref =
            &borrow_global<RewardsVaultSignerCapability>(@emojicoin_dot_fun).signer_capability;
        let vault_address = account::get_signer_capability_address(vault_signer_cap_ref);
        let vault_balance = coin::balance<AptosCoin>(vault_address);
        if (vault_balance == 0) return;

        // Determine claim amount and disburse it, updating tracking state.
        let claim_amount = if (eligible > vault_balance) vault_balance else eligible;
        let vault_signer = account::create_signer_with_capability(vault_signer_cap_ref);
        aptos_account::transfer(&vault_signer, user_address, claim_amount);
        rewards_ref_mut.apt_rewards_claimed = claimed + claim_amount;
    }

    public(friend) fun increment_apt_fees_paid(user: &signer, amount: u64) acquires
        EmojicoinDotFunRewards
    {
        let (_, rewards_ref_mut) = borrow_rewards_ref_mut(user);
        rewards_ref_mut.apt_fees_paid = rewards_ref_mut.apt_fees_paid + amount;
    }

    fun init_module(emojicoin_dot_fun: &signer) {
        let (vault_signer, signer_capability) =
            account::create_resource_account(emojicoin_dot_fun, VAULT_NAME);
        move_to(emojicoin_dot_fun, RewardsVaultSignerCapability{ signer_capability });
        coin::register<AptosCoin>(&vault_signer);
    }

    inline fun borrow_rewards_ref_mut(user: &signer): (address, &mut EmojicoinDotFunRewards) {
        let user_address = signer::address_of(user);
        if (!exists<EmojicoinDotFunRewards>(user_address)) {
            move_to(user, EmojicoinDotFunRewards{ apt_fees_paid: 0, apt_rewards_claimed: 0 });
        };
        let rewards_ref_mut = borrow_global_mut<EmojicoinDotFunRewards>(user_address);
        (user_address, rewards_ref_mut)
    }

}