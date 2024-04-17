module coin_factory::coin_factory {
    use aptos_std::coin::{Self, BurnCapability, FreezeCapability, MintCapability};
    use aptos_std::string;
    use std::signer;
    use emojicoin_dot_fun::emojicoin_dot_fun::{store_capabilities};

    struct Emojicoin {}
    struct EmojicoinLP {}

    const EMOJICOIN_SUPPLY: u64 = 450_000_000_000_000_000;
    const DECIMALS: u8 = 8;
    const MONITOR_SUPPLY: bool = false;

    const EMOJICOIN_STRING: vector<u8> = b" emojicoin";
    const SYMBOL: vector<u8> = x"99887766554433221100ffeeddccbbaa00112233445566778899aabbccddeeff";

    const EMOJICOIN_LP_STRING: vector<u8> = b" emojicoin LP";

    // Note that by virtue of how publishing modules works, the @coin_factory
    // address will always be equal to the signer passed into `init_module`,
    // so we do not need to check it.
    fun init_module(deployer_obj: &signer) {
        initialize_emojicoin(deployer_obj);
        initialize_emojicoin_lp(deployer_obj);
    }

    inline fun initialize_emojicoin(deployer_obj: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = init_coin_and_register<Emojicoin>(
            deployer_obj,
            EMOJICOIN_STRING,
        );

        let minted_coins = coin::mint<Emojicoin>(EMOJICOIN_SUPPLY, &mint_cap);
        let deployer_addr = signer::address_of(deployer_obj);
        coin::deposit(deployer_addr, minted_coins);

        // Destroy all Emojicoin capabilities, because we will not need them.
        coin::destroy_freeze_cap<Emojicoin>(freeze_cap);
        coin::destroy_mint_cap<Emojicoin>(mint_cap);
        coin::destroy_burn_cap<Emojicoin>(burn_cap);
    }

    inline fun initialize_emojicoin_lp(deployer: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = init_coin_and_register<EmojicoinLP>(
            deployer,
            EMOJICOIN_LP_STRING,
        );

        coin::destroy_freeze_cap<EmojicoinLP>(freeze_cap);
        store_capabilities<EmojicoinLP>(deployer, burn_cap, mint_cap);
    }

    inline fun init_coin_and_register<T>(
        deployer_obj: &signer,
        name_suffix: vector<u8>,
    ): (BurnCapability<T>, FreezeCapability<T>, MintCapability<T>) {
        let symbol = string::utf8(SYMBOL);
        let name = copy symbol;
        string::append_utf8(&mut name, name_suffix);

        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<T>(
            deployer_obj,
            name,
            symbol,
            DECIMALS,
            MONITOR_SUPPLY,
        );

        coin::register<T>(deployer_obj);

        (burn_cap, freeze_cap, mint_cap)
    }
}
