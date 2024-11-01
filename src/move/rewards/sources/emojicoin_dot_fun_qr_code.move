// cspell:word funder
module rewards::emojicoin_dot_fun_qr_code {

    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::event;
    use aptos_std::ed25519::{Self, ValidatedPublicKey};
    use aptos_std::simple_map::SimpleMap;
    use aptos_std::smart_table::{Self, SmartTable};
    use emojicoin_dot_fun::emojicoin_dot_fun::{Self, Swap};
    use std::option::{Self, Option};
    use std::bcs;
    use std::signer;

    const INTEGRATOR_FEE_RATE_BPS: u8 = 100;
    const NIL: address = @0x0;
    const DEFAULT_CLAIM_AMOUNT: u64 = 10_000_000;
    const VAULT: vector<u8> = b"QR code vault";

    /// Signer does not correspond to admin.
    const E_NOT_ADMIN: u64 = 0;
    /// Admin to remove address does not correspond to admin.
    const E_ADMIN_TO_REMOVE_IS_NOT_ADMIN: u64 = 1;
    /// Public key of QR code private key is not in manifest.
    const E_INVALID_QR_CODE: u64 = 2;
    /// QR code has already been redeemed.
    const E_QR_CODE_ALREADY_REDEEMED: u64 = 3;
    /// Vault has insufficient funds.
    const E_VAULT_INSUFFICIENT_FUNDS: u64 = 4;
    /// Public key does not pass Ed25519 validation.
    const E_INVALID_PUBLIC_KEY: u64 = 5;
    /// Signature does not pass Ed25519 validation.
    const E_INVALID_SIGNATURE: u64 = 6;

    struct Vault has key {
        /// Addresses of signers who can mutate the manifest.
        admins: vector<address>,
        claim_amount: u64,
        /// Map from public key of QR code private key to address of claimant, `NIL` if unclaimed.
        manifest: SmartTable<ValidatedPublicKey, address>,
        signer_capability: SignerCapability
    }

    #[event]
    struct EmojicoinDotFunQRCodeRedemption has copy, drop, store {
        claimant: address,
        claim_amount: u64,
        swap: Swap
    }

    /*
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

    */

    public entry fun add_public_keys(
        admin: &signer, public_keys_as_bytes: vector<vector<u8>>
    ) acquires Vault {
        let manifest_ref_mut = &mut borrow_vault_mut_checked(admin).manifest;
        public_keys_as_bytes.for_each(|public_key_bytes| {
            manifest_ref_mut.add(validate_public_key_bytes(public_key_bytes), NIL);
        });
    }

    public entry fun fund_vault(funder: &signer, n_claims: u64) acquires Vault {
        let amount = n_claims * Vault[@rewards].claim_amount;
        aptos_account::transfer(
            funder,
            account::get_signer_capability_address(&Vault[@rewards].signer_capability),
            amount
        );
    }

    public entry fun add_admin(admin: &signer, new_admin: address) acquires Vault {
        let admins_ref_mut = &mut borrow_vault_mut_checked(admin).admins;
        admins_ref_mut.push_back(new_admin);
    }

    public entry fun redeem<Emojicoin, EmojicoinLP>(
        claimant: &signer,
        signature_bytes: vector<u8>,
        public_key_bytes: vector<u8>,
        market_address: address,
        min_output_amount: u64
    ) acquires Vault {

        // Verify signature.
        let validated_public_key = validate_public_key_bytes(public_key_bytes);
        let claimant_address = signer::address_of(claimant);
        assert!(
            ed25519::signature_verify_strict(
                &ed25519::new_signature_from_bytes(signature_bytes),
                &ed25519::public_key_to_unvalidated(&validated_public_key),
                bcs::to_bytes(&claimant_address)
            ),
            E_INVALID_SIGNATURE
        );

        // Verify public key is eligible for claim.
        let vault_ref_mut = &mut Vault[@rewards];
        let manifest_ref_mut = &mut vault_ref_mut.manifest;
        assert!(manifest_ref_mut.contains(validated_public_key), E_INVALID_QR_CODE);
        assert!(
            *manifest_ref_mut.borrow(validated_public_key) == NIL,
            E_QR_CODE_ALREADY_REDEEMED
        );

        // Check vault balance.
        let vault_signer_cap_ref = &vault_ref_mut.signer_capability;
        let vault_address = account::get_signer_capability_address(vault_signer_cap_ref);
        let claim_amount = vault_ref_mut.claim_amount;
        assert!(
            coin::balance<AptosCoin>(vault_address) >= claim_amount,
            E_VAULT_INSUFFICIENT_FUNDS
        );

        // Update manifest, transfer APT to claimant.
        *manifest_ref_mut.borrow_mut(validated_public_key) = claimant_address;
        let vault_signer = account::create_signer_with_capability(vault_signer_cap_ref);
        aptos_account::transfer(&vault_signer, claimant_address, claim_amount);

        // Invoke swap, emit event.
        let swap_event =
            emojicoin_dot_fun::simulate_swap<Emojicoin, EmojicoinLP>(
                claimant_address,
                market_address,
                claim_amount,
                false,
                @integrator,
                INTEGRATOR_FEE_RATE_BPS
            );
        emojicoin_dot_fun::swap<Emojicoin, EmojicoinLP>(
            claimant,
            market_address,
            claim_amount,
            false,
            @integrator,
            INTEGRATOR_FEE_RATE_BPS,
            min_output_amount
        );
        event::emit(
            EmojicoinDotFunQRCodeRedemption {
                claimant: claimant_address,
                claim_amount,
                swap: swap_event
            }
        );

    }

    public entry fun remove_admin(admin: &signer, admin_to_remove: address) acquires Vault {
        let admins_ref_mut = &mut borrow_vault_mut_checked(admin).admins;
        let (admin_to_remove_is_admin, admin_to_remove_index) =
            admins_ref_mut.index_of(&admin_to_remove);
        assert!(admin_to_remove_is_admin, E_ADMIN_TO_REMOVE_IS_NOT_ADMIN);
        admins_ref_mut.remove(admin_to_remove_index);
    }

    public entry fun remove_public_keys(
        admin: &signer, public_keys_as_bytes: vector<vector<u8>>
    ) acquires Vault {
        let manifest_ref_mut = &mut borrow_vault_mut_checked(admin).manifest;
        public_keys_as_bytes.for_each(|public_key_bytes| {
            let validated_public_key = validate_public_key_bytes(public_key_bytes);
            if (manifest_ref_mut.contains(validated_public_key)
                && *manifest_ref_mut.borrow(validated_public_key) == NIL) {
                manifest_ref_mut.remove(validated_public_key);
            }
        });
    }

    fun init_module(rewards: &signer) {
        let (vault_signer, signer_capability) =
            account::create_resource_account(rewards, VAULT);
        move_to(
            rewards,
            Vault {
                admins: vector[signer::address_of(rewards)],
                claim_amount: DEFAULT_CLAIM_AMOUNT,
                manifest: smart_table::new(),
                signer_capability
            }
        );
        coin::register<AptosCoin>(&vault_signer);
    }

    inline fun borrow_vault_mut_checked(admin: &signer): &mut Vault {
        let vault_ref_mut = &mut Vault[@rewards];
        assert!(vault_ref_mut.admins.contains(&signer::address_of(admin)), E_NOT_ADMIN);
        vault_ref_mut
    }

    inline fun validate_public_key_bytes(public_key_bytes: vector<u8>): ValidatedPublicKey {
        let validated_public_key_option =
            ed25519::new_validated_public_key_from_bytes(public_key_bytes);
        assert!(option::is_some(&validated_public_key_option), E_INVALID_PUBLIC_KEY);
        option::destroy_some(validated_public_key_option)
    }
}
