module coin_factory::coin_factory {
    use aptos_std::coin::{Self, BurnCapability, FreezeCapability, MintCapability};
    use aptos_std::string::{Self, String};
    use std::signer;
    use std::vector;
    use emojicoin_dot_fun::emojicoin_dot_fun;

    struct Emojicoin {}
    struct EmojicoinLP {}

    const EMOJICOIN_SUPPLY: u64 = 450_000_000_000_000_000;
    const DECIMALS: u8 = 8;
    const MONITOR_SUPPLY: bool = false;

    const EMOJICOIN_STRING: vector<u8> = b" emojicoin";
    const SYMBOL: vector<u8> = x"7abcdef01234578abcdef7";

    const EMOJICOIN_LP_STRING: vector<u8> = b" emojicoin LP";

    // Note that by virtue of how publishing modules works, the @coin_factory
    // address will always be equal to the signer passed into `init_module`,
    // so we do not need to check it.
    fun init_module(market_obj: &signer) {
        initialize_emojicoin(market_obj);
        initialize_emojicoin_lp(market_obj);
    }

    // The symbol will always be exactly 11 bytes long and the first byte signifies
    // how many bytes of the symbol are supposed to be used. The rest are thrown
    // away in order to ensure the module's bytecode stays as consistent as possible.
    inline fun decode_symbol(symbol: vector<u8>): String {
        vector::reverse(&mut symbol);
        let symbol_len = vector::pop_back(&mut symbol);
        let decoded_symbol = vector::empty<u8>();
        for (i in 0..symbol_len) {
            let byte = vector::pop_back(&mut symbol);
            vector::push_back(&mut decoded_symbol, byte);
        };
        string::utf8(decoded_symbol)
    }

    inline fun initialize_emojicoin(market_obj: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = init_coin_and_register<Emojicoin>(
            market_obj,
            EMOJICOIN_STRING,
        );

        let minted_coins = coin::mint<Emojicoin>(EMOJICOIN_SUPPLY, &mint_cap);
        let market_addr = signer::address_of(market_obj);
        coin::deposit(market_addr, minted_coins);

        // Destroy all Emojicoin capabilities, because we will not need them.
        coin::destroy_freeze_cap<Emojicoin>(freeze_cap);
        coin::destroy_mint_cap<Emojicoin>(mint_cap);
        coin::destroy_burn_cap<Emojicoin>(burn_cap);
    }

    inline fun initialize_emojicoin_lp(market: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = init_coin_and_register<EmojicoinLP>(
            market,
            EMOJICOIN_LP_STRING,
        );

        emojicoin_dot_fun::store_capabilities<Emojicoin, EmojicoinLP>(
            market,
            burn_cap,
            freeze_cap,
            mint_cap,
        );
    }

    inline fun init_coin_and_register<T>(
        market_obj: &signer,
        name_suffix: vector<u8>,
    ): (BurnCapability<T>, FreezeCapability<T>, MintCapability<T>) {
        let symbol = decode_symbol(SYMBOL);
        let name = copy symbol;
        string::append_utf8(&mut name, name_suffix);

        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<T>(
            market_obj,
            name,
            symbol,
            DECIMALS,
            MONITOR_SUPPLY,
        );

        coin::register<T>(market_obj);

        (burn_cap, freeze_cap, mint_cap)
    }

    #[test]
    fun test_emojicoin_supply() {
        assert!(EMOJICOIN_SUPPLY == emojicoin_dot_fun::get_EMOJICOIN_SUPPLY(), 0);
    }
}
