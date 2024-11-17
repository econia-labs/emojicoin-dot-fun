// cspell:word funder
// cspell:word unvalidated
module rewards::emojicoin_dot_fun_claim_link {

    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::event;
    use aptos_std::ed25519::{Self, ValidatedPublicKey};
    use aptos_std::from_bcs;
    use aptos_std::simple_map::SimpleMap;
    use aptos_std::smart_table::{Self, SmartTable};
    use emojicoin_dot_fun::emojicoin_dot_fun::{Self, Swap};
    use std::option::{Self, Option};
    use std::bcs;
    use std::signer;

    const INTEGRATOR_FEE_RATE_BPS: u8 = 100;
    const DEFAULT_CLAIM_AMOUNT: u64 = 100_000_000;
    const VAULT: vector<u8> = b"Claim link vault";

    /// Signer does not correspond to admin.
    const E_NOT_ADMIN: u64 = 0;
    /// Admin to remove address does not correspond to admin.
    const E_ADMIN_TO_REMOVE_IS_NOT_ADMIN: u64 = 1;
    /// Public key of claim link private key is not eligible.
    const E_INVALID_CLAIM_LINK: u64 = 2;
    /// Claim link has already been claimed.
    const E_CLAIM_LINK_ALREADY_CLAIMED: u64 = 3;
    /// Vault has insufficient funds.
    const E_VAULT_INSUFFICIENT_FUNDS: u64 = 4;
    /// Public key does not pass Ed25519 validation.
    const E_INVALID_PUBLIC_KEY: u64 = 5;
    /// Signature does not pass Ed25519 validation.
    const E_INVALID_SIGNATURE: u64 = 6;
    /// Admin to remove is rewards publisher.
    const E_ADMIN_TO_REMOVE_IS_REWARDS_PUBLISHER: u64 = 7;
    /// Admin is already an admin.
    const E_ALREADY_ADMIN: u64 = 8;
    /// Claim link is already eligible.
    const E_CLAIM_LINK_ALREADY_ELIGIBLE: u64 = 9;

    struct Nil {}
    has copy, drop, store;

    struct Vault has key {
        /// Addresses of signers who can mutate the vault.
        admins: vector<address>,
        /// In octas.
        claim_amount: u64,
        /// Eligible claim link public keys.
        eligible: SmartTable<ValidatedPublicKey, Nil>,
        /// Map from claim link public key to address of claimant.
        claimed: SmartTable<ValidatedPublicKey, address>,
        /// Approves transfers from the vault.
        signer_capability: SignerCapability
    }

    #[event]
    struct EmojicoinDotFunClaimLinkRedemption has copy, drop, store {
        claimant: address,
        claim_amount: u64,
        swap: Swap
    }

    #[view]
    public fun admins(): vector<address> acquires Vault {
        Vault[@rewards].admins
    }

    #[view]
    public fun claim_amount(): u64 acquires Vault {
        Vault[@rewards].claim_amount
    }

    #[view]
    public fun public_key_claimant(public_key_bytes: vector<u8>): Option<address> acquires Vault {
        let validated_public_key_option =
            ed25519::new_validated_public_key_from_bytes(public_key_bytes);
        if (option::is_some(&validated_public_key_option)) {
            let validated_public_key = option::destroy_some(validated_public_key_option);
            let claimed_ref = &Vault[@rewards].claimed;
            if (claimed_ref.contains(validated_public_key)) {
                option::some(*claimed_ref.borrow(validated_public_key))
            } else {
                option::none()
            }
        } else {
            option::none()
        }
    }

    #[view]
    public fun public_key_is_eligible(public_key_bytes: vector<u8>): bool acquires Vault {
        let validated_public_key_option =
            ed25519::new_validated_public_key_from_bytes(public_key_bytes);
        if (option::is_some(&validated_public_key_option)) {
            Vault[@rewards].eligible.contains(
                option::destroy_some(validated_public_key_option)
            )
        } else { false }
    }

    #[view]
    public fun public_keys_that_are_claimed(): vector<ValidatedPublicKey> acquires Vault {
        Vault[@rewards].claimed.keys()
    }

    #[view]
    public fun public_keys_that_are_claimed_paginated(
        starting_bucket_index: u64, starting_vector_index: u64, num_public_keys_to_get: u64
    ): (vector<ValidatedPublicKey>, Option<u64>, Option<u64>) acquires Vault {
        Vault[@rewards].claimed.keys_paginated(
            starting_bucket_index, starting_vector_index, num_public_keys_to_get
        )
    }

    #[view]
    public fun public_keys_that_are_claimed_to_simple_map():
        SimpleMap<ValidatedPublicKey, address> acquires Vault {
        Vault[@rewards].claimed.to_simple_map()
    }

    #[view]
    public fun public_keys_that_are_eligible(): vector<ValidatedPublicKey> acquires Vault {
        Vault[@rewards].eligible.keys()
    }

    #[view]
    public fun public_keys_that_are_eligible_paginated(
        starting_bucket_index: u64, starting_vector_index: u64, num_public_keys_to_get: u64
    ): (vector<ValidatedPublicKey>, Option<u64>, Option<u64>) acquires Vault {
        Vault[@rewards].eligible.keys_paginated(
            starting_bucket_index, starting_vector_index, num_public_keys_to_get
        )
    }

    #[view]
    public fun vault_balance(): u64 acquires Vault {
        coin::balance<AptosCoin>(
            account::get_signer_capability_address(&Vault[@rewards].signer_capability)
        )
    }

    #[view]
    public fun vault_signer_address(): address acquires Vault {
        account::get_signer_capability_address(&Vault[@rewards].signer_capability)
    }

    public entry fun add_admin(admin: &signer, new_admin: address) acquires Vault {
        let admins_ref_mut = &mut borrow_vault_mut_checked(admin).admins;
        assert!(!admins_ref_mut.contains(&new_admin), E_ALREADY_ADMIN);
        admins_ref_mut.push_back(new_admin);
    }

    public entry fun add_public_keys(
        admin: &signer, public_keys_as_bytes: vector<vector<u8>>
    ) acquires Vault {
        let vault_ref_mut = borrow_vault_mut_checked(admin);
        let claimed_ref = &vault_ref_mut.claimed;
        let eligible_ref_mut = &mut vault_ref_mut.eligible;
        let validated_public_key;
        public_keys_as_bytes.for_each_ref(
            |public_key_bytes_ref| {
                validated_public_key = validate_public_key_bytes(*public_key_bytes_ref);
                assert!(
                    !claimed_ref.contains(validated_public_key),
                    E_CLAIM_LINK_ALREADY_CLAIMED
                );
                assert!(
                    !eligible_ref_mut.contains(validated_public_key),
                    E_CLAIM_LINK_ALREADY_ELIGIBLE
                );
                eligible_ref_mut.add(validated_public_key, Nil {});
            }
        );
    }

    public entry fun add_public_keys_and_fund_gas_escrows(
        admin: &signer, public_keys_as_bytes: vector<vector<u8>>, amount_per_escrow: u64
    ) acquires Vault {
        let vault_ref_mut = borrow_vault_mut_checked(admin);
        let claimed_ref = &vault_ref_mut.claimed;
        let eligible_ref_mut = &mut vault_ref_mut.eligible;
        let coins =
            coin::withdraw<AptosCoin>(
                admin, public_keys_as_bytes.length() * amount_per_escrow
            );
        let validated_public_key;
        public_keys_as_bytes.for_each_ref(
            |public_key_bytes_ref| {
                validated_public_key = validate_public_key_bytes(*public_key_bytes_ref);
                assert!(
                    !claimed_ref.contains(validated_public_key),
                    E_CLAIM_LINK_ALREADY_CLAIMED
                );
                assert!(
                    !eligible_ref_mut.contains(validated_public_key),
                    E_CLAIM_LINK_ALREADY_ELIGIBLE
                );
                eligible_ref_mut.add(validated_public_key, Nil {});
                aptos_account::deposit_coins(
                    from_bcs::to_address(
                        ed25519::validated_public_key_to_authentication_key(
                            &validated_public_key
                        )
                    ),
                    coin::extract(&mut coins, amount_per_escrow)
                )
            }
        );
        coin::destroy_zero(coins);
    }

    public entry fun fund_vault(funder: &signer, n_claims: u64) acquires Vault {
        let amount = n_claims * Vault[@rewards].claim_amount;
        aptos_account::transfer(
            funder,
            account::get_signer_capability_address(&Vault[@rewards].signer_capability),
            amount
        );
    }

    /// `signature_bytes` is generated by signing the claimant's address with the claim link private
    /// key, and can be verified by `public_key_bytes`, the corresponding claim link public key.
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
        let claimed_ref_mut = &mut vault_ref_mut.claimed;
        let eligible_ref_mut = &mut vault_ref_mut.eligible;
        assert!(
            !claimed_ref_mut.contains(validated_public_key),
            E_CLAIM_LINK_ALREADY_CLAIMED
        );
        assert!(eligible_ref_mut.contains(validated_public_key), E_INVALID_CLAIM_LINK);

        // Check vault balance.
        let vault_signer_cap_ref = &vault_ref_mut.signer_capability;
        let vault_address = account::get_signer_capability_address(vault_signer_cap_ref);
        let claim_amount = vault_ref_mut.claim_amount;
        assert!(
            coin::balance<AptosCoin>(vault_address) >= claim_amount,
            E_VAULT_INSUFFICIENT_FUNDS
        );

        // Update tables, transfer APT to claimant.
        eligible_ref_mut.remove(validated_public_key);
        claimed_ref_mut.add(validated_public_key, claimant_address);
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
            EmojicoinDotFunClaimLinkRedemption {
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
        assert!(admin_to_remove != @rewards, E_ADMIN_TO_REMOVE_IS_REWARDS_PUBLISHER);
        assert!(admin_to_remove_is_admin, E_ADMIN_TO_REMOVE_IS_NOT_ADMIN);
        admins_ref_mut.remove(admin_to_remove_index);
    }

    public entry fun remove_public_keys(
        admin: &signer, public_keys_as_bytes: vector<vector<u8>>
    ) acquires Vault {
        let eligible_ref_mut = &mut borrow_vault_mut_checked(admin).eligible;
        let validated_public_key;
        public_keys_as_bytes.for_each_ref(|public_key_bytes_ref| {
            validated_public_key = validate_public_key_bytes(*public_key_bytes_ref);
            if (eligible_ref_mut.contains(validated_public_key)) {
                eligible_ref_mut.remove(validated_public_key);
            }
        });
    }

    public entry fun set_claim_amount(admin: &signer, claim_amount: u64) acquires Vault {
        borrow_vault_mut_checked(admin).claim_amount = claim_amount;
    }

    public entry fun withdraw_from_vault(admin: &signer, amount: u64) acquires Vault {
        aptos_account::transfer(
            &account::create_signer_with_capability(
                &borrow_vault_mut_checked(admin).signer_capability
            ),
            signer::address_of(admin),
            amount
        );
    }

    fun init_module(rewards: &signer) {
        let (vault_signer, signer_capability) =
            account::create_resource_account(rewards, VAULT);
        move_to(
            rewards,
            Vault {
                admins: vector[signer::address_of(rewards)],
                claim_amount: DEFAULT_CLAIM_AMOUNT,
                claimed: smart_table::new(),
                eligible: smart_table::new(),
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

    #[test_only]
    use aptos_framework::account::{create_signer_for_test as get_signer};
    #[test_only]
    use black_cat_market::coin_factory::{
        Emojicoin as BlackCatEmojicoin,
        EmojicoinLP as BlackCatEmojicoinLP
    };

    #[test_only]
    const CLAIMANT: address = @0x1111;

    #[test_only]
    fun prepare_for_redemption(): (vector<u8>, vector<u8>) acquires Vault {
        // Init package, execute exact transition swap, fund vault.
        emojicoin_dot_fun::tests::init_package_then_exact_transition();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);
        emojicoin_dot_fun::test_acquisitions::mint_aptos_coin_to(
            @rewards, DEFAULT_CLAIM_AMOUNT
        );
        fund_vault(&rewards_signer, 1);

        // Generate private, public keys.
        let (claim_link_private_key, claim_link_validated_public_key) =
            ed25519::generate_keys();
        let claim_link_validated_public_key_bytes =
            ed25519::validated_public_key_to_bytes(&claim_link_validated_public_key);
        let signature_bytes =
            ed25519::signature_to_bytes(
                &ed25519::sign_arbitrary_bytes(
                    &claim_link_private_key, bcs::to_bytes(&CLAIMANT)
                )
            );
        add_public_keys(
            &rewards_signer,
            vector[claim_link_validated_public_key_bytes]
        );

        // Return valid signature against claimant's address, claim link public key bytes.
        (signature_bytes, claim_link_validated_public_key_bytes)
    }

    #[test, expected_failure(abort_code = E_ALREADY_ADMIN)]
    fun test_add_admin_already_admin() acquires Vault {
        emojicoin_dot_fun::tests::init_package();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);
        add_admin(&rewards_signer, @rewards);
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_add_admin_not_admin() acquires Vault {
        emojicoin_dot_fun::tests::init_package();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);
        let not_admin = @0x2222;
        let not_admin_signer = get_signer(not_admin);
        assert!(&rewards_signer != &not_admin_signer);
        add_admin(&not_admin_signer, not_admin);
    }

    #[test, expected_failure(abort_code = E_INVALID_PUBLIC_KEY)]
    fun test_add_public_keys_invalid_public_key() acquires Vault {
        emojicoin_dot_fun::tests::init_package();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);
        add_public_keys(&rewards_signer, vector[vector[0x0]]);
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_add_public_keys_not_admin() acquires Vault {
        emojicoin_dot_fun::tests::init_package();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);
        let not_admin_signer = get_signer(@0x2222);
        assert!(&rewards_signer != &not_admin_signer);
        add_public_keys(&not_admin_signer, vector[]);
    }

    #[test]
    fun test_add_public_keys_and_fund_gas_escrows() acquires Vault {
        // Prepare escrow account public keys.
        let n_escrows = 3;
        let amount_per_escrow = 2;
        let escrow_account_public_keys = vector[];
        let escrow_account_public_key_bytes = vector[];
        let validated_public_key;
        for (i in 0..n_escrows) {
            (_, validated_public_key) = ed25519::generate_keys();
            escrow_account_public_key_bytes.push_back(
                ed25519::validated_public_key_to_bytes(&validated_public_key)
            );
            escrow_account_public_keys.push_back(validated_public_key);
        };

        // Init packages.
        emojicoin_dot_fun::tests::init_package_then_exact_transition();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);

        // Fund escrows.
        emojicoin_dot_fun::test_acquisitions::mint_aptos_coin_to(
            @rewards, n_escrows * amount_per_escrow
        );
        add_public_keys_and_fund_gas_escrows(
            &rewards_signer, escrow_account_public_key_bytes, amount_per_escrow
        );

        // Verify state.
        let public_key_bytes;
        escrow_account_public_key_bytes.for_each_ref(|public_key_bytes_ref| {
            public_key_bytes = *public_key_bytes_ref;
            assert!(public_key_is_eligible(public_key_bytes));
        });
        escrow_account_public_keys.for_each_ref(|public_key_ref| {
            assert!(
                coin::balance<AptosCoin>(
                    from_bcs::to_address(
                        ed25519::validated_public_key_to_authentication_key(public_key_ref)
                    )
                ) == amount_per_escrow
            );
        });

        // Call with zero public keys argument to invoke silent return.
        assert!(coin::balance<AptosCoin>(@rewards) == 0);
        add_public_keys_and_fund_gas_escrows(
            &rewards_signer, vector[], amount_per_escrow
        );
        assert!(coin::balance<AptosCoin>(@rewards) == 0);

    }

    #[test, expected_failure(abort_code = E_INVALID_PUBLIC_KEY)]
    fun test_add_public_keys_and_fund_gas_escrows_invalid_public_key() acquires Vault {
        emojicoin_dot_fun::tests::init_package();
        let rewards_signer = get_signer(@rewards);
        emojicoin_dot_fun::test_acquisitions::mint_aptos_coin_to(@rewards, 1);
        init_module(&rewards_signer);
        add_public_keys_and_fund_gas_escrows(&rewards_signer, vector[vector[0x0]], 1);
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_add_public_keys_and_fund_gas_escrows_not_admin() acquires Vault {
        emojicoin_dot_fun::tests::init_package();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);
        let not_admin_signer = get_signer(@0x2222);
        assert!(&rewards_signer != &not_admin_signer);
        add_public_keys_and_fund_gas_escrows(&not_admin_signer, vector[], 1);
    }

    #[test]
    fun test_general_flow() acquires Vault {
        // Initialize black cat market, have it undergo state transition.
        emojicoin_dot_fun::tests::init_package_then_exact_transition();

        // Get claim link private, public keys.
        let (claim_link_private_key, claim_link_validated_public_key) =
            ed25519::generate_keys();
        let claim_link_validated_public_key_bytes =
            ed25519::validated_public_key_to_bytes(&claim_link_validated_public_key);

        // Initialize module.
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);

        // Check initial state.
        assert!(admins() == vector[@rewards]);
        assert!(claim_amount() == DEFAULT_CLAIM_AMOUNT);
        assert!(!public_key_is_eligible(claim_link_validated_public_key_bytes));
        assert!(public_keys_that_are_claimed().is_empty());
        assert!(public_keys_that_are_eligible().is_empty());
        let (keys, starting_bucket_index, starting_vector_index) =
            public_keys_that_are_claimed_paginated(0, 0, 1);
        assert!(keys == vector[]);
        assert!(starting_bucket_index == option::none());
        assert!(starting_vector_index == option::none());
        (keys, starting_bucket_index, starting_vector_index) = public_keys_that_are_eligible_paginated(
            0, 0, 1
        );
        assert!(keys == vector[]);
        assert!(starting_bucket_index == option::none());
        assert!(starting_vector_index == option::none());
        assert!(public_keys_that_are_claimed_to_simple_map().length() == 0);
        assert!(vault_balance() == 0);
        assert!(
            vault_signer_address()
                == account::get_signer_capability_address(
                    &Vault[@rewards].signer_capability
                )
        );

        // Add an admin, public key, mint APT, fund vault.
        add_public_keys(
            &rewards_signer,
            vector[claim_link_validated_public_key_bytes]
        );
        emojicoin_dot_fun::test_acquisitions::mint_aptos_coin_to(
            @rewards, DEFAULT_CLAIM_AMOUNT
        );
        let n_redemptions = 1;
        fund_vault(&rewards_signer, n_redemptions);
        let new_admin = @0x2222;
        add_admin(&rewards_signer, new_admin);

        // Check new state.
        assert!(admins() == vector[@rewards, new_admin]);
        assert!(claim_amount() == DEFAULT_CLAIM_AMOUNT);
        assert!(public_key_is_eligible(claim_link_validated_public_key_bytes));
        assert!(
            public_key_claimant(claim_link_validated_public_key_bytes)
                == option::none()
        );
        assert!(
            public_keys_that_are_eligible() == vector[claim_link_validated_public_key]
        );
        assert!(
            public_key_claimant(claim_link_validated_public_key_bytes)
                == option::none()
        );
        (keys, starting_bucket_index, starting_vector_index) = public_keys_that_are_eligible_paginated(
            0, 0, 1
        );
        assert!(keys == vector[claim_link_validated_public_key]);
        assert!(starting_bucket_index == option::none());
        assert!(starting_vector_index == option::none());
        assert!(public_keys_that_are_claimed_to_simple_map().length() == 0);
        assert!(vault_balance() == DEFAULT_CLAIM_AMOUNT);

        // Fund another reward, double claim amount, fund another reward, remove admin, withdraw.
        emojicoin_dot_fun::test_acquisitions::mint_aptos_coin_to(
            @rewards, 3 * DEFAULT_CLAIM_AMOUNT
        );
        fund_vault(&rewards_signer, 1);
        set_claim_amount(&rewards_signer, 2 * DEFAULT_CLAIM_AMOUNT);
        fund_vault(&rewards_signer, 1);
        remove_admin(&rewards_signer, new_admin);
        withdraw_from_vault(&rewards_signer, 2 * DEFAULT_CLAIM_AMOUNT);

        // Verify new state.
        assert!(admins() == vector[@rewards]);
        assert!(claim_amount() == 2 * DEFAULT_CLAIM_AMOUNT);
        assert!(vault_balance() == 2 * DEFAULT_CLAIM_AMOUNT);
        assert!(
            coin::balance<AptosCoin>(@rewards) == 2 * DEFAULT_CLAIM_AMOUNT
        );

        // Verify that public key can be removed and re-added.
        remove_public_keys(
            &rewards_signer,
            vector[claim_link_validated_public_key_bytes]
        );
        assert!(!public_key_is_eligible(claim_link_validated_public_key_bytes));
        add_public_keys(
            &rewards_signer,
            vector[claim_link_validated_public_key_bytes]
        );
        assert!(public_key_is_eligible(claim_link_validated_public_key_bytes));

        // Get expected proceeds from swap.
        let swap_event =
            emojicoin_dot_fun::simulate_swap<BlackCatEmojicoin, BlackCatEmojicoinLP>(
                CLAIMANT,
                @black_cat_market,
                2 * DEFAULT_CLAIM_AMOUNT,
                false,
                @integrator,
                INTEGRATOR_FEE_RATE_BPS
            );
        let (_, _, _, _, _, _, _, _, net_proceeds, _, _, _, _, _, _, _, _, _) =
            emojicoin_dot_fun::unpack_swap(swap_event);
        assert!(net_proceeds > 0);

        // Redeem a claim link.
        redeem<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(CLAIMANT),
            ed25519::signature_to_bytes(
                &ed25519::sign_arbitrary_bytes(
                    &claim_link_private_key, bcs::to_bytes(&CLAIMANT)
                )
            ),
            claim_link_validated_public_key_bytes,
            @black_cat_market,
            1
        );

        // Verify claimant's emojicoin balance.
        assert!(coin::balance<BlackCatEmojicoin>(CLAIMANT) == net_proceeds);

        // Check vault balance, manifest.
        assert!(vault_balance() == 0);
        assert!(
            public_key_claimant(claim_link_validated_public_key_bytes)
                == option::some(CLAIMANT)
        );
        (keys, starting_bucket_index, starting_vector_index) = public_keys_that_are_claimed_paginated(
            0, 0, 1
        );
        assert!(keys == vector[claim_link_validated_public_key]);
        assert!(starting_bucket_index == option::none());
        assert!(starting_vector_index == option::none());
        assert!(
            public_keys_that_are_claimed_to_simple_map().keys()
                == vector[claim_link_validated_public_key]
        );
        assert!(
            public_keys_that_are_claimed_to_simple_map().values() == vector[CLAIMANT]
        );

        // Verify that public key entry can no longer be removed.
        remove_public_keys(
            &rewards_signer,
            vector[claim_link_validated_public_key_bytes]
        );
        assert!(!public_key_is_eligible(claim_link_validated_public_key_bytes));

        // Verify silent return for trying to remove public key not in manifest.
        let (_, new_public_key) = ed25519::generate_keys();
        remove_public_keys(
            &rewards_signer,
            vector[ed25519::validated_public_key_to_bytes(&new_public_key)]
        );
    }

    #[test, expected_failure(abort_code = E_CLAIM_LINK_ALREADY_CLAIMED)]
    fun test_redeem_claim_link_already_claimed() acquires Vault {
        let (signature_bytes, claim_link_validated_public_key_bytes) =
            prepare_for_redemption();
        redeem<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(CLAIMANT),
            signature_bytes,
            claim_link_validated_public_key_bytes,
            @black_cat_market,
            1
        );
        redeem<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(CLAIMANT),
            signature_bytes,
            claim_link_validated_public_key_bytes,
            @black_cat_market,
            1
        );
    }

    #[test, expected_failure(abort_code = E_INVALID_CLAIM_LINK)]
    fun test_redeem_invalid_claim_link() acquires Vault {
        let (signature_bytes, claim_link_validated_public_key_bytes) =
            prepare_for_redemption();
        remove_public_keys(
            &get_signer(@rewards),
            vector[claim_link_validated_public_key_bytes]
        );
        redeem<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(CLAIMANT),
            signature_bytes,
            claim_link_validated_public_key_bytes,
            @black_cat_market,
            1
        );
    }

    #[test, expected_failure(abort_code = E_INVALID_PUBLIC_KEY)]
    fun test_redeem_invalid_public_key() acquires Vault {
        let (signature_bytes, claim_link_validated_public_key_bytes) =
            prepare_for_redemption();
        claim_link_validated_public_key_bytes.push_back(0);
        redeem<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(CLAIMANT),
            signature_bytes,
            claim_link_validated_public_key_bytes,
            @black_cat_market,
            1
        );
    }

    #[test, expected_failure(abort_code = E_INVALID_SIGNATURE)]
    fun test_redeem_invalid_signature() acquires Vault {
        let (signature_bytes, claim_link_validated_public_key_bytes) =
            prepare_for_redemption();
        signature_bytes[0] = signature_bytes[0] ^ 0xff;
        redeem<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(CLAIMANT),
            signature_bytes,
            claim_link_validated_public_key_bytes,
            @black_cat_market,
            1
        );
    }

    #[test, expected_failure(abort_code = E_VAULT_INSUFFICIENT_FUNDS)]
    fun test_redeem_vault_insufficient_funds() acquires Vault {
        let (signature_bytes, claim_link_validated_public_key_bytes) =
            prepare_for_redemption();
        withdraw_from_vault(&get_signer(@rewards), DEFAULT_CLAIM_AMOUNT);
        redeem<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(CLAIMANT),
            signature_bytes,
            claim_link_validated_public_key_bytes,
            @black_cat_market,
            1
        );
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_remove_admin_not_admin() acquires Vault {
        emojicoin_dot_fun::tests::init_package();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);
        let not_admin = @0x2222;
        assert!(not_admin != @rewards);
        remove_admin(&get_signer(not_admin), @rewards);
    }

    #[test, expected_failure(abort_code = E_ADMIN_TO_REMOVE_IS_NOT_ADMIN)]
    fun test_remove_admin_admin_to_remove_is_not_admin() acquires Vault {
        emojicoin_dot_fun::tests::init_package();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);
        let not_admin = @0x2222;
        assert!(not_admin != @rewards);
        remove_admin(&rewards_signer, not_admin);
    }

    #[test, expected_failure(abort_code = E_ADMIN_TO_REMOVE_IS_REWARDS_PUBLISHER)]
    fun test_remove_admin_admin_to_remove_is_rewards_publisher() acquires Vault {
        emojicoin_dot_fun::tests::init_package();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);
        remove_admin(&rewards_signer, @rewards);
    }

    #[test, expected_failure(abort_code = E_INVALID_PUBLIC_KEY)]
    fun test_remove_public_keys_invalid_public_key() acquires Vault {
        emojicoin_dot_fun::tests::init_package();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);
        remove_public_keys(&rewards_signer, vector[vector[0x0]]);
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_remove_public_keys_not_admin() acquires Vault {
        emojicoin_dot_fun::tests::init_package();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);
        let not_admin_signer = get_signer(@0x2222);
        assert!(&rewards_signer != &not_admin_signer);
        remove_public_keys(&not_admin_signer, vector[]);
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_set_claim_amount_not_admin() acquires Vault {
        emojicoin_dot_fun::tests::init_package();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);
        let not_admin_signer = get_signer(@0x2222);
        assert!(&not_admin_signer != &rewards_signer);
        set_claim_amount(&not_admin_signer, 1);
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_withdraw_from_vault_not_admin() acquires Vault {
        emojicoin_dot_fun::tests::init_package();
        let rewards_signer = get_signer(@rewards);
        init_module(&rewards_signer);
        let not_admin_signer = get_signer(@0x2222);
        assert!(&not_admin_signer != &rewards_signer);
        withdraw_from_vault(&not_admin_signer, 1);
    }
}
