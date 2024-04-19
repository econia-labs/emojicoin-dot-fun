module coin_factory::coin_factory {
    use aptos_framework::aptos_account;
    use aptos_std::coin;
    use aptos_std::string::{Self, String};
    use emojicoin_dot_fun::emojicoin_dot_fun;
    use std::signer;
    use std::vector;

    struct Emojicoin {}
    struct EmojicoinLP {}

    const EMOJICOIN_SUPPLY: u64 = 450_000_000_000_000_000;
    const DECIMALS: u8 = 8;
    const MONITOR_SUPPLY: bool = true;

    /// This constant is used as a bytecode flag, and is replaced during runtime by a vector of
    /// bytes. The first byte denotes the number of subsequent emoji bytes to include in the symbol.
    const SYMBOL_FLAG: vector<u8> = x"aaaaaaaaaaaaaaaaaaaaaa";

    const EMOJICOIN_NAME_SUFFIX: vector<u8> = b" emojicoin";
    const EMOJICOIN_LP_NAME_SUFFIX: vector<u8> = b" emojicoin LP";

    fun init_module(market: &signer) {

        // Decode symbol.
        let symbol_flag = SYMBOL_FLAG; // Load once to minimize gas.
        let encoded_symbol_length = (*vector::borrow(&symbol_flag, 0) as u64);
        let symbol_bytes = vector<u8>[];
        for (b in 1..(encoded_symbol_length + 1)) {
            vector::push_back(&mut symbol_bytes, *vector::borrow(&symbol_flag, b));
        };
        let symbol = string::utf8(symbol_bytes);

        // Initialize emojicoin with fixed supply, throw away capabilities.
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<Emojicoin>(
            market,
            get_name(symbol, EMOJICOIN_NAME_SUFFIX),
            symbol,
            DECIMALS,
            MONITOR_SUPPLY
        );
        let emojicoin_supply = coin::mint<Emojicoin>(EMOJICOIN_SUPPLY, &mint_cap);
        aptos_account::deposit_coins(signer::address_of(market), emojicoin_supply);
        coin::destroy_freeze_cap(freeze_cap);
        coin::destroy_mint_cap(mint_cap);
        coin::destroy_burn_cap(burn_cap);

        // Initialize LP coin, storing only burn and mint capabilities.
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<EmojicoinLP>(
            market,
            get_name(symbol, EMOJICOIN_LP_NAME_SUFFIX),
            symbol,
            DECIMALS,
            MONITOR_SUPPLY
        );
        coin::register<EmojicoinLP>(market);
        coin::destroy_freeze_cap(freeze_cap);
        emojicoin_dot_fun::store_lp_coin_capabilities<Emojicoin, EmojicoinLP>(
            market,
            burn_cap,
            mint_cap,
        );
    }

    inline fun get_name(symbol: String, suffix_bytes: vector<u8>): String {
        string::append_utf8(&mut symbol, suffix_bytes);
        symbol
    }

    #[test]
    fun test_emojicoin_supply() {
        assert!(EMOJICOIN_SUPPLY == emojicoin_dot_fun::get_EMOJICOIN_SUPPLY(), 0);
    }
}
