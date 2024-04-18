module lp_coin_manager::lp_coin_manager {
    use aptos_framework::coin::{Self, Coin, BurnCapability, FreezeCapability, MintCapability};
    use std::signer::{address_of};

    #[resource_group = ObjectGroup]
    struct LPCoinCapabilities<phantom CoinType, phantom LPCoinType> has key {
        burn: BurnCapability<LPCoinType>,
        mint: MintCapability<LPCoinType>,
    }

    // Intended to be called from `coin_factory`, this function facilitates
    // storing the LP Coin capabilities atomically when the coin factory
    // module is initialized.
    public fun store_capabilities<CoinType, LPCoinType>(
        market_obj: &signer,
        burn_cap: BurnCapability<LPCoinType>,
        freeze_cap: FreezeCapability<LPCoinType>,
        mint_cap: MintCapability<LPCoinType>,
    ) {
        coin::destroy_freeze_cap<LPCoinType>(freeze_cap);

        move_to(market_obj, LPCoinCapabilities<CoinType, LPCoinType> {
            burn: burn_cap,
            mint: mint_cap,
        });
    }

    public fun burn_from<CoinType, LPCoinType>(
        market_obj: &signer,
        account_addr: address,
        amount: u64,
    ) acquires LPCoinCapabilities {
        let burn_cap = &borrow_coin_capabilities<CoinType, LPCoinType>(market_obj).burn;
        coin::burn_from<LPCoinType>(account_addr, amount, burn_cap);
    }

    public fun burn<CoinType, LPCoinType>(
        market_obj: &signer,
        coin: Coin<LPCoinType>
    ) acquires LPCoinCapabilities {
        let burn_cap = &borrow_coin_capabilities<CoinType, LPCoinType>(market_obj).burn;
        coin::burn<LPCoinType>(coin, burn_cap);
    }

    public fun mint<CoinType, LPCoinType>(
        market_obj: &signer,
        amount: u64,
    ): Coin<LPCoinType> acquires LPCoinCapabilities {
        let mint_cap = &borrow_coin_capabilities<CoinType, LPCoinType>(market_obj).mint;

        coin::mint<LPCoinType>(amount, mint_cap)
    }

    inline fun borrow_coin_capabilities<CoinType, LPCoinType>( market_obj: &signer, ): &LPCoinCapabilities<CoinType, LPCoinType> {
        borrow_global<LPCoinCapabilities<CoinType, LPCoinType>>(address_of(market_obj))
    }
}
