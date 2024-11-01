// cspell:word funder
module rewards::emojicoin_dot_fun_access_code {

    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::event;
    use aptos_std::simple_map::SimpleMap;
    use aptos_std::smart_table::{Self, SmartTable};
    use emojicoin_dot_fun::emojicoin_dot_fun::{Self, Swap};
    use std::option::Option;
    use std::signer;
    use std::hash;

    const APT_PER_REDEMPTION: u64 = 5;
    const INTEGRATOR_FEE_RATE_BPS: u8 = 100;
    const NIL: address = @0x0;
    const OCTAS_PER_APT: u64 = 100_000_000;
    const VAULT: vector<u8> = b"Access code vault";

    /// Signer does not correspond to admin.
    const E_NOT_ADMIN: u64 = 0;
    /// Admin to remove address does not correspond to admin.
    const E_ADMIN_TO_REMOVE_IS_NOT_ADMIN: u64 = 1;
    /// Access code is not in manifest.
    const E_INVALID_ACCESS_CODE: u64 = 2;
    /// Access code has already been redeemed.
    const E_ACCESS_CODE_ALREADY_REDEEMED: u64 = 3;
    /// Vault has insufficient funds.
    const E_VAULT_INSUFFICIENT_FUNDS: u64 = 4;

    struct Vault has key {
        signer_capability: SignerCapability,
        /// Map from SHA3-256 hash of access code to address of claimant, `NIL` if unclaimed.
        manifest: SmartTable<vector<u8>, address>,
        /// Addresses of signers who can mutate the manifest.
        admins: vector<address>
    }

    #[event]
    struct EmojicoinDotFunAccessCodeRedemption has copy, drop, store {
        claimant: address,
        octas_claim_amount: u64,
        swap: Swap
    }

    #[view]
    public fun access_code_hash_claimant_entry(
        access_code_hash: vector<u8>
    ): address acquires Vault {
        *Vault[@rewards].manifest.borrow(access_code_hash)
    }

    #[view]
    public fun access_code_hashes(): vector<vector<u8>> acquires Vault {
        Vault[@rewards].manifest.keys()
    }

    #[view]
    public fun access_code_hashes_paginated(
        starting_bucket_index: u64, starting_vector_index: u64, num_keys_to_get: u64
    ): (vector<vector<u8>>, Option<u64>, Option<u64>) acquires Vault {
        Vault[@rewards].manifest.keys_paginated(
            starting_bucket_index, starting_vector_index, num_keys_to_get
        )
    }

    #[view]
    public fun is_access_code_hash_in_manifest(
        access_code_hash: vector<u8>
    ): bool acquires Vault {
        Vault[@rewards].manifest.contains(access_code_hash)
    }

    #[view]
    public fun manifest_to_simple_map(): SimpleMap<vector<u8>, address> acquires Vault {
        Vault[@rewards].manifest.to_simple_map()
    }

    #[view]
    public fun vault_balance(): u64 acquires Vault {
        coin::balance<AptosCoin>(
            account::get_signer_capability_address(&Vault[@rewards].signer_capability)
        )
    }

    public entry fun add_access_code_hashes(
        admin: &signer, access_code_hashes: vector<vector<u8>>
    ) acquires Vault {
        let manifest_ref_mut = &mut borrow_vault_mut_checked(admin).manifest;
        access_code_hashes.for_each(|access_code_hash| {
            manifest_ref_mut.add(access_code_hash, NIL);
        });
    }

    public entry fun add_admin(admin: &signer, new_admin: address) acquires Vault {
        let admins_ref_mut = &mut borrow_vault_mut_checked(admin).admins;
        admins_ref_mut.push_back(new_admin);
    }

    public entry fun fund_vault(funder: &signer, amount: u64) acquires Vault {
        aptos_account::transfer(
            funder,
            account::get_signer_capability_address(&Vault[@rewards].signer_capability),
            amount
        );
    }

    public entry fun redeem<Emojicoin, EmojicoinLP>(
        claimant: &signer,
        access_code: vector<u8>,
        market_address: address,
        min_output_amount: u64
    ) acquires Vault {

        // Verify access code.
        let access_code_hash = hash::sha3_256(access_code);
        let vault_ref_mut = &mut Vault[@rewards];
        let manifest_ref_mut = &mut vault_ref_mut.manifest;
        assert!(manifest_ref_mut.contains(access_code_hash), E_INVALID_ACCESS_CODE);
        assert!(
            *manifest_ref_mut.borrow(access_code_hash) == NIL,
            E_ACCESS_CODE_ALREADY_REDEEMED
        );

        // Check vault balance.
        let vault_signer_cap_ref = &vault_ref_mut.signer_capability;
        let vault_address = account::get_signer_capability_address(vault_signer_cap_ref);
        let octas_claim_amount = APT_PER_REDEMPTION * OCTAS_PER_APT;
        assert!(
            coin::balance<AptosCoin>(vault_address) >= octas_claim_amount,
            E_VAULT_INSUFFICIENT_FUNDS
        );

        // Update manifest, transfer APT to claimant.
        let claimant_address = signer::address_of(claimant);
        *manifest_ref_mut.borrow_mut(access_code_hash) = claimant_address;
        let vault_signer = account::create_signer_with_capability(vault_signer_cap_ref);
        aptos_account::transfer(&vault_signer, claimant_address, octas_claim_amount);

        // Invoke swap, emit event.
        let swap_event =
            emojicoin_dot_fun::simulate_swap<Emojicoin, EmojicoinLP>(
                claimant_address,
                market_address,
                octas_claim_amount,
                false,
                @integrator,
                INTEGRATOR_FEE_RATE_BPS
            );
        emojicoin_dot_fun::swap<Emojicoin, EmojicoinLP>(
            claimant,
            market_address,
            octas_claim_amount,
            false,
            @integrator,
            INTEGRATOR_FEE_RATE_BPS,
            min_output_amount
        );
        event::emit(
            EmojicoinDotFunAccessCodeRedemption {
                claimant: claimant_address,
                octas_claim_amount,
                swap: swap_event
            }
        );

    }

    public entry fun remove_access_code_hashes(
        admin: &signer, access_code_hashes: vector<vector<u8>>
    ) acquires Vault {
        let manifest_ref_mut = &mut borrow_vault_mut_checked(admin).manifest;
        access_code_hashes.for_each(|access_code_hash| {
            if (manifest_ref_mut.contains(access_code_hash)
                && *manifest_ref_mut.borrow(access_code_hash) == NIL) {
                manifest_ref_mut.remove(access_code_hash);
            }
        });
    }

    public entry fun remove_admin(admin: &signer, admin_to_remove: address) acquires Vault {
        let admins_ref_mut = &mut borrow_vault_mut_checked(admin).admins;
        let (admin_to_remove_is_admin, admin_to_remove_index) =
            admins_ref_mut.index_of(&admin_to_remove);
        assert!(admin_to_remove_is_admin, E_ADMIN_TO_REMOVE_IS_NOT_ADMIN);
        admins_ref_mut.remove(admin_to_remove_index);
    }

    fun init_module(rewards: &signer) {
        let (vault_signer, signer_capability) =
            account::create_resource_account(rewards, VAULT);
        move_to(
            rewards,
            Vault {
                signer_capability,
                manifest: smart_table::new(),
                admins: vector[signer::address_of(rewards)]
            }
        );
        coin::register<AptosCoin>(&vault_signer);
    }

    inline fun borrow_vault_mut_checked(admin: &signer): &mut Vault {
        let vault_ref_mut = &mut Vault[@rewards];
        assert!(vault_ref_mut.admins.contains(&signer::address_of(admin)), E_NOT_ADMIN);
        vault_ref_mut
    }
}
