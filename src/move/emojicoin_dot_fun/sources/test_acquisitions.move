// Test utilities that rely on the `acquires` keyword, isolated here so that tests don't have to be
// annotated with `acquires` themselves.
#[test_only] module emojicoin_dot_fun::test_acquisitions {

    use aptos_framework::account::{create_signer_for_test as get_signer};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::coin::{Self, BurnCapability, Coin, MintCapability};

    struct AptosCoinCapStore has key {
        burn_cap: BurnCapability<AptosCoin>,
        mint_cap: MintCapability<AptosCoin>,
    }

    public fun mint_aptos_coin(amount: u64): Coin<AptosCoin> acquires AptosCoinCapStore {
        if (!exists<AptosCoinCapStore>(@aptos_framework)) {
            let framework_signer = get_signer(@aptos_framework);
            let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&framework_signer);
            move_to(&framework_signer, AptosCoinCapStore { burn_cap, mint_cap });
        };
        coin::mint(amount, &borrow_global<AptosCoinCapStore>(@aptos_framework).mint_cap)
    }

    public fun mint_aptos_coin_to(recipient: address, amount: u64) acquires AptosCoinCapStore {
        aptos_account::deposit_coins(recipient, mint_aptos_coin(amount))
    }

}
